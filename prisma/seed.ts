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
  const hashedPassword = await bcrypt.hash("Rwanda@123", 10);
  const todayDate = getTodayDate();

  const users = [
    {
      email: "snshuti@centrika.rw",
      name: "Selmy Nshuti",
      password: hashedPassword,
      role: "admin",
      status: "Active",
      departmentName: "Tech Engineering",
      staffId: "", // Auto-generate
    },
    {
      email: "hntaganzwa@centrika.rw",
      name: "Henry Ntaganzwa",
      password: hashedPassword,
      role: "head_of_department",
      additionalRoles: "hr",
      status: "Active",
      departmentName: "Administration",
      position: "HR Manager",
      staffId: "", // Auto-generate
    },
    {
      email: "pndabarasa@centrika.rw",
      name: "Patrick Ndabarasa",
      password: hashedPassword,
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
      password: hashedPassword,
      role: "head_of_department",
      status: "Active",
      departmentName: "Tech Engineering",
      position: "Head of IT",
      staffId: "", // Auto-generate
    },
    {
      email: "ehitimana@centrika.rw",
      name: "Ed Hitimana",
      password: hashedPassword,
      role: "user",
      status: "Active",
      departmentName: "Tech Engineering",
      position: "Project Manager",
      staffId: "", // Auto-generate
    },
    {
      email: "msebagabo@centrika.rw",
      name: "Moses Sebagabo",
      password: hashedPassword,
      role: "admin",
      status: "Active",
      departmentName: "Tech Engineering",
      staffId: "", // Auto-generate
    },
    {
      email: "muwamahoro@centrika.rw",
      name: "Munira Uwamahoro",
      password: hashedPassword,
      role: "user",
      status: "Active",
      departmentName: "Tech Engineering",
      position: "QA Engineer",
      staffId: "", // Auto-generate
    },
    {
      email: "otuyishime@centrika.rw",
      name: "Odilon Tuyishime",
      password: hashedPassword,
      role: "head_of_department",
      status: "Active",
      departmentName: "Operations",
      position: "Head of Operations",
      staffId: "", // Auto-generate
    },
    {
      email: "tngassa@centrika.rw",
      name: "Tresor Ngassa",
      password: hashedPassword,
      role: "ceo_md",
      status: "Active",
      departmentName: "Administration",
      position: "CEO/MD",
      staffId: "", // Auto-generate
    },
    {
      email: "ekamanzi@centrika.rw",
      name: "Eric Kamanzi",
      password: hashedPassword,
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

  // 3. Seed Workflow Configurations
  console.log("Syncing WorkflowConfigs to match exact requested routes...");

  // Clear old workflow configs that might be misrouting requests
  await prisma.escalationRule.deleteMany();
  await prisma.workflowStep.deleteMany();
  await prisma.workflowConfig.deleteMany();

  console.log("Cleared old configurations.");

  // Leave: Staff -> HOD
  const leaveWf = await prisma.workflowConfig.create({
    data: { requestType: "leave", name: "Leave Approval", isActive: true }
  });
  await prisma.workflowStep.create({
    data: { workflowConfigId: leaveWf.id, stepOrder: 1, stepName: "HOD Approval", statusLabel: "Pending HOD", roleResponsible: "head_of_department", isFinal: true }
  });
  console.log("Configured Leave workflow.");

  // Car/Transport: Staff -> HR
  const carWf = await prisma.workflowConfig.create({
    data: { requestType: "car", name: "Car Request Approval", isActive: true }
  });
  await prisma.workflowStep.create({
    data: { workflowConfigId: carWf.id, stepOrder: 1, stepName: "HR Approval", statusLabel: "Pending HR", roleResponsible: "hr", isFinal: true }
  });
  console.log("Configured Car workflow.");

  // Expenditure: Staff -> HOD -> Finance -> CEO
  const expWf = await prisma.workflowConfig.create({
    data: { requestType: "expenditure", name: "Expenditure Approval", isActive: true }
  });
  // HOD first
  await prisma.workflowStep.create({
    data: { workflowConfigId: expWf.id, stepOrder: 1, stepName: "HOD Approval", statusLabel: "Pending HOD", roleResponsible: "head_of_department", isFinal: false }
  });
  // Head of Finance (manual escalate or final approve)
  await prisma.workflowStep.create({
    data: { workflowConfigId: expWf.id, stepOrder: 2, stepName: "Finance Approval", statusLabel: "Pending Finance", roleResponsible: "head_of_finance", isFinal: false }
  });
  // CEO (final option)
  await prisma.workflowStep.create({
    data: { workflowConfigId: expWf.id, stepOrder: 3, stepName: "CEO Approval", statusLabel: "Pending CEO", roleResponsible: "ceo_md", isFinal: true }
  });
  console.log("Configured Expenditure workflow.");

  // Asset: Staff -> HOD -> Finance -> CEO
  const assetWf = await prisma.workflowConfig.create({
    data: { requestType: "asset", name: "Asset Approval", isActive: true }
  });
  await prisma.workflowStep.create({
    data: { workflowConfigId: assetWf.id, stepOrder: 1, stepName: "HOD Approval", statusLabel: "Pending HOD", roleResponsible: "head_of_department", isFinal: false }
  });
  await prisma.workflowStep.create({
    data: { workflowConfigId: assetWf.id, stepOrder: 2, stepName: "Finance Approval", statusLabel: "Pending Finance", roleResponsible: "head_of_finance", isFinal: false }
  });
  await prisma.workflowStep.create({
    data: { workflowConfigId: assetWf.id, stepOrder: 3, stepName: "CEO Approval", statusLabel: "Pending CEO", roleResponsible: "ceo_md", isFinal: true }
  });
  console.log("Configured Asset workflow.");

  console.log("Workflows synced successfully!");

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

