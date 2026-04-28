// TRPC Router for Suggestions
import { z } from "zod";
import { protectedProcedure, router } from "../core/trpc";
import { prisma } from "../db";
import { TRPCError } from "@trpc/server";
import { sendEmail, emailTemplates } from "../core/email";
import { Role } from "@prisma/client";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  hr: "Human Resources",
  head_of_department: "Head of Department",
  head_of_finance: "Head of Finance",
  ceo_md: "CEO / Managing Director",
};

export const suggestionsRouter = router({
  searchStaff: protectedProcedure
    .input(z.object({ search: z.string().optional() }))
    .query(async ({ input }) => {
      return prisma.user.findMany({
        where: {
          status: "Active",
          OR: input.search ? [
            { name: { contains: input.search, mode: "insensitive" } },
            { position: { contains: input.search, mode: "insensitive" } },
          ] : undefined,
        },
        select: {
          id: true,
          name: true,
          position: true,
          profileImage: true,
          department: { select: { name: true } }
        },
        take: 10,
        orderBy: { name: 'asc' }
      });
    }),

  submit: protectedProcedure
    .input(
      z.object({
        title: z.string().optional(),
        content: z.string().min(1),
        targetUserIds: z.array(z.number()).nonempty(),
        attachments: z.array(z.object({
          fileName: z.string(),
          fileUrl: z.string(),
          fileKey: z.string(),
          mimeType: z.string().optional(),
          fileSize: z.number().optional(),
        })).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await prisma.user.findUnique({
        where: { id: ctx.user.id },
        include: { department: true }
      });

      const suggestion = await prisma.suggestion.create({
        data: {
          title: input.title,
          content: input.content,
          isAnonymous: false,
          userId: ctx.user.id,
          targetUserIds: input.targetUserIds,
          targetRoles: [],
          attachments: input.attachments ? {
            create: input.attachments
          } : undefined
        },
      });

      // Target users for notification
      const allTargets = await prisma.user.findMany({
        where: {
          id: { in: input.targetUserIds },
          status: "Active"
        },
        select: { id: true, name: true, email: true },
      });

      if (allTargets.length > 0) {
        // Create in-app notifications
        await prisma.notification.createMany({
          data: allTargets.map((u) => ({
            userId: u.id,
            triggeredByUserId: ctx.user.id,
            type: "new_suggestion" as any,
            title: `New Message on Centrika Connect`,
            message: `A team member has sent you a message or support request.`,
            isRead: false,
            suggestionId: suggestion.id,
          })),
        });

        const emailPromises = allTargets
          .filter((u) => u.email)
          .map((u) => {
            const template = emailTemplates.newSuggestionEmail(
              u.name || "Colleague",
              "Direct Message",
              input.content,
              {
                dept: user?.department?.name || "N/A",
                pos: user?.position || "Staff",
                topic: "CENTRIKA CONNECT",
                action: "NEW-MESSAGE",
                level: "NORMAL"
              }
            );
            return sendEmail(u.email!, template.subject, template.html);
          });

        Promise.allSettled(emailPromises).catch(console.error);
      }

      return suggestion;
    }),

  listInbox: protectedProcedure.query(async ({ ctx }) => {
    // Show messages where the user is explicitly targeted
    const suggestions = await prisma.suggestion.findMany({
      where: {
        OR: [
          { targetUserIds: { has: ctx.user.id } },
          { targetRoles: { hasSome: [ctx.user.role] as Role[] } } // Maintain legacy role support for now
        ]
      },
      include: {
        user: { select: { id: true, name: true, role: true, position: true, profileImage: true, department: { select: { name: true } } } },
        replies: { include: { user: { select: { id: true, name: true, position: true, profileImage: true } }, _count: { select: { likes: true } }, likes: { where: { userId: ctx.user.id }, select: { id: true } } }, orderBy: { createdAt: 'asc' } },
        notifications: { where: { userId: ctx.user.id } },
        _count: { select: { likes: true } },
        likes: { where: { userId: ctx.user.id }, select: { id: true } }
      }
    });

    // Fetch target users for each suggestion to show recipients in UI if needed
    const suggestionsWithTargets = await Promise.all(suggestions.map(async (s) => {
      const targetUsers = s.targetUserIds.length > 0
        ? await prisma.user.findMany({
          where: { id: { in: s.targetUserIds } },
          select: { id: true, name: true, role: true, position: true, profileImage: true, department: { select: { name: true } } }
        })
        : [];
      return { ...s, targetUsers };
    }));

    return suggestionsWithTargets.sort((a, b) => {
      const aLatestCreatedAt = a.replies.length > 0 ? a.replies[a.replies.length - 1].createdAt : a.createdAt;
      const bLatestCreatedAt = b.replies.length > 0 ? b.replies[b.replies.length - 1].createdAt : b.createdAt;

      return bLatestCreatedAt.getTime() - aLatestCreatedAt.getTime();
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const suggestion = await prisma.suggestion.findUnique({
        where: { id: input.id },
        include: {
          user: { select: { id: true, name: true, role: true, position: true, profileImage: true, department: { select: { name: true } } } },
          replies: {
            include: {
              user: { select: { id: true, name: true, position: true, profileImage: true } },
              attachments: true,
              _count: { select: { likes: true } },
              likes: { where: { userId: ctx.user.id }, select: { id: true } }
            },
            orderBy: { createdAt: 'asc' }
          },
          notifications: { where: { userId: ctx.user.id } },
          attachments: true,
          _count: { select: { likes: true } },
          likes: { where: { userId: ctx.user.id }, select: { id: true } },
          readStatuses: {
            include: {
              user: { select: { id: true, name: true } }
            }
          }
        }
      });
      if (!suggestion) throw new TRPCError({ code: "NOT_FOUND" });

      // Fetch target users details if they exist
      const targetUsers = suggestion.targetUserIds.length > 0
        ? await prisma.user.findMany({
          where: { id: { in: suggestion.targetUserIds } },
          select: { id: true, name: true, role: true, position: true, profileImage: true, department: { select: { name: true } } }
        })
        : [];

      return { ...suggestion, targetUsers };
    }),

  listMyFeedback: protectedProcedure.query(async ({ ctx }) => {
    const suggestions = await prisma.suggestion.findMany({
      where: {
        userId: ctx.user.id
      },
      include: {
        user: { select: { id: true, name: true, role: true, position: true, profileImage: true, department: { select: { name: true } } } },
        replies: { include: { user: { select: { id: true, name: true, position: true, profileImage: true } }, _count: { select: { likes: true } }, likes: { where: { userId: ctx.user.id }, select: { id: true } } }, orderBy: { createdAt: 'asc' } },
        notifications: { where: { userId: ctx.user.id } },
        _count: { select: { likes: true } },
        likes: { where: { userId: ctx.user.id }, select: { id: true } }
      }
    });

    const suggestionsWithTargets = await Promise.all(suggestions.map(async (s) => {
      const targetUsers = s.targetUserIds.length > 0
        ? await prisma.user.findMany({
          where: { id: { in: s.targetUserIds } },
          select: { id: true, name: true, role: true, position: true, profileImage: true, department: { select: { name: true } } }
        })
        : [];
      return { ...s, targetUsers };
    }));

    return suggestionsWithTargets.sort((a, b) => {
      const aLatestCreatedAt = a.replies.length > 0 ? a.replies[a.replies.length - 1].createdAt : a.createdAt;
      const bLatestCreatedAt = b.replies.length > 0 ? b.replies[b.replies.length - 1].createdAt : b.createdAt;

      return bLatestCreatedAt.getTime() - aLatestCreatedAt.getTime();
    });
  }),

  reply: protectedProcedure
    .input(z.object({
      suggestionId: z.number(),
      content: z.string().min(1),
      attachments: z.array(z.object({
        fileName: z.string(),
        fileUrl: z.string(),
        fileKey: z.string(),
        mimeType: z.string().optional(),
        fileSize: z.number().optional(),
      })).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const suggestion = await prisma.suggestion.findUnique({ where: { id: input.suggestionId }, include: { user: true } });
      if (!suggestion) throw new TRPCError({ code: "NOT_FOUND" });

      const replier = await prisma.user.findUnique({
        where: { id: ctx.user.id },
        include: { department: true }
      });

      const reply = await prisma.suggestionReply.create({
        data: {
          content: input.content,
          suggestionId: input.suggestionId,
          userId: ctx.user.id,
          attachments: input.attachments ? {
            create: input.attachments
          } : undefined
        }
      });

      // Notify all other participants
      const participants = [suggestion.userId, ...suggestion.targetUserIds]
        .filter((id): id is number => id !== null && id !== ctx.user.id);

      if (participants.length > 0) {
        await prisma.notification.createMany({
          data: participants.map(pid => ({
            userId: pid,
            triggeredByUserId: ctx.user.id,
            type: "feedback_reply" as any,
            title: suggestion.title ? `New Reply in ${suggestion.title}` : `New Reply on Centrika Connect`,
            message: `${ctx.user.name} (${ctx.user.position || "Staff"}) replied to the message.`,
            isRead: false,
            suggestionId: suggestion.id,
          }))
        });

        if (suggestion.user?.email) {
          const template = emailTemplates.feedbackReplyEmail(
            suggestion.user.name || "Staff",
            replier?.position || "Staff",
            input.content,
            {
              dept: replier?.department?.name || "N/A",
              pos: replier?.position || "Staff",
              topic: "PULSE REPLY",
              action: "RESPONSE-RECEIVED",
              level: "MODERATE"
            }
          );
          sendEmail(suggestion.user.email, template.subject, template.html).catch(console.error);
        }
      }

      return reply;
    }),

  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    return prisma.notification.count({
      where: {
        userId: ctx.user.id,
        isRead: false,
        type: {
          in: ["new_suggestion", "feedback_reply"]
        }
      }
    });
  }),

  markThreadAsRead: protectedProcedure
    .input(z.object({ suggestionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Clear in-app notifications
      await prisma.notification.updateMany({
        where: {
          userId: ctx.user.id,
          suggestionId: input.suggestionId,
          isRead: false,
        },
        data: {
          isRead: true
        }
      });

      // Update per-user read Status for "Seen by" indicators
      await prisma.suggestionReadStatus.upsert({
        where: {
          suggestionId_userId: {
            suggestionId: input.suggestionId,
            userId: ctx.user.id
          }
        },
        update: {
          lastReadAt: new Date()
        },
        create: {
          suggestionId: input.suggestionId,
          userId: ctx.user.id,
          lastReadAt: new Date()
        }
      });

      return { success: true };
    }),

  getReadStatus: protectedProcedure
    .input(z.object({ suggestionId: z.number() }))
    .query(async ({ input }) => {
      return prisma.suggestionReadStatus.findMany({
        where: { suggestionId: input.suggestionId },
        include: {
          suggestion: {
            include: {
              user: { select: { id: true, name: true } }
            }
          }
        },
        orderBy: { lastReadAt: 'desc' }
      });
    }),

  getDetailedReadStatus: protectedProcedure
    .input(z.object({ suggestionId: z.number() }))
    .query(async ({ input }) => {
      const readStatuses = await prisma.suggestionReadStatus.findMany({
        where: { suggestionId: input.suggestionId },
        select: {
          userId: true,
          lastReadAt: true
        }
      });

      const users = await prisma.user.findMany({
        where: { id: { in: readStatuses.map(r => r.userId) } },
        select: { id: true, name: true }
      });

      return readStatuses.map(rs => ({
        ...rs,
        userName: users.find(u => u.id === rs.userId)?.name || "Staff Member"
      }));
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const suggestion = await prisma.suggestion.findUnique({ where: { id: input.id } });
      if (!suggestion) throw new TRPCError({ code: "NOT_FOUND" });

      const allowedRoles = ["admin", "hr", "ceo_md"];
      const isOwner = suggestion.userId === ctx.user.id;
      const isAdmin = allowedRoles.includes(ctx.user.role);
      const isParticipant = suggestion.targetUserIds.includes(ctx.user.id);

      if (!isOwner && !isAdmin && !isParticipant) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own chats",
        });
      }

      return prisma.suggestion.delete({
        where: { id: input.id },
      });
    }),

  toggleLike: protectedProcedure
    .input(z.object({ suggestionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.suggestionLike.findUnique({
        where: {
          suggestionId_userId: {
            suggestionId: input.suggestionId,
            userId: ctx.user.id
          }
        }
      });
      if (existing) {
        await prisma.suggestionLike.delete({ where: { id: existing.id } });
        return { liked: false };
      } else {
        await prisma.suggestionLike.create({
          data: { suggestionId: input.suggestionId, userId: ctx.user.id }
        });
        return { liked: true };
      }
    }),

  toggleReplyLike: protectedProcedure
    .input(z.object({ replyId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.suggestionReplyLike.findUnique({
        where: {
          replyId_userId: {
            replyId: input.replyId,
            userId: ctx.user.id
          }
        }
      });
      if (existing) {
        await prisma.suggestionReplyLike.delete({ where: { id: existing.id } });
        return { liked: false };
      } else {
        await prisma.suggestionReplyLike.create({
          data: { replyId: input.replyId, userId: ctx.user.id }
        });
        return { liked: true };
      }
    }),
});
