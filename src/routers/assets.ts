import { z } from "zod";
import { router, protectedProcedure } from "../core/trpc";
import { prisma } from "../db";
import { TRPCError } from "@trpc/server";
import {
  uploadFileToSpaces,
  generateFileKey,
  validateFile,
} from "../lib/spaces";

export const assetsRouter = router({
  // Registry & Management
  list: protectedProcedure
    .input(z.object({
      category: z.enum(["it_equipment", "furniture", "vehicles", "software", "other"]).optional(),
      status: z.enum(["available", "assigned", "in_maintenance", "retired", "lost"]).optional(),
      searchTerm: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      const where: any = {};
      if (input?.category) where.category = input.category;
      if (input?.status) where.status = input.status;
      if (input?.searchTerm) {
        where.OR = [
          { name: { contains: input.searchTerm, mode: "insensitive" } },
          { assetTag: { contains: input.searchTerm, mode: "insensitive" } },
          { serialNumber: { contains: input.searchTerm, mode: "insensitive" } },
        ];
      }

      return prisma.asset.findMany({
        where,
        include: {
          assignments: {
            where: { status: "active" },
            include: { user: true },
            take: 1
          }
        },
        orderBy: { updatedAt: "desc" }
      });
    }),

  getDetails: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const asset = await prisma.asset.findUnique({
        where: { id: input.id },
        include: {
          assignments: {
            include: { user: true, assigner: true },
            orderBy: { assignedAt: "desc" }
          },
          documents: {
            include: { uploader: true },
            orderBy: { createdAt: "desc" }
          },
          maintenance: {
            include: { logger: true },
            orderBy: { maintenanceDate: "desc" }
          },
          auditLogs: {
            include: { user: true },
            orderBy: { createdAt: "desc" }
          }
        }
      });

      if (!asset) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Asset not found" });
      }

      return asset;
    }),

  create: protectedProcedure
    .input(z.object({
      assetTag: z.string(),
      name: z.string(),
      category: z.enum(["it_equipment", "furniture", "vehicles", "software", "other"]),
      serialNumber: z.string().optional(),
      purchaseDate: z.string(), // ISO string
      purchaseCost: z.number(),
      currency: z.string().default("RWF"),
      vendor: z.string().optional(),
      warrantyExpiry: z.string().optional(),
      location: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "hr") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only Admin or HR can create assets" });
      }

      const asset = await prisma.asset.create({
        data: {
          assetTag: input.assetTag,
          name: input.name,
          category: input.category,
          serialNumber: input.serialNumber,
          purchaseDate: new Date(input.purchaseDate),
          purchaseCost: input.purchaseCost,
          currency: input.currency,
          vendor: input.vendor,
          warrantyExpiry: input.warrantyExpiry ? new Date(input.warrantyExpiry) : null,
          location: input.location,
          status: "available",
        }
      });

      await prisma.assetAuditLog.create({
        data: {
          assetId: asset.id,
          userId: ctx.user.id,
          action: "CREATED",
          details: `Asset created with tag ${input.assetTag}`
        }
      });

      return asset;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      category: z.enum(["it_equipment", "furniture", "vehicles", "software", "other"]).optional(),
      serialNumber: z.string().optional(),
      location: z.string().optional(),
      status: z.enum(["available", "assigned", "in_maintenance", "retired", "lost"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "hr") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only Admin or HR can update assets" });
      }

      const { id, ...data } = input;
      const asset = await prisma.asset.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date()
        }
      });

      await prisma.assetAuditLog.create({
        data: {
          assetId: id,
          userId: ctx.user.id,
          action: "UPDATED",
          details: `Asset details updated: ${Object.keys(data).join(", ")}`
        }
      });

      return asset;
    }),

  // Assignment Workflow
  assign: protectedProcedure
    .input(z.object({
      assetId: z.number(),
      userId: z.number(),
      expectedReturnDate: z.string().optional(),
      conditionAtAssignment: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "hr") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only Admin or HR can assign assets" });
      }

      const asset = await prisma.asset.findUnique({ where: { id: input.assetId } });
      if (!asset || asset.status !== "available") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Asset is not available for assignment" });
      }

      const [assignment] = await prisma.$transaction([
        prisma.assetAssignment.create({
          data: {
            assetId: input.assetId,
            userId: input.userId,
            assignedAt: new Date(),
            expectedReturnDate: input.expectedReturnDate ? new Date(input.expectedReturnDate) : null,
            conditionAtAssignment: input.conditionAtAssignment,
            assignedBy: ctx.user.id,
            status: "active",
          }
        }),
        prisma.asset.update({
          where: { id: input.assetId },
          data: { status: "assigned" }
        }),
        prisma.assetAuditLog.create({
          data: {
            assetId: input.assetId,
            userId: ctx.user.id,
            action: "ASSIGNED",
            details: `Asset assigned to user ID ${input.userId}`
          }
        })
      ]);

      return assignment;
    }),

  return: protectedProcedure
    .input(z.object({
      assetId: z.number(),
      conditionAtReturn: z.string().optional(),
      newStatus: z.enum(["available", "in_maintenance", "retired"]).default("available"),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "hr") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only Admin or HR can return assets" });
      }

      const activeAssignment = await prisma.assetAssignment.findFirst({
        where: { assetId: input.assetId, status: "active" }
      });

      if (!activeAssignment) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No active assignment found for this asset" });
      }

      await prisma.$transaction([
        prisma.assetAssignment.update({
          where: { id: activeAssignment.id },
          data: {
            returnedAt: new Date(),
            conditionAtReturn: input.conditionAtReturn,
            status: "returned",
          }
        }),
        prisma.asset.update({
          where: { id: input.assetId },
          data: { status: input.newStatus }
        }),
        prisma.assetAuditLog.create({
          data: {
            assetId: input.assetId,
            userId: ctx.user.id,
            action: "RETURNED",
            details: `Asset returned. New status set to ${input.newStatus}`
          }
        })
      ]);

      return { success: true };
    }),

  // Maintenance
  logMaintenance: protectedProcedure
    .input(z.object({
      assetId: z.number(),
      maintenanceDate: z.string(),
      cost: z.number(),
      vendor: z.string().optional(),
      description: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "hr" && ctx.user.role !== "head_of_finance") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Unauthorized to log maintenance" });
      }

      const maintenance = await prisma.assetMaintenance.create({
        data: {
          assetId: input.assetId,
          maintenanceDate: new Date(input.maintenanceDate),
          cost: input.cost,
          vendor: input.vendor,
          description: input.description,
          loggedBy: ctx.user.id,
        }
      });

      await prisma.assetAuditLog.create({
        data: {
          assetId: input.assetId,
          userId: ctx.user.id,
          action: "MAINTENANCE_LOGGED",
          details: `Maintenance logged with cost ${input.cost} RWF`
        }
      });

      return maintenance;
    }),

  // Documents
  uploadDocument: protectedProcedure
    .input(z.object({
      assetId: z.number(),
      assignmentId: z.number().optional(),
      type: z.enum(["invoice", "warranty", "contract", "photo", "maintenance_report", "other"]),
      fileName: z.string(),
      fileUrl: z.string(),
      fileKey: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const doc = await prisma.assetDocument.create({
        data: {
          assetId: input.assetId,
          assignmentId: input.assignmentId,
          type: input.type,
          fileName: input.fileName,
          fileUrl: input.fileUrl,
          fileKey: input.fileKey,
          uploadedBy: ctx.user.id,
        }
      });

      await prisma.assetAuditLog.create({
        data: {
          assetId: input.assetId,
          userId: ctx.user.id,
          action: "DOCUMENT_UPLOADED",
          details: `Uploaded ${input.type}: ${input.fileName}`
        }
      });

      return doc;
    }),

  uploadDocumentBase64: protectedProcedure
    .input(z.object({
      assetId: z.number(),
      assignmentId: z.number().optional(),
      type: z.enum(["invoice", "warranty", "contract", "photo", "maintenance_report", "other"]),
      fileName: z.string(),
      fileData: z.string(), // base64
      mimeType: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const fileBuffer = Buffer.from(input.fileData, "base64");
      const validation = validateFile(fileBuffer, input.mimeType);
      if (!validation.valid) {
        throw new TRPCError({ code: "BAD_REQUEST", message: validation.error || "Invalid file" });
      }

      // We use 0 as a placeholder requestId for the spaces key generator if not associated with a request
      const fileKey = generateFileKey(0, `asset-${input.type}`, input.fileName);
      const { url } = await uploadFileToSpaces(fileBuffer, fileKey, input.mimeType);

      const doc = await prisma.assetDocument.create({
        data: {
          assetId: input.assetId,
          assignmentId: input.assignmentId,
          type: input.type,
          fileName: input.fileName,
          fileUrl: url,
          fileKey: fileKey,
          uploadedBy: ctx.user.id,
        }
      });

      await prisma.assetAuditLog.create({
        data: {
          assetId: input.assetId,
          userId: ctx.user.id,
          action: "DOCUMENT_UPLOADED",
          details: `Uploaded ${input.type}: ${input.fileName}`
        }
      });

      return doc;
    }),

  // Stats
  getStats: protectedProcedure.query(async () => {
    const [totalAssets, assignedCount, maintenanceCount, totalCost] = await Promise.all([
      prisma.asset.count(),
      prisma.asset.count({ where: { status: "assigned" } }),
      prisma.asset.count({ where: { status: "in_maintenance" } }),
      prisma.asset.aggregate({ _sum: { purchaseCost: true } })
    ]);

    const categories = await prisma.asset.groupBy({
      by: ["category"],
      _count: { id: true }
    });

    return {
      totalAssets,
      assignedCount,
      maintenanceCount,
      totalValue: Number(totalCost._sum.purchaseCost || 0),
      categories: categories.map((c: any) => ({ name: c.category, count: c._count.id }))
    };
  }),
});
