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

      // Permissions logic:
      // HR, Admin, CEO/MD can post globally (departmentId = null)
      // Head of Department (HOD) can ONLY post to their own department
      let targetDepartmentId = input.departmentId;

      if (ctx.user.role === "head_of_department") {
        const deptId = typeof ctx.user.department === 'object' ? ctx.user.department?.id : undefined;
        if (!deptId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You must be assigned to a department to post a team announcement.",
          });
        }
        targetDepartmentId = deptId;
      } else if (["hr", "admin", "ceo_md"].includes(ctx.user.role)) {
        // These roles can post to a specific department if provided, else it's global (null)
        targetDepartmentId = input.departmentId || null;
      } else {
        // Fallback for unauthorized roles (though protectedProcedure and allowedRoles above should catch this)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to post announcements",
        });
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
