import { z } from "zod";
import { protectedProcedure, router } from "../core/trpc";
import { prisma } from "../db";
import { TRPCError } from "@trpc/server";
import { parseAdditionalRoles } from "../shared/roles";
import { sendEmail, emailTemplates } from "../core/email";
import { getFrontendUrl } from "../core/env";

const ROLE_LABELS: Record<string, string> = {
  user: "Employee",
  admin: "Admin",
  hr: "HR",
  head_of_department: "Head of Department",
  head_of_finance: "Head of Finance",
  ceo_md: "CEO/MD",
};

export const announcementsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return prisma.announcement.findMany({
      where: {
        OR: [
          { departmentId: null },
          // Using raw departmentId field which is more reliable than the relation in this context
          ctx.user.departmentId ? { departmentId: ctx.user.departmentId } : undefined
        ].filter(Boolean) as any
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true,
            position: true,
            profileImage: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          }
        },
        _count: {
          select: { comments: true, likes: true }
        },
        likes: {
          where: { userId: ctx.user.id },
          select: { id: true }
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
      
      // Check both primary role and additionalRoles
      const additionalRoles = parseAdditionalRoles(ctx.user.additionalRoles);
      
      const hasAllowedRole = allowedRoles.includes(ctx.user.role) || 
        additionalRoles.some((r: string) => allowedRoles.includes(r));
      
      if (!hasAllowedRole) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to post announcements",
        });
      }

      // Permissions logic:
      // HR, Admin, CEO/MD can post globally (departmentId = null)
      // Head of Department (HOD) can ONLY post to their own department
      // BUT if a HOD also has an additional role of hr/admin/ceo_md, they can post globally
      let targetDepartmentId = input.departmentId;

      const canPostGlobally = ["hr", "admin", "ceo_md"].includes(ctx.user.role) ||
        additionalRoles.some((r: string) => ["hr", "admin", "ceo_md"].includes(r));

      if (canPostGlobally) {
        // These roles can post to a specific department if provided, else it's global (null)
        targetDepartmentId = input.departmentId || null;
      } else if (ctx.user.role === "head_of_department") {
        // Pure HODs (without hr/admin additional roles) post to their department only
        const deptId = ctx.user.department?.id;
        if (!deptId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You must be assigned to a department to post a team announcement.",
          });
        }
        targetDepartmentId = deptId;
      } else {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to post announcements",
        });
      }

      const announcement = await prisma.announcement.create({
        data: {
          title: input.title,
          content: input.content,
          departmentId: targetDepartmentId || null,
          authorId: ctx.user.id,
        },
      });

      // --- Send notifications to all relevant staff ---
      try {
        // Determine which users should receive the notification
        const targetUsers = await prisma.user.findMany({
          where: {
            id: { not: ctx.user.id }, // Don't notify the author
            ...(targetDepartmentId
              ? { departmentId: targetDepartmentId } // Department-specific
              : {}), // Global — all users
          },
          select: {
            id: true,
            name: true,
            email: true,
          },
        });

        const authorName = ctx.user.name || "A team member";
        const authorRole = ROLE_LABELS[ctx.user.role] || ctx.user.role;

        // Create in-app notifications for all target users (batch insert)
        if (targetUsers.length > 0) {
          await prisma.notification.createMany({
            data: targetUsers.map((u) => ({
              userId: u.id,
              triggeredByUserId: ctx.user.id,
              type: "announcement_posted" as const,
              title: `New Communication: ${input.title}`,
              message: `${authorName} (${authorRole}) has shared a new communication.`,
              isRead: false,
              announcementId: announcement.id,
            })),
          });
        }

        // Send email notifications in the background (don't block the response)
        const authorWithDept = await prisma.user.findUnique({
          where: { id: ctx.user.id },
          include: { department: true }
        });

        const frontendUrl = getFrontendUrl(ctx.req);
        const viewLink = `${frontendUrl}/?announcementId=${announcement.id}`;

        const emailPromises = targetUsers
          .filter((u) => u.email) // Only users with emails
          .map((u) => {
            const emailData = emailTemplates.announcementPostedEmail(
              u.name || "Team Member",
              authorName,
              authorRole,
              input.title,
              input.content,
              viewLink,
              {
                dept: authorWithDept?.department?.name || "SYSTEM",
                pos: authorWithDept?.position || "Staff",
                topic: "INTERNAL COMMUNICATION",
                action: "NEW-POST",
                level: "NORMAL",
                recipientEmail: u.email || undefined
              }
            );
            return sendEmail(u.email!, emailData.subject, emailData.html);
          });

        // Fire-and-forget: don't await all emails to avoid slowing the response
        Promise.allSettled(emailPromises).then((results) => {
          const failed = results.filter((r) => r.status === "rejected").length;
          const sent = results.filter((r) => r.status === "fulfilled").length;
          console.log(`[Announcement] Emails sent: ${sent}, failed: ${failed} for announcement "${input.title}"`);
        });

      } catch (notifError) {
        // Log but don't fail the announcement creation if notifications fail
        console.error("[Announcement] Failed to send notifications:", notifError);
      }

      return announcement;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        content: z.string().min(1).optional(),
        departmentId: z.number().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const announcement = await prisma.announcement.findUnique({
        where: { id: input.id },
      });

      if (!announcement) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Announcement not found",
        });
      }

      // Permissions: Must be author or admin/hr/ceo_md
      const isAuthor = announcement.authorId === ctx.user.id;
      const isAdminFlag = ["admin", "hr", "ceo_md"].includes(ctx.user.role);

      if (!isAuthor && !isAdminFlag) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to update this announcement",
        });
      }

      return prisma.announcement.update({
        where: { id: input.id },
        data: {
          title: input.title,
          content: input.content,
          departmentId: input.departmentId,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const announcement = await prisma.announcement.findUnique({
        where: { id: input.id },
      });

      if (!announcement) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Announcement not found",
        });
      }

      // Permissions: Must be author or admin/hr/ceo_md
      const isAuthor = announcement.authorId === ctx.user.id;
      const isAdminFlag = ["admin", "hr", "ceo_md"].includes(ctx.user.role);

      if (!isAuthor && !isAdminFlag) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to delete this announcement",
        });
      }

      return prisma.announcement.delete({
        where: { id: input.id },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const announcement = await prisma.announcement.findUnique({
        where: { id: input.id },
        include: {
          author: {
            select: { id: true, name: true, role: true, position: true, profileImage: true },
          },
          department: {
            select: { id: true, name: true },
          },
          _count: {
            select: { comments: true, likes: true }
          },
          likes: {
            where: { userId: ctx.user.id },
            select: { id: true }
          }
        },
      });

      if (!announcement) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Announcement not found" });
      }

      return announcement;
    }),

  getComments: protectedProcedure
    .input(z.object({ announcementId: z.number() }))
    .query(async ({ ctx, input }) => {
      return prisma.announcementComment.findMany({
        where: { announcementId: input.announcementId },
        include: {
          user: {
            select: { id: true, name: true, role: true, position: true, profileImage: true },
          },
          _count: {
            select: { likes: true }
          },
          likes: {
            where: { userId: ctx.user.id },
            select: { id: true }
          }
        },
        orderBy: { createdAt: "asc" },
      });
    }),

  addComment: protectedProcedure
    .input(
      z.object({
        announcementId: z.number(),
        content: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const announcement = await prisma.announcement.findUnique({
        where: { id: input.announcementId },
      });

      if (!announcement) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Announcement not found" });
      }

      const comment = await prisma.announcementComment.create({
        data: {
          announcementId: input.announcementId,
          content: input.content,
          userId: ctx.user.id,
        },
        include: {
          user: {
            select: { id: true, name: true, role: true, position: true, profileImage: true, department: true },
          },
        },
      });

      // Notify users about the new comment
      const targetUsers = await prisma.user.findMany({
        where: {
          status: "Active",
          id: { not: ctx.user.id },
          ...(announcement.departmentId ? { departmentId: announcement.departmentId } : {}),
        },
        select: { id: true, name: true, email: true },
      });

      if (targetUsers.length > 0) {
        await prisma.notification.createMany({
          data: targetUsers.map((u) => ({
            userId: u.id,
            triggeredByUserId: ctx.user.id,
            type: "new_comment" as const,
            title: `New Comment: ${announcement.title}`,
            message: `${comment.user.name || "A team member"} (${comment.user.position || "Staff"}) commented on an announcement.`,
            isRead: false,
            announcementId: announcement.id,
          })),
        });

        const frontendUrl = getFrontendUrl(ctx.req);
        const viewLink = `${frontendUrl}/?announcementId=${announcement.id}`;

        const emailPromises = targetUsers
          .filter((u) => u.email)
          .map((u) => {
            const template = emailTemplates.newCommentEmail(
              u.name || "Team Member",
              comment.user.name || "A team member",
              comment.user.position || "Staff",
              announcement.title,
              input.content,
              viewLink,
              {
                dept: (comment.user as any).department?.name || "N/A",
                pos: comment.user.position || "Staff",
                topic: "COMMUNICATION COMMENT",
                action: "NEW-REPLY",
                level: "NORMAL",
                recipientEmail: u.email || undefined
              }
            );
            return sendEmail(
              u.email!,
              template.subject,
              template.html
            );
          });

        Promise.allSettled(emailPromises).catch((err) =>
          console.error("Failed to send some comment notification emails:", err)
        );
      }

      return comment;
    }),

  toggleLike: protectedProcedure
    .input(z.object({ announcementId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.announcementLike.findUnique({
        where: {
          announcementId_userId: {
            announcementId: input.announcementId,
            userId: ctx.user.id
          }
        }
      });
      
      if (existing) {
        await prisma.announcementLike.delete({ where: { id: existing.id } });
        return { liked: false };
      } else {
        await prisma.announcementLike.create({
          data: {
            announcementId: input.announcementId,
            userId: ctx.user.id
          }
        });
        return { liked: true };
      }
    }),

  toggleCommentLike: protectedProcedure
    .input(z.object({ commentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.announcementCommentLike.findUnique({
        where: {
          commentId_userId: {
            commentId: input.commentId,
            userId: ctx.user.id
          }
        }
      });
      
      if (existing) {
        await prisma.announcementCommentLike.delete({ where: { id: existing.id } });
        return { liked: false };
      } else {
        await prisma.announcementCommentLike.create({
          data: {
            commentId: input.commentId,
            userId: ctx.user.id
          }
        });
        return { liked: true };
      }
    }),
});
