import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

// Helper function to get today's date in YYYY-MM-DD format
function getTodayDate(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

async function main() {
  console.log("🌱 Starting seeding...");

  // 1. Seed Departments
  const departments = [
    { name: "Tech Engineering", description: "Software development and engineering" },
    { name: "Administration", description: "Employee management and recruitment" },
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
  const userPassword = await bcrypt.hash("Rwanda@123", 10);
  const newUserPassword = await bcrypt.hash("Rwanda@123", 10);
  const todayDate = getTodayDate();

  const users = [
    {
      email: "snshuti@centrika.rw",
      name: "Selmy Nshuti",
      password: adminPassword,
      role: "admin",
      status: "Active",
      departmentName: "Tech Engineering",
      staffId: "", // Auto-generate
    },
    {
      email: "dmbabazi@centrika.rw",
      name: "Doreen Mbabazi",
      password: userPassword,
      role: "head_of_department",
      additionalRoles: "hr",
      status: "Active",
      departmentName: "Administration",
      staffId: "", // Auto-generate
    },
    {
      email: "pndabarasa@centrika.rw",
      name: "Patrick Ndabarasa",
      password: newUserPassword,
      role: "head_of_department",
      additionalRoles: "head_of_finance",
      status: "Active",
      departmentName: "Finance",
      position: "Head of Finance",
      staffId: "", // Auto-generate
    },
    {
      email: "gagaba@centrika.rw",
      name: "Gad Agaba",
      password: newUserPassword,
      role: "head_of_department",
      status: "Active",
      departmentName: "Tech Engineering",
      position: "Head of IT",
      staffId: "", // Auto-generate
    },
    {
      email: "ehitimana@centrika.rw",
      name: "Ed Hitimana",
      password: newUserPassword,
      role: "user",
      status: "Active",
      departmentName: "Tech Engineering",
      position: "Project Manager",
      staffId: "", // Auto-generate
    },
    {
      email: "msebagabo@centrika.rw",
      name: "Moses Sebagabo",
      password: adminPassword,
      role: "admin",
      status: "Active",
      departmentName: "Tech Engineering",
      staffId: "", // Auto-generate
    },
    {
      email: "muwamahoro@centrika.rw",
      name: "Munira Uwamahoro",
      password: newUserPassword,
      role: "user",
      status: "Active",
      departmentName: "Tech Engineering",
      position: "QA Engineer",
      staffId: "", // Auto-generate
    },
    {
      email: "otuyishime@centrika.rw",
      name: "Odilon Tuyishime",
      password: newUserPassword,
      role: "head_of_department",
      status: "Active",
      departmentName: "Operations",
      position: "Head of Operations",
      staffId: "", // Auto-generate
    },
    {
      email: "tngassa@centrika.rw",
      name: "Tresor Ngassa",
      password: newUserPassword,
      role: "ceo_md",
      status: "Active",
      departmentName: "Administration",
      position: "CEO/MD",
      staffId: "", // Auto-generate
    },
    {
      email: "ekamanzi@centrika.rw",
      name: "Eric Kamanzi",
      password: newUserPassword,
      role: "ceo_md",
      status: "Active",
      departmentName: "Administration",
      position: "CEO/MD",
      staffId: "", // Auto-generate
    },
  ];

  console.log("Seeding users...");
  let userCounter = 1;
  for (const user of users) {
    const dept = createdDepartments.find(d => d.name === user.departmentName);
    const openId = `email-${crypto.createHash('md5').update(user.email).digest('hex')}`;
    
    // Generate staff ID with format: CTK-YYYY-MM-DD NNN
    const staffId = `CTK-${todayDate} ${String(userCounter).padStart(3, '0')}`;
    
    // @ts-ignore - Ignore potential stale types for email unique if prisma hasn't regenerated yet
    await prisma.user.upsert({
      where: { email: user.email } as any,
      update: {
        name: user.name,
        role: user.role as any,
        departmentId: dept?.id,
        position: (user as any).position,
        staffId: staffId,
        additionalRoles: (user as any).additionalRoles,
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
        position: (user as any).position,
        staffId: staffId,
        additionalRoles: (user as any).additionalRoles,
      },
    });
    console.log(`✅ User: ${user.email} (${user.role}) - Staff ID: ${staffId}`);
    userCounter++;
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

