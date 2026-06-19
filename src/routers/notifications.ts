import { z } from "zod";
import { protectedProcedure, router } from "../core/trpc";
import { prisma } from "../db";
import { TRPCError } from "@trpc/server";

export const notificationsRouter = router({
  getNotifications: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().positive().default(10),
        onlyUnread: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      const result = await prisma.notification.findMany({
        where: {
          userId: ctx.user.id,
          ...(input.onlyUnread ? { isRead: false } : {}),
        },
        include: {
          triggeredByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          request: {
            select: {
              id: true,
              type: true,
              title: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: input.limit,
      });

      return result;
    }),

  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    return prisma.notification.count({
      where: {
        userId: ctx.user.id,
        isRead: false,
      },
    });
  }),

  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const notif = await prisma.notification.findUnique({
        where: { id: input.notificationId },
      });

      if (!notif) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Notification not found" });
      }

      if (notif.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You cannot modify this notification" });
      }

      await prisma.notification.update({
        where: { id: input.notificationId },
        data: { isRead: true },
      });

      return { success: true };
    }),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await prisma.notification.updateMany({
      where: { userId: ctx.user.id },
      data: { isRead: true },
    });

    return { success: true };
  }),

  markReadByRequestId: protectedProcedure
    .input(z.object({ requestId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await prisma.notification.updateMany({
        where: {
          userId: ctx.user.id,
          requestId: input.requestId,
          isRead: false,
        },
        data: { isRead: true },
      });
      return { success: true };
    }),
});
