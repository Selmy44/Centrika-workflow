import { z } from "zod";
import { protectedProcedure, router } from "../core/trpc";
import { prisma } from "../db";
import { parseAdditionalRoles } from "../shared/roles";
import { TRPCError } from "@trpc/server";
import { sendEmail, emailTemplates } from "../core/email";
import {
  uploadFileToSpaces,
  generateFileKey,
  validateFile,
  isSpacesConfigured,
} from "../lib/spaces";
import { calculateAnnualLeaveBalance } from "../lib/leaveBalanceCalculator";

function getDocId(request: any): string {
  const prefix = request.type === "leave" ? "LR" : request.type === "car" ? "CR" : request.type === "expenditure" ? "ER" : "AR";
  const d = new Date(request.createdAt);
  return `${prefix}-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(request.id).padStart(5, '0')}`;
}

async function generateRequestDetailsHtml(prisma: any, request: any): Promise<string> {
  let detailsHtml = `<table style="width: 100%; font-size: 14px; color: #333;">`;
  detailsHtml += `<tr><td style="padding: 6px 0; font-weight: bold; width: 160px;">Title:</td><td>${request.title}</td></tr>`;

  if (request.type === "leave") {
    const data = await prisma.leaveRequest.findUnique({ where: { requestId: request.id } });
    if (data) {
      detailsHtml += `<tr><td style="padding: 6px 0; font-weight: bold;">Leave Type:</td><td>${data.leaveType}</td></tr>`;
      detailsHtml += `<tr><td style="padding: 6px 0; font-weight: bold;">Dates:</td><td>${data.startDate} to ${data.endDate}</td></tr>`;
      detailsHtml += `<tr><td style="padding: 6px 0; font-weight: bold;">Days Requested:</td><td>${data.leaveDaysRequested || 0}</td></tr>`;
    }
  } else if (request.type === "car") {
    const data = await prisma.carRequest.findUnique({ where: { requestId: request.id } });
    if (data) {
      detailsHtml += `<tr><td style="padding: 6px 0; font-weight: bold;">Destination:</td><td>${data.destination}</td></tr>`;
      detailsHtml += `<tr><td style="padding: 6px 0; font-weight: bold;">Departure:</td><td>${data.departureDate} ${data.departureTime || ""}</td></tr>`;
      detailsHtml += `<tr><td style="padding: 6px 0; font-weight: bold;">Passengers:</td><td>${data.passengers}</td></tr>`;
    }
  } else if (request.type === "expenditure") {
    const data = await prisma.expenditureRequest.findUnique({ where: { requestId: request.id } });
    if (data) {
      detailsHtml += `<tr><td style="padding: 6px 0; font-weight: bold;">Amount:</td><td>${data.amount} ${data.currency}</td></tr>`;
      if (data.category) detailsHtml += `<tr><td style="padding: 6px 0; font-weight: bold;">Category:</td><td>${data.category}</td></tr>`;
    }
  } else if (request.type === "asset") {
    const data = await prisma.assetRequest.findUnique({ where: { requestId: request.id } });
    if (data) {
      detailsHtml += `<tr><td style="padding: 6px 0; font-weight: bold;">Item Name:</td><td>${data.itemName}</td></tr>`;
      detailsHtml += `<tr><td style="padding: 6px 0; font-weight: bold;">Est. Cost:</td><td>${data.estimatedCost} ${data.currency}</td></tr>`;
    }
  }

  if (request.description) {
    detailsHtml += `<tr><td style="padding: 6px 0; font-weight: bold;">Description/Reason:</td><td>${request.description}</td></tr>`;
  }

  detailsHtml += `</table>`;
  return detailsHtml;
}

function populateRequestSignatures(req: any) {
  if (!req) return req;
  const hodApproval = req.approvals?.find((a: any) => a.approvalLevel === "head_of_department");
  const hrApproval = req.approvals?.find((a: any) => a.approvalLevel === "hr");
  const financeApproval = req.approvals?.find((a: any) => a.approvalLevel === "head_of_finance");
  const ceoApproval = req.approvals?.find((a: any) => a.approvalLevel === "ceo_md" || a.approvalLevel === "md");

  let managerSignatureUrl = hodApproval?.signature?.fileUrl || null;
  let hrSignatureUrl = hrApproval?.signature?.fileUrl || null;
  let financeSignatureUrl = financeApproval?.signature?.fileUrl || null;
  let ceoSignatureUrl = ceoApproval?.signature?.fileUrl || null;

  if (req.formSubmission?.formData) {
    try {
      const parsed = JSON.parse(req.formSubmission.formData);
      if (!managerSignatureUrl) managerSignatureUrl = parsed.managerSignatureUrl || null;
      if (!hrSignatureUrl) hrSignatureUrl = parsed.hrSignatureUrl || null;
      if (!financeSignatureUrl) financeSignatureUrl = parsed.financeSignatureUrl || null;
      if (!ceoSignatureUrl) ceoSignatureUrl = parsed.ceoSignatureUrl || null;
    } catch {}
  }

  return {
    ...req,
    managerSignatureUrl,
    hrSignatureUrl,
    financeSignatureUrl,
    ceoSignatureUrl,
    typeDetails: req.leaveRequest || req.carRequest || req.expenditureRequest || req.assetRequest
  };
}

