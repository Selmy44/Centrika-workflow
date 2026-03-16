import { z } from "zod";
import { protectedProcedure, router } from "../core/trpc";
import { prisma } from "../db";
import { TRPCError } from "@trpc/server";

export const announcementsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return prisma.announcement.findMany({
      where: {
        OR: [
          { departmentId: null },
          { departmentId: typeof ctx.user.department === 'object' ? ctx.user.department?.id : undefined }
        ]
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          }
        }
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    });
  }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        content: z.string().min(1),
        departmentId: z.number().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const allowedRoles = ["admin", "hr", "head_of_department", "ceo_md"];
      if (!allowedRoles.includes(ctx.user.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to post announcements",
        });
      }

      // Admins and HR can post globally (departmentId = null)
      // HODs must post to their own department
      let targetDepartmentId = input.departmentId;

      if (ctx.user.role === "head_of_department" && !["admin", "hr", "ceo_md"].includes(ctx.user.role)) {
         targetDepartmentId = typeof ctx.user.department === 'object' ? ctx.user.department?.id : undefined;
         
         if (!targetDepartmentId) {
             throw new TRPCError({
                 code: "BAD_REQUEST",
                 message: "You are not assigned to a department.",
             });
         }
      }

      return prisma.announcement.create({
        data: {
          title: input.title,
          content: input.content,
          departmentId: targetDepartmentId || null,
          authorId: ctx.user.id,
        },
      });
    }),
});
