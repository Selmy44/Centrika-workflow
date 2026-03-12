#!/usr/bin/env tsx
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanup() {
  console.log("[Database] Connected to PostgreSQL");

  // Delete old duplicate entries
  const result = await prisma.user.deleteMany({
    where: {
      email: {
        in: ["doreen.mbabazi@centrika.com", "patrick.ndabarasa@centrika.com"],
      },
      role: { not: "head_of_department" },
    },
  });

  console.log(`✅ Cleanup complete - removed ${result.count} duplicate role entries`);

  await prisma.$disconnect();
  process.exit(0);
}

cleanup().catch(async (e) => {
  console.error("Cleanup failed:", e);
  await prisma.$disconnect();
  process.exit(1);
});
