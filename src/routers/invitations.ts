import { protectedProcedure, router } from "../core/trpc";
import { getDb } from "../db";
import { invitations, users } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { sendEmail, emailTemplates } from "../core/email";
import crypto from "crypto";

// Generate unique invitation token
function generateInvitationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export const invitationsRouter = router({
  // Send invitation to new user
  sendInvitation: protectedProcedure
    .input(z.object({
      email: z.string().email(),
      name: z.string().min(1),
      role: z.enum(["user", "admin", "hr", "head_of_department", "head_of_finance", "ceo_md"]),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Only admin and hr can invite users
        if (!ctx.user || !["admin", "hr"].includes(ctx.user.role)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins and HR can invite users",
          });
        }

        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        // Check if user already exists
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.email, input.email))
          .limit(1);

        if (existingUser.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "User with this email already exists",
          });
        }

        // Check if invitation already exists and is still pending
        const existingInvitation = await db
          .select()
          .from(invitations)
          .where(
            and(
              eq(invitations.email, input.email),
              eq(invitations.status, "pending"),
              // Check if not expired
              // expiresAt > now is checked below
            )
          )
          .limit(1);

        if (existingInvitation.length > 0) {
          // Check if it's expired
          if (existingInvitation[0].expiresAt < new Date()) {
            // Update to expired
            await db
              .update(invitations)
              .set({ status: "expired" })
              .where(eq(invitations.id, existingInvitation[0].id));
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

        const newInvitation = await db.insert(invitations).values({
          email: input.email,
          token,
          role: input.role,
          name: input.name,
          createdBy: ctx.user.id,
          status: "pending",
          expiresAt,
        }).returning();

        // Send invitation email
        const inviteLink = `${process.env.VITE_OAUTH_PORTAL_URL || "http://localhost:5173"}/accept-invite/${token}`;

        // Convert role to display format
        const roleDisplay = ctx.user.role === "head_of_department" ? "Department Head" :
          ctx.user.role === "head_of_finance" ? "Finance" :
            ctx.user.role === "ceo_md" ? "CEO/MD" :
              ctx.user.role.charAt(0).toUpperCase() + ctx.user.role.slice(1);

        const emailData = emailTemplates.userInvitationEmail(
          input.name,
          input.email,
          inviteLink,
          roleDisplay
        );

        try {
          await sendEmail(input.email, emailData.subject, emailData.html);
        } catch (emailError) {
          console.error("Failed to send invitation email:", emailError);
          // Don't fail the API call if email fails
        }

        return {
          success: true,
          invitationId: newInvitation[0].id,
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
      if (!ctx.user || !["admin", "hr"].includes(ctx.user.role)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins and HR can view invitations",
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const allInvitations = await db
        .select()
        .from(invitations)
        .where(eq(invitations.status, "pending"));

      // Separate active and expired
      const now = new Date();
      const active = allInvitations.filter(inv => inv.expiresAt > now);
      const expired = allInvitations.filter(inv => inv.expiresAt <= now);

      // Update expired statuses in DB
      for (const expiredInv of expired) {
        await db
          .update(invitations)
          .set({ status: "expired" })
          .where(eq(invitations.id, expiredInv.id));
      }

      return active.map(inv => ({
        id: inv.id,
        email: inv.email,
        name: inv.name,
        role: inv.role,
        createdAt: inv.createdAt,
        expiresAt: inv.expiresAt,
        status: inv.status,
      }));
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
        if (!ctx.user || !["admin", "hr"].includes(ctx.user.role)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins and HR can resend invitations",
          });
        }

        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        const invitation = await db
          .select()
          .from(invitations)
          .where(eq(invitations.id, input.invitationId))
          .limit(1);

        if (!invitation.length) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Invitation not found",
          });
        }

        const inv = invitation[0];

        // Extend expiry by 1 day
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        await db
          .update(invitations)
          .set({
            expiresAt,
            status: "pending",
            updatedAt: new Date(),
          })
          .where(eq(invitations.id, input.invitationId));

        // Resend email
        const inviteLink = `${process.env.VITE_OAUTH_PORTAL_URL || "http://localhost:5173"}/accept-invite/${inv.token}`;

        // Convert role to display format
        const roleDisplay = ctx.user.role === "head_of_department" ? "Department Head" :
          ctx.user.role === "head_of_finance" ? "Finance" :
            ctx.user.role === "ceo_md" ? "CEO/MD" :
              ctx.user.role.charAt(0).toUpperCase() + ctx.user.role.slice(1);

        const emailData = emailTemplates.userInvitationEmail(
          inv.name || "User",
          inv.email,
          inviteLink,
          roleDisplay
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
        if (!ctx.user || !["admin", "hr"].includes(ctx.user.role)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only admins and HR can cancel invitations",
          });
        }

        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        const invitation = await db
          .select()
          .from(invitations)
          .where(eq(invitations.id, input.invitationId))
          .limit(1);

        if (!invitation.length) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Invitation not found",
          });
        }

        await db
          .update(invitations)
          .set({
            status: "expired",
            updatedAt: new Date(),
          })
          .where(eq(invitations.id, input.invitationId));

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
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        // Find invitation by token
        const invitationResult = await db
          .select()
          .from(invitations)
          .where(eq(invitations.token, input.token))
          .limit(1);

        if (!invitationResult.length) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Invalid or expired invitation link",
          });
        }

        const invitation = invitationResult[0];

        // Check if invitation is valid
        if (invitation.status !== "pending") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Invitation has already been ${invitation.status}`,
          });
        }

        if (invitation.expiresAt < new Date()) {
          // Mark as expired
          await db
            .update(invitations)
            .set({ status: "expired" })
            .where(eq(invitations.id, invitation.id));

          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invitation has expired",
          });
        }

        // Check if user already exists
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.email, invitation.email))
          .limit(1);

        if (existingUser.length > 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "User already exists with this email",
          });
        }

        // Hash password
        const bcryptjs = await import("bcryptjs");
        const hashedPassword = await bcryptjs.default.hash(input.password, 10);

        // Create user
        const newUser = await db.insert(users).values({
          openId: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: invitation.name,
          email: invitation.email,
          password: hashedPassword,
          role: invitation.role as any,
          loginMethod: "email",
        }).returning();

        // Mark invitation as accepted
        await db
          .update(invitations)
          .set({
            status: "accepted",
            acceptedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(invitations.id, invitation.id));

        // Send welcome email
        const welcomeEmailData = emailTemplates.welcomeEmail(
          newUser[0].name,
          newUser[0].email
        );

        try {
          await sendEmail(newUser[0].email, welcomeEmailData.subject, welcomeEmailData.html);
        } catch (emailError) {
          console.error("Failed to send welcome email:", emailError);
          // Don't fail the account creation if email fails
        }

        return {
          success: true,
          userId: newUser[0].id,
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
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        const invitationResult = await db
          .select()
          .from(invitations)
          .where(eq(invitations.token, input.token))
          .limit(1);

        if (!invitationResult.length) {
          return { valid: false, message: "Invalid invitation link" };
        }

        const invitation = invitationResult[0];

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
