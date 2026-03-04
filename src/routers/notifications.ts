import { z } from "zod";
import { protectedProcedure, router } from "../core/trpc";
import { getDb } from "../db";
import { notifications, requests, users } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { eq, desc, and } from "drizzle-orm";

export const notificationsRouter = router({
  getNotifications: protectedProcedure
    .input(
      z.object({
        limit: z.number().int().positive().default(10),
        onlyUnread: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      let query = db
        .select({
          id: notifications.id,
          userId: notifications.userId,
          requestId: notifications.requestId,
          type: notifications.type,
          title: notifications.title,
          message: notifications.message,
          isRead: notifications.isRead,
          createdAt: notifications.createdAt,
          triggeredByUser: {
            id: users.id,
            name: users.name,
            email: users.email,
          },
          request: {
            id: requests.id,
            type: requests.type,
            title: requests.title,
          },
        })
        .from(notifications)
        .innerJoin(users, eq(notifications.triggeredByUserId, users.id))
        .innerJoin(requests, eq(notifications.requestId, requests.id))
        .where(eq(notifications.userId, ctx.user.id));

      if (input.onlyUnread) {
        query = query.where(eq(notifications.isRead, false));
      }

      const result = await query.orderBy(desc(notifications.createdAt)).limit(input.limit);
      return result;
    }),

  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    }

    const result = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, ctx.user.id), eq(notifications.isRead, false)));

    return result.length;
  }),

  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      const notif = await db
        .select()
        .from(notifications)
        .where(eq(notifications.id, input.notificationId))
        .limit(1);

      if (!notif.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Notification not found" });
      }

      if (notif[0].userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You cannot modify this notification" });
      }

      await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, input.notificationId));

      return { success: true };
    }),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    }

    await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, ctx.user.id));

    return { success: true };
  }),
});
