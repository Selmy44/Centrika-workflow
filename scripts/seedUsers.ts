import "dotenv/config";
import { connectDatabase, prisma, upsertUser } from "../src/db.js";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

async function seedUsers() {
  await connectDatabase();

  const seedUsersData = [
    {
      email: "msebagabo@centrika.rw",
      name: "Moses Sebagabo",
      password: "Rwanda@123",
      role: "admin" as const,
      phoneNumber: "+250-788-123-456",
      location: "Kigali, Rwanda",
      status: "Active",
    },
    {
      email: "snshuti@centrika.rw", 
      name: "Selmy Nshuti", 
      password: "Rwanda@123",
      role: "admin" as const,
      phoneNumber: "+250-781-674-354",
      location: "Kigali, Rwanda",
      status: "Active",
      departmentId: 1, // Engineering
    },
    {
      email: "tngassa@centrika.rw",
      name: "Trésor NGASSA",
      password: "Rwanda@123",
      role: "ceo_md" as const,
      phoneNumber: "+250-788-234-567",
      location: "Kigali, Rwanda",
      status: "Active",
      departmentId: 5, // Operations
    },
    {
      email: "ehitimana1@centrika.rw",
      name: "Ed HITIMANA",
      password: "Rwanda@123",
      role: "user" as const,
      phoneNumber: "+250-788-345-678",
      location: "Kigali, Rwanda",
      status: "On Leave",
      departmentId: 3, // Finance
    },
  ];

  console.log("Seeding users...");

  for (const user of seedUsersData) {
    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const openId = `email-${crypto.randomBytes(16).toString("hex")}`;

      // Upsert user
      await upsertUser({
        openId,
        email: user.email,
        name: user.name,
        password: hashedPassword,
        loginMethod: "email",
        role: user.role,
        phoneNumber: user.phoneNumber,
        location: user.location,
        status: user.status,
        departmentId: user.departmentId,
      });

      console.log(`✓ Created/Updated user: ${user.email} (${user.role})`);
    } catch (error) {
      console.error(`✗ Error creating user ${user.email}:`, error);
    }
  }

  console.log("✓ Seeding complete!");
  await prisma.$disconnect();
  process.exit(0);
}

seedUsers().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
