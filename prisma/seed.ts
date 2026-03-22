import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seeding...");

  // 1. Seed Departments
  const departments = [
    { name: "Engineering", description: "Software development and engineering" },
    { name: "Human Resources", description: "Employee management and recruitment" },
    { name: "Finance", description: "Financial planning and accounting" },
    { name: "Sales & Marketing", description: "Revenue generation and brand management" },
    { name: "Operations", description: "Day-to-day business operations" },
    { name: "IT Support", description: "Technical support and infrastructure" },
  ];

  console.log("Seeding departments...");
  const createdDepartments = [];
  for (const dept of departments) {
    const d = await prisma.department.upsert({
      where: { name: dept.name },
      update: {},
      create: dept,
    });
    createdDepartments.push(d);
    console.log(`✅ Department: ${dept.name}`);
  }

  // 2. Seed Initial Users
  const adminPassword = await bcrypt.hash("Rwanda@123", 10);
  const userPassword = await bcrypt.hash("Centrika@2024", 10);

  const users = [
    {
      email: "msebagabo@centrika.rw",
      name: "Moses Sebagabo",
      password: adminPassword,
      role: "admin",
      status: "Active",
      departmentName: "Engineering",
    },
    {
      email: "snshuti@centrika.rw",
      name: "",
      password: adminPassword,
      role: "ceo_md",
      status: "Active",
      departmentName: "Operations",
    },
    {
      email: "sebagabomoses25@gmail.com",
      name: "Devops Moses",
      password: userPassword,
      role: "hr",
      status: "Active",
      departmentName: "Human Resources",
    },
  ];

  console.log("Seeding users...");
  for (const user of users) {
    const dept = createdDepartments.find(d => d.name === user.departmentName);
    const openId = `email-${crypto.createHash('md5').update(user.email).digest('hex')}`;
    
    // @ts-ignore - Ignore potential stale types for email unique if prisma hasn't regenerated yet
    await prisma.user.upsert({
      where: { email: user.email } as any,
      update: {
        role: user.role as any,
        departmentId: dept?.id,
      },
      create: {
        email: user.email,
        name: user.name,
        password: user.password,
        role: user.role as any,
        status: user.status,
        openId: openId,
        loginMethod: "email",
        departmentId: dept?.id,
      },
    });
    console.log(`✅ User: ${user.email} (${user.role})`);
  }

  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
