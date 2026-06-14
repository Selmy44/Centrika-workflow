import { protectedProcedure, router } from "../core/trpc";
import { getFrontendUrl } from "../core/env";
import { prisma } from "../db";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sendEmail, emailTemplates } from "../core/email";
import crypto from "crypto";
import bcrypt from "bcryptjs";

// Generate unique invitation token
function generateInvitationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export const invitationsRouter = router({
  // Send invitation to new user
  sendInvitation: protectedProcedure
    .input(z.object({
      email: z.string().email("Invalid email").refine(val => val.trim().toLowerCase().endsWith("@centrika.rw"), {
        message: "Email must be a company email address (username@centrika.rw)"
      }),
      name: z.string().min(1),
      role: z.enum(["user", "admin", "hr", "head_of_department", "head_of_finance", "ceo_md"] as const),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Only admin and hr can invite users
        if (!["admin", "hr"].includes(ctx.user.role)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins and HR can invite users",
          });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
          where: { email: input.email }
        });

        if (existingUser) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "User with this email already exists",
          });
        }

        // Check if invitation already exists and is still pending
        const existingInvitation = await prisma.invitation.findFirst({
          where: {
            email: input.email,
            status: "pending",
          }
        });

        if (existingInvitation) {
          // Check if it's expired
          if (existingInvitation.expiresAt < new Date()) {
            // Update to expired
            await prisma.invitation.update({
              where: { id: existingInvitation.id },
              data: { status: "expired" }
            });
          } else {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "An active invitation already exists for this email",
            });
          }
        }

        // Create invitation token (valid for 1 day)
        const token = generateInvitationToken();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const newInvitation = await prisma.invitation.create({
          data: {
            email: input.email,
            token,
            role: input.role,
            name: input.name,
            createdBy: ctx.user.id,
            status: "pending",
            expiresAt,
          }
        });

        // Send invitation email
        const frontendUrl = getFrontendUrl(ctx.req);
        const inviteLink = `${frontendUrl}/accept-invite/${token}`;

        // Convert role to display format
        const roleDisplay = input.role === "head_of_department" ? "Department Head" :
          input.role === "head_of_finance" ? "Finance" :
            input.role === "ceo_md" ? "CEO/MD" :
              input.role.charAt(0).toUpperCase() + input.role.slice(1);

        const emailData = emailTemplates.userInvitationEmail(
          input.name,
          input.email,
          inviteLink,
          roleDisplay,
          {
            dept: "SYSTEM",
            pos: "ADMIN",
            topic: "ACCOUNT INVITATION",
            action: "JOIN-ONEPORTAL",
            level: "MODERATE",
            appUrl: frontendUrl,
          }
        );

        try {
          await sendEmail(input.email, emailData.subject, emailData.html);
        } catch (emailError) {
          console.error("Failed to send invitation email:", emailError);
          // Don't fail the API call if email fails
        }

        return {
          success: true,
          invitationId: newInvitation.id,
          message: `Invitation sent to ${input.email}`,
        };
      } catch (error) {
        console.error("Error sending invitation:", error);
        throw error;
      }
    }),

  // Get pending invitations
  getPendingInvitations: protectedProcedure.query(async ({ ctx }) => {
    try {
      if (!["admin", "hr"].includes(ctx.user.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins and HR can view invitations",
        });
      }

      const allInvitations = await prisma.invitation.findMany({
        where: { status: "pending" }
      });

      // Separate active and expired
      const now = new Date();
      const active = allInvitations.filter((inv: any) => inv.expiresAt > now);
      const expired = allInvitations.filter((inv: any) => inv.expiresAt <= now);

      // Update expired statuses in DB
      if (expired.length > 0) {
        await prisma.invitation.updateMany({
          where: { id: { in: expired.map((inv: any) => inv.id) } },
          data: { status: "expired" }
        });
      }

      return active;
    } catch (error) {
      console.error("Error fetching invitations:", error);
      throw error;
    }
  }),

  // Resend invitation
  resendInvitation: protectedProcedure
    .input(z.object({ invitationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        if (!["admin", "hr"].includes(ctx.user.role)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins and HR can resend invitations",
          });
        }

        const inv = await prisma.invitation.findUnique({
          where: { id: input.invitationId }
        });

        if (!inv) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Invitation not found",
          });
        }

        // Extend expiry by 1 day
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await prisma.invitation.update({
          where: { id: input.invitationId },
          data: {
            expiresAt,
            status: "pending",
            updatedAt: new Date(),
          }
        });

        // Resend email
        const frontendUrl = getFrontendUrl(ctx.req);
        const inviteLink = `${frontendUrl}/accept-invite/${inv.token}`;

        // Convert role to display format
        const roleDisplay = inv.role === "head_of_department" ? "Department Head" :
          inv.role === "head_of_finance" ? "Finance" :
            inv.role === "ceo_md" ? "CEO/MD" :
              inv.role.charAt(0).toUpperCase() + inv.role.slice(1);

        const emailData = emailTemplates.userInvitationEmail(
          inv.name || "User",
          inv.email,
          inviteLink,
          roleDisplay,
          {
            dept: "SYSTEM",
            pos: "ADMIN",
            topic: "ACCOUNT INVITATION",
            action: "RESEND-INVITE",
            level: "MODERATE",
            appUrl: frontendUrl,
          }
        );

        try {
          await sendEmail(inv.email, emailData.subject, emailData.html);
        } catch (emailError) {
          console.error("Failed to resend invitation email:", emailError);
        }

        return {
          success: true,
          message: "Invitation resent successfully",
        };
      } catch (error) {
        console.error("Error resending invitation:", error);
        throw error;
      }
    }),

  // Cancel invitation
  cancelInvitation: protectedProcedure
    .input(z.object({ invitationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        if (!["admin", "hr"].includes(ctx.user.role)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins and HR can cancel invitations",
          });
        }

        const invitation = await prisma.invitation.findUnique({
          where: { id: input.invitationId }
        });

        if (!invitation) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Invitation not found",
          });
        }

        await prisma.invitation.update({
          where: { id: input.invitationId },
          data: {
            status: "expired",
            updatedAt: new Date(),
          }
        });

        return {
          success: true,
          message: "Invitation cancelled",
        };
      } catch (error) {
        console.error("Error cancelling invitation:", error);
        throw error;
      }
    }),

  // Accept invitation and create user with password
  acceptInvitation: protectedProcedure
    .input(z.object({
      token: z.string(),
      password: z.string().min(8),
    }))
    .mutation(async ({ input }) => {
      try {
        // Find invitation by token
        const invitation = await prisma.invitation.findUnique({
          where: { token: input.token }
        });

        if (!invitation) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Invalid or expired invitation link",
          });
        }

        // Check if invitation is valid
        if (invitation.status !== "pending") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Invitation has already been ${invitation.status}`,
          });
        }

        if (invitation.expiresAt < new Date()) {
          // Mark as expired
          await prisma.invitation.update({
            where: { id: invitation.id },
            data: { status: "expired" }
          });

          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invitation has expired",
          });
        }

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
          where: { email: invitation.email }
        });

        if (existingUser) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "User already exists with this email",
          });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(input.password, 10);

        // Create user
        const newUser = await prisma.user.create({
          data: {
            openId: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: invitation.name || "User",
            email: invitation.email,
            password: hashedPassword,
            role: invitation.role as any,
            loginMethod: "email",
            lastSignedIn: new Date(),
          }
        });

        // Mark invitation as accepted
        await prisma.invitation.update({
          where: { id: invitation.id },
          data: {
            status: "accepted",
            acceptedAt: new Date(),
            updatedAt: new Date(),
          }
        });

        // Send welcome email
        const welcomeEmailData = emailTemplates.welcomeEmail(
          newUser.name || "User",
          newUser.email || "",
          {
            dept: "SYSTEM",
            pos: "USER",
            topic: "WELCOME",
            action: "ACCOUNT-ACTIVATED",
            level: "NORMAL",
            appUrl: getFrontendUrl(),
          }
        );

        try {
          await sendEmail(newUser.email || "", welcomeEmailData.subject, welcomeEmailData.html);
        } catch (emailError) {
          console.error("Failed to send welcome email:", emailError);
          // Don't fail the account creation if email fails
        }

        return {
          success: true,
          userId: newUser.id,
          message: "Account created successfully! You can now log in.",
        };
      } catch (error) {
        console.error("Error accepting invitation:", error);
        throw error;
      }
    }),

  // Verify invitation token (for accept-invite page)
  verifyInvitationToken: protectedProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      try {
        const invitation = await prisma.invitation.findUnique({
          where: { token: input.token }
        });

        if (!invitation) {
          return { valid: false, message: "Invalid invitation link" };
        }

        if (invitation.status !== "pending") {
          return { valid: false, message: `Invitation has already been ${invitation.status}` };
        }

        if (invitation.expiresAt < new Date()) {
          return { valid: false, message: "Invitation has expired" };
        }

        return {
          valid: true,
          email: invitation.email,
          name: invitation.name,
          role: invitation.role,
        };
      } catch (error) {
        console.error("Error verifying invitation:", error);
        return { valid: false, message: "Error verifying invitation" };
      }
    }),
});
