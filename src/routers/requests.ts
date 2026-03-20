import { z } from "zod";
import { protectedProcedure, router } from "../core/trpc";
import { prisma } from "../db";
import { TRPCError } from "@trpc/server";
import { sendEmail, emailTemplates } from "../core/email";
import {
  uploadFileToSpaces,
  generateFileKey,
  validateFile,
  isSpacesConfigured,
} from "../lib/spaces";
import { calculateAnnualLeaveBalance } from "../lib/leaveBalanceCalculator";

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

  listUserRequests: protectedProcedure.query(async ({ ctx }) => {
    const userReqs = await prisma.request.findMany({
      where: { userId: ctx.user.id },
      include: {
        leaveRequest: true,
        carRequest: true,
        expenditureRequest: true,
        assetRequest: true,
        approvals: { include: { signature: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return userReqs.map((req: any) => {
      const hodApproval = req.approvals?.find((a: any) => a.approvalLevel === "head_of_department");
      return {
        ...req,
        managerSignatureUrl: hodApproval?.signature?.fileUrl || null,
        typeDetails: req.leaveRequest || req.carRequest || req.expenditureRequest || req.assetRequest
      };
    });
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
        },
      });

      if (!request) return null;
      if (request.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const hodApproval = request.approvals?.find(a => a.approvalLevel === "head_of_department");
      return {
        ...request,
        managerSignatureUrl: hodApproval?.signature?.fileUrl || null,
        typeDetails: request.leaveRequest || request.carRequest || request.expenditureRequest || request.assetRequest
      };
    }),

  submitRequest: protectedProcedure
    .input(z.object({ id: z.number(), initialApproverId: z.number().optional() }))
    .mutation(async ({ ctx, input }) => {
      const request = await prisma.request.findUnique({
        where: { id: input.id },
        include: { user: true }
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
          approverId = input.initialApproverId || request.user.managerId || (await prisma.user.findFirst({ where: { role: "head_of_department" } }))?.id || 0;
        } else {
          approverId = (await prisma.user.findFirst({
            where: { OR: [{ role: initialLevel as any }, { additionalRoles: { contains: initialLevel } }] }
          }))?.id || 0;
        }
      } else {
        // Legacy fallback
        initialLevel = request.type === "car" ? "hr" : "head_of_department";
        approverId = input.initialApproverId || (await prisma.user.findFirst({ where: { role: initialLevel as any } }))?.id || 0;
      }

      if (!approverId) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No approver found" });

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

      if (request.type === "leave") {
        try {
          const approver = await prisma.user.findUnique({ where: { id: approverId } });
          const leaveReq = await prisma.leaveRequest.findUnique({ where: { requestId: request.id } });
          const docId = `LR-${new Date(request.createdAt).getFullYear()}-${String(new Date(request.createdAt).getMonth() + 1).padStart(2, '0')}-${request.id.toString().padStart(5, '0')}`;
          
          if (approver?.email && leaveReq) {
            const emailContent = emailTemplates.leaveRequestSubmittedEmail(
              request.user.name || "Employee",
              approver.name || "Manager",
              docId,
              leaveReq.startDate,
              leaveReq.endDate
            );
            await sendEmail(approver.email, emailContent.subject, emailContent.html);
          }
        } catch (error) {
          console.error("Failed to send submission email", error);
        }
      }

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
    };

    const approvals = await prisma.requestApproval.findMany({
      where: { approverId: ctx.user.id, status: "pending" },
      include: { request: { include: requestIncludes } }
    });

    let results = approvals.map((a: any) => a.request);

    if (ctx.user.role === "admin") {
      const allPending = await prisma.request.findMany({
        where: { status: "pending" },
        include: requestIncludes,
        orderBy: { createdAt: "desc" }
      });
      const map = new Map(results.map((r: any) => [r.id, r]));
      allPending.forEach((r: any) => { if (!map.has(r.id)) map.set(r.id, r); });
      results = Array.from(map.values());
    }

    if (ctx.user.role === "head_of_finance") {
      results = (results as any[]).filter((r: any) => r.type === "expenditure");
    }

    return (results as any[]).sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());
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
        include: { user: true }
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

        if (request.type === "leave") {
          try {
            const approver = await prisma.user.findUnique({ where: { id: ctx.user.id } });
            const leaveReq = await prisma.leaveRequest.findUnique({ where: { requestId: request.id } });
            const docId = `LR-${new Date(request.createdAt).getFullYear()}-${String(new Date(request.createdAt).getMonth() + 1).padStart(2, '0')}-${request.id.toString().padStart(5, '0')}`;
            if (request.user.email && leaveReq && approver) {
              const emailContent = emailTemplates.leaveRequestApprovedEmail(
                request.user.name || "Employee",
                approver.name || "Manager",
                docId,
                leaveReq.startDate,
                leaveReq.endDate
              );
              await sendEmail(request.user.email, emailContent.subject, emailContent.html);
            }
          } catch (error) { console.error("Email error", error); }

          // Notify HR and CEO/MD about the approved leave (they should see the record)
          try {
            const approver = await prisma.user.findUnique({ where: { id: ctx.user.id } });
            const leaveReq = await prisma.leaveRequest.findUnique({ where: { requestId: request.id } });
            const docId = `LR-${new Date(request.createdAt).getFullYear()}-${String(new Date(request.createdAt).getMonth() + 1).padStart(2, '0')}-${request.id.toString().padStart(5, '0')}`;

            const hrAndCeoUsers = await prisma.user.findMany({
              where: {
                OR: [
                  { role: "hr" },
                  { role: "ceo_md" },
                  { additionalRoles: { contains: "hr" } },
                  { additionalRoles: { contains: "ceo_md" } },
                ],
                id: { not: ctx.user.id }, // Don't notify the approver themselves
              },
            });

            for (const recipient of hrAndCeoUsers) {
              // In-app notification
              await prisma.notification.create({
                data: {
                  userId: recipient.id,
                  requestId: input.requestId,
                  triggeredByUserId: ctx.user.id,
                  type: "request_approved",
                  title: `Leave approved: ${request.user.name}'s ${request.type} request`,
                  message: `${request.user.name}'s leave request was approved by ${approver?.name || "HOD"}.`,
                },
              });

              // Email notification 
              if (recipient.email && leaveReq && approver) {
                const notifEmail = emailTemplates.leaveApprovedNotificationEmail(
                  recipient.name || "Team",
                  request.user.name || "Employee",
                  approver.name || "HOD",
                  leaveReq.leaveType || "Leave",
                  leaveReq.startDate,
                  leaveReq.endDate,
                  leaveReq.leaveDaysRequested || 0,
                  leaveReq.reason || "",
                  docId,
                  new Date().toISOString().split("T")[0]
                );
                await sendEmail(recipient.email, notifEmail.subject, notifEmail.html);
              }
            }
          } catch (error) { console.error("HR/CEO notification error", error); }
        }
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

        if (request.type === "leave") {
          try {
            const docId = `LR-${new Date(request.createdAt).getFullYear()}-${String(new Date(request.createdAt).getMonth() + 1).padStart(2, '0')}-${request.id.toString().padStart(5, '0')}`;
            const leaveReq = await prisma.leaveRequest.findUnique({ where: { requestId: request.id } });
            if (leaveReq && nextUser.email) {
              const emailContent = emailTemplates.leaveRequestSubmittedEmail(
                request.user.name || "Employee",
                nextUser.name || "Manager",
                docId,
                leaveReq.startDate,
                leaveReq.endDate
              );
              await sendEmail(nextUser.email, emailContent.subject, emailContent.html);
            }
          } catch (error) { console.error("Email error", error); }
        }
      };

      // Current approval
      await prisma.requestApproval.updateMany({
        where: { requestId: input.requestId, approverId: ctx.user.id, status: "pending" },
        data: { status: "approved", comments: input.comments, signatureFileId: input.signatureFileId, approvalDate: new Date() }
      });

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
            if (currentStep.isFinal) await finalApprove();
            else {
              const nextStep = workflow.steps.find((s: any) => s.stepOrder > currentStep.stepOrder);
              if (nextStep) await routeToNext(nextStep.roleResponsible, nextStep.roleResponsible);
              else await finalApprove();
            }
          }
          return { success: true };
        }
      }

      // Legacy fallback
      if (request.type === "leave" && request.currentApprovalLevel === "head_of_department") await finalApprove();
      else if (request.type === "car" && request.currentApprovalLevel === "hr") await finalApprove();
      else if (request.type === "expenditure") {
        if (request.currentApprovalLevel === "head_of_department") await routeToNext("hr", "hr");
        else if (request.currentApprovalLevel === "hr") await routeToNext("head_of_finance", "head_of_finance");
        else if (request.currentApprovalLevel === "head_of_finance") {
          if (input.escalateToCeo) await routeToNext("ceo_md", "ceo_md");
          else await finalApprove();
        } else if (request.currentApprovalLevel === "ceo_md") await finalApprove();
      } else await finalApprove();

      return { success: true };
    }),

  rejectRequest: protectedProcedure
    .input(z.object({ requestId: z.number(), comments: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const request = await prisma.request.findUnique({ where: { id: input.requestId }, include: { user: true } });
      if (!request) throw new TRPCError({ code: "NOT_FOUND" });

      await prisma.requestApproval.updateMany({
        where: { requestId: input.requestId, approverId: ctx.user.id, status: "pending" },
        data: { status: "rejected", comments: input.comments, approvalDate: new Date() }
      });

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

      if (request.type === "leave") {
        try {
          const approver = await prisma.user.findUnique({ where: { id: ctx.user.id } });
          const docId = `LR-${new Date(request.createdAt).getFullYear()}-${String(new Date(request.createdAt).getMonth() + 1).padStart(2, '0')}-${request.id.toString().padStart(5, '0')}`;
          if (request.user?.email && approver) {
            const emailContent = emailTemplates.leaveRequestRejectedEmail(
              request.user.name || "Employee",
              approver.name || "Manager",
              docId,
              input.comments
            );
            await sendEmail(request.user.email, emailContent.subject, emailContent.html);
          }
        } catch (error) { console.error("Email error", error); }
      }

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

    const approvedLeaves = await prisma.request.findMany({
      where: { userId: ctx.user.id, type: "leave", status: "approved" },
      include: { leaveRequest: true }
    });

    const totalUsed = approvedLeaves.reduce((sum: number, r: any) => sum + (r.leaveRequest?.leaveDaysRequested || 0), 0);
    const remaining = (leaveCalc.totalAnnualLeave + (balance.annualLeaveCarryover || 0)) - totalUsed;

    const updated = await prisma.leaveBalance.update({
      where: { id: balance.id },
      data: {
        annualLeaveEntitled: Math.round(leaveCalc.totalAnnualLeave * 100) / 100,
        annualLeaveTaken: totalUsed,
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
      eligibilityMessage: leaveCalc.completedFullYear
        ? `✓ Eligible for annual leave (${leaveCalc.yearsEmployed} year(s) employed)`
        : `Not eligible yet. Accrued: ${Math.round(leaveCalc.totalAnnualLeave * 100) / 100} days`,
    };
  }),

  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role === "admin") {
      const [totalRequests, totalUsers, pending, approved, rejected] = await Promise.all([
        prisma.request.count({ where: { NOT: { status: { in: ["draft", "cancelled"] } } } }),
        prisma.user.count(),
        prisma.request.count({ where: { status: "pending" } }),
        prisma.request.count({ where: { status: "approved" } }),
        prisma.request.count({ where: { status: "rejected" } }),
      ]);
      return { totalRequests, totalUsers, pendingRequests: pending, approvedRequests: approved, rejectedRequests: rejected };
    }

    const isApprover = ["head_of_department", "hr", "head_of_finance", "ceo_md"].includes(ctx.user.role) || !!ctx.user.additionalRoles;
    if (isApprover) {
      const [pend, hdl] = await Promise.all([
        prisma.requestApproval.count({ where: { approverId: ctx.user.id, status: "pending" } }),
        prisma.requestApproval.findMany({ where: { approverId: ctx.user.id, status: { in: ["approved", "rejected"] } } }),
      ]);
      return {
        totalRequests: pend + hdl.length,
        pendingRequests: pend,
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
        where: { userId: ctx.user.id },
        orderBy: { createdAt: "desc" },
        take: input.limit,
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
    if (!["head_of_finance", "admin", "hr", "ceo_md"].includes(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
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
      if (!["hr", "admin", "ceo_md"].includes(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
      const targetId = input.employeeId || ctx.user.id;
      const [employee, balance, reqs] = await Promise.all([
        prisma.user.findUnique({ where: { id: targetId } }),
        prisma.leaveBalance.findFirst({ where: { userId: targetId, year: new Date().getFullYear() } }),
        prisma.request.findMany({ where: { userId: targetId, type: "leave" }, include: { leaveRequest: true }, orderBy: { createdAt: "desc" } })
      ]);
      return { employee, leaveBalance: balance, leaveRequests: reqs.map((r: any) => ({ ...r, details: r.leaveRequest })) };
    }),

  getAllEmployees: protectedProcedure.query(async ({ ctx }) => {
    const hasPriv = ["hr", "admin", "ceo_md"].includes(ctx.user.role) || (ctx.user.additionalRoles && (ctx.user.additionalRoles.includes("hr") || ctx.user.additionalRoles.includes("ceo_md")));
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
      const req = await prisma.request.findUnique({ where: { id: input.requestId }, include: { carRequest: true, user: true } });
      if (!req) throw new TRPCError({ code: "NOT_FOUND" });
      return { request: req, carDetails: req.carRequest, employee: req.user };
    }),

  getExpenditureRequestDetails: protectedProcedure
    .input(z.object({ requestId: z.coerce.number() }))
    .query(async ({ input }) => {
      const req = await prisma.request.findUnique({ where: { id: input.requestId }, include: { expenditureRequest: true, user: true } });
      if (!req) throw new TRPCError({ code: "NOT_FOUND" });
      return { request: req, expenditureDetails: req.expenditureRequest, employee: req.user };
    }),

  getAssetRequestDetails: protectedProcedure
    .input(z.object({ requestId: z.coerce.number() }))
    .query(async ({ input }) => {
      const req = await prisma.request.findUnique({ where: { id: input.requestId }, include: { assetRequest: true, user: true } });
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
    const isM = ["head_of_department", "hr", "head_of_finance", "ceo_md"].includes(ctx.user.role);
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
    if (!["head_of_department", "hr", "head_of_finance", "ceo_md"].includes(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
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
});
