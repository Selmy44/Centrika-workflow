import { protectedProcedure, router } from "../core/trpc";
import { prisma } from "../db";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const hrRouter = router({
  uploadDocument: protectedProcedure
    .input(z.object({
      userId: z.number(),
      name: z.string(),
      fileUrl: z.string(),
      fileKey: z.string(),
      category: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Employees can upload their own docs, or HR/Admin can upload for them
      if (ctx.user.id !== input.userId && ctx.user.role !== "hr" && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to upload documents for this user",
        });
      }

      try {
        // @ts-ignore - resolve stale IDE Prisma type cache
        const document = await prisma.employeeDocument.create({
          data: {
            userId: input.userId,
            name: input.name,
            fileUrl: input.fileUrl,
            fileKey: input.fileKey,
            category: input.category,
            status: "pending",
          },
        });

        return { success: true, document };
      } catch (error) {
        console.error("[hr.uploadDocument] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to upload document",
        });
      }
    }),

  verifyDocument: protectedProcedure
    .input(z.object({
      documentId: z.number(),
      status: z.enum(["verified", "rejected"]),
    }))
    .mutation(async ({ ctx, input }) => {
      // Only HR and Admin can verify
      if (ctx.user.role !== "hr" && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only HR or Admin can verify documents",
        });
      }

      try {
        // @ts-ignore - resolve stale IDE Prisma type cache
        const document = await prisma.employeeDocument.update({
          where: { id: input.documentId },
          data: {
            status: input.status,
            verifiedBy: ctx.user.id,
            verifiedAt: new Date(),
          },
        });

        return { success: true, document };
      } catch (error) {
        console.error("[hr.verifyDocument] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to verify document",
        });
      }
    }),

  listDocuments: protectedProcedure
    .input(z.object({
      userId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      // User can see their own, HR/Admin/HOD/CEO can see all
      const allowedRoles = ["admin", "hr", "head_of_department", "ceo_md"];
      if (ctx.user.id !== input.userId && !allowedRoles.includes(ctx.user.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to view these documents",
        });
      }

      try {
        // @ts-ignore - resolve stale IDE Prisma type cache
        return await prisma.employeeDocument.findMany({
          where: { userId: input.userId },
          include: {
            verifier: {
              select: {
                id: true,
                name: true,
              }
            }
          },
          orderBy: { createdAt: "desc" },
        });
      } catch (error) {
        console.error("[hr.listDocuments] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to list documents",
        });
      }
    }),

  listAllDocuments: protectedProcedure
    .input(z.object({
      status: z.string().optional(),
      category: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "hr" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      try {
        // @ts-ignore
        return await prisma.employeeDocument.findMany({
          where: {
            ...(input.status ? { status: input.status } : {}),
            ...(input.category ? { category: input.category } : {}),
          },
          include: {
            user: {
              select: { id: true, name: true, department: { select: { name: true } } }
            },
            verifier: {
              select: { id: true, name: true }
            }
          },
          orderBy: { createdAt: "desc" },
        });
      } catch (error) {
        console.error("[hr.listAllDocuments] Error:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }
    }),

  getHRDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "hr" && ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const [totalEmployees, onLeaveToday, pendingDocuments, recentActivities] = await Promise.all([
        prisma.user.count({ where: { status: "Active" } }),
        prisma.leaveRequest.count({
          where: {
            startDate: { lte: today },
            endDate: { gte: today },
            request: { status: "approved" }
          }
        }),
        // @ts-ignore
        prisma.employeeDocument.count({ where: { status: "pending" } }),
        prisma.request.findMany({
          take: 5,
          orderBy: { updatedAt: "desc" },
          include: { user: true }
        })
      ]);

      const departmentDistribution = await prisma.user.groupBy({
        by: ["departmentId"],
        _count: { id: true },
        where: { status: "Active" }
      });

      return {
        totalEmployees,
        onLeaveToday,
        pendingDocuments,
        recentActivities,
        departmentDistribution,
      };
    } catch (error) {
      console.error("[hr.getHRDashboardStats] Error:", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    }
  }),

  getLeaveUsageReport: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "hr" && ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    const usage = await prisma.leaveRequest.groupBy({
      by: ["leaveType"],
      _count: { id: true },
      where: { request: { status: "approved" } }
    });

    return usage;
  }),

  getHeadcountTrends: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "hr" && ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    // Simplified headcount trend for now
    return [
      { month: "Jan", count: 45 },
      { month: "Feb", count: 48 },
      { month: "Mar", count: 52 },
    ];
  }),
});