export const requestsRouter = router({
  createLeaveRequest: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        leaveType: z.enum(["annual", "sick", "personal", "unpaid", "parental"]),
        parentalLeaveType: z.enum(["paternity", "maternity"]).optional(),
        startDate: z.string(),
        endDate: z.string(),
        reason: z.string().optional(),
        leaveDaysEntitled: z.number().optional(),
        leaveDaysTaken: z.number().optional(),
        leaveDaysRequested: z.number().optional(),
        backupPersonName: z.string().optional(),
        backupPersonPhone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await prisma.user.findUnique({ where: { id: ctx.user.id } });
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

      let entitled = input.leaveDaysEntitled;
      if (input.leaveType === "annual") {
        const leaveBalance = calculateAnnualLeaveBalance(user.dateOfEmployment);
        entitled = leaveBalance.totalAnnualLeave;
      } else {
        entitled = entitled || 0;
      }

      const taken = input.leaveDaysTaken || 0;
      const requested = input.leaveDaysRequested || 0;
      const remaining = entitled - taken - requested;

      const request = await prisma.request.create({
        data: {
          userId: ctx.user.id,
          type: "leave",
          status: "draft",
          title: input.title,
          description: input.reason,
          leaveRequest: {
            create: {
              leaveType: input.leaveType,
              parentalLeaveType: input.parentalLeaveType ?? null,
              startDate: input.startDate,
              endDate: input.endDate,
              reason: input.reason ?? null,
              leaveDaysEntitled: Math.round(entitled * 100) / 100,
              leaveDaysTaken: taken,
              leaveDaysRequested: requested,
              leaveDaysRemaining: Math.round(remaining * 100) / 100,
              backupPersonName: input.backupPersonName ?? null,
              backupPersonPhone: input.backupPersonPhone ?? null,
            },
          },
        },
      });

      return { id: request.id };
    }),

  updateLeaveRequest: protectedProcedure
    .input(
      z.object({
        requestId: z.number(),
        title: z.string().min(1),
        leaveType: z.enum(["annual", "sick", "personal", "unpaid", "parental"]),
        parentalLeaveType: z.enum(["paternity", "maternity"]).optional(),
        startDate: z.string(),
        endDate: z.string(),
        reason: z.string().optional(),
        leaveDaysEntitled: z.number().optional(),
        leaveDaysTaken: z.number().optional(),
        leaveDaysRequested: z.number().optional(),
        backupPersonName: z.string().optional(),
        backupPersonPhone: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const request = await prisma.request.findUnique({ where: { id: input.requestId } });
      if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
      if (request.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      const user = await prisma.user.findUnique({ where: { id: ctx.user.id } });
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

      let entitled = input.leaveDaysEntitled;
      if (input.leaveType === "annual") {
        const leaveBalance = calculateAnnualLeaveBalance(user.dateOfEmployment);
        entitled = leaveBalance.totalAnnualLeave;
      } else {
        entitled = entitled || 0;
      }

      const taken = input.leaveDaysTaken || 0;
      const requested = input.leaveDaysRequested || 0;
      const remaining = entitled - taken - requested;

      await prisma.request.update({
        where: { id: input.requestId },
        data: {
          title: input.title,
          description: input.reason,
          leaveRequest: {
            update: {
              leaveType: input.leaveType,
              parentalLeaveType: input.parentalLeaveType ?? null,
              startDate: input.startDate,
              endDate: input.endDate,
              reason: input.reason ?? null,
              leaveDaysEntitled: Math.round(entitled * 100) / 100,
              leaveDaysTaken: taken,
              leaveDaysRequested: requested,
              leaveDaysRemaining: Math.round(remaining * 100) / 100,
              backupPersonName: input.backupPersonName ?? null,
              backupPersonPhone: input.backupPersonPhone ?? null,
            },
          },
        },
      });

      return { id: input.requestId };
    }),

  createCarRequest: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        destination: z.string().min(1),
        purpose: z.string().optional(),
        departureDate: z.string(),
        departureTime: z.string().optional(),
        passengers: z.number().int().min(1),
        driverName: z.string().optional(),
        carInfo: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const request = await prisma.request.create({
        data: {
          userId: ctx.user.id,
          type: "car",
          status: "draft",
          title: input.title,
          description: input.purpose,
          carRequest: {
            create: {
              destination: input.destination,
              purpose: input.purpose,
              departureDate: input.departureDate,
              departureTime: input.departureTime,
              passengers: input.passengers,
              driverName: input.driverName,
              carInfo: input.carInfo,
            },
          },
        },
      });

      return { id: request.id };
    }),

  updateCarRequest: protectedProcedure
    .input(
      z.object({
        requestId: z.number(),
        title: z.string().min(1),
        destination: z.string().min(1),
        purpose: z.string().optional(),
        departureDate: z.string(),
        departureTime: z.string().optional(),
        passengers: z.number().int().min(1),
        driverName: z.string().optional(),
        carInfo: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const request = await prisma.request.findUnique({ where: { id: input.requestId } });
      if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
      if (request.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      await prisma.request.update({
        where: { id: input.requestId },
        data: {
          title: input.title,
          description: input.purpose,
          carRequest: {
            update: {
              destination: input.destination,
              purpose: input.purpose,
              departureDate: input.departureDate,
              departureTime: input.departureTime,
              passengers: input.passengers,
              driverName: input.driverName,
              carInfo: input.carInfo,
            },
          },
        },
      });

      return { id: input.requestId };
    }),

  getAvailableDrivers: protectedProcedure.query(async () => {
    return [
      { name: "Rukundo", car: "Toyota RAV4 — RAB 123A" },
      { name: "Celestin", car: "Toyota Hilux — RAC 456B" },
      { name: "Olivier", car: "Suzuki Escudo — RAD 789C" },
    ];
  }),

  createExpenditureRequest: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        amount: z.number().int().positive(),
        currency: z.string().default("RWF"),
        department: z.string().optional(),
        category: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const request = await prisma.request.create({
        data: {
          userId: ctx.user.id,
          type: "expenditure",
          status: "draft",
          title: input.title,
          expenditureRequest: {
            create: {
              amount: input.amount,
              currency: input.currency,
              department: input.department,
              category: input.category,
            },
          },
        },
      });

      return { id: request.id };
    }),

  createAssetRequest: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        itemName: z.string().min(1),
        description: z.string().optional(),
        estimatedCost: z.number().int().positive(),
        currency: z.string().default("RWF"),
        category: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const request = await prisma.request.create({
        data: {
          userId: ctx.user.id,
          type: "asset",
          status: "draft",
          title: input.title,
          description: input.description,
          assetRequest: {
            create: {
              itemName: input.itemName,
              description: input.description,
              estimatedCost: input.estimatedCost,
              currency: input.currency,
              category: input.category,
            },
          },
        },
      });

      return { id: request.id };
    }),

  updateExpenditureRequest: protectedProcedure
    .input(
      z.object({
        requestId: z.number(),
        title: z.string().min(1),
        amount: z.number().int().positive(),
        currency: z.string().default("RWF"),
        department: z.string().optional(),
        category: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const request = await prisma.request.findUnique({ where: { id: input.requestId } });
      if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
      if (request.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      await prisma.request.update({
        where: { id: input.requestId },
        data: {
          title: input.title,
          expenditureRequest: {
            update: {
              amount: input.amount,
              currency: input.currency,
              department: input.department,
              category: input.category,
            },
          },
        },
      });

      return { id: input.requestId };
    }),

  updateAssetRequest: protectedProcedure
    .input(
      z.object({
        requestId: z.number(),
        title: z.string().min(1),
        itemName: z.string().min(1),
        description: z.string().optional(),
        estimatedCost: z.number().int().positive(),
        currency: z.string().default("RWF"),
        category: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const request = await prisma.request.findUnique({ where: { id: input.requestId } });
      if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
      if (request.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      await prisma.request.update({
        where: { id: input.requestId },
        data: {
          title: input.title,
          description: input.description,
          assetRequest: {
            update: {
              itemName: input.itemName,
              description: input.description,
              estimatedCost: input.estimatedCost,
              currency: input.currency,
              category: input.category,
            },
          },
        },
      });

      return { id: input.requestId };
    }),

  listUserRequests: protectedProcedure
    .input(z.object({ includeNonSubmitted: z.boolean().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const userReqs = await prisma.request.findMany({
        where: {
          userId: ctx.user.id,
          // Only exclude draft/cancelled if not explicitly requested
          ...(input?.includeNonSubmitted ? {} : { NOT: { status: { in: ["draft", "cancelled"] } } })
        },
        include: {
          leaveRequest: true,
          carRequest: true,
          expenditureRequest: true,
          assetRequest: true,
          approvals: { include: { signature: true } },
          formSubmission: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return userReqs.map(populateRequestSignatures);
    }),

  getRequest: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const request = await prisma.request.findUnique({
        where: { id: input.id },
        include: {
          leaveRequest: true,
          carRequest: true,
          expenditureRequest: true,
          assetRequest: true,
          approvals: { include: { approver: true, signature: true } },
          attachments: true,
          formSubmission: true,
        },
      });

      if (!request) return null;

      const rolesToCheck: string[] = [ctx.user.role, ...parseAdditionalRoles(ctx.user.additionalRoles)];

      const hasFullAccess = ["admin", "hr", "ceo_md"].some((role) => rolesToCheck.includes(role));
      const isApprover = request.approvals.some((a) => a.approverId === ctx.user.id) || 
                         (request.currentApprovalLevel && rolesToCheck.includes(request.currentApprovalLevel));

      if (request.userId !== ctx.user.id && !hasFullAccess && !isApprover) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return populateRequestSignatures(request);
    }),

  submitRequest: protectedProcedure
    .input(z.object({ id: z.number(), initialApproverId: z.number().optional() }))
    .mutation(async ({ ctx, input }) => {
      const request = await prisma.request.findUnique({
        where: { id: input.id },
        include: { user: { include: { department: true } } }
      });

      if (!request) throw new TRPCError({ code: "NOT_FOUND" });
      if (request.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      if (request.status !== "draft") throw new TRPCError({ code: "BAD_REQUEST" });

      const workflowConfig = await prisma.workflowConfig.findFirst({
        where: { requestType: request.type, isActive: true },
        include: { steps: { orderBy: { stepOrder: "asc" }, take: 1 } }
      });

      let initialLevel = "";
      let approverId = 0;

      if (workflowConfig?.steps.length) {
        const firstStep = workflowConfig.steps[0];
        initialLevel = firstStep.roleResponsible;

        if (initialLevel === "head_of_department") {
          approverId = input.initialApproverId || request.user.managerId || 0;
        } else {
          approverId = (await prisma.user.findFirst({
            where: { OR: [{ role: initialLevel as any }, { additionalRoles: { contains: initialLevel } }] }
          }))?.id || 0;
        }
      } else {
        // Legacy fallback
        if (request.type === "car") {
          initialLevel = "hr";
          approverId = (await prisma.user.findFirst({
            where: { OR: [{ role: "hr" }, { additionalRoles: { contains: "hr" } }] }
          }))?.id || 0;
        } else {
          initialLevel = "head_of_department";
          approverId = input.initialApproverId || request.user.managerId || 0;
        }
      }

      // If no specific approverId but we have a role, we still proceed if it's a role-based pooling level (HR, Finance, CEO)
      // but for HOD we really need a specific ID.
      if (!approverId && initialLevel === "head_of_department") {
        // Find ANY HOD if none assigned? Better to throw error or find a default.
        const defaultHod = await prisma.user.findFirst({ where: { role: "head_of_department" } });
        approverId = defaultHod?.id || 0;
      }

      if (!approverId && !["hr", "head_of_finance", "ceo_md"].includes(initialLevel)) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No approver found" });
      }

      await prisma.$transaction([
        prisma.request.update({
          where: { id: input.id },
          data: {
            status: "pending",
            currentApprovalLevel: initialLevel as any,
            initialApproverId: approverId,
            updatedAt: new Date(),
          }
        }),
        prisma.requestApproval.create({
          data: {
            requestId: input.id,
            approverId,
            approvalLevel: initialLevel as any,
            status: "pending"
          }
        }),
        prisma.notification.create({
          data: {
            userId: approverId,
            requestId: input.id,
            triggeredByUserId: ctx.user.id,
            type: "approval_needed",
            title: `New ${request.type} request awaiting approval`,
            message: `${request.user.name} submitted a ${request.type} request.`,
          }
        })
      ]);

      // Run email notifications in the background so it doesn't block the request creation response
      (async () => {
        const approver = await prisma.user.findUnique({ where: { id: approverId } });
        if (approver?.email) {
          const docId = getDocId(request);
          const detailsHtml = await generateRequestDetailsHtml(prisma, request);
          const emailContent = emailTemplates.requestSubmittedEmail(
            approver.name || "Manager",
            request.user.name || "Employee",
            request.type,
            docId,
            detailsHtml,
            {
              dept: request.user.department?.name || "N/A",
              pos: request.user.position || "Staff",
              topic: `${request.type.toUpperCase()} REQUEST`,
              action: "SUBMITTED",
              level: "MODERATE"
            }
          );
          await sendEmail(approver.email, emailContent.subject, emailContent.html);
        }
      })().catch((error) => {
        console.error("Failed to send submission email in background:", error);
      });
      return { success: true };
    }),

  listPendingApprovals: protectedProcedure.query(async ({ ctx }) => {
    const requestIncludes = {
      user: { include: { department: true } },
      leaveRequest: true,
      carRequest: true,
      expenditureRequest: true,
      assetRequest: true,
      attachments: true,
      approvals: { include: { signature: true } },
      formSubmission: true,
    };

    // Resolve all active roles for the user (primary + additional roles)
    const rolesToCheck: string[] = [ctx.user.role, ...parseAdditionalRoles(ctx.user.additionalRoles)];

    // Build OR conditions - include role-based filter if any role maps to a valid ApprovalLevel
    const validApprovalLevels = ["head_of_department", "hr", "head_of_finance", "ceo_md"];
    const orConditions: any[] = [
      { approverId: ctx.user.id, status: "pending" }
    ];

    rolesToCheck.forEach((role) => {
      if (validApprovalLevels.includes(role)) {
        orConditions.push({
          status: "pending",
          approvalLevel: role as any,
          request: { currentApprovalLevel: role as any }
        });
      }
    });

    const approvals = await prisma.requestApproval.findMany({
      where: { OR: orConditions },
      include: { request: { include: requestIncludes } }
    });

    let results = approvals.map((a: any) => a.request);

    // Allow HR, CEO/MD, and Admin to see ALL pending requests, not just their explicitly assigned ones
    const hasFullAccess = ["admin", "hr", "ceo_md"].some((role) => rolesToCheck.includes(role));
    if (hasFullAccess) {
      const allPending = await prisma.request.findMany({
        where: { status: "pending" },
        include: requestIncludes,
        orderBy: { createdAt: "desc" }
      });
      const map = new Map(results.map((r: any) => [r.id, r]));
      allPending.forEach((r: any) => { if (!map.has(r.id)) map.set(r.id, r); });
      results = Array.from(map.values());
    }

    // Filter by role-specific needs if necessary
    // Only filter out non-financial requests if they ONLY have the head_of_finance role
    const onlyFinance = rolesToCheck.includes("head_of_finance") && !rolesToCheck.includes("head_of_department") && !rolesToCheck.includes("admin") && !rolesToCheck.includes("hr") && !rolesToCheck.includes("ceo_md");
    if (onlyFinance) {
      results = (results as any[]).filter((r: any) => r.type === "expenditure" || r.type === "asset");
    }

    // Deduplicate in case a user is both assigned by ID and by role
    const uniqueMap = new Map(results.map((r: any) => [r.id, r]));
    const deduplicated = Array.from(uniqueMap.values()).sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());
    return deduplicated.map(populateRequestSignatures);
  }),

  listApprovalHistory: protectedProcedure.query(async ({ ctx }) => {
    const requestIncludes = {
      user: { include: { department: true } },
      leaveRequest: true,
      carRequest: true,
      expenditureRequest: true,
      assetRequest: true,
      attachments: true,
      approvals: { include: { signature: true } },
      formSubmission: true,
    };

    // Resolve all active roles for the user (primary + additional roles)
    const rolesToCheck: string[] = [ctx.user.role, ...parseAdditionalRoles(ctx.user.additionalRoles)];

    const hasFullAccess = ["admin", "hr", "ceo_md"].some((role) => rolesToCheck.includes(role));

    // Admin, HR, CEO/MD see ALL requests (approved, rejected, pending)
    if (hasFullAccess) {
      const allRequests = await prisma.request.findMany({
        where: { status: { in: ["approved", "rejected", "pending"] } },
        include: requestIncludes,
        orderBy: { createdAt: "desc" },
      });
      return allRequests.map(populateRequestSignatures);
    }

    // HOD and Finance Head only see requests assigned to them
    const approvals = await prisma.requestApproval.findMany({
      where: { approverId: ctx.user.id },
      include: { request: { include: requestIncludes } },
    });

    const results = approvals.map((a: any) => a.request);
    // Deduplicate
    const map = new Map(results.map((r: any) => [r.id, r]));
    const deduplicated = Array.from(map.values()).sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());
    return deduplicated.map(populateRequestSignatures);
  }),

  approveRequest: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      comments: z.string().optional(),
      signatureFileId: z.number().optional(),
      escalateToCeo: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const request = await prisma.request.findUnique({
        where: { id: input.requestId },
        include: { user: { include: { department: true } } }
      });

      if (!request) throw new TRPCError({ code: "NOT_FOUND" });

      const finalApprove = async () => {
        await prisma.request.update({
          where: { id: input.requestId },
          data: { status: "approved", updatedAt: new Date() }
        });
        await prisma.notification.create({
          data: {
            userId: request.userId,
            requestId: input.requestId,
            triggeredByUserId: ctx.user.id,
            type: "request_approved",
            title: `Your ${request.type} request was approved`,
            message: `Your request has been fully approved.`,
          }
        });

      // Run finalApprove notification block in the background
      (async () => {
        try {
          const approver = await prisma.user.findUnique({ where: { id: ctx.user.id } });
          const docId = getDocId(request);
          const detailsHtml = await generateRequestDetailsHtml(prisma, request);

          // Email Requester
          if (request.user.email && approver) {
            const emailContent = emailTemplates.requestApprovedEmail(
              request.user.name || "Employee",
              approver.name || "Manager",
              request.type,
              docId,
              detailsHtml,
              {
                dept: request.user.department?.name || "N/A",
                pos: request.user.position || "Staff",
                topic: `${request.type.toUpperCase()} REQUEST`,
                action: "APPROVED",
                level: "NORMAL"
              }
            );
            sendEmail(request.user.email, emailContent.subject, emailContent.html).catch(e => console.error("Requester email error:", e));
          }

          // Email Observers (HR, CEO/MD, and Finance if expenditure/asset)
          const rolesToNotify = ["hr", "ceo_md"];
          if (request.type === "expenditure" || request.type === "asset") {
            rolesToNotify.push("head_of_finance");
          }

          const observers = await prisma.user.findMany({
            where: {
              OR: rolesToNotify.flatMap(role => [
                { role: role as any },
                { additionalRoles: { contains: role } }
              ]),
              id: { not: ctx.user.id } // Don't email the approver themselves
            }
          });

          await Promise.all(observers.map(async (recipient) => {
            // In-app notification for observers
            await prisma.notification.create({
              data: {
                userId: recipient.id,
                requestId: input.requestId,
                triggeredByUserId: ctx.user.id,
                type: "request_approved",
                title: `${request.type} req. approved for ${request.user.name}`,
                message: `${request.user.name}'s request was approved by ${approver?.name || "HOD"}.`,
              },
            });

            // Email for observers
            if (recipient.email && approver) {
              const notifEmail = emailTemplates.observerNotificationEmail(
                recipient.name || "Team",
                request.user.name || "Employee",
                approver.name || "Manager",
                "APPROVED",
                request.type,
                docId,
                detailsHtml,
                {
                  dept: request.user.department?.name || "N/A",
                  pos: request.user.position || "Staff",
                  topic: `${request.type.toUpperCase()} NOTIFICATION`,
                  action: "OBSERVED-APPROVED",
                  level: "NORMAL"
                }
              );
              await sendEmail(recipient.email, notifEmail.subject, notifEmail.html);
            }
          }));
        } catch (error) {
          console.error("Background finalApprove notifications failed:", error);
        }
      })();
    };

    const routeToNext = async (nextLevel: string, nextRole: string) => {
      const nextUser = await prisma.user.findFirst({
        where: { OR: [{ role: nextRole as any }, { additionalRoles: { contains: nextRole } }] }
      });
      if (!nextUser) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `No ${nextRole} found` });

      await prisma.requestApproval.create({
        data: { requestId: input.requestId, approverId: nextUser.id, approvalLevel: nextLevel as any, status: "pending" }
      });
      await prisma.request.update({
        where: { id: input.requestId },
        data: { status: "pending", currentApprovalLevel: nextLevel as any, updatedAt: new Date() }
      });
      await prisma.notification.create({
        data: {
          userId: nextUser.id,
          requestId: input.requestId,
          triggeredByUserId: ctx.user.id,
          type: "approval_needed",
          title: `Approval needed: ${request.type} request`,
          message: `A request is waiting for your approval.`,
        }
      });

      // Run escalation email notification in the background
      (async () => {
        try {
          if (nextUser.email) {
            const docId = getDocId(request);
            const detailsHtml = await generateRequestDetailsHtml(prisma, request);
            const emailContent = emailTemplates.requestSubmittedEmail(
              nextUser.name || "Manager",
              request.user.name || "Employee",
              request.type,
              docId,
              detailsHtml,
              {
                dept: request.user.department?.name || "N/A",
                pos: request.user.position || "Staff",
                topic: `${request.type.toUpperCase()} ESCALATION`,
                action: "PENDING-APPROVAL",
                level: "URGENT"
              }
            );
            await sendEmail(nextUser.email, emailContent.subject, emailContent.html);
          }
        } catch (error) {
          console.error("Background routeToNext email failed:", error);
        }
      })();
    };

      // Resolve all active roles for the approver (primary + additionalRoles)
      const approverRolesToCheck = [ctx.user.role as string, ...parseAdditionalRoles(ctx.user.additionalRoles)];

      // Try to mark the approval by the exact approverId first
      const byIdResult = await prisma.requestApproval.updateMany({
        where: { requestId: input.requestId, approverId: ctx.user.id, status: "pending" },
        data: { status: "approved", comments: input.comments, signatureFileId: input.signatureFileId, approvalDate: new Date() }
      });

      // If no record matched by ID (e.g. the record was assigned to a different user of the same role pool),
      // fall back to updating by approval level if the user holds that role
      if (byIdResult.count === 0 && request.currentApprovalLevel) {
        const currentLevel = request.currentApprovalLevel as string;
        if (approverRolesToCheck.includes(currentLevel)) {
          await prisma.requestApproval.updateMany({
            where: { requestId: input.requestId, approvalLevel: currentLevel as any, status: "pending" },
            data: { status: "approved", comments: input.comments, signatureFileId: input.signatureFileId, approvalDate: new Date(), approverId: ctx.user.id }
          });
        }
      }

      const workflow = await prisma.workflowConfig.findFirst({
        where: { requestType: request.type, isActive: true },
        include: { steps: { orderBy: { stepOrder: "asc" } } }
      });

      if (workflow) {
        const currentStep = workflow.steps.find((s: any) => s.roleResponsible === request.currentApprovalLevel);
        if (currentStep) {
          const rules = await prisma.escalationRule.findMany({ where: { workflowStepId: currentStep.id } });
          let escalated = false;

          if (rules.length) {
            let details: any = null;
            if (request.type === "asset") details = await prisma.assetRequest.findUnique({ where: { requestId: request.id } });
            else if (request.type === "expenditure") details = await prisma.expenditureRequest.findUnique({ where: { requestId: request.id } });

            for (const rule of rules) {
              const val = details?.[rule.conditionColumn];
              const threshold = parseFloat(rule.conditionValue);
              if ((rule.conditionOperator === ">" && val > threshold) || (rule.conditionOperator === "<" && val < threshold)) {
                await routeToNext(rule.targetRole, rule.targetRole);
                escalated = true;
                break;
              }
            }
          }

          if (!escalated) {
            // Head of finance has manual option to Escalate to CEO or Final Approve
            if (currentStep.roleResponsible === "head_of_finance" && (request.type === "expenditure" || request.type === "asset")) {
              if (input.escalateToCeo) {
                const nextStep = workflow.steps.find((s: any) => s.roleResponsible === "ceo_md");
                if (nextStep) await routeToNext(nextStep.roleResponsible, nextStep.roleResponsible);
                else await routeToNext("ceo_md", "ceo_md");
              } else {
                await finalApprove();
              }
            } else {
              if (currentStep.isFinal) await finalApprove();
              else {
                const nextStep = workflow.steps.find((s: any) => s.stepOrder > currentStep.stepOrder);
                if (nextStep) await routeToNext(nextStep.roleResponsible, nextStep.roleResponsible);
                else await finalApprove();
              }
            }
          }
          return { success: true };
        }
      }

      // Legacy fallback
      if (request.type === "leave") {
        await finalApprove();
      } else if (request.type === "car") {
        await finalApprove();
      } else if (request.type === "expenditure" || request.type === "asset") {
        if (request.currentApprovalLevel === "head_of_department") {
          await routeToNext("head_of_finance", "head_of_finance");
        } else if (request.currentApprovalLevel === "head_of_finance") {
          if (input.escalateToCeo) await routeToNext("ceo_md", "ceo_md");
          else await finalApprove();
        } else {
          await finalApprove();
        }
      } else {
        await finalApprove();
      }

      return { success: true };
    }),

  rejectRequest: protectedProcedure
    .input(z.object({ requestId: z.number(), comments: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const request = await prisma.request.findUnique({
        where: { id: input.requestId },
        include: { user: { include: { department: true } } }
      });
      if (!request) throw new TRPCError({ code: "NOT_FOUND" });

      // Resolve all active roles for the rejector (primary + additionalRoles)
      const rejectorRolesToCheck = [ctx.user.role as string, ...parseAdditionalRoles(ctx.user.additionalRoles)];

      const rejectByIdResult = await prisma.requestApproval.updateMany({
        where: { requestId: input.requestId, approverId: ctx.user.id, status: "pending" },
        data: { status: "rejected", comments: input.comments, approvalDate: new Date() }
      });

      // Fallback: match by approvalLevel if this user holds that role
      if (rejectByIdResult.count === 0 && request.currentApprovalLevel) {
        const currentLevel = request.currentApprovalLevel as string;
        if (rejectorRolesToCheck.includes(currentLevel)) {
          await prisma.requestApproval.updateMany({
            where: { requestId: input.requestId, approvalLevel: currentLevel as any, status: "pending" },
            data: { status: "rejected", comments: input.comments, approvalDate: new Date(), approverId: ctx.user.id }
          });
        }
      }

      await prisma.request.update({
        where: { id: input.requestId },
        data: { status: "rejected", updatedAt: new Date() }
      });

      await prisma.notification.create({
        data: {
          userId: request.userId,
          requestId: input.requestId,
          triggeredByUserId: ctx.user.id,
          type: "request_rejected",
          title: `Your ${request.type} request was rejected`,
          message: `Reason: ${input.comments}`,
        }
      });

      // Run email notifications in the background so it doesn't block the HTTP response of the reject request
      (async () => {
        try {
          const approver = await prisma.user.findUnique({ where: { id: ctx.user.id } });
          const docId = getDocId(request);

          // Notify Requester
          if (request.user?.email && approver) {
            const emailContent = emailTemplates.requestRejectedEmail(
              request.user.name || "Employee",
              approver.name || "Manager",
              request.type,
              docId,
              input.comments,
              {
                dept: request.user.department?.name || "N/A",
                pos: request.user.position || "Staff",
                topic: `${request.type.toUpperCase()} REQUEST`,
                action: "REJECTED",
                level: "MODERATE"
              }
            );
            sendEmail(request.user.email, emailContent.subject, emailContent.html).catch(e => console.error("Requester email error:", e));
          }

          // Notify Observers (HR/CEO)
          const observers = await prisma.user.findMany({
            where: {
              OR: [
                { role: "hr" }, { role: "ceo_md" },
                { additionalRoles: { contains: "hr" } }, { additionalRoles: { contains: "ceo_md" } }
              ],
              id: { not: ctx.user.id }
            }
          });

          await Promise.all(observers.map(async (recipient) => {
            if (recipient.email && approver) {
              const detailsHtml = await generateRequestDetailsHtml(prisma, request);
              const notifEmail = emailTemplates.observerNotificationEmail(
                recipient.name || "Team",
                request.user.name || "Employee",
                approver.name || "Manager",
                "REJECTED",
                request.type,
                docId,
                detailsHtml + `<br/><p style="color:#d32f2f"><strong>Rejection Reason:</strong> ${input.comments}</p>`,
                {
                  dept: request.user.department?.name || "N/A",
                  pos: request.user.position || "Staff",
                  topic: `${request.type.toUpperCase()} NOTIFICATION`,
                  action: "OBSERVED-REJECTED",
                  level: "MODERATE"
                }
              );
              await sendEmail(recipient.email, notifEmail.subject, notifEmail.html);
            }
          }));
        } catch (error) {
          console.error("Background reject notifications failed:", error);
        }
      })();

      return { success: true };
    }),

  getAttachments: protectedProcedure
    .input(z.object({ requestId: z.number() }))
    .query(async ({ input }) => {
      return prisma.requestAttachment.findMany({ where: { requestId: input.requestId } });
    }),

  uploadAttachment: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      fileName: z.string(),
      fileData: z.string(),
      mimeType: z.string(),
      attachmentType: z.enum(["employee_signature", "manager_signature", "hr_signature", "ceo_signature", "supporting_document"]),
    }))
    .mutation(async ({ input, ctx }) => {
      const fileBuffer = Buffer.from(input.fileData, "base64");
      const validation = validateFile(fileBuffer, input.mimeType);
      if (!validation.valid) throw new TRPCError({ code: "BAD_REQUEST", message: validation.error || "Invalid file" });

      const fileKey = generateFileKey(input.requestId, input.attachmentType, input.fileName);
      const { url } = await uploadFileToSpaces(fileBuffer, fileKey, input.mimeType);

      const attachment = await prisma.requestAttachment.create({
        data: {
          requestId: input.requestId,
          fileName: input.fileName,
          fileUrl: url,
          fileKey,
          mimeType: input.mimeType,
          type: input.attachmentType,
          uploadedBy: ctx.user.id,
        }
      });

      return { success: true, fileId: attachment.id, fileUrl: url };
    }),

  getLeaveBalance: protectedProcedure.query(async ({ ctx }) => {
    const user = await prisma.user.findUnique({ where: { id: ctx.user.id } });
    if (!user) throw new TRPCError({ code: "NOT_FOUND" });

    const leaveCalc = calculateAnnualLeaveBalance(user.dateOfEmployment);
    const currentYear = new Date().getFullYear();

    let balance = await prisma.leaveBalance.findFirst({ where: { userId: ctx.user.id, year: currentYear } });
    if (!balance) {
      balance = await prisma.leaveBalance.create({
        data: {
          userId: ctx.user.id,
          year: currentYear,
          annualLeaveEntitled: Math.round(leaveCalc.totalAnnualLeave * 100) / 100,
          annualLeaveCarryover: 0,
          annualLeaveTaken: 0,
          annualLeaveRemaining: Math.round(leaveCalc.totalAnnualLeave * 100) / 100,
          sickLeave: 10,
          personalLeave: 3,
        }
      });
    }

    const approvedAnnualLeaves = await prisma.request.findMany({
      where: {
        userId: ctx.user.id,
        type: "leave",
        status: "approved",
        leaveRequest: { leaveType: "annual" }
      },
      include: { leaveRequest: true }
    });

    // Get all approved leave dates for calendar visualization
    const allApprovedLeaves = await prisma.request.findMany({
      where: {
        userId: ctx.user.id,
        type: "leave",
        status: "approved",
      },
      include: { leaveRequest: true }
    });

    // Extract all taken leave dates (from startDate to endDate inclusive)
    const takenLeaveDates: string[] = [];
    for (const request of allApprovedLeaves) {
      if (request.leaveRequest?.startDate && request.leaveRequest?.endDate) {
        const start = new Date(request.leaveRequest.startDate);
        const end = new Date(request.leaveRequest.endDate);
        const current = new Date(start);

        while (current <= end) {
          const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
          takenLeaveDates.push(dateStr);
          current.setDate(current.getDate() + 1);
        }
      }
    }

    const totalUsedAnnual = approvedAnnualLeaves.reduce((sum: number, r: any) => sum + (r.leaveRequest?.leaveDaysRequested || 0), 0);
    const remaining = (leaveCalc.totalAnnualLeave + (balance.annualLeaveCarryover || 0)) - totalUsedAnnual;

    const updated = await prisma.leaveBalance.update({
      where: { id: balance.id },
      data: {
        annualLeaveEntitled: Math.round(leaveCalc.totalAnnualLeave * 100) / 100,
        annualLeaveTaken: totalUsedAnnual,
        annualLeaveRemaining: Math.round(remaining * 100) / 100,
        updatedAt: new Date(),
      }
    });

    return {
      ...updated,
      isEligibleForAnnualLeave: leaveCalc.completedFullYear,
      employmentDate: user.dateOfEmployment,
      monthsEmployed: leaveCalc.monthsEmployed,
      yearsEmployed: leaveCalc.yearsEmployed,
      totalAnnualLeave: leaveCalc.totalAnnualLeave,
      takenLeaveDates, // Array of dates already on leave
      eligibilityMessage: leaveCalc.completedFullYear
        ? `✓ Eligible for annual leave (${leaveCalc.yearsEmployed} year(s) employed)`
        : `Not eligible yet. Accrued: ${Math.round(leaveCalc.totalAnnualLeave * 100) / 100} days`,
    };
  }),

  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    // Resolve all active roles for the user (primary + additional roles)
    const rolesToCheck: string[] = [ctx.user.role, ...parseAdditionalRoles(ctx.user.additionalRoles)];

    const hasFullAccess = ["admin", "hr", "ceo_md"].some((role) => rolesToCheck.includes(role));
    if (hasFullAccess) {
      const [totalRequests, totalUsers, pending, approved, rejected] = await Promise.all([
        prisma.request.count({ where: { NOT: { status: { in: ["draft", "cancelled"] } } } }),
        prisma.user.count(),
        prisma.request.count({ where: { status: "pending" } }),
        prisma.request.count({ where: { status: "approved" } }),
        prisma.request.count({ where: { status: "rejected" } }),
      ]);
      return { totalRequests, totalUsers, pendingRequests: pending, approvedRequests: approved, rejectedRequests: rejected };
    }

    const isApprover = ["head_of_department", "hr", "head_of_finance", "ceo_md"].some((role) => rolesToCheck.includes(role));
    if (isApprover) {
      const [pendCount, hdl] = await Promise.all([
        prisma.request.count({
          where: {
            status: "pending",
            OR: [
              { currentApprovalLevel: { in: rolesToCheck as any[] } },
              { approvals: { some: { approverId: ctx.user.id, status: "pending" } } }
            ]
          }
        }),
        prisma.requestApproval.findMany({ where: { approverId: ctx.user.id, status: { in: ["approved", "rejected"] } } }),
      ]);
      return {
        totalRequests: pendCount + hdl.length,
        pendingRequests: pendCount,
        approvedRequests: hdl.filter((a: any) => a.status === "approved").length,
        rejectedRequests: hdl.filter((a: any) => a.status === "rejected").length,
      };
    }

    const userReqs = await prisma.request.findMany({ where: { userId: ctx.user.id, NOT: { status: { in: ["draft", "cancelled"] } } } });
    return {
      totalRequests: userReqs.length,
      pendingRequests: userReqs.filter((r: any) => r.status === "pending").length,
      approvedRequests: userReqs.filter((r: any) => r.status === "approved").length,
      rejectedRequests: userReqs.filter((r: any) => r.status === "rejected").length,
    };
  }),

  getRecentRequests: protectedProcedure
    .input(z.object({ limit: z.number().default(5) }))
    .query(async ({ ctx, input }) => {
      return prisma.request.findMany({
        where: { userId: ctx.user.id, NOT: { status: { in: ["draft", "cancelled"] } } },
        orderBy: { createdAt: "desc" },
        take: input.limit,
        include: {
          leaveRequest: true,
          carRequest: true,
          expenditureRequest: true,
          assetRequest: true,
        },
      });
    }),

  getApprovedExpenditures: protectedProcedure.query(async () => {
    const result = await prisma.$queryRaw<any[]>`
      SELECT 
        COALESCE(SUM(CASE WHEN er.currency = 'RWF' THEN er.amount ELSE 0 END), 0) as rwf,
        COALESCE(SUM(CASE WHEN er.currency = 'USD' THEN er.amount ELSE 0 END), 0) as usd,
        COALESCE(SUM(CASE WHEN er.currency = 'EUR' THEN er.amount ELSE 0 END), 0) as eur
      FROM expenditure_requests er
      INNER JOIN requests r ON er.request_id = r.id
      WHERE r.status = 'approved'
    `;
    return {
      rwf: Number(result[0]?.rwf) || 0,
      usd: Number(result[0]?.usd) || 0,
      eur: Number(result[0]?.eur) || 0,
    };
  }),

  getExpenditureHistory: protectedProcedure.query(async ({ ctx }) => {
    const rolesToCheck: string[] = [ctx.user.role, ...parseAdditionalRoles(ctx.user.additionalRoles)];
    const hasPriv = ["head_of_finance", "admin", "hr", "ceo_md"].some((role) => rolesToCheck.includes(role));
    if (!hasPriv) throw new TRPCError({ code: "FORBIDDEN" });

    const expenditures = await prisma.request.findMany({
      where: { type: "expenditure", status: "approved" },
      include: { expenditureRequest: true, user: true },
      orderBy: { createdAt: "desc" },
    });
    return expenditures.map((req: any) => ({
      ...req,
      amount: req.expenditureRequest?.amount || 0,
      currency: req.expenditureRequest?.currency,
      requester: req.user,
    }));
  }),

  getEmployeeLeaveData: protectedProcedure
    .input(z.object({ employeeId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const rolesToCheck: string[] = [ctx.user.role, ...parseAdditionalRoles(ctx.user.additionalRoles)];
      const hasPriv = ["hr", "admin", "ceo_md"].some((role) => rolesToCheck.includes(role));
      if (!hasPriv) throw new TRPCError({ code: "FORBIDDEN" });

      const targetId = input.employeeId || ctx.user.id;
      const [employee, balance, reqs] = await Promise.all([
        prisma.user.findUnique({ where: { id: targetId } }),
        prisma.leaveBalance.findFirst({ where: { userId: targetId, year: new Date().getFullYear() } }),
        prisma.request.findMany({ where: { userId: targetId, type: "leave" }, include: { leaveRequest: true }, orderBy: { createdAt: "desc" } })
      ]);
      return { employee, leaveBalance: balance, leaveRequests: reqs.map((r: any) => ({ ...r, details: r.leaveRequest })) };
    }),

  getAllEmployees: protectedProcedure.query(async ({ ctx }) => {
    const rolesToCheck = [ctx.user.role, ...parseAdditionalRoles(ctx.user.additionalRoles)];
    const hasPriv = ["hr", "admin", "ceo_md"].some((role) => rolesToCheck.includes(role));
    if (!hasPriv) throw new TRPCError({ code: "FORBIDDEN" });
    return prisma.user.findMany({ where: { role: "user" }, orderBy: { name: "asc" } });
  }),

  storeLeaveFormData: protectedProcedure
    .input(z.object({ requestId: z.number(), formData: z.any() }))
    .mutation(async ({ input }) => {
      await prisma.formSubmission.upsert({
        where: { requestId: input.requestId },
        create: { requestId: input.requestId, formData: JSON.stringify(input.formData) },
        update: { formData: JSON.stringify(input.formData), updatedAt: new Date() }
      });
      return { success: true };
    }),

  getLeaveFormData: protectedProcedure
    .input(z.object({ requestId: z.coerce.number() }))
    .query(async ({ input }) => {
      const submission = await prisma.formSubmission.findUnique({ where: { requestId: input.requestId } });
      if (submission) {
        const parsed = JSON.parse(submission.formData);
        const hod = await prisma.requestApproval.findFirst({ where: { requestId: input.requestId, approvalLevel: "head_of_department" }, include: { signature: true } });
        if (hod?.signature) parsed.managerSignatureUrl = hod.signature.fileUrl;
        parsed.requestId = input.requestId;
        return parsed;
      }
      return null;
    }),

  storeCarFormData: protectedProcedure
    .input(z.object({ requestId: z.number(), formData: z.any() }))
    .mutation(async ({ input }) => {
      await prisma.formSubmission.upsert({
        where: { requestId: input.requestId },
        create: { requestId: input.requestId, formData: JSON.stringify(input.formData) },
        update: { formData: JSON.stringify(input.formData), updatedAt: new Date() }
      });
      return { success: true };
    }),

  getCarFormData: protectedProcedure
    .input(z.object({ requestId: z.coerce.number() }))
    .query(async ({ input }) => {
      const submission = await prisma.formSubmission.findUnique({ where: { requestId: input.requestId } });
      if (submission) {
        const parsed = JSON.parse(submission.formData);
        const hod = await prisma.requestApproval.findFirst({ where: { requestId: input.requestId, approvalLevel: "head_of_department" }, include: { signature: true } });
        if (hod?.signature) parsed.managerSignatureUrl = hod.signature.fileUrl;
        const hr = await prisma.requestApproval.findFirst({ where: { requestId: input.requestId, approvalLevel: "hr" }, include: { signature: true } });
        if (hr?.signature) parsed.hrSignatureUrl = hr.signature.fileUrl;
        parsed.requestId = input.requestId;
        return parsed;
      }
      return null;
    }),

  storeExpenditureFormData: protectedProcedure
    .input(z.object({ requestId: z.number(), formData: z.any() }))
    .mutation(async ({ input }) => {
      await prisma.formSubmission.upsert({
        where: { requestId: input.requestId },
        create: { requestId: input.requestId, formData: JSON.stringify(input.formData) },
        update: { formData: JSON.stringify(input.formData), updatedAt: new Date() }
      });
      return { success: true };
    }),

  getExpenditureFormData: protectedProcedure
    .input(z.object({ requestId: z.coerce.number() }))
    .query(async ({ input }) => {
      const submission = await prisma.formSubmission.findUnique({ where: { requestId: input.requestId } });
      if (submission) {
        const parsed = JSON.parse(submission.formData);
        const hod = await prisma.requestApproval.findFirst({ where: { requestId: input.requestId, approvalLevel: "head_of_department" }, include: { signature: true } });
        if (hod?.signature) parsed.managerSignatureUrl = hod.signature.fileUrl;
        const finance = await prisma.requestApproval.findFirst({ where: { requestId: input.requestId, approvalLevel: "head_of_finance" }, include: { signature: true } });
        if (finance?.signature) parsed.financeSignatureUrl = finance.signature.fileUrl;
        const hr = await prisma.requestApproval.findFirst({ where: { requestId: input.requestId, approvalLevel: "hr" }, include: { signature: true } });
        if (hr?.signature) parsed.hrSignatureUrl = hr.signature.fileUrl;
        const ceo = await prisma.requestApproval.findFirst({ where: { requestId: input.requestId, approvalLevel: "ceo_md" }, include: { signature: true } });
        if (ceo?.signature) parsed.ceoSignatureUrl = ceo.signature.fileUrl;
        parsed.requestId = input.requestId;
        return parsed;
      }
      return null;
    }),

  storeAssetFormData: protectedProcedure
    .input(z.object({ requestId: z.number(), formData: z.any() }))
    .mutation(async ({ input }) => {
      await prisma.formSubmission.upsert({
        where: { requestId: input.requestId },
        create: { requestId: input.requestId, formData: JSON.stringify(input.formData) },
        update: { formData: JSON.stringify(input.formData), updatedAt: new Date() }
      });
      return { success: true };
    }),

  getAssetFormData: protectedProcedure
    .input(z.object({ requestId: z.coerce.number() }))
    .query(async ({ input }) => {
      const submission = await prisma.formSubmission.findUnique({ where: { requestId: input.requestId } });
      if (submission) {
        const parsed = JSON.parse(submission.formData);
        const hod = await prisma.requestApproval.findFirst({ where: { requestId: input.requestId, approvalLevel: "head_of_department" }, include: { signature: true } });
        if (hod?.signature) parsed.managerSignatureUrl = hod.signature.fileUrl;
        const finance = await prisma.requestApproval.findFirst({ where: { requestId: input.requestId, approvalLevel: "head_of_finance" }, include: { signature: true } });
        if (finance?.signature) parsed.financeSignatureUrl = finance.signature.fileUrl;
        const hr = await prisma.requestApproval.findFirst({ where: { requestId: input.requestId, approvalLevel: "hr" }, include: { signature: true } });
        if (hr?.signature) parsed.hrSignatureUrl = hr.signature.fileUrl;
        const ceo = await prisma.requestApproval.findFirst({ where: { requestId: input.requestId, approvalLevel: "ceo_md" }, include: { signature: true } });
        if (ceo?.signature) parsed.ceoSignatureUrl = ceo.signature.fileUrl;
        parsed.requestId = input.requestId;
        return parsed;
      }
      return null;
    }),

  getCarRequestDetails: protectedProcedure
    .input(z.object({ requestId: z.coerce.number() }))
    .query(async ({ input }) => {
      const req = await prisma.request.findUnique({ where: { id: input.requestId }, include: { carRequest: true, user: { include: { department: true } } } });
      if (!req) throw new TRPCError({ code: "NOT_FOUND" });
      return { request: req, carDetails: req.carRequest, employee: req.user };
    }),

  getExpenditureRequestDetails: protectedProcedure
    .input(z.object({ requestId: z.coerce.number() }))
    .query(async ({ input }) => {
      const req = await prisma.request.findUnique({ where: { id: input.requestId }, include: { expenditureRequest: true, user: { include: { department: true } } } });
      if (!req) throw new TRPCError({ code: "NOT_FOUND" });
      return { request: req, expenditureDetails: req.expenditureRequest, employee: req.user };
    }),

  getAssetRequestDetails: protectedProcedure
    .input(z.object({ requestId: z.coerce.number() }))
    .query(async ({ input }) => {
      const req = await prisma.request.findUnique({ where: { id: input.requestId }, include: { assetRequest: true, user: { include: { department: true } } } });
      if (!req) throw new TRPCError({ code: "NOT_FOUND" });
      return { request: req, assetDetails: req.assetRequest, employee: req.user };
    }),

  cancelRequest: protectedProcedure
    .input(z.object({ requestId: z.number(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const req = await prisma.request.findUnique({ where: { id: input.requestId } });
      if (!req) throw new TRPCError({ code: "NOT_FOUND" });
      if (ctx.user.id !== req.userId && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      if (req.status !== "pending" && req.status !== "draft") throw new TRPCError({ code: "BAD_REQUEST" });
      await prisma.request.update({ where: { id: input.requestId }, data: { status: "cancelled", updatedAt: new Date() } });
      return { success: true };
    }),

  deleteRequest: protectedProcedure
    .input(z.object({ requestId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const req = await prisma.request.findUnique({ where: { id: input.requestId } });
      if (!req) throw new TRPCError({ code: "NOT_FOUND" });
      if (ctx.user.id !== req.userId && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      if (req.status !== "draft") throw new TRPCError({ code: "BAD_REQUEST" });
      await prisma.request.delete({ where: { id: input.requestId } });
      return { success: true };
    }),

  getMyLeaveBalance: protectedProcedure.query(async ({ ctx }) => {
    const user = await prisma.user.findUnique({ where: { id: ctx.user.id } });
    if (!user) throw new TRPCError({ code: "NOT_FOUND" });
    const lb = calculateAnnualLeaveBalance(user.dateOfEmployment);
    const used = await prisma.$queryRaw<any[]>`
      SELECT COALESCE(SUM(CAST(lr.leave_days_requested AS DECIMAL)), 0) as total
      FROM leave_requests lr INNER JOIN requests r ON lr.request_id = r.id
      WHERE r.user_id = ${ctx.user.id} AND lr.leave_type = 'annual' AND EXTRACT(YEAR FROM r.created_at) = ${new Date().getFullYear()} AND r.status IN ('approved', 'pending')
    `;
    const totalUsed = Number(used[0]?.total) || 0;
    return { ...lb, usedDays: totalUsed, remainingDays: lb.totalAnnualLeave - totalUsed, employmentDate: user.dateOfEmployment };
  }),

  getDepartmentAnalytics: protectedProcedure.query(async ({ ctx }) => {
    const rolesToCheck: string[] = [ctx.user.role, ...parseAdditionalRoles(ctx.user.additionalRoles)];
    const isM = ["head_of_department", "hr", "head_of_finance", "ceo_md"].some((role) => rolesToCheck.includes(role));
    const reqs = await prisma.request.findMany({
      where: isM ? { user: { departmentId: ctx.user.departmentId } } : { userId: ctx.user.id },
    });
    const act = reqs.filter((r: any) => r.status !== "draft" && r.status !== "cancelled");

    // Calculate average processing time (hrs) for completed requests
    const completed = act.filter((r: any) => r.status === "approved" || r.status === "rejected");
    const avgTime = completed.length > 0
      ? completed.reduce((acc: number, r: any) => acc + (r.updatedAt.getTime() - r.createdAt.getTime()), 0) / completed.length / (1000 * 60 * 60)
      : 0;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyCount = act.filter((r: any) => {
      const d = new Date(r.createdAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;

    return {
      totalRequests: act.length,
      approvedCount: act.filter((r: any) => r.status === "approved").length,
      rejectedCount: act.filter((r: any) => r.status === "rejected").length,
      pendingCount: act.filter((r: any) => r.status === "pending").length,
      leaveCount: act.filter((r: any) => r.type === "leave").length,
      carCount: act.filter((r: any) => r.type === "car").length,
      expenditureCount: act.filter((r: any) => r.type === "expenditure").length,
      avgProcessingTime: Math.round(avgTime * 10) / 10,
      monthlyRequests: monthlyCount,
    };
  }),

  getTeamStatistics: protectedProcedure.query(async ({ ctx }) => {
    const rolesToCheck: string[] = [ctx.user.role, ...parseAdditionalRoles(ctx.user.additionalRoles)];
    if (!["head_of_department", "hr", "head_of_finance", "ceo_md"].some((role) => rolesToCheck.includes(role))) throw new TRPCError({ code: "FORBIDDEN" });
    const team = await prisma.user.findMany({
      where: { departmentId: ctx.user.departmentId, role: "user" },
      include: { requests: { where: { NOT: { status: { in: ["draft", "cancelled"] } } } } }
    });
    const teamMembers = team.map((m: any) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      profileImage: m.profileImage,
      requestCount: m.requests.length,
      approvedCount: m.requests.filter((r: any) => r.status === "approved").length,
      pendingCount: m.requests.filter((r: any) => r.status === "pending").length,
      rejectedCount: m.requests.filter((r: any) => r.status === "rejected").length,
    })).sort((a: any, b: any) => b.requestCount - a.requestCount);

    const totalRequests = teamMembers.reduce((acc: number, m: any) => acc + m.requestCount, 0);
    const approvedCount = teamMembers.reduce((acc: number, m: any) => acc + m.approvedCount, 0);
    const pendingCount = teamMembers.reduce((acc: number, m: any) => acc + m.pendingCount, 0);
    const rejectedCount = teamMembers.reduce((acc: number, m: any) => acc + m.rejectedCount, 0);

    return {
      totalMembers: team.length,
      totalRequests,
      approvedCount,
      pendingCount,
      rejectedCount,
      teamMembers,
    };
  }),

  listAllLeaveRequests: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      leaveType: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const rolesToCheck: string[] = [ctx.user.role, ...parseAdditionalRoles(ctx.user.additionalRoles)];
      if (!["hr", "admin", "ceo_md"].some((role) => rolesToCheck.includes(role))) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return prisma.request.findMany({
        where: {
          type: "leave",
          ...(input.status ? { status: input.status as any } : {}),
          leaveRequest: {
            ...(input.leaveType ? { leaveType: input.leaveType as any } : {}),
          }
        },
        include: {
          user: { include: { department: true } },
          leaveRequest: true,
          approvals: { include: { approver: true } }
        },
        orderBy: { createdAt: "desc" }
      });
    }),

  getAllLeaveBalances: protectedProcedure.query(async ({ ctx }) => {
    const rolesToCheck: string[] = [ctx.user.role, ...parseAdditionalRoles(ctx.user.additionalRoles)];
    if (!["hr", "admin", "ceo_md"].some((role) => rolesToCheck.includes(role))) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    return prisma.leaveBalance.findMany({
      where: { year: new Date().getFullYear() },
      include: {
        user: { include: { department: true } }
      },
      orderBy: { user: { name: "asc" } }
    });
  }),
});
