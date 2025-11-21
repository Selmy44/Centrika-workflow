import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { requests, leaveRequests, carRequests, expenditureRequests, requestApprovals, requestAttachments, leaveBalances, InsertRequest, InsertLeaveRequest, InsertCarRequest, InsertExpenditureRequest, InsertRequestApproval, InsertRequestAttachment } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { eq, and } from "drizzle-orm";

export const requestsRouter = router({
  /**
   * Create a new leave request
   */
  createLeaveRequest: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        leaveType: z.enum(["annual", "sick", "personal", "unpaid"]),
        startDate: z.string(),
        endDate: z.string(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const insertRequest: InsertRequest = {
        userId: ctx.user.id,
        type: "leave",
        status: "pending",
        title: input.title,
        description: input.reason,
      };

      const result = await db.insert(requests).values(insertRequest);
      const requestId = result[0].insertId as number;

      const insertLeaveRequest: InsertLeaveRequest = {
        requestId,
        leaveType: input.leaveType,
        startDate: input.startDate,
        endDate: input.endDate,
        reason: input.reason,
      };

      await db.insert(leaveRequests).values(insertLeaveRequest);

      return { id: requestId, ...insertRequest };
    }),

  /**
   * Create a new car request
   */
  createCarRequest: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        destination: z.string().min(1),
        purpose: z.string().optional(),
        departureDate: z.string(),
        departureTime: z.string().optional(),
        passengers: z.number().int().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const insertRequest: InsertRequest = {
        userId: ctx.user.id,
        type: "car",
        status: "pending",
        title: input.title,
        description: input.purpose,
      };

      const result = await db.insert(requests).values(insertRequest);
      const requestId = result[0].insertId as number;

      const insertCarRequest: InsertCarRequest = {
        requestId,
        destination: input.destination,
        purpose: input.purpose,
        departureDate: input.departureDate,
        departureTime: input.departureTime,
        passengers: input.passengers,
      };

      await db.insert(carRequests).values(insertCarRequest);

      return { id: requestId, ...insertRequest };
    }),

  /**
   * Create a new expenditure request
   */
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
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const insertRequest: InsertRequest = {
        userId: ctx.user.id,
        type: "expenditure",
        status: "pending",
        title: input.title,
      };

      const result = await db.insert(requests).values(insertRequest);
      const requestId = result[0].insertId as number;

      const insertExpenditureRequest: InsertExpenditureRequest = {
        requestId,
        amount: input.amount,
        currency: input.currency,
        department: input.department,
        category: input.category,
      };

      await db.insert(expenditureRequests).values(insertExpenditureRequest);

      return { id: requestId, ...insertRequest };
    }),

  /**
   * Get all requests for the current user
   */
  listUserRequests: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(requests).where(eq(requests.userId, ctx.user.id));
  }),

  /**
   * Get request details
   */
  getRequest: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return null;

      const result = await db.select().from(requests).where(eq(requests.id, input.id)).limit(1);
      if (!result.length) return null;

      const request = result[0];
      if (request.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return request;
    }),

  /**
   * Get pending approvals for the current user (admin only)
   */
  listPendingApprovals: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    const db = await getDb();
    if (!db) return [];

    return db
      .select()
      .from(requestApprovals)
      .where(eq(requestApprovals.status, "pending"));
  }),

  /**
   * Approve a request
   */
  approveRequest: protectedProcedure
    .input(
      z.object({
        requestId: z.number(),
        comments: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const insertApproval: InsertRequestApproval = {
        requestId: input.requestId,
        approverId: ctx.user.id,
        status: "approved",
        comments: input.comments,
      };

      await db.insert(requestApprovals).values(insertApproval);

      // Update request status to approved
      await db.update(requests).set({ status: "approved" }).where(eq(requests.id, input.requestId));

      return { success: true };
    }),

  /**
   * Reject a request
   */
  rejectRequest: protectedProcedure
    .input(
      z.object({
        requestId: z.number(),
        comments: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const insertApproval: InsertRequestApproval = {
        requestId: input.requestId,
        approverId: ctx.user.id,
        status: "rejected",
        comments: input.comments,
      };

      await db.insert(requestApprovals).values(insertApproval);

      // Update request status to rejected
      await db.update(requests).set({ status: "rejected" }).where(eq(requests.id, input.requestId));

      return { success: true };
    }),

  /**
   * Get request attachments
   */
  getAttachments: protectedProcedure
    .input(z.object({ requestId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(requestAttachments).where(eq(requestAttachments.requestId, input.requestId));
    }),

  /**
   * Add attachment to request
   */
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
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const insertAttachment: InsertRequestAttachment = {
        requestId: input.requestId,
        fileName: input.fileName,
        fileUrl: input.fileUrl,
        fileKey: input.fileKey,
        mimeType: input.mimeType,
      };

      await db.insert(requestAttachments).values(insertAttachment);
      return { success: true };
    }),

  /**
   * Get user leave balance
   */
  getLeaveBalance: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    const currentYear = new Date().getFullYear();
    const result = await db
      .select()
      .from(leaveBalances)
      .where(and(eq(leaveBalances.userId, ctx.user.id), eq(leaveBalances.year, currentYear)))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  }),

  /**
   * Get dashboard statistics
   */
  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      return {
        totalRequests: 0,
        pendingRequests: 0,
        approvedRequests: 0,
        rejectedRequests: 0,
      };
    }

    const userRequests = await db.select().from(requests).where(eq(requests.userId, ctx.user.id));

    const stats = {
      totalRequests: userRequests.length,
      pendingRequests: userRequests.filter((r) => r.status === "pending").length,
      approvedRequests: userRequests.filter((r) => r.status === "approved").length,
      rejectedRequests: userRequests.filter((r) => r.status === "rejected").length,
    };

    return stats;
  }),
});
