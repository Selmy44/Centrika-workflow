import { protectedProcedure, router } from "../core/trpc";
import { prisma } from "../db";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { uploadFileToSpaces, isSpacesConfigured } from "../lib/spaces";

export const hrRouter = router({
  uploadDocument: protectedProcedure
    .input(z.object({
      userId: z.number(),
      name: z.string(),
      fileUrl: z.string(), // base64 data URL from frontend
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
        let finalUrl = input.fileUrl;
        let finalKey = input.fileKey;

        // If Spaces is configured, upload to cloud storage for proper URLs
        if (isSpacesConfigured() && input.fileUrl.startsWith("data:")) {
          const matches = input.fileUrl.match(/^data:([^;]+);base64,(.+)$/);
          if (matches) {
            const mimeType = matches[1];
            const base64Data = matches[2];
            const fileBuffer = Buffer.from(base64Data, "base64");
            const spacesKey = `documents/user-${input.userId}/${input.fileKey}`;
            const result = await uploadFileToSpaces(fileBuffer, spacesKey, mimeType);
            finalUrl = result.url;
            finalKey = result.key;
          }
        }
        // If Spaces is NOT configured, store the base64 data URL directly (works for viewing)

        const document = await prisma.employeeDocument.create({
          data: {
            userId: input.userId,
            name: input.name,
            fileUrl: finalUrl,
            fileKey: finalKey,
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

  deleteDocument: protectedProcedure
    .input(z.object({ documentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const doc = await prisma.employeeDocument.findUnique({ where: { id: input.documentId } });
      if (!doc) throw new TRPCError({ code: "NOT_FOUND", message: "Document not found" });

      // Only the owner, HR, or admin can delete
      if (doc.userId !== ctx.user.id && ctx.user.role !== "hr" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to delete this document" });
      }

      // Delete from Spaces if stored there
      if (doc.fileKey && !doc.fileUrl.startsWith("data:")) {
        try {
          const { deleteFileFromSpaces } = await import("../lib/spaces");
          await deleteFileFromSpaces(doc.fileKey);
        } catch (err) {
          console.error("[hr.deleteDocument] Spaces deletion error:", err);
        }
      }

      await prisma.employeeDocument.delete({ where: { id: input.documentId } });
      return { success: true };
    }),
});
