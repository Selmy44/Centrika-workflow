import "dotenv/config";
import { getDb } from "../src/db";
import { users } from "../../drizzle/schema";
import bcrypt from "bcryptjs";
import crypto from "crypto";

async function seedUsers() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    process.exit(1);
  }

  const seedUsers = [
    {
      email: "snshuti@centrika.rw",
      name: "Selmy Nshuti",
      password: "Centrika@2024",
      role: "admin" as const,
    },
    {
      email: "tngassa@centrika.rw",
      name: "Théophile NGASSA",
      password: "Centrika@2024",
      role: "ceo_md" as const,
    },
    {
      email: "employee1@centrika.rw",
      name: "John Employee",
      password: "Centrika@2024",
      role: "user" as const,
    },
  ];

  console.log("Seeding users...");

  for (const user of seedUsers) {
    try {
      // Check if user already exists
      const existingUsers = await db
        .select()
        .from(users)
        .where((u) => u.email === user.email);

      if (existingUsers && existingUsers.length > 0) {
        console.log(`✓ User ${user.email} already exists`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const openId = `email-${crypto.randomBytes(16).toString("hex")}`;

      // Insert user
      await db.insert(users).values({
        openId,
        email: user.email,
        name: user.name,
        password: hashedPassword,
        loginMethod: "email",
        role: user.role,
        lastSignedIn: new Date(),
      });

      console.log(`✓ Created user: ${user.email} (${user.role})`);
    } catch (error) {
      console.error(`✗ Error creating user ${user.email}:`, error);
    }
  }

  console.log("✓ Seeding complete!");
  process.exit(0);
}

seedUsers().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
