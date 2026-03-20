import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding workflow configurations...");

  // 1. LEAVE REQUEST: Employee → HOD (final). HR & CEO/MD get notified only.
  const leaveWorkflow = await prisma.workflowConfig.upsert({
    where: { id: 1 },
    create: { requestType: "leave", name: "Leave Request Approval", description: "Leave requests are approved by HOD only. HR and CEO/MD are notified.", isActive: true },
    update: { name: "Leave Request Approval", description: "Leave requests are approved by HOD only. HR and CEO/MD are notified.", isActive: true },
  });
  await prisma.workflowStep.deleteMany({ where: { workflowConfigId: leaveWorkflow.id } });
  await prisma.workflowStep.create({
    data: { workflowConfigId: leaveWorkflow.id, stepOrder: 1, stepName: "HOD Approval", roleResponsible: "head_of_department", statusLabel: "Pending HOD Approval", isFinal: true },
  });

  // 2. CAR REQUEST: Employee → HR (final).
  const carWorkflow = await prisma.workflowConfig.upsert({
    where: { id: 2 },
    create: { requestType: "car", name: "Car Request Approval", description: "Car requests go directly to HR for approval.", isActive: true },
    update: { name: "Car Request Approval", description: "Car requests go directly to HR for approval.", isActive: true },
  });
  await prisma.workflowStep.deleteMany({ where: { workflowConfigId: carWorkflow.id } });
  await prisma.workflowStep.create({
    data: { workflowConfigId: carWorkflow.id, stepOrder: 1, stepName: "HR Approval", roleResponsible: "hr", statusLabel: "Pending HR Approval", isFinal: true },
  });

  // 3. EXPENDITURE REQUEST: Employee → HOD → Head of Finance → CEO/MD (final).
  const expWorkflow = await prisma.workflowConfig.upsert({
    where: { id: 3 },
    create: { requestType: "expenditure", name: "Expenditure Request Approval", description: "Expenditure requests go HOD → Head of Finance → CEO/MD.", isActive: true },
    update: { name: "Expenditure Request Approval", description: "Expenditure requests go HOD → Head of Finance → CEO/MD.", isActive: true },
  });
  await prisma.workflowStep.deleteMany({ where: { workflowConfigId: expWorkflow.id } });
  await prisma.workflowStep.createMany({
    data: [
      { workflowConfigId: expWorkflow.id, stepOrder: 1, stepName: "HOD Approval", roleResponsible: "head_of_department", statusLabel: "Pending HOD Approval", isFinal: false },
      { workflowConfigId: expWorkflow.id, stepOrder: 2, stepName: "Head of Finance Approval", roleResponsible: "head_of_finance", statusLabel: "Pending Finance Approval", isFinal: false },
      { workflowConfigId: expWorkflow.id, stepOrder: 3, stepName: "CEO/MD Final Approval", roleResponsible: "ceo_md", statusLabel: "Pending CEO/MD Approval", isFinal: true },
    ],
  });

  // 4. ASSET REQUEST: Employee → HOD → Head of Finance → CEO/MD (final).
  const assetWorkflow = await prisma.workflowConfig.upsert({
    where: { id: 4 },
    create: { requestType: "asset", name: "Asset Request Approval", description: "Asset requests go HOD → Head of Finance → CEO/MD.", isActive: true },
    update: { name: "Asset Request Approval", description: "Asset requests go HOD → Head of Finance → CEO/MD.", isActive: true },
  });
  await prisma.workflowStep.deleteMany({ where: { workflowConfigId: assetWorkflow.id } });
  await prisma.workflowStep.createMany({
    data: [
      { workflowConfigId: assetWorkflow.id, stepOrder: 1, stepName: "HOD Approval", roleResponsible: "head_of_department", statusLabel: "Pending HOD Approval", isFinal: false },
      { workflowConfigId: assetWorkflow.id, stepOrder: 2, stepName: "Head of Finance Approval", roleResponsible: "head_of_finance", statusLabel: "Pending Finance Approval", isFinal: false },
      { workflowConfigId: assetWorkflow.id, stepOrder: 3, stepName: "CEO/MD Final Approval", roleResponsible: "ceo_md", statusLabel: "Pending CEO/MD Approval", isFinal: true },
    ],
  });

  console.log("✅ Workflow configs seeded successfully!");
  console.log("  - Leave: HOD (final)");
  console.log("  - Car: HR (final)");
  console.log("  - Expenditure: HOD → Head of Finance → CEO/MD (final)");
  console.log("  - Asset: HOD → Head of Finance → CEO/MD (final)");
}

main().catch(console.error).finally(() => prisma.$disconnect());
