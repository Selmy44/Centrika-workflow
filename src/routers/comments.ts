import { z } from "zod";
import { protectedProcedure, router } from "../core/trpc";
import { prisma } from "../db";
import { TRPCError } from "@trpc/server";

export const commentsRouter = router({
  getComments: protectedProcedure
    .input(
      z.object({
        requestId: z.number().int().positive(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Basic permission check could be added here to ensure the user can see the request
      return prisma.requestComment.findMany({
        where: {
          requestId: input.requestId,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profileImage: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc", // Oldest first for a thread
        },
      });
    }),

  addComment: protectedProcedure
    .input(
      z.object({
        requestId: z.number().int().positive(),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const comment = await prisma.requestComment.create({
        data: {
          requestId: input.requestId,
          userId: ctx.user.id,
          content: input.content,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profileImage: true,
              role: true,
            },
          },
          request: {
            select: {
              userId: true,
              type: true,
              title: true,
              approvals: {
                where: { status: "pending" },
                select: { approverId: true }
              }
            }
          }
        },
      });

      // Automated Notification Logic
      const request = comment.request;
      const notifications = [];

      // 1. Notify Request Owner if someone else commented
      if (ctx.user.id !== request.userId) {
        notifications.push({
          userId: request.userId,
          requestId: input.requestId,
          triggeredByUserId: ctx.user.id,
          type: "new_comment" as any,
          title: "New comment on your request",
          message: `${ctx.user.name} commented: "${input.content.substring(0, 50)}${input.content.length > 50 ? "..." : ""}"`,
        });
      }

      // 2. Notify Current Approver if the Owner commented
      if (ctx.user.id === request.userId && request.approvals.length > 0) {
        request.approvals.forEach((app) => {
          notifications.push({
            userId: app.approverId,
            requestId: input.requestId,
            triggeredByUserId: ctx.user.id,
            type: "new_comment" as any,
            title: "Requester added a comment",
            message: `${ctx.user.name} added a comment to their ${request.type} request.`,
          });
        });
      }

      if (notifications.length > 0) {
        await prisma.notification.createMany({
          data: notifications
        });
      }
      
      return comment;
    }),
});
