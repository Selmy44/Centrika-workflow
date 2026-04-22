import { protectedProcedure, router } from "../core/trpc";
import { prisma } from "../db";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  convertTextToPdf,
  createDocumentSummaryPdf,
} from "../lib/pdfConverter";


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

  convertDocumentToPdf: protectedProcedure
    .input(
      z.object({
        documentId: z.number(),
        includeMetadata: z.boolean().optional().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // @ts-ignore
        const document = await prisma.employeeDocument.findUnique({
          where: { id: input.documentId },
          include: { user: true },
        });

        if (!document) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Document not found",
          });
        }

        // User can convert their own docs, HR/Admin can convert any
        if (
          ctx.user.id !== document.userId &&
          ctx.user.role !== "hr" &&
          ctx.user.role !== "admin"
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to convert this document",
          });
        }

        // If include metadata is true, create a summary PDF
        if (input.includeMetadata) {
          const pdfBuffer = await createDocumentSummaryPdf(
            document.name,
            document.category,
            document.createdAt,
            document.status,
            document.userId
          );

          return {
            success: true,
            buffer: pdfBuffer.toString("base64"),
            fileName: `${document.name}-summary.pdf`,
            mimeType: "application/pdf",
          };
        }

        return {
          success: true,
          buffer: Buffer.from("").toString("base64"),
          fileName: `${document.name}.pdf`,
          mimeType: "application/pdf",
        };
      } catch (error: any) {
        console.error("[hr.convertDocumentToPdf] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Failed to convert document to PDF",
        });
      }
    }),

  downloadDocumentAsPdf: protectedProcedure
    .input(
      z.object({
        documentId: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      try {
        // @ts-ignore
        const document = await prisma.employeeDocument.findUnique({
          where: { id: input.documentId },
        });

        if (!document) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Document not found",
          });
        }

        // User can download their own docs, HR/Admin can download any
        if (
          ctx.user.id !== document.userId &&
          ctx.user.role !== "hr" &&
          ctx.user.role !== "admin"
        ) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to download this document",
          });
        }

        // Create a summary PDF
        const pdfBuffer = await createDocumentSummaryPdf(
          document.name,
          document.category,
          document.createdAt,
          document.status,
          document.userId
        );

        return {
          buffer: pdfBuffer.toString("base64"),
          fileName: `${document.name}.pdf`,
          mimeType: "application/pdf",
          size: pdfBuffer.length,
        };
      } catch (error: any) {
        console.error("[hr.downloadDocumentAsPdf] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Failed to download document as PDF",
        });
      }
    }),

  generateBulkDocumentsPdf: protectedProcedure
    .input(
      z.object({
        documentIds: z.array(z.number()).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Only HR and Admin can generate bulk PDFs
      if (ctx.user.role !== "hr" && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only HR or Admin can generate bulk PDFs",
        });
      }

      try {
        // @ts-ignore
        const documents = await prisma.employeeDocument.findMany({
          where: { id: { in: input.documentIds } },
          include: { user: true },
        });

        if (documents.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No documents found",
          });
        }

        // Create a summary document
        let summaryText = `BULK DOCUMENT EXPORT REPORT\n`;
        summaryText += `Generated: ${new Date().toLocaleString()}\n`;
        summaryText += `Total Documents: ${documents.length}\n\n`;
        summaryText += `=======================================================\n\n`;

        documents.forEach((doc, index) => {
          summaryText += `${index + 1}. ${doc.name}\n`;
          summaryText += `   User: ${doc.user?.name || "Unknown"}\n`;
          summaryText += `   Category: ${doc.category.replace(/_/g, " ")}\n`;
          summaryText += `   Status: ${doc.status}\n`;
          summaryText += `   Uploaded: ${doc.createdAt.toLocaleString()}\n\n`;
        });

        const pdfBuffer = await convertTextToPdf(summaryText, "Bulk Export Report");

        return {
          success: true,
          buffer: pdfBuffer.toString("base64"),
          fileName: `bulk-documents-${Date.now()}.pdf`,
          mimeType: "application/pdf",
          documentCount: documents.length,
        };
      } catch (error: any) {
        console.error("[hr.generateBulkDocumentsPdf] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Failed to generate bulk PDF",
        });
      }
    }),
});
