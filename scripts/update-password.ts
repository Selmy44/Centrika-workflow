#!/usr/bin/env tsx
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const emails = ["pndabarasa@centrika.rw", "tngassa@centrika.rw"];
  const newPassword = "Rwanda@123";

  console.log(`\n🔐 Updating passwords for users...\n`);

  for (const email of emails) {
    console.log(`📧 Processing: ${email}`);

    const user = await prisma.user.findFirst({
      where: { email },
    });

    if (user) {
      console.log(`   ✅ User found: ${user.name}`);

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
        },
      });

      console.log(`   ✅ Password hashed and updated to: ${newPassword}\n`);
    } else {
      console.log(`   ❌ User not found\n`);
    }
  }

  console.log(`✅ All updates complete!`);
  await prisma.$disconnect();
  process.exit(0);
}

main().catch(async (error) => {
  console.error("Error:", error);
  await prisma.$disconnect();
  process.exit(1);
});
