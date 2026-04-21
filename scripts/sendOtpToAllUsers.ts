#!/usr/bin/env tsx
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

import { PrismaClient } from "@prisma/client";
import { sendOtp } from "../src/core/otp";
import { sendEmail, emailTemplates } from "../src/core/email";

const prisma = new PrismaClient();

async function sendOtpToAllUsers() {
  console.log("📧 Starting OTP distribution to all users...\n");

  try {
    // Get all users with emails
    const usersWithEmails = await prisma.user.findMany({
      where: {
        email: { not: null },
      },
      select: { id: true, email: true, name: true },
      orderBy: { id: "asc" },
    });

    console.log(`Found ${usersWithEmails.length} users with emails\n`);

    let successCount = 0;
    let failureCount = 0;
    const failedEmails: Array<{ email: string; reason: string }> = [];

    for (const user of usersWithEmails) {
      try {
        if (!user.email) {
          failureCount++;
          failedEmails.push({
            email: user.email || "unknown",
            reason: "No email found",
          });
          continue;
        }

        console.log(`📤 Processing ${user.email}...`);

        // Generate and send OTP
        const result = await sendOtp(user.id, "email", user.email);
        if (!result.success) {
          throw new Error(result.message);
        }

        // Send email with OTP
        const template = emailTemplates.otpEmail(user.name || "User", result.code || "", {
          dept: "SYSTEM",
          pos: "USER",
          topic: "SECURITY",
          action: "FORCE-OTP-RESET",
          level: "URGENT"
        });
        await sendEmail(user.email, template.subject, template.html);

        console.log(`   ✅ OTP sent successfully (Code: ${result.code})`);
        successCount++;
      } catch (error) {
        failureCount++;
        const errorMsg = error instanceof Error ? error.message : "Unknown error";
        console.log(`   ❌ Failed: ${errorMsg}`);
        failedEmails.push({
          email: user.email || "unknown",
          reason: errorMsg,
        });
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("📊 OTP Distribution Summary");
    console.log("=".repeat(50));
    console.log(`✅ Successful: ${successCount}/${usersWithEmails.length}`);
    console.log(`❌ Failed: ${failureCount}/${usersWithEmails.length}`);

    if (failedEmails.length > 0) {
      console.log("\n⚠️  Failed emails:");
      failedEmails.forEach(({ email, reason }) => {
        console.log(`   - ${email}: ${reason}`);
      });
    }

    console.log("\n🎉 OTP distribution complete!\n");
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error("💥 Script failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

sendOtpToAllUsers();
