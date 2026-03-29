import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Syncing WorkflowConfigs to match exact requested routes...");

  // 1. Clear old workflow configs that might be misrouting requests
  await prisma.escalationRule.deleteMany();
  await prisma.workflowStep.deleteMany();
  await prisma.workflowConfig.deleteMany();

  console.log("Cleared old configurations.");

  // 2. Leave: Staff -> HOD
  const leaveWf = await prisma.workflowConfig.create({
    data: { requestType: "leave", name: "Leave Approval", isActive: true }
  });
  await prisma.workflowStep.create({
    data: { workflowConfigId: leaveWf.id, stepOrder: 1, stepName: "HOD Approval", statusLabel: "Pending HOD", roleResponsible: "head_of_department", isFinal: true }
  });
  console.log("Configured Leave workflow.");

  // 3. Car/Transport: Staff -> HR
  const carWf = await prisma.workflowConfig.create({
    data: { requestType: "car", name: "Car Request Approval", isActive: true }
  });
  await prisma.workflowStep.create({
    data: { workflowConfigId: carWf.id, stepOrder: 1, stepName: "HR Approval", statusLabel: "Pending HR", roleResponsible: "hr", isFinal: true }
  });
  console.log("Configured Car workflow.");

  // 4. Expenditure: Staff -> HOD -> Finance -> CEO
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

  // 5. Asset: Staff -> HOD -> Finance -> CEO
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
}

main().catch(console.error).finally(() => prisma.$disconnect());
