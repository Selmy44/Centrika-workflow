import { z } from "zod";
import { protectedProcedure, router } from "../core/trpc";
import { getDb } from "../db";
import { requests, users, leaveRequests, carRequests, expenditureRequests, requestApprovals, requestAttachments, leaveBalances, notifications, formSubmissions, InsertRequest, InsertLeaveRequest, InsertCarRequest, InsertExpenditureRequest, InsertRequestApproval, InsertRequestAttachment, InsertNotification, InsertFormSubmission, type Request } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { eq, and, desc, sql } from "drizzle-orm";
import { sendEmail, emailTemplates } from "../core/email";
import {
  uploadFileToSpaces,
  generateFileKey,
  validateFile,
  isSpacesConfigured,
} from "../lib/spaces";
import { calculateAnnualLeaveBalance, getRemainingAnnualLeave } from "../lib/leaveBalanceCalculator";

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
      const db = await getDb();

      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      // Fetch user to get employment date
      const userRecord = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);

      if (!userRecord.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const user = userRecord[0];
      const dateOfEmployment = user.dateOfEmployment;

      const insertRequest: InsertRequest = {
        userId: ctx.user.id,
        type: "leave",
        status: "draft",
        title: input.title,
        description: input.reason,
      };

      const result = await db.insert(requests).values(insertRequest).returning({ id: requests.id });
      const requestId = result[0].id;

      // Calculate leave balance based on employment date using new logic
      let entitled = input.leaveDaysEntitled;

      if (input.leaveType === "annual") {
        // Use the new dynamic calculation for annual leave
        const leaveBalance = calculateAnnualLeaveBalance(dateOfEmployment);
        entitled = leaveBalance.totalAnnualLeave;

        console.log(`[createLeaveRequest] Annual leave calculated for user ${ctx.user.id}:`, {
          employmentDate: dateOfEmployment,
          monthsEmployed: leaveBalance.monthsEmployed,
          yearsEmployed: leaveBalance.yearsEmployed,
          completedFullYear: leaveBalance.completedFullYear,
          totalAnnualLeave: leaveBalance.totalAnnualLeave,
          description: leaveBalance.description,
        });
      } else {
        // For other leave types, use the provided value or default to 0
        entitled = entitled || 0;
      }

      const taken = input.leaveDaysTaken || 0;
      const requested = input.leaveDaysRequested || 0;
      const remaining = entitled - taken - requested;

      // Insert leave request directly
      try {
        const leaveData = {
          requestId: requestId,
          leaveType: input.leaveType,
          parentalLeaveType: input.parentalLeaveType ?? null,
          startDate: input.startDate,
          endDate: input.endDate,
          reason: input.reason ?? null,
          leaveDaysEntitled: Math.round(entitled * 100) / 100, // Keep decimals: 1.5 days per month
          leaveDaysTaken: taken ?? null,
          leaveDaysRequested: requested ?? null,
          leaveDaysRemaining: Math.round(remaining * 100) / 100, // Keep decimals for accuracy
          backupPersonName: input.backupPersonName ?? null,
          backupPersonPhone: input.backupPersonPhone ?? null,
          employeeSignatureFileId: null,
          managerSignatureFileId: null,
        };

        console.log("[createLeaveRequest] Insert data:", JSON.stringify(leaveData, null, 2));

        await db.insert(leaveRequests).values(leaveData);
      } catch (error: any) {
        console.error("[createLeaveRequest] Insert error:", error);
        console.error("[createLeaveRequest] Error message:", error.message);
        console.error("[createLeaveRequest] Error code:", error.code);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Database error: ${error.message}`
        });
      }

      return result[0];
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
      const db = await getDb();

      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      const insertRequest: InsertRequest = {
        userId: ctx.user.id,
        type: "car",
        status: "draft",
        title: input.title,
        description: input.purpose,
      };

      const result = await db.insert(requests).values(insertRequest).returning({ id: requests.id });
      const requestId = result[0].id;

      const insertCarRequest: InsertCarRequest = {
        requestId,
        destination: input.destination,
        purpose: input.purpose,
        departureDate: input.departureDate,
        departureTime: input.departureTime,
        passengers: input.passengers,
        driverName: input.driverName,
        carInfo: input.carInfo,
      };

      await db.insert(carRequests).values(insertCarRequest);

      return result[0];
    }),

  getAvailableDrivers: protectedProcedure.query(async () => {
    // Hardcoded for now — can be moved to a DB table later
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
      const db = await getDb();

      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      const insertRequest: InsertRequest = {
        userId: ctx.user.id,
        type: "expenditure",
        status: "draft",
        title: input.title,
      };

      const result = await db.insert(requests).values(insertRequest).returning({ id: requests.id });
      const requestId = result[0].id;

      const insertExpenditureRequest: InsertExpenditureRequest = {
        requestId,
        amount: input.amount,
        currency: input.currency,
        department: input.department,
        category: input.category,
      };

      await db.insert(expenditureRequests).values(insertExpenditureRequest);

      return result[0];
    }),

  listUserRequests: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    }

    const userReqs = await db.select().from(requests).where(eq(requests.userId, ctx.user.id)).orderBy(desc(requests.createdAt));

    // Enhance with type-specific details
    const enriched = await Promise.all(userReqs.map(async (req) => {
      let typeDetails = null;
      if (req.type === "leave") {
        const leaveResult = await db.select().from(leaveRequests).where(eq(leaveRequests.requestId, req.id)).limit(1);
        typeDetails = leaveResult[0] || null;
      } else if (req.type === "car") {
        const carResult = await db.select().from(carRequests).where(eq(carRequests.requestId, req.id)).limit(1);
        typeDetails = carResult[0] || null;
      } else if (req.type === "expenditure") {
        const expResult = await db.select().from(expenditureRequests).where(eq(expenditureRequests.requestId, req.id)).limit(1);
        typeDetails = expResult[0] || null;
      }

      return {
        ...req,
        typeDetails,
      };
    }));

    return enriched;
  }),

  getRequest: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();

      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      const result = await db.select().from(requests).where(eq(requests.id, input.id)).limit(1);
      if (!result.length) return null;

      const request = result[0];
      if (request.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Fetch type-specific details
      let typeDetails = null;
      if (request.type === "leave") {
        const leaveResult = await db.select().from(leaveRequests).where(eq(leaveRequests.requestId, request.id)).limit(1);
        typeDetails = leaveResult[0] || null;
      } else if (request.type === "car") {
        const carResult = await db.select().from(carRequests).where(eq(carRequests.requestId, request.id)).limit(1);
        typeDetails = carResult[0] || null;
      } else if (request.type === "expenditure") {
        const expResult = await db.select().from(expenditureRequests).where(eq(expenditureRequests.requestId, request.id)).limit(1);
        typeDetails = expResult[0] || null;
      }

      // Fetch approvals
      const approvals = await db.select().from(requestApprovals).where(eq(requestApprovals.requestId, request.id));

      // Fetch attachments
      const attachments = await db.select().from(requestAttachments).where(eq(requestAttachments.requestId, request.id));

      return {
        ...request,
        typeDetails,
        approvals,
        attachments,
      };
    }),

  submitRequest: protectedProcedure
    .input(z.object({ id: z.number(), initialApproverId: z.number().optional() }))
    .mutation(async ({ ctx, input }) => {
      try {
        console.log("[submitRequest] Starting with input:", { id: input.id, initialApproverId: input.initialApproverId, userId: ctx.user.id });

        const db = await getDb();

        if (!db) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        }

        // Make sure request exists and belongs to the person trying to submit it
        const result = await db.select().from(requests).where(eq(requests.id, input.id)).limit(1);
        if (!result.length) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
        }

        const request = result[0];
        console.log("[submitRequest] Found request:", { id: request.id, status: request.status, userId: request.userId });

        if (request.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You can only submit your own requests" });
        }

        if (request.status !== "draft") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Only draft requests can be submitted" });
        }

        // ===== TYPE-SPECIFIC ROUTING =====
        let approverId: number;
        let initialApprovalLevel: string;

        if (request.type === "car") {
          // CAR REQUESTS: Route directly to HR
          initialApprovalLevel = "hr";
          const hrUsers = await db.select().from(users).where(eq(users.role, "hr" as any)).limit(1);
          if (!hrUsers.length) {
            throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No HR user found to approve car request" });
          }
          approverId = hrUsers[0].id;
          console.log("[submitRequest] Car request — routing to HR:", approverId);
        } else {
          // LEAVE & EXPENDITURE: Route to HOD
          initialApprovalLevel = "head_of_department";
          if (input.initialApproverId) {
            approverId = input.initialApproverId;
            console.log("[submitRequest] Using provided initialApproverId:", approverId);
          } else {
            const departmentHeads = await db.select().from(users).where(eq(users.role, "head_of_department")).limit(1);
            if (!departmentHeads.length) {
              throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No department head found to approve request" });
            }
            approverId = departmentHeads[0].id;
            console.log("[submitRequest] No initialApproverId provided, using fallback:", approverId);
          }
        }

        console.log("[submitRequest] Updating request status to pending with approverId:", approverId, "level:", initialApprovalLevel);
        await db.update(requests).set({
          status: "pending",
          currentApprovalLevel: initialApprovalLevel as any,
          initialApproverId: approverId,
          updatedAt: new Date()
        }).where(eq(requests.id, input.id));
        console.log("[submitRequest] Request status updated successfully");

        const insertApproval: InsertRequestApproval = {
          requestId: input.id,
          approverId,
          approvalLevel: initialApprovalLevel as any,
          status: "pending",
        };
        console.log("[submitRequest] Creating approval record:", insertApproval);
        await db.insert(requestApprovals).values(insertApproval);
        console.log("[submitRequest] Approval record created");

        (async () => {
          try {
            const currentUser = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
            const approver = await db.select().from(users).where(eq(users.id, approverId)).limit(1);

            if (currentUser.length > 0 && approver.length > 0) {
              const notificationMessage = `${currentUser[0].name} submitted a ${request.type} request for your approval`;
              await db.insert(notifications).values({
                userId: approverId,
                requestId: input.id,
                triggeredByUserId: ctx.user.id,
                type: "approval_needed",
                title: `New ${request.type} request waiting for approval`,
                message: notificationMessage,
              });
              console.log("[submitRequest] Notification created for approver");

              if (request.type === "leave" && approver[0].email) {
                try {
                  const leaveReqData = await db.select().from(leaveRequests).where(eq(leaveRequests.requestId, input.id)).limit(1);
                  const startDate = leaveReqData[0]?.startDate || "TBD";
                  const endDate = leaveReqData[0]?.endDate || "TBD";

                  const emailData = emailTemplates.leaveRequestSubmittedEmail(
                    currentUser[0].name || "Employee",
                    approver[0].name || "HOD",
                    request.title || `Request #${input.id}`,
                    startDate,
                    endDate
                  );

                  await sendEmail(approver[0].email, emailData.subject, emailData.html);
                  console.log("[submitRequest] Email sent to HOD:", approver[0].email);
                } catch (emailError) {
                  console.error("[submitRequest] Failed to send email to HOD:", emailError);
                  // Don't throw - email failure shouldn't block the request submission
                }
              }
            }
          } catch (e) {
            console.error("[submitRequest] Failed to create notification:", e);
          }
        })();

        console.log("[submitRequest] Submit request completed successfully");
        return { success: true };
      } catch (error) {
        console.error("[submitRequest] ERROR:", error);
        throw error;
      }
    }),

  listPendingApprovals: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    }

    const pendingApprovals = await db
      .select()
      .from(requestApprovals)
      .where(and(eq(requestApprovals.approverId, ctx.user.id), eq(requestApprovals.status, "pending")));

    const results: any[] = [];
    for (const approval of pendingApprovals) {
      const req = await db.select().from(requests).where(eq(requests.id, approval.requestId)).limit(1);
      if (req.length) {
        results.push(req[0]);
      }
    }

    // Sort by createdAt DESC (newest first)
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // If admin, include any pending requests not assigned (fallback)
    if (ctx.user.role === "admin") {
      const unassigned = await db
        .select()
        .from(requests)
        .where(eq(requests.status, "pending"))
        .orderBy(desc(requests.createdAt));
      // Merge, avoiding duplicates
      const map = new Map<number, any>();
      results.forEach(r => map.set(r.id, r));
      unassigned.forEach(r => { if (!map.has(r.id)) map.set(r.id, r); });
      const merged = Array.from(map.values());
      // Sort merged results by date (newest first)
      merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return merged;
    }

    // If head_of_finance, only show expenditure requests
    if (ctx.user.role === "head_of_finance") {
      return results.filter(req => req.type === "expenditure");
    }

    return results;
  }),

  approveRequest: protectedProcedure
    .input(
      z.object({
        requestId: z.number(),
        comments: z.string().optional(),
        signatureFileId: z.number().optional(),
        escalateToCeo: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role === "user") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only approvers can approve requests" });
      }

      const db = await getDb();

      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      // Grab the request and see which approval stage it's at
      const requestResult = await db.select().from(requests).where(eq(requests.id, input.requestId)).limit(1);
      if (!requestResult.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
      }

      const request = requestResult[0];

      // Map each approval level to the role that should be approving it
      // Prevents someone from skipping the chain or approving out of order
      const approvalLevelToRoleMap: Record<string, string> = {
        "head_of_department": "head_of_department",
        "hr": "hr",
        "head_of_finance": "head_of_finance",
        "ceo_md": "ceo_md",
        "final": "ceo_md",
      };

      if (!request.currentApprovalLevel) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid approval level" });
      }
      const expectedRole = approvalLevelToRoleMap[request.currentApprovalLevel];
      if (ctx.user.role !== expectedRole && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: `Only ${expectedRole} can approve at this level` });
      }

      // Record this approval so we can track who approved what and when
      const insertApproval: InsertRequestApproval = {
        requestId: input.requestId,
        approverId: ctx.user.id,
        approvalLevel: request.currentApprovalLevel as any,
        status: "approved",
        comments: input.comments,
        signatureFileId: input.signatureFileId,
      };

      await db.insert(requestApprovals).values(insertApproval);

      // ===== TYPE-SPECIFIC APPROVAL CHAINS =====

      // Helper: mark request as fully approved and notify employee
      const finalApprove = async () => {
        await db.update(requests).set({ status: "approved", updatedAt: new Date() }).where(eq(requests.id, input.requestId));
        const requesterUser = await db.select().from(users).where(eq(users.id, request.userId)).limit(1);
        if (requesterUser.length > 0) {
          await db.insert(notifications).values({
            userId: request.userId,
            requestId: input.requestId,
            triggeredByUserId: ctx.user.id,
            type: "request_approved",
            title: `Your ${request.type} request was approved`,
            message: `Your ${request.type} request has been fully approved and is now finalized.`,
          });
        }
      };

      // Helper: route to next approver
      const routeToNext = async (nextLevel: string, nextRole: string) => {
        const nextUsers = await db.select().from(users).where(eq(users.role, nextRole as any)).limit(1);
        if (!nextUsers.length) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `No ${nextRole} found to approve request at next level` });
        }
        const nextApproverId = nextUsers[0].id;
        await db.insert(requestApprovals).values({
          requestId: input.requestId,
          approverId: nextApproverId,
          approvalLevel: nextLevel as any,
          status: "pending",
        });
        await db.update(requests).set({
          status: "pending",
          currentApprovalLevel: nextLevel as any,
          updatedAt: new Date()
        }).where(eq(requests.id, input.requestId));
        await db.insert(notifications).values({
          userId: nextApproverId,
          requestId: input.requestId,
          triggeredByUserId: ctx.user.id,
          type: "approval_needed",
          title: `${request.type} request awaiting your approval`,
          message: `A ${request.type} request is now waiting for your approval.`,
        });
        // Notify requester that it moved to next stage
        await db.insert(notifications).values({
          userId: request.userId,
          requestId: input.requestId,
          triggeredByUserId: ctx.user.id,
          type: "request_approved",
          title: `Your ${request.type} request was approved at this stage`,
          message: `Your ${request.type} request has been approved and is now at the next stage of review.`,
        });
      };

      // ── LEAVE: HOD is final. HR + CEO/MD get notifications only ──
      if (request.type === "leave" && request.currentApprovalLevel === "head_of_department") {
        await db.update(requests).set({ status: "approved", updatedAt: new Date() }).where(eq(requests.id, input.requestId));

        // Update leave balance for annual leave
        const currentYear = new Date().getFullYear();
        const leaveDetails = await db.select().from(leaveRequests).where(eq(leaveRequests.requestId, input.requestId)).limit(1);
        if (leaveDetails.length > 0 && leaveDetails[0].leaveType === "annual") {
          const daysTaken = leaveDetails[0].leaveDaysRequested || 0;
          let balance = await db.select().from(leaveBalances)
            .where(and(eq(leaveBalances.userId, request.userId), eq(leaveBalances.year, currentYear))).limit(1);
          if (balance.length === 0) {
            await db.insert(leaveBalances).values({
              userId: request.userId, year: currentYear,
              annualLeaveEntitled: 18, annualLeaveCarryover: 0,
              annualLeaveTaken: daysTaken, annualLeaveRemaining: 18 - daysTaken,
              sickLeave: 10, personalLeave: 3, updatedAt: new Date(),
            });
          } else {
            const newTaken = (balance[0].annualLeaveTaken || 0) + daysTaken;
            const newRemaining = (balance[0].annualLeaveEntitled + balance[0].annualLeaveCarryover) - newTaken;
            await db.update(leaveBalances).set({ annualLeaveTaken: newTaken, annualLeaveRemaining: newRemaining, updatedAt: new Date() })
              .where(and(eq(leaveBalances.userId, request.userId), eq(leaveBalances.year, currentYear)));
          }
        }

        // Notify employee
        const requesterUser = await db.select().from(users).where(eq(users.id, request.userId)).limit(1);
        if (requesterUser.length > 0) {
          await db.insert(notifications).values({
            userId: request.userId, requestId: input.requestId, triggeredByUserId: ctx.user.id,
            type: "request_approved", title: `Your leave request was approved`,
            message: `Your leave request has been approved by ${ctx.user.name || 'your Head of Department'}.`,
          });

          const leaveReqData = await db.select().from(leaveRequests).where(eq(leaveRequests.requestId, input.requestId)).limit(1);
          const leaveDetail = leaveReqData[0];
          const startDate = leaveDetail?.startDate || "TBD";
          const endDate = leaveDetail?.endDate || "TBD";
          const leaveType = leaveDetail?.leaveType || "leave";
          const daysRequested = leaveDetail?.leaveDaysRequested || 0;
          const reason = leaveDetail?.reason || "";
          const employeeName = requesterUser[0].name || "Employee";
          const hodName = ctx.user.name || "Head of Department";
          const approvalDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
          const requestNumber = request.title || `Request #${input.requestId}`;

          // Email to employee
          (async () => {
            try {
              if (requesterUser[0].email) {
                const emailData = emailTemplates.leaveRequestApprovedEmail(employeeName, hodName, requestNumber, startDate, endDate);
                await sendEmail(requesterUser[0].email, emailData.subject, emailData.html);
              }
            } catch (e) { console.error("[approveRequest] Failed to send employee email:", e); }
          })();

          // Notify HR and CEO/MD (notification only, no approval)
          (async () => {
            try {
              const hrAndCeoUsers = await db.select().from(users).where(sql`${users.role} IN ('hr', 'ceo_md')`);
              for (const recipient of hrAndCeoUsers) {
                await db.insert(notifications).values({
                  userId: recipient.id, requestId: input.requestId, triggeredByUserId: ctx.user.id,
                  type: "request_approved", title: `Leave Approved: ${employeeName}`,
                  message: `${employeeName}'s ${leaveType} leave (${startDate} to ${endDate}, ${daysRequested} days) has been approved by ${hodName}.`,
                });
                if (recipient.email) {
                  const emailData = emailTemplates.leaveApprovedNotificationEmail(
                    recipient.name || recipient.role.toUpperCase(), employeeName, hodName,
                    leaveType.charAt(0).toUpperCase() + leaveType.slice(1), startDate, endDate,
                    daysRequested, reason, requestNumber, approvalDate
                  );
                  await sendEmail(recipient.email, emailData.subject, emailData.html);
                }
              }
            } catch (e) { console.error("[approveRequest] Failed to send HR/CEO notifications:", e); }
          })();
        }

        return { success: true };
      }

      // ── CAR: HR is final. No further routing, no CEO/MD notification ──
      if (request.type === "car" && request.currentApprovalLevel === "hr") {
        await finalApprove();
        console.log("[approveRequest] Car request approved by HR (final)");
        return { success: true };
      }

      // ── EXPENDITURE: Type-specific chain HOD → HR → Finance → (optional) CEO/MD ──
      if (request.type === "expenditure") {
        const currentLevel = request.currentApprovalLevel;

        if (currentLevel === "head_of_department") {
          // HOD approved → route to HR
          await routeToNext("hr", "hr");
          console.log("[approveRequest] Expenditure: HOD approved, routed to HR");
          return { success: true };
        }

        if (currentLevel === "hr") {
          // HR approved → route to Head of Finance
          await routeToNext("head_of_finance", "head_of_finance");
          console.log("[approveRequest] Expenditure: HR approved, routed to Head of Finance");
          return { success: true };
        }

        if (currentLevel === "head_of_finance") {
          if (input.escalateToCeo) {
            // Finance chose to escalate → route to CEO/MD
            await routeToNext("ceo_md", "ceo_md");
            console.log("[approveRequest] Expenditure: Finance escalated to CEO/MD");
            return { success: true };
          } else {
            // Finance final approval
            await finalApprove();
            console.log("[approveRequest] Expenditure: Finance final approved");
            return { success: true };
          }
        }

        if (currentLevel === "ceo_md") {
          // CEO/MD final approval
          await finalApprove();
          console.log("[approveRequest] Expenditure: CEO/MD final approved");
          return { success: true };
        }
      }

      // ── FALLBACK: Generic chain for any other case ──
      const approvalChain = ["head_of_department", "hr", "head_of_finance", "ceo_md", "final"];
      const currentIndex = request.currentApprovalLevel ? approvalChain.indexOf(request.currentApprovalLevel) : -1;

      if (currentIndex === -1 || currentIndex === approvalChain.length - 1) {
        await finalApprove();
        return { success: true };
      }

      const nextLevel = approvalChain[currentIndex + 1];
      const roleForNextLevel: Record<string, string> = {
        "head_of_department": "head_of_department", "hr": "hr",
        "head_of_finance": "head_of_finance", "ceo_md": "ceo_md", "final": "ceo_md",
      };
      await routeToNext(nextLevel, roleForNextLevel[nextLevel]);
      return { success: true };
    }),

  rejectRequest: protectedProcedure
    .input(
      z.object({
        requestId: z.number(),
        comments: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role === "user") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only approvers can reject requests" });
      }

      const db = await getDb();

      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      const requestResult = await db.select().from(requests).where(eq(requests.id, input.requestId)).limit(1);
      if (!requestResult.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
      }

      const request = requestResult[0];

      const insertApproval: InsertRequestApproval = {
        requestId: input.requestId,
        approverId: ctx.user.id,
        approvalLevel: request.currentApprovalLevel as any,
        status: "rejected",
        comments: input.comments,
      };

      await db.insert(requestApprovals).values(insertApproval);

      // Rejection stops the chain - no more approvals happen
      await db.update(requests).set({ status: "rejected", updatedAt: new Date() }).where(eq(requests.id, input.requestId));

      const requesterUser = await db.select().from(users).where(eq(users.id, request.userId)).limit(1);
      if (requesterUser.length > 0) {
        await db.insert(notifications).values({
          userId: request.userId,
          requestId: input.requestId,
          triggeredByUserId: ctx.user.id,
          type: "request_rejected",
          title: `Your ${request.type} request was rejected`,
          message: `Your ${request.type} request was rejected${input.comments ? ': ' + input.comments : '.'}`,
        });
      }

      return { success: true };
    }),

  getAttachments: protectedProcedure
    .input(z.object({ requestId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }
      // Just return the file attachments for this request
      return db.select().from(requestAttachments).where(eq(requestAttachments.requestId, input.requestId));
    }),

  // NEW: Upload file to DigitalOcean Spaces
  uploadAttachment: protectedProcedure
    .input(
      z.object({
        requestId: z.number(),
        fileName: z.string(),
        fileData: z.string(), // Base64 encoded file data
        mimeType: z.string(),
        attachmentType: z.enum([
          "employee_signature",
          "manager_signature",
          "hr_signature",
          "ceo_signature",
          "supporting_document",
        ]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();

      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      try {
        // Convert base64 to buffer
        const fileBuffer = Buffer.from(input.fileData, "base64");

        // Validate file
        const validation = validateFile(fileBuffer, input.mimeType);
        if (!validation.valid) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: validation.error || "Invalid file",
          });
        }

        // Generate unique file key
        const fileKey = generateFileKey(
          input.requestId,
          input.attachmentType,
          input.fileName
        );

        // Upload to Spaces
        const { url } = await uploadFileToSpaces(
          fileBuffer,
          fileKey,
          input.mimeType
        );

        // Store attachment metadata in database
        const insertAttachment: InsertRequestAttachment = {
          requestId: input.requestId,
          fileName: input.fileName,
          fileUrl: url,
          fileKey: fileKey,
          mimeType: input.mimeType,
          type: input.attachmentType,
          uploadedBy: ctx.user.id,
        };

        const result = await db
          .insert(requestAttachments)
          .values(insertAttachment)
          .returning({ id: requestAttachments.id });

        return {
          success: true,
          fileId: result[0]?.id,
          fileUrl: url,
          fileKey: fileKey,
        };
      } catch (error) {
        console.error("Upload error:", error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to upload file: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }),

  addAttachment: protectedProcedure
    .input(
      z.object({
        requestId: z.number(),
        fileName: z.string(),
        fileUrl: z.string(),
        fileKey: z.string(),
        mimeType: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();

      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      const insertAttachment: InsertRequestAttachment = {
        requestId: input.requestId,
        fileName: input.fileName,
        fileUrl: input.fileUrl,
        fileKey: input.fileKey,
        mimeType: input.mimeType,
        uploadedBy: ctx.user.id,
      };

      const result = await db.insert(requestAttachments).values(insertAttachment).returning({ id: requestAttachments.id });
      return { success: true, fileId: result[0]?.id };
    }),

  getLeaveBalance: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    }

    // Fetch user with employment date
    const userRecord = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
    if (!userRecord.length) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    const user = userRecord[0];
    const dateOfEmployment = user.dateOfEmployment;

    // Calculate leave entitlement using new logic
    const leaveCalc = calculateAnnualLeaveBalance(dateOfEmployment);
    const isEligibleForAnnualLeave = leaveCalc.completedFullYear;

    const currentYear = new Date().getFullYear();
    let balance = await db
      .select()
      .from(leaveBalances)
      .where(and(eq(leaveBalances.userId, ctx.user.id), eq(leaveBalances.year, currentYear)))
      .limit(1);

    // If no balance record exists, create one
    if (balance.length === 0) {
      const newBalance = {
        userId: ctx.user.id,
        year: currentYear,
        annualLeaveEntitled: Math.round(leaveCalc.totalAnnualLeave * 100) / 100,
        annualLeaveCarryover: 0,
        annualLeaveTaken: 0,
        annualLeaveRemaining: Math.round(leaveCalc.totalAnnualLeave * 100) / 100,
        sickLeave: 10,
        personalLeave: 3,
        updatedAt: new Date(),
      };
      await db.insert(leaveBalances).values(newBalance);
      return {
        ...newBalance,
        isEligibleForAnnualLeave,
        employmentDate: dateOfEmployment,
        monthsEmployed: leaveCalc.monthsEmployed,
        completedFullYear: leaveCalc.completedFullYear,
        eligibilityMessage: isEligibleForAnnualLeave
          ? `✓ Eligible for annual leave (${leaveCalc.yearsEmployed} year(s) employed)`
          : `Not eligible yet. You'll be eligible after ${12 - leaveCalc.monthsEmployed} more month(s). Currently accrued: ${leaveCalc.totalAnnualLeave} days`,
      };
    }

    // Calculate total days taken from approved annual leave requests
    const approvedLeaves = await db
      .select()
      .from(requests)
      .where(
        and(
          eq(requests.userId, ctx.user.id),
          eq(requests.type, "leave"),
          eq(requests.status, "approved")
        )
      );

    let totalDaysTaken = 0;
    for (const leave of approvedLeaves) {
      const leaveDetails = await db
        .select()
        .from(leaveRequests)
        .where(eq(leaveRequests.requestId, leave.id))
        .limit(1);

      if (leaveDetails.length > 0 && leaveDetails[0].leaveType === "annual") {
        totalDaysTaken += leaveDetails[0].leaveDaysRequested || 0;
      }
    }

    // Calculate total entitled days
    const entitled = leaveCalc.totalAnnualLeave + (balance[0]?.annualLeaveCarryover || 0);
    const remaining = entitled - totalDaysTaken;

    await db.update(leaveBalances).set({
      annualLeaveEntitled: Math.round(leaveCalc.totalAnnualLeave * 100) / 100,
      annualLeaveTaken: totalDaysTaken,
      annualLeaveRemaining: Math.round(remaining * 100) / 100,
      updatedAt: new Date(),
    }).where(
      and(
        eq(leaveBalances.userId, ctx.user.id),
        eq(leaveBalances.year, currentYear)
      )
    );

    return {
      ...balance[0],
      annualLeaveTaken: totalDaysTaken,
      annualLeaveRemaining: remaining,
      isEligibleForAnnualLeave,
      employmentDate: dateOfEmployment,
      monthsEmployed: leaveCalc.monthsEmployed,
      yearsEmployed: leaveCalc.yearsEmployed,
      completedFullYear: leaveCalc.completedFullYear,
      baseEntitlement: leaveCalc.baseEntitlement,
      accruedSinceFirstYear: leaveCalc.accruedSinceFirstYear,
      totalAnnualLeave: leaveCalc.totalAnnualLeave,
      eligibilityMessage: isEligibleForAnnualLeave
        ? `✓ Eligible for annual leave (${leaveCalc.yearsEmployed} year(s) employed)`
        : `Not eligible yet. You'll be eligible after ${Math.max(0, 12 - leaveCalc.monthsEmployed)} more month(s). Currently accrued: ${Math.round(leaveCalc.totalAnnualLeave * 100) / 100} days`,
    };
  }),

  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    }

    // For admin, return system-wide stats
    if (ctx.user.role === "admin") {
      const allRequests = await db.select().from(requests);
      const allUsers = await db.select().from(users);

      // Count only submitted requests (exclude drafts and cancelled) for totalRequests
      const submittedRequests = allRequests.filter(
        (r) => r.status !== "draft" && r.status !== "cancelled"
      );

      return {
        totalRequests: submittedRequests.length,
        totalUsers: allUsers.length,
        pendingRequests: submittedRequests.filter((r) => r.status === "pending").length,
        approvedRequests: submittedRequests.filter((r) => r.status === "approved").length,
        rejectedRequests: submittedRequests.filter((r) => r.status === "rejected").length,
      };
    }

    // For approvers (HOD, HR, Finance, CEO), show requests waiting for their approval
    if (["head_of_department", "hr", "head_of_finance", "ceo_md"].includes(ctx.user.role)) {
      const pendingApprovals = await db
        .select()
        .from(requestApprovals)
        .where(and(
          eq(requestApprovals.approverId, ctx.user.id),
          eq(requestApprovals.status, "pending")
        ));

      const pendingRequests: any[] = [];
      const approvedRequests: any[] = [];
      const rejectedRequests: any[] = [];

      for (const approval of pendingApprovals) {
        const req = await db
          .select()
          .from(requests)
          .where(eq(requests.id, approval.requestId))
          .limit(1);
        if (req.length) {
          pendingRequests.push(req[0]);
        }
      }

      // Also count approved and rejected requests handled by this user
      const allApprovals = await db
        .select()
        .from(requestApprovals)
        .where(eq(requestApprovals.approverId, ctx.user.id));

      for (const approval of allApprovals) {
        if (approval.status === "approved") {
          const req = await db
            .select()
            .from(requests)
            .where(eq(requests.id, approval.requestId))
            .limit(1);
          if (req.length) {
            approvedRequests.push(req[0]);
          }
        } else if (approval.status === "rejected") {
          const req = await db
            .select()
            .from(requests)
            .where(eq(requests.id, approval.requestId))
            .limit(1);
          if (req.length) {
            rejectedRequests.push(req[0]);
          }
        }
      }

      return {
        totalRequests: pendingRequests.length + approvedRequests.length + rejectedRequests.length,
        pendingRequests: pendingRequests.length,
        approvedRequests: approvedRequests.length,
        rejectedRequests: rejectedRequests.length,
      };
    }

    // For regular employees, return their own request stats
    const userRequests = await db.select().from(requests).where(eq(requests.userId, ctx.user.id));

    // Exclude draft and cancelled requests from stats
    const activeRequests = userRequests.filter(
      (r) => r.status !== "draft" && r.status !== "cancelled"
    );

    const stats = {
      totalRequests: activeRequests.length,
      pendingRequests: activeRequests.filter((r) => r.status === "pending").length,
      approvedRequests: activeRequests.filter((r) => r.status === "approved").length,
      rejectedRequests: activeRequests.filter((r) => r.status === "rejected").length,
    };

    return stats;
  }),

  getRecentRequests: protectedProcedure
    .input(z.object({ limit: z.number().default(5) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      return db
        .select()
        .from(requests)
        .where(eq(requests.userId, ctx.user.id))
        .orderBy(desc(requests.createdAt))
        .limit(input.limit);
    }),

  getApprovedExpenditures: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    }

    try {
      // Query using raw SQL to avoid drizzle-orm version issues
      const result = await db.execute(`
        SELECT 
          COALESCE(SUM(CASE WHEN er.currency = 'RWF' THEN er.amount ELSE 0 END), 0) as rwf,
          COALESCE(SUM(CASE WHEN er.currency = 'USD' THEN er.amount ELSE 0 END), 0) as usd,
          COALESCE(SUM(CASE WHEN er.currency = 'EUR' THEN er.amount ELSE 0 END), 0) as eur
        FROM expenditure_requests er
        INNER JOIN requests r ON er.request_id = r.id
        WHERE r.status = 'approved'
      `) as any;

      if (result.rows && result.rows.length > 0) {
        return {
          rwf: parseInt(result.rows[0].rwf) || 0,
          usd: parseInt(result.rows[0].usd) || 0,
          eur: parseInt(result.rows[0].eur) || 0,
        };
      }

      return { rwf: 0, usd: 0, eur: 0 };
    } catch (error) {
      console.error("Error fetching approved expenditures:", error);
      return { rwf: 0, usd: 0, eur: 0 };
    }
  }),

  getExpenditureHistory: protectedProcedure.query(async ({ ctx }) => {
    const allowedRoles = ["head_of_finance", "admin", "hr", "ceo_md"];
    if (!allowedRoles.includes(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "You don't have access to expenditure history" });
    }

    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    }

    try {
      // Query using raw SQL to get detailed expenditure information with requester details
      const result = await db.execute(`
        SELECT 
          r.id as request_id,
          r.title,
          r.description,
          r.status,
          r.created_at,
          r.updated_at,
          er.amount,
          er.currency,
          er.department,
          er.category,
          u.id as requester_id,
          u.name as requester_name,
          u.email as requester_email,
          u.department as requester_department
        FROM requests r
        INNER JOIN expenditure_requests er ON er.request_id = r.id
        INNER JOIN users u ON r.user_id = u.id
        WHERE r.type = 'expenditure' AND r.status = 'approved'
        ORDER BY r.created_at DESC
      `) as any;

      if (result.rows && result.rows.length > 0) {
        return result.rows.map((row: any) => ({
          id: row.request_id,
          title: row.title,
          description: row.description,
          status: row.status,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          amount: parseInt(row.amount) || 0,
          currency: row.currency,
          department: row.department,
          category: row.category,
          requester: {
            id: row.requester_id,
            name: row.requester_name,
            email: row.requester_email,
            department: row.requester_department,
          },
        }));
      }

      return [];
    } catch (error) {
      console.error("Error fetching expenditure history:", error);
      return [];
    }
  }),

  // Admin function to delete a user account
  deleteUser: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      if (ctx.user.role !== "admin" && ctx.user.role !== "hr") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can delete users" });
      }

      if (ctx.user.id === input.userId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot delete your own account" });
      }

      try {
        await db.update(users)
          .set({ managerId: null })
          .where(eq(users.managerId, input.userId));

        const result = await db.delete(users).where(eq(users.id, input.userId)).returning({ id: users.id, name: users.name });

        if (result.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }

        return { success: true, message: `User ${result[0].name} deleted successfully` };
      } catch (error) {
        console.error("[deleteUser] Error deleting user:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }),

  // ===== NEW: Get leave balance for an employee (for HR dashboard) =====
  getEmployeeLeaveData: protectedProcedure
    .input(z.object({ employeeId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      if (ctx.user.role !== "hr" && ctx.user.role !== "admin" && ctx.user.role !== "ceo_md") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only HR and admins can view employee leave data" });
      }

      const targetEmployeeId = input.employeeId || ctx.user.id;

      const employee = await db.select().from(users).where(eq(users.id, targetEmployeeId)).limit(1);
      if (!employee.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Employee not found" });
      }

      const currentYear = new Date().getFullYear();
      const leaveBalance = await db
        .select()
        .from(leaveBalances)
        .where(and(eq(leaveBalances.userId, targetEmployeeId), eq(leaveBalances.year, currentYear)))
        .limit(1);

      const leaveRequestsList = await db
        .select()
        .from(requests)
        .where(and(eq(requests.userId, targetEmployeeId), eq(requests.type, "leave")))
        .orderBy(desc(requests.createdAt));

      let leaveDetails: any[] = [];
      for (const req of leaveRequestsList) {
        const detail = await db.select().from(leaveRequests).where(eq(leaveRequests.requestId, req.id)).limit(1);
        if (detail.length) {
          leaveDetails.push({ ...req, details: detail[0] });
        }
      }

      return {
        employee: employee[0],
        leaveBalance: leaveBalance.length > 0 ? leaveBalance[0] : null,
        leaveRequests: leaveDetails,
      };
    }),

  // ===== NEW: Get all employees for HR dashboard list =====
  getAllEmployees: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    }

    if (ctx.user.role !== "hr" && ctx.user.role !== "admin" && ctx.user.role !== "ceo_md") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only HR and admins can view all employees" });
    }

    return db.select().from(users).where(eq(users.role, "user")).orderBy(users.name);
  }),

  // ===== NEW: Add signature to approval =====
  addApprovalSignature: protectedProcedure
    .input(
      z.object({
        approvalId: z.number(),
        fileName: z.string(),
        fileUrl: z.string(),
        fileKey: z.string(),
        mimeType: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      const insertAttachment: InsertRequestAttachment = {
        requestId: 0, // Will be filled from approval
        fileName: input.fileName,
        fileUrl: input.fileUrl,
        fileKey: input.fileKey,
        mimeType: input.mimeType,
        uploadedBy: ctx.user.id,
        type: `${ctx.user.role}_signature` as any,
      };

      const attachment = await db.insert(requestAttachments).values(insertAttachment).returning();

      // Link attachment to approval
      if (attachment.length > 0) {
        await db
          .update(requestApprovals)
          .set({ signatureFileId: attachment[0].id })
          .where(eq(requestApprovals.id, input.approvalId));
      }

      return { success: true, attachmentId: attachment[0]?.id };
    }),

  // ===== NEW: Get all request attachments with details =====
  getRequestFilesForReview: protectedProcedure
    .input(z.object({ requestId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      const request = await db.select().from(requests).where(eq(requests.id, input.requestId)).limit(1);
      if (!request.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
      }

      const attachments = await db
        .select()
        .from(requestAttachments)
        .where(eq(requestAttachments.requestId, input.requestId));

      let leaveSignatureInfo: any = null;
      if (request[0].type === "leave") {
        const leaveDetail = await db
          .select()
          .from(leaveRequests)
          .where(eq(leaveRequests.requestId, input.requestId))
          .limit(1);

        if (leaveDetail.length) {
          let employeeSigFile = null;
          let managerSigFile = null;

          if (leaveDetail[0].employeeSignatureFileId) {
            const sigFile = await db
              .select()
              .from(requestAttachments)
              .where(eq(requestAttachments.id, leaveDetail[0].employeeSignatureFileId))
              .limit(1);
            employeeSigFile = sigFile[0] || null;
          }

          // ✅ FIX: First check if manager signature is in leaveRequests (submitted form)
          if (leaveDetail[0].managerSignatureFileId) {
            const sigFile = await db
              .select()
              .from(requestAttachments)
              .where(eq(requestAttachments.id, leaveDetail[0].managerSignatureFileId))
              .limit(1);
            managerSigFile = sigFile[0] || null;
          }

          // ✅ FIX: If no manager signature in form, fetch from HOD's approval signature
          if (!managerSigFile) {
            const hodApproval = await db
              .select()
              .from(requestApprovals)
              .where(
                and(
                  eq(requestApprovals.requestId, input.requestId),
                  eq(requestApprovals.approvalLevel, "head_of_department")
                )
              )
              .limit(1);

            if (hodApproval.length && hodApproval[0].signatureFileId) {
              const sigFile = await db
                .select()
                .from(requestAttachments)
                .where(eq(requestAttachments.id, hodApproval[0].signatureFileId))
                .limit(1);
              managerSigFile = sigFile[0] || null;
            }
          }

          leaveSignatureInfo = {
            employeeSignature: employeeSigFile,
            managerSignature: managerSigFile,
            leaveDaysRemaining: leaveDetail[0].leaveDaysRemaining,
          };
        }
      }

      return {
        request: request[0],
        attachments: attachments.filter(a => a.type === "supporting_document"),
        leaveSignatures: leaveSignatureInfo,
      };
    }),

  // ===== STORE COMPLETE FORM DATA FOR PERSISTENCE ACROSS APPROVALS =====
  storeLeaveFormData: protectedProcedure
    .input(
      z.object({
        requestId: z.number(),
        formData: z.any(), // Store the complete form object
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      try {
        console.log("[storeLeaveFormData] Storing form for requestId:", input.requestId);
        console.log("[storeLeaveFormData] Form data keys:", Object.keys(input.formData || {}).join(", "));
        console.log("[storeLeaveFormData] employeeName:", input.formData?.employeeName);
        console.log("[storeLeaveFormData] employeeSignatureUrl present:", !!input.formData?.employeeSignatureUrl);
        console.log("[storeLeaveFormData] backupName:", input.formData?.backupName);

        const existing = await db
          .select()
          .from(formSubmissions)
          .where(eq(formSubmissions.requestId, input.requestId))
          .limit(1);

        if (existing.length > 0) {
          console.log("[storeLeaveFormData] Updating existing submission");
          await db
            .update(formSubmissions)
            .set({
              formData: JSON.stringify(input.formData),
              updatedAt: new Date(),
            })
            .where(eq(formSubmissions.requestId, input.requestId));
        } else {
          console.log("[storeLeaveFormData] Creating new submission");
          const insertFormSubmission: InsertFormSubmission = {
            requestId: input.requestId,
            formData: JSON.stringify(input.formData),
          };
          await db.insert(formSubmissions).values(insertFormSubmission);
        }

        console.log("[storeLeaveFormData] Successfully stored form data");
        return { success: true };
      } catch (error) {
        console.error("[storeLeaveFormData] Error storing form data:", error);
        console.error("[storeLeaveFormData] Error details:", {
          message: (error as any)?.message,
          code: (error as any)?.code,
          stack: (error as any)?.stack?.split('\n').slice(0, 5),
        });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to store form data" });
      }
    }),

  // ===== UPLOAD EMPLOYEE SIGNATURE =====
  uploadEmployeeSignature: protectedProcedure
    .input(
      z.object({
        requestId: z.number(),
        fileData: z.string(), // Base64 encoded file data
        fileName: z.string().optional(),
        fileType: z.string().optional(), // mime type
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      try {
        console.log("[uploadEmployeeSignature] Uploading signature for requestId:", input.requestId);

        let fileUrl: string;
        let fileKey: string;

        if (isSpacesConfigured()) {
          // Spaces is configured — upload to S3
          console.log("[uploadEmployeeSignature] Spaces configured, uploading to S3...");

          // Convert base64 to buffer
          let buffer: Buffer;
          try {
            const base64Data = input.fileData.includes(',')
              ? input.fileData.split(',')[1]
              : input.fileData;
            buffer = Buffer.from(base64Data, 'base64');
          } catch (e) {
            throw new Error("Invalid base64 data");
          }

          fileKey = generateFileKey(
            input.requestId,
            'employee_signature',
            input.fileName || `signature-${Date.now()}.png`
          );

          const result = await uploadFileToSpaces(
            buffer,
            fileKey,
            input.fileType || 'image/png'
          );
          fileUrl = result.url;
          console.log("[uploadEmployeeSignature] File uploaded to Spaces:", fileUrl);
        } else {
          // Spaces NOT configured — store the data URL directly in DB
          console.log("[uploadEmployeeSignature] Spaces not configured, storing signature data URL directly");
          fileUrl = input.fileData;
          fileKey = `signature-employee-${input.requestId}-${Date.now()}`;
        }

        // Store in database as attachment
        const attachment: InsertRequestAttachment = {
          requestId: input.requestId,
          type: "employee_signature",
          fileName: input.fileName || "employee_signature",
          fileUrl: fileUrl,
          fileKey: fileKey,
          mimeType: input.fileType || 'image/png',
          uploadedBy: ctx.user.id,
        };

        const result = await db
          .insert(requestAttachments)
          .values(attachment)
          .returning({ id: requestAttachments.id });

        console.log("[uploadEmployeeSignature] Signature stored with id:", result[0].id);

        return { success: true, fileUrl, attachmentId: result[0].id };
      } catch (error) {
        console.error("[uploadEmployeeSignature] Error uploading signature:", error);
        console.error("[uploadEmployeeSignature] Error details:", {
          message: (error as any)?.message,
          code: (error as any)?.code,
        });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to upload signature" });
      }
    }),

  // ===== RETRIEVE COMPLETE FORM DATA FOR APPROVERS =====
  getLeaveFormData: protectedProcedure
    .input(z.object({ requestId: z.coerce.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      try {
        console.log("[getLeaveFormData] Looking for form data for requestId:", input.requestId);

        // First, try to get the form submission (employee's submitted form data)
        const submission = await db
          .select()
          .from(formSubmissions)
          .where(eq(formSubmissions.requestId, input.requestId))
          .limit(1);

        console.log("[getLeaveFormData] Found submissions:", submission.length > 0 ? "YES" : "NO");
        if (submission.length > 0) {
          console.log("[getLeaveFormData] Submission formData length:", submission[0].formData?.length || 0);
          console.log("[getLeaveFormData] Submission formData (first 200 chars):", submission[0].formData?.substring(0, 200) || "EMPTY");
        }

        if (submission.length > 0) {
          try {
            const parsed = JSON.parse(submission[0].formData);
            console.log("[getLeaveFormData] Successfully parsed form data, keys:", Object.keys(parsed));
            console.log("[getLeaveFormData] employeeName:", parsed.employeeName);
            console.log("[getLeaveFormData] employeeSignatureUrl:", parsed.employeeSignatureUrl);

            // ✅ FIX: Fetch HOD's approval signature and add to response (run in parallel for speed)
            const [hodApproval, managerSigAttachment] = await Promise.all([
              db
                .select()
                .from(requestApprovals)
                .where(
                  and(
                    eq(requestApprovals.requestId, input.requestId),
                    eq(requestApprovals.approvalLevel, "head_of_department")
                  )
                )
                .limit(1),
              db
                .select()
                .from(requestAttachments)
                .where(
                  and(
                    eq(requestAttachments.requestId, input.requestId),
                    eq(requestAttachments.type, "manager_signature")
                  )
                )
                .orderBy(desc(requestAttachments.createdAt))
                .limit(1)
            ]);

            // Check approval signature first
            if (hodApproval.length && hodApproval[0].signatureFileId) {
              try {
                const hodSigFile = await db
                  .select()
                  .from(requestAttachments)
                  .where(eq(requestAttachments.id, hodApproval[0].signatureFileId))
                  .limit(1);

                if (hodSigFile.length) {
                  console.log("[getLeaveFormData] Adding HOD signature URL from approval record");
                  parsed.managerSignatureUrl = hodSigFile[0].fileUrl;
                }
              } catch (sigError) {
                console.warn("[getLeaveFormData] Failed to get HOD signature from approval:", sigError);
              }
            } else if (managerSigAttachment.length) {
              console.log("[getLeaveFormData] Adding HOD signature URL from attachments");
              parsed.managerSignatureUrl = managerSigAttachment[0].fileUrl;
            }

            // CRITICAL: Add requestId to form data so frontend can validate we're showing the right form
            parsed.requestId = input.requestId;

            console.log("[getLeaveFormData] Returning complete form data with keys:", Object.keys(parsed).join(", "));
            return parsed;
          } catch (parseError) {
            console.error("[getLeaveFormData] Error parsing stored form data:", parseError);
            console.log("[getLeaveFormData] Raw formData value:", submission[0].formData?.substring(0, 500));
            console.warn("[getLeaveFormData] Parse error - falling back to reconstructing from request data");
            // Fall through to reconstruction below instead of returning null
          }
        } else {
          console.log("[getLeaveFormData] No stored form found, building fallback from available data...");

          // Try to get the leave request details for this submission
          const leaveRequest = await db
            .select()
            .from(leaveRequests)
            .where(eq(leaveRequests.requestId, input.requestId))
            .limit(1);

          // Get the base request
          const request = await db
            .select()
            .from(requests)
            .where(eq(requests.id, input.requestId))
            .limit(1);

          if (!request.length) {
            console.log("[getLeaveFormData] Request not found");
            return null;
          }

          const req = request[0];
          const leave = leaveRequest.length > 0 ? leaveRequest[0] : null;

          // Get user info to fill in missing employee details
          const user = await db
            .select()
            .from(users)
            .where(eq(users.id, req.userId))
            .limit(1);

          const userData = user.length > 0 ? user[0] : null;

          console.log("[getLeaveFormData] Building form from request and leave details");

          // Get all attachments (including employee signature)
          const attachments = await db
            .select()
            .from(requestAttachments)
            .where(eq(requestAttachments.requestId, input.requestId));

          // Get approvals
          const hodApproval = await db
            .select()
            .from(requestApprovals)
            .where(
              and(
                eq(requestApprovals.requestId, input.requestId),
                eq(requestApprovals.approvalLevel, "head_of_department")
              )
            )
            .limit(1);

          // Get manager/reporting manager info
          let reportingManagerName = "";
          if (req.initialApproverId) {
            const manager = await db
              .select()
              .from(users)
              .where(eq(users.id, req.initialApproverId))
              .limit(1);
            reportingManagerName = manager.length > 0 ? (manager[0].name || "") : "";
          }

          // Build comprehensive fallback form
          const fallbackForm: any = {
            requestId: input.requestId, // CRITICAL: Include requestId for validation
            documentId: req.title || "",
            requestNumber: req.title || "",
            departmentHeader: "COMP",
            leaveType: req.type || "annual",
            parentalLeaveType: (leave as any)?.parentalLeaveType || "",
            year: new Date(req.createdAt).getFullYear().toString(),
            month: String(new Date(req.createdAt).getMonth() + 1).padStart(2, "0"),
            employeeName: userData?.name || req.employeeName || "",
            dateOfEmployment: userData?.dateOfEmployment || "",
            staffId: userData?.staffId || "",
            department: userData?.department || "",
            position: userData?.position || "",
            reason: req.reason || req.description || "",
            startDate: leave?.startDate ? new Date(leave.startDate).toISOString().split('T')[0] : "",
            endDate: leave?.endDate ? new Date(leave.endDate).toISOString().split('T')[0] : "",
            leaveDaysRequested: leave?.leaveDaysRequested?.toString() || "",
            outsideCountry: "no",
            contactDuringLeave: "",
            leaveDaysEntitled: leave?.leaveDaysEntitled?.toString() || "18",
            leaveDaysTaken: leave?.leaveDaysTaken?.toString() || "0",
            leaveDaysRemaining: ((leave?.leaveDaysEntitled || 18) - (leave?.leaveDaysTaken || 0) - (leave?.leaveDaysRequested || 0))?.toString() || "18",
            backupName: "",
            reportingManager: reportingManagerName || req.initialApproverId?.toString() || "",
            approvalComments: "",
            leaveReason: "",
            supportingDocumentUrl: "",
            employeeSignatureUrl: "",
            managerSignatureUrl: "",
            signatureDate: new Date().toISOString().split('T')[0],
          };

          // Populate attachments from request_attachments table
          for (const attachment of attachments) {
            if (attachment.type === "employee_signature") {
              fallbackForm.employeeSignatureUrl = attachment.fileUrl;
              console.log("[getLeaveFormData] Populated employeeSignatureUrl from attachments");
            } else if (attachment.type === "manager_signature") {
              fallbackForm.managerSignatureUrl = attachment.fileUrl;
            } else if (attachment.type === "supporting_document") {
              fallbackForm.supportingDocumentUrl = attachment.fileUrl;
              console.log("[getLeaveFormData] Populated supportingDocumentUrl from attachments");
            }
          }

          // Add HOD signature from approval if exists
          if (hodApproval.length && hodApproval[0].signatureFileId) {
            try {
              const hodSigFile = await db
                .select()
                .from(requestAttachments)
                .where(eq(requestAttachments.id, hodApproval[0].signatureFileId))
                .limit(1);

              if (hodSigFile.length) {
                fallbackForm.managerSignatureUrl = hodSigFile[0].fileUrl;
              }
            } catch (sigError) {
              console.warn("[getLeaveFormData] Failed to get HOD signature from approval");
            }
          }

          console.log("[getLeaveFormData] Returning reconstructed fallback form with employeeSignatureUrl:", fallbackForm.employeeSignatureUrl ? "PRESENT" : "EMPTY");
          return fallbackForm;
        }
      } catch (error) {
        console.error("[getLeaveFormData] Error retrieving form data:", error);
        console.error("[getLeaveFormData] Error details:", {
          message: (error as any)?.message,
          code: (error as any)?.code,
          stack: (error as any)?.stack?.split('\n').slice(0, 5),
        });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to retrieve form data" });
      }
    }),

  // ===== GET CAR REQUEST DETAILS FOR APPROVAL VIEW =====
  getCarRequestDetails: protectedProcedure
    .input(z.object({ requestId: z.coerce.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      const request = await db.select().from(requests).where(eq(requests.id, input.requestId)).limit(1);
      if (!request.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
      }

      const carDetail = await db.select().from(carRequests).where(eq(carRequests.requestId, input.requestId)).limit(1);
      const employee = await db.select().from(users).where(eq(users.id, request[0].userId)).limit(1);

      return {
        request: request[0],
        carDetails: carDetail.length > 0 ? carDetail[0] : null,
        employee: employee.length > 0 ? {
          name: employee[0].name,
          email: employee[0].email,
          department: employee[0].department,
          position: employee[0].position,
          staffId: employee[0].staffId,
        } : null,
      };
    }),

  // ===== GET EXPENDITURE REQUEST DETAILS FOR APPROVAL VIEW =====
  getExpenditureRequestDetails: protectedProcedure
    .input(z.object({ requestId: z.coerce.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      const request = await db.select().from(requests).where(eq(requests.id, input.requestId)).limit(1);
      if (!request.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
      }

      const expDetail = await db.select().from(expenditureRequests).where(eq(expenditureRequests.requestId, input.requestId)).limit(1);
      const employee = await db.select().from(users).where(eq(users.id, request[0].userId)).limit(1);

      return {
        request: request[0],
        expenditureDetails: expDetail.length > 0 ? expDetail[0] : null,
        employee: employee.length > 0 ? {
          name: employee[0].name,
          email: employee[0].email,
          department: employee[0].department,
          position: employee[0].position,
          staffId: employee[0].staffId,
        } : null,
      };
    }),

  cancelRequest: protectedProcedure
    .input(
      z.object({
        requestId: z.number(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      const requestResult = await db
        .select()
        .from(requests)
        .where(eq(requests.id, input.requestId))
        .limit(1);

      if (!requestResult.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
      }

      const request = requestResult[0];

      if (ctx.user.id !== request.userId && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only cancel your own requests" });
      }

      // Can only cancel pending or draft requests
      if (request.status !== "pending" && request.status !== "draft") {
        throw new TRPCError({ code: "BAD_REQUEST", message: `Cannot cancel a ${request.status} request` });
      }

      // Fetch requester and approver details for notifications/emails
      const requesterResult = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
      const requester = requesterResult.length > 0 ? requesterResult[0] : null;

      await db
        .update(requests)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(requests.id, input.requestId));

      // Record cancellation in approval history
      const insertApproval: InsertRequestApproval = {
        requestId: input.requestId,
        approverId: ctx.user.id,
        approvalLevel: request.currentApprovalLevel as any,
        status: "rejected" as any,
        comments: input.reason || "Request cancelled by requester",
      };

      await db.insert(requestApprovals).values(insertApproval);

      const assignedApprovals = await db
        .select()
        .from(requestApprovals)
        .where(
          and(
            eq(requestApprovals.requestId, input.requestId),
            eq(requestApprovals.status, "pending")
          )
        );

      // Notify all assigned approvers
      for (const approval of assignedApprovals) {
        await db
          .update(requestApprovals)
          .set({ status: "rejected", comments: "Request cancelled by requester" })
          .where(eq(requestApprovals.id, approval.id));

        // Get approver details
        const approverResult = await db.select().from(users).where(eq(users.id, approval.approverId)).limit(1);
        const approver = approverResult.length > 0 ? approverResult[0] : null;

        // Add in-app notification
        await db.insert(notifications).values({
          userId: approval.approverId,
          requestId: input.requestId,
          triggeredByUserId: ctx.user.id,
          type: "request_rejected",
          title: "Request Cancelled",
          message: `${requester?.name || 'Employee'} has cancelled their ${request.type} request (#${input.requestId}).`,
        });

        // Send email notification to approver
        if (approver?.email) {
          try {
            const cancelledRequestType = request.type.charAt(0).toUpperCase() + request.type.slice(1);
            const approvalLevelLabel = approval.approvalLevel === "head_of_department" ? "Head of Department" : approval.approvalLevel.replace(/_/g, " ").toUpperCase();

            await sendEmail({
              to: approver.email,
              subject: `${cancelledRequestType} Request Cancelled by ${requester?.name || 'Employee'}`,
              html: `
                <h2>Request Cancellation Notification</h2>
                <p>Dear ${approver.name || 'Approver'},</p>
                <p><strong>${requester?.name || 'An employee'}</strong> has cancelled their <strong>${cancelledRequestType}</strong> request (Request #${input.requestId}).</p>
                
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
                  <p><strong>Request Details:</strong></p>
                  <p><strong>Type:</strong> ${cancelledRequestType}</p>
                  <p><strong>Request ID:</strong> #${input.requestId}</p>
                  <p><strong>Submitted by:</strong> ${requester?.name || 'Unknown'}</p>
                  <p><strong>Cancelled on:</strong> ${new Date().toLocaleString()}</p>
                  ${input.reason ? `<p><strong>Reason for Cancellation:</strong> ${input.reason}</p>` : ''}
                </div>
                
                <p>This request is no longer pending your approval and has been removed from your queue.</p>
                <p>Best regards,<br/>Centrika Portal</p>
              `,
            });
            console.log(`[cancelRequest] Email sent to approver ${approver.email}`);
          } catch (emailError) {
            console.error(`[cancelRequest] Failed to send email to approver ${approver.email}:`, emailError);
            // Don't throw - continue even if email fails
          }
        }
      }

      return { success: true, message: "Request cancelled successfully. Approvers have been notified." };
    }),

  /**
   * Delete a draft request completely (removes all related data)
   * Only the requester or admin can delete draft requests
   */
  deleteRequest: protectedProcedure
    .input(
      z.object({
        requestId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      const requestResult = await db
        .select()
        .from(requests)
        .where(eq(requests.id, input.requestId))
        .limit(1);

      if (!requestResult.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
      }

      const request = requestResult[0];

      // Check permissions
      if (ctx.user.id !== request.userId && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only delete your own requests" });
      }

      // Can only delete draft requests
      if (request.status !== "draft") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot delete a ${request.status} request. Only draft requests can be deleted. Use 'Cancel' for pending/approved requests.`
        });
      }

      // Delete the request (cascading delete will remove related records)
      const deletedRequest = await db
        .delete(requests)
        .where(eq(requests.id, input.requestId))
        .returning({ id: requests.id, type: requests.type });

      console.log(`[deleteRequest] User ${ctx.user.id} deleted draft ${request.type} request #${input.requestId}`);

      return {
        success: true,
        message: `Draft ${request.type} request deleted successfully`,
        deletedRequestId: deletedRequest[0]?.id
      };
    }),

  /**
   * Get calculated annual leave balance for the current user
   * Uses employment date to dynamically calculate entitled days
   */
  getMyLeaveBalance: protectedProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      // Fetch user record to get employment date
      const userRecord = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      if (!userRecord.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const user = userRecord[0];
      const dateOfEmployment = user.dateOfEmployment;

      // Calculate leave balance using new logic
      const leaveBalance = calculateAnnualLeaveBalance(dateOfEmployment);

      // Get total approved/submitted leave days for current year
      const currentYear = new Date().getFullYear();
      const approvedLeaveQuery = await db
        .select({
          totalDays: sql<number>`COALESCE(SUM(CAST(${leaveRequests.leaveDaysRequested} as DECIMAL)), 0)`,
        })
        .from(leaveRequests)
        .innerJoin(requests, eq(leaveRequests.requestId, requests.id))
        .where(
          and(
            eq(requests.userId, ctx.user.id),
            eq(leaveRequests.leaveType, "annual"),
            // Only count approved/submitted requests
            sql`EXTRACT(YEAR FROM ${requests.createdAt}) = ${currentYear}`,
            sql`${requests.status} IN ('approved', 'pending')`
          )
        );

      const totalUsedDays = approvedLeaveQuery[0]?.totalDays ?
        parseFloat(approvedLeaveQuery[0].totalDays.toString()) : 0;

      const remainingDays = leaveBalance.totalAnnualLeave - totalUsedDays;

      return {
        ...leaveBalance,
        usedDays: Math.round(totalUsedDays * 100) / 100,
        remainingDays: Math.max(0, Math.round(remainingDays * 100) / 100),
        employmentDate: dateOfEmployment,
      };
    } catch (error) {
      console.error("[getMyLeaveBalance] Error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to calculate leave balance",
      });
    }
  }),

  // Approval History - ALL approval records (not just pending)
  getApprovalHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    }

    // Get all approval records for this user
    const approvalRecords = await db
      .select()
      .from(requestApprovals)
      .where(eq(requestApprovals.approverId, ctx.user.id))
      .orderBy(desc(requestApprovals.updatedAt));

    // Fetch full request details for each approval
    const approvalHistory = await Promise.all(
      approvalRecords.map(async (approval) => {
        const req = await db
          .select()
          .from(requests)
          .where(eq(requests.id, approval.requestId))
          .limit(1);

        return {
          id: req[0]?.id || approval.requestId,
          title: req[0]?.title || "Unknown Request",
          type: req[0]?.type || "leave",
          status: approval.status,
          comments: approval.comments,
          approvalDate: approval.approvalDate,
          createdAt: req[0]?.createdAt,
        };
      })
    );

    return approvalHistory;
  }),

  // Request Analytics - request-focused metrics
  getDepartmentAnalytics: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    }

    // For HOD/managers - get department requests
    let departmentRequests;
    if (["head_of_department", "hr", "head_of_finance", "ceo_md"].includes(ctx.user.role)) {
      // Get all team members in the department
      const teamMembers = await db
        .select()
        .from(users)
        .where(eq(users.departmentId, ctx.user.departmentId));

      const memberIds = teamMembers.map((m) => m.id);
      departmentRequests = await db
        .select()
        .from(requests)
        .where(sql`${requests.userId} IN (${sql.join(memberIds)})`);
    } else {
      departmentRequests = await db.select().from(requests).where(eq(requests.userId, ctx.user.id));
    }

    // Filter active requests
    const activeRequests = departmentRequests.filter(
      (r) => r.status !== "draft" && r.status !== "cancelled"
    );

    // Calculate metrics
    const totalRequests = activeRequests.length;
    const approvedCount = activeRequests.filter((r) => r.status === "approved").length;
    const rejectedCount = activeRequests.filter((r) => r.status === "rejected").length;
    const pendingCount = activeRequests.filter((r) => r.status === "pending").length;

    // Calculate average processing time (in hours)
    const approvedWithTime = activeRequests
      .filter((r) => r.status === "approved" && r.updatedAt)
      .map((r) => {
        const createdTime = new Date(r.createdAt).getTime();
        const updatedTime = new Date(r.updatedAt!).getTime();
        return (updatedTime - createdTime) / (1000 * 60 * 60); // convert to hours
      });

    const avgProcessingTime =
      approvedWithTime.length > 0
        ? Math.round(approvedWithTime.reduce((a, b) => a + b, 0) / approvedWithTime.length)
        : 0;

    // Count by type
    const leaveCount = activeRequests.filter((r) => r.type === "leave").length;
    const carCount = activeRequests.filter((r) => r.type === "car").length;
    const expenditureCount = activeRequests.filter((r) => r.type === "expenditure").length;

    // This month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyRequests = activeRequests.filter(
      (r) => new Date(r.createdAt) >= monthStart
    ).length;

    return {
      totalRequests,
      approvedCount,
      rejectedCount,
      pendingCount,
      avgProcessingTime,
      leaveCount,
      carCount,
      expenditureCount,
      monthlyRequests,
    };
  }),

  // Team Statistics - team member performance
  getTeamStatistics: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    }

    // Only HOD/managers can access team statistics
    if (!["head_of_department", "hr", "head_of_finance", "ceo_md"].includes(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only managers can access team statistics" });
    }

    // Get all team members in the department
    const teamMembers = await db
      .select()
      .from(users)
      .where(eq(users.departmentId, ctx.user.departmentId));

    const memberIds = teamMembers.map((m) => m.id);

    // Get all department requests
    const allDepartmentRequests = await db
      .select()
      .from(requests)
      .where(sql`${requests.userId} IN (${sql.join(memberIds)})`);

    const activeRequests = allDepartmentRequests.filter(
      (r) => r.status !== "draft" && r.status !== "cancelled"
    );

    // Get stats per team member
    const teamMemberStats = teamMembers.map((member) => {
      const memberRequests = activeRequests.filter((r) => r.userId === member.id);
      const approvedCount = memberRequests.filter((r) => r.status === "approved").length;
      const rejectedCount = memberRequests.filter((r) => r.status === "rejected").length;
      const pendingCount = memberRequests.filter((r) => r.status === "pending").length;

      return {
        id: member.id,
        name: member.name,
        email: member.email,
        profileImage: member.profileImage,
        requestCount: memberRequests.length,
        approvedCount,
        rejectedCount,
        pendingCount,
      };
    });

    // Calculate department totals
    const totalMembers = teamMembers.length;
    const totalRequests = activeRequests.length;
    const approvedCount = activeRequests.filter((r) => r.status === "approved").length;
    const rejectedCount = activeRequests.filter((r) => r.status === "rejected").length;
    const pendingCount = activeRequests.filter((r) => r.status === "pending").length;

    return {
      totalMembers,
      totalRequests,
      approvedCount,
      rejectedCount,
      pendingCount,
      teamMembers: teamMemberStats.sort((a, b) => b.requestCount - a.requestCount),
    };
  }),
});
