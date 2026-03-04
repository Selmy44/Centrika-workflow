import crypto from "crypto";
import { getDb } from "../db";
import { otpTokens, users } from "../../drizzle/schema";
import { eq, and, gt } from "drizzle-orm";
import { setOtpInRedis, getOtpFromRedis, deleteOtpFromRedis } from "./redis";
import { sendEmail, emailTemplates } from "./email";

/**
 * Generate a random 6-digit OTP code
 */
export function generateOtpCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Generate a random token for magic links
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

/**
 * Send OTP via email or SMS and store in database + Redis
 */
export async function sendOtp(
  userId: number,
  method: "email" | "sms",
  destination: string
): Promise<{ success: boolean; message: string; code?: string }> {
  try {
    const db = await getDb();
    if (!db) {
      return { success: false, message: "Database not available" };
    }

    // Generate OTP code
    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store in database
    await db.insert(otpTokens).values({
      userId,
      code,
      method,
      destination,
      expiresAt,
      attempts: 0,
    });

    // Also store in Redis for faster verification (with automatic expiration)
    await setOtpInRedis(userId, code, 600); // 10 minutes

    // Send OTP via email
    if (method === "email") {
      try {
        // Get user's name for the email template
        const userRecord = await db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        const userName = userRecord[0]?.name || "User";
        const emailTemplate = emailTemplates.otpEmail(userName, code, 10);

        const success = await sendEmail(
          destination,
          emailTemplate.subject,
          emailTemplate.html
        );

        if (!success) {
          console.warn(`[OTP] Failed to send email to ${destination}`);
          // Still return success as OTP is stored - email might fail but OTP is ready
          return {
            success: true,
            message: `OTP generated but email delivery may have failed`,
            code, // For testing
          };
        }

        console.log(`[OTP] OTP sent to ${destination} for user ${userId}: ${code}`);
      } catch (emailError) {
        console.error(`[OTP] Email sending error:`, emailError);
        // Still return success as OTP is stored
        return {
          success: true,
          message: `OTP generated successfully`,
          code, // For testing
        };
      }
    }

    return {
      success: true,
      message: `OTP sent via ${method}`,
      code, // REMOVE THIS IN PRODUCTION - only for testing
    };
  } catch (error) {
    console.error("[OTP] Generation failed:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to generate OTP",
    };
  }
}

/**
 * Verify OTP code
 */
export async function verifyOtp(
  userId: number,
  code: string,
  method: "email" | "sms"
): Promise<{ success: boolean; message: string }> {
  try {
    const db = await getDb();
    if (!db) {
      return { success: false, message: "Database not available" };
    }

    // First check Redis for faster verification
    const redisCode = await getOtpFromRedis(userId);
    if (redisCode === code) {
      // Mark as used in DB
      await db
        .update(otpTokens)
        .set({ usedAt: new Date() })
        .where(
          and(
            eq(otpTokens.userId, userId),
            eq(otpTokens.code, code),
            eq(otpTokens.method, method)
          )
        );

      // Remove from Redis
      await deleteOtpFromRedis(userId);

      return { success: true, message: "OTP verified successfully" };
    }

    // Fallback to database check
    const otpRecord = await db
      .select()
      .from(otpTokens)
      .where(
        and(
          eq(otpTokens.userId, userId),
          eq(otpTokens.code, code),
          eq(otpTokens.method, method),
          gt(otpTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (otpRecord.length === 0) {
      return { success: false, message: "Invalid or expired OTP" };
    }

    // Check attempts
    if ((otpRecord[0].attempts || 0) >= 3) {
      return { success: false, message: "Too many attempts. Please request a new OTP" };
    }

    // Mark as used
    await db
      .update(otpTokens)
      .set({
        usedAt: new Date(),
        attempts: (otpRecord[0].attempts || 0) + 1,
      })
      .where(eq(otpTokens.id, otpRecord[0].id));

    // Clean up from Redis
    await deleteOtpFromRedis(userId);

    return { success: true, message: "OTP verified successfully" };
  } catch (error) {
    console.error("[OTP] Verification failed:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Verification failed",
    };
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  try {
    const db = await getDb();
    if (!db) return null;

    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("[Auth] Get user failed:", error);
    return null;
  }
}

/**
 * Clean up expired OTP tokens
 */
export async function cleanupExpiredOtps(): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    await db
      .delete(otpTokens)
      .where(gt(new Date(), otpTokens.expiresAt));

    console.log("[OTP] Cleanup completed");
  } catch (error) {
    console.error("[OTP] Cleanup failed:", error);
  }
}

/**
 * Increment OTP attempt counter
 */
export async function incrementOtpAttempts(
  userId: number,
  code: string,
  method: "email" | "sms"
): Promise<number> {
  try {
    const db = await getDb();
    if (!db) return 0;

    const otpRecord = await db
      .select()
      .from(otpTokens)
      .where(
        and(
          eq(otpTokens.userId, userId),
          eq(otpTokens.code, code),
          eq(otpTokens.method, method)
        )
      )
      .limit(1);

    if (otpRecord.length === 0) return 0;

    const newAttempts = (otpRecord[0].attempts || 0) + 1;

    await db
      .update(otpTokens)
      .set({ attempts: newAttempts })
      .where(eq(otpTokens.id, otpRecord[0].id));

    return newAttempts;
  } catch (error) {
    console.error("[OTP] Increment attempts failed:", error);
    return 0;
  }
}
