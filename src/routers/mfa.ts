import { router, publicProcedure, protectedProcedure } from "../core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { prisma } from "../db";
import { generateToken, sendOtp, verifyOtp, getUserByEmail } from "../core/otp";
import { sendEmail, emailTemplates } from "../core/email";
import { getSessionCookieOptions } from "../core/cookies";
import { SignJWT } from "jose";
import { ENV } from "../core/env";
import { COOKIE_NAME } from "../shared/const";

export const mfaRouter = router({
  // ==================== OTP Endpoints ====================

  /**
   * Send OTP to user's email
   * Used during login or MFA setup
   */
  sendEmailOtp: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        purpose: z.enum(["login", "mfa_setup"]),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const user = await getUserByEmail(input.email);
        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "This email address is not registered in our system. Please contact HR to create an account.",
          });
        }

        // sendOtp already sends the email internally - no need to send again
        const result = await sendOtp(user.id, "email", user.email!);
        if (!result.success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: result.message,
          });
        }

        return {
          success: true,
          message: "OTP sent to your email",
          expiresIn: 600, // 10 minutes
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to send OTP",
        });
      }
    }),

  /**
   * Verify OTP code during login
   * Returns a temporary MFA session if verification succeeds
   */
  verifyOtpLogin: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        code: z.string().min(6, "Invalid OTP code"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const user = await getUserByEmail(input.email);
        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "This email address is not registered in our system. Please contact HR to create an account.",
          });
        }

        // Ensure user has an openId
        let userOpenId = user.openId;
        if (!userOpenId) {
          userOpenId = `email-${crypto.randomBytes(16).toString("hex")}`;
          await prisma.user.update({
            where: { id: user.id },
            data: { openId: userOpenId }
          });
        }

        const result = await verifyOtp(user.id, input.code.trim(), "email");
        if (!result.success) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: result.message,
          });
        }

        const token = await new SignJWT({
          openId: userOpenId,
          appId: ENV.appId,
          name: user.name,
        })
          .setProtectedHeader({ alg: "HS256" })
          .setExpirationTime("7d")
          .sign(new TextEncoder().encode(ENV.cookieSecret));

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, cookieOptions);

        return {
          success: true,
          message: "Login successful",
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            openId: user.openId,
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Verification failed",
        });
      }
    }),

  // ==================== Magic Link Endpoints ====================

  /**
   * Send magic link to user's email
   */
  sendMagicLink: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      try {
        const user = await getUserByEmail(input.email);
        if (!user) {
          // Don't reveal if email exists for security
          return {
            success: true,
            message: "If an account exists with this email, a magic link will be sent",
          };
        }

        const token = generateToken(32);
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        await prisma.magicLink.create({
          data: {
            userId: user.id,
            token,
            expiresAt,
          }
        });

        const magicLink = `${ENV.appUrl}/auth/magic-link?token=${token}`;
        const userWithDept = await prisma.user.findUnique({
          where: { id: user.id },
          include: { department: true }
        });

        const template = emailTemplates.magicLinkEmail(user.name || "User", magicLink, {
          dept: userWithDept?.department?.name || "SYSTEM",
          pos: userWithDept?.position || "USER",
          topic: "SECURITY",
          action: "MAGIC-LINK-LOGIN",
          level: "URGENT"
        });
        await sendEmail(user.email!, template.subject, template.html);

        return {
          success: true,
          message: "Magic link sent to your email",
        };
      } catch (error) {
        console.error("[Magic Link] Send failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to send magic link",
        });
      }
    }),

  /**
   * Verify magic link token and log in user
   */
  verifyMagicLink: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        const link = await prisma.magicLink.findFirst({
          where: {
            token: input.token,
            isUsed: false,
            expiresAt: { gt: new Date() }
          },
          include: { user: true }
        });

        if (!link) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid or expired magic link",
          });
        }

        const user = link.user;

        await prisma.magicLink.update({
          where: { id: link.id },
          data: { isUsed: true, usedAt: new Date() }
        });

        const token = await new SignJWT({
          openId: user.openId,
          appId: ENV.appId,
          name: user.name,
        })
          .setProtectedHeader({ alg: "HS256" })
          .setExpirationTime("7d")
          .sign(new TextEncoder().encode(ENV.cookieSecret));

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, cookieOptions);

        return {
          success: true,
          message: "Login successful",
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            openId: user.openId,
          },
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Verification failed",
        });
      }
    }),

  // ==================== MFA Setup & Management ====================

  /**
   * Get user's MFA methods
   */
  getMfaMethods: protectedProcedure.query(async ({ ctx }) => {
    try {
      return prisma.mfaMethodSettings.findMany({
        where: { userId: ctx.user.id }
      });
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch MFA methods",
      });
    }
  }),

  /**
   * Start MFA setup process
   * Sends verification code to email
   */
  setupMfaEmail: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const existing = await prisma.mfaMethodSettings.findFirst({
        where: {
          userId: ctx.user.id,
          method: "email",
          isVerified: true
        }
      });

      if (existing) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Email MFA is already set up",
        });
      }

      // sendOtp already sends the verification email internally — no need to send again
      const result = await sendOtp(ctx.user.id, "email", ctx.user.email!);
      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.message,
        });
      }

      return {
        success: true,
        message: "Verification code sent to your email",
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Failed to setup MFA",
      });
    }
  }),

  /**
   * Complete MFA email setup
   * Verify code and enable email MFA
   */
  completeMfaEmailSetup: protectedProcedure
    .input(z.object({ code: z.string().length(6) }))
    .mutation(async ({ ctx, input }) => {
      try {
        const verifyResult = await verifyOtp(ctx.user.id, input.code, "email");
        if (!verifyResult.success) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: verifyResult.message,
          });
        }

        const existing = await prisma.mfaMethodSettings.findFirst({
          where: {
            userId: ctx.user.id,
            method: "email"
          }
        });

        if (existing) {
          await prisma.mfaMethodSettings.update({
            where: { id: existing.id },
            data: {
              isVerified: true,
              isEnabled: true,
              updatedAt: new Date(),
            }
          });
        } else {
          await prisma.mfaMethodSettings.create({
            data: {
              userId: ctx.user.id,
              method: "email",
              isVerified: true,
              isEnabled: true,
            }
          });
        }

        return {
          success: true,
          message: "Email MFA enabled successfully",
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to complete MFA setup",
        });
      }
    }),

  /**
   * Disable MFA method
   */
  disableMfa: protectedProcedure
    .input(z.object({ method: z.enum(["email", "sms", "totp"]) }))
    .mutation(async ({ ctx, input }) => {
      try {
        await prisma.mfaMethodSettings.updateMany({
          where: {
            userId: ctx.user.id,
            method: input.method
          },
          data: { isEnabled: false, updatedAt: new Date() }
        });

        return {
          success: true,
          message: `${input.method} MFA disabled`,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to disable MFA",
        });
      }
    }),

  sendSmsMfa: protectedProcedure
    .input(z.object({ phoneNumber: z.string() }))
    .mutation(async ({ ctx, input }) => {
      throw new TRPCError({
        code: "NOT_IMPLEMENTED",
        message: "SMS MFA coming soon",
      });
    }),

  setupTotp: protectedProcedure.mutation(async ({ ctx }) => {
    throw new TRPCError({
      code: "NOT_IMPLEMENTED",
      message: "TOTP setup coming soon",
    });
  }),
});
