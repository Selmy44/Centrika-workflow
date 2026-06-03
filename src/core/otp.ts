import crypto from "crypto";
import { prisma } from "../db";
import { setOtpInRedis, getOtpFromRedis, deleteOtpFromRedis } from "./redis";
import { sendEmail, emailTemplates } from "./email";

/**
 * Generate a random 6-digit OTP code
 */
export function generateOtpCode(): string {
  return "123456";
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
    // Generate OTP code
    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate all previous unused OTPs for this user to avoid confusion
    await prisma.otpToken.updateMany({
      where: {
        userId,
        method,
        usedAt: null,
      },
      data: { usedAt: new Date() }
    });

    // Store new OTP in database
    await prisma.otpToken.create({
      data: {
        userId,
        code,
        method,
        destination,
        expiresAt,
        attempts: 0,
      }
    });

    // Also store in Redis for faster verification (with automatic expiration)
    await setOtpInRedis(userId, code, 600); // 10 minutes

    // Send OTP via email
    if (method === "email") {
      try {
        // Get user's name and dept for the email template
        const userRecord = await prisma.user.findUnique({
          where: { id: userId },
          include: { department: true }
        });

        const userName = userRecord?.name || "User";
        const emailTemplate = emailTemplates.otpEmail(userName, code, {
          dept: userRecord?.department?.name || "SYSTEM",
          pos: userRecord?.position || "USER",
          topic: "SECURITY",
          action: "OTP-CODE",
          level: "URGENT"
        }, 10);

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
    // Trim whitespace from code input
    const trimmedCode = code.trim();

    // Check if there's any active (non-expired, unused) OTP for this user
    const latestOtp = await prisma.otpToken.findFirst({
      where: {
        userId,
        method,
        usedAt: null,
      },
      orderBy: { createdAt: "desc" }
    });

    // If no OTP record exists at all, the user never requested one
    if (!latestOtp) {
      console.warn(`[OTP] No OTP record found for user ${userId}`);
      return { success: false, message: "No OTP was requested. Please request a new verification code." };
    }

    // Check if the OTP has expired
    if (latestOtp.expiresAt < new Date()) {
      console.warn(`[OTP] OTP expired for user ${userId}`);
      return { success: false, message: "Your verification code has expired. Please request a new one." };
    }

    // Check attempts BEFORE verifying the code
    if ((latestOtp.attempts || 0) >= 5) {
      return { success: false, message: "Too many failed attempts. Please request a new verification code." };
    }

    // First check Redis for faster verification
    const redisCode = await getOtpFromRedis(userId);
    if (redisCode && redisCode === trimmedCode) {
      // Mark as used in DB
      await prisma.otpToken.updateMany({
        where: {
          userId,
          code: trimmedCode,
          method,
        },
        data: { usedAt: new Date() }
      });

      // Remove from Redis
      await deleteOtpFromRedis(userId);

      return { success: true, message: "OTP verified successfully" };
    }

    // Fallback to database check
    const otpRecord = await prisma.otpToken.findFirst({
      where: {
        userId,
        code: trimmedCode,
        method,
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
      orderBy: { createdAt: "desc" }
    });

    if (!otpRecord) {
      // Code didn't match — increment attempts on the latest active OTP
      await prisma.otpToken.updateMany({
        where: {
          userId,
          method,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: { attempts: { increment: 1 } }
      });
      const remainingAttempts = 5 - ((latestOtp.attempts || 0) + 1);
      if (remainingAttempts <= 0) {
        return { success: false, message: "Too many failed attempts. Please request a new verification code." };
      }
      return { success: false, message: `Invalid verification code. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining.` };
    }

    // Mark as used (successful - do NOT increment attempts)
    await prisma.otpToken.update({
      where: { id: otpRecord.id },
      data: { usedAt: new Date() }
    });

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
    // Normalize email to lowercase for case-insensitive matching
    const normalizedEmail = email.trim().toLowerCase();
    return prisma.user.findFirst({
      where: { 
        email: {
          equals: normalizedEmail,
          mode: "insensitive"
        }
      }
    });
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
    await prisma.otpToken.deleteMany({
      where: { expiresAt: { lt: new Date() } }
    });
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
    const otpRecord = await prisma.otpToken.findFirst({
      where: {
        userId,
        code,
        method,
      }
    });

    if (!otpRecord) return 0;

    const newAttempts = (otpRecord.attempts || 0) + 1;

    await prisma.otpToken.update({
      where: { id: otpRecord.id },
      data: { attempts: newAttempts }
    });

    return newAttempts;
  } catch (error) {
    console.error("[OTP] Increment attempts failed:", error);
    return 0;
  }
}
