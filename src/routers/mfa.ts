import { router, publicProcedure, protectedProcedure } from "../core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import {
  mfaMethods,
  otpTokens,
  magicLinks,
  mfaSessions,
  users,
} from "../../drizzle/schema";
import { eq, and, gt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { generateOtpCode, generateToken, sendOtp, verifyOtp, getUserByEmail } from "../core/otp";
import { sendEmail, emailTemplates } from "../core/email";
import { setMfaSessionInRedis, getMfaSessionFromRedis, deleteMfaSessionFromRedis } from "../core/redis";
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
            message: "User not found",
          });
        }

        const result = await sendOtp(user.id, "email", user.email!);
        if (!result.success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: result.message,
          });
        }

        const template = emailTemplates.otpEmail(user.name || "User", result.code || "");
        await sendEmail(user.email!, template.subject, template.html);

        return {
          success: true,
          message: "OTP sent to your email",
          // In production, remove the code from response
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
        code: z.string().length(6),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const user = await getUserByEmail(input.email);
        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Invalid email or code",
          });
        }

        const result = await verifyOtp(user.id, input.code, "email");
        if (!result.success) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: result.message,
          });
        }

        const token = await new SignJWT({
          userId: user.id,
          email: user.email,
          role: user.role,
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

        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        const token = generateToken(32);
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

        await db.insert(magicLinks).values({
          userId: user.id,
          token,
          expiresAt,
        });

        const magicLink = `${ENV.appUrl}/auth/magic-link?token=${token}`;
        const template = emailTemplates.magicLinkEmail(user.name || "User", magicLink);
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
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        const linkResult = await db
          .select()
          .from(magicLinks)
          .where(
            and(
              eq(magicLinks.token, input.token),
              eq(magicLinks.isUsed, false),
              gt(magicLinks.expiresAt, new Date())
            )
          )
          .limit(1);

        if (linkResult.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Invalid or expired magic link",
          });
        }

        const link = linkResult[0];
        const userResult = await db
          .select()
          .from(users)
          .where(eq(users.id, link.userId))
          .limit(1);

        if (userResult.length === 0) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        const user = userResult[0];

        await db
          .update(magicLinks)
          .set({ isUsed: true, usedAt: new Date() })
          .where(eq(magicLinks.id, link.id));

        const token = await new SignJWT({
          userId: user.id,
          email: user.email,
          role: user.role,
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
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const methods = await db
        .select()
        .from(mfaMethods)
        .where(eq(mfaMethods.userId, ctx.user.id));

      return methods;
    } catch (error) {
      if (error instanceof TRPCError) throw error;
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
      if (!ctx.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const existing = await db
        .select()
        .from(mfaMethods)
        .where(
          and(
            eq(mfaMethods.userId, ctx.user.id),
            eq(mfaMethods.method, "email")
          )
        )
        .limit(1);

      if (existing.length > 0 && existing[0].isVerified) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Email MFA is already set up",
        });
      }

      const result = await sendOtp(ctx.user.id, "email", ctx.user.email!);
      if (!result.success) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: result.message,
        });
      }

      const template = emailTemplates.mfaSetupEmail(ctx.user.name || "User", result.code || "");
      await sendEmail(ctx.user.email!, template.subject, template.html);

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
        if (!ctx.user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Not authenticated",
          });
        }

        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        const verifyResult = await verifyOtp(ctx.user.id, input.code, "email");
        if (!verifyResult.success) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: verifyResult.message,
          });
        }

        const existing = await db
          .select()
          .from(mfaMethods)
          .where(
            and(
              eq(mfaMethods.userId, ctx.user.id),
              eq(mfaMethods.method, "email")
            )
          )
          .limit(1);

        if (existing.length > 0) {
          await db
            .update(mfaMethods)
            .set({
              isVerified: true,
              isEnabled: true,
              updatedAt: new Date(),
            })
            .where(eq(mfaMethods.id, existing[0].id));
        } else {
          await db.insert(mfaMethods).values({
            userId: ctx.user.id,
            method: "email",
            isVerified: true,
            isEnabled: true,
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
        if (!ctx.user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Not authenticated",
          });
        }

        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        await db
          .update(mfaMethods)
          .set({ isEnabled: false, updatedAt: new Date() })
          .where(
            and(
              eq(mfaMethods.userId, ctx.user.id),
              eq(mfaMethods.method, input.method)
            )
          );

        return {
          success: true,
          message: `${input.method} MFA disabled`,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to disable MFA",
        });
      }
    }),

  // ==================== Placeholder for SMS MFA (using Twilio) ====================

  sendSmsMfa: protectedProcedure
    .input(z.object({ phoneNumber: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // TODO: Implement Twilio SMS OTP
      // This is a placeholder for future SMS MFA implementation
      throw new TRPCError({
        code: "NOT_IMPLEMENTED",
        message: "SMS MFA coming soon",
      });
    }),

  // ==================== Placeholder for TOTP (Google Authenticator) ====================

  setupTotp: protectedProcedure.mutation(async ({ ctx }) => {
    // TODO: Implement TOTP setup with QR code
    // This is a placeholder for future TOTP implementation
    throw new TRPCError({
      code: "NOT_IMPLEMENTED",
      message: "TOTP setup coming soon",
    });
  }),
});
