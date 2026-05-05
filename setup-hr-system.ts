import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 SETTING UP HR APPROVAL SYSTEM\n");
  
  console.log("=" .repeat(70));
  console.log("Step 1: Add HR role to Doreen Mbabazi");
  console.log("=" .repeat(70));
  
  const doreen = await prisma.user.update({
    where: { email: "dmbabazi@centrika.rw" },
    data: { additionalRoles: "hr" }
  });
  console.log(`✅ Doreen updated:`);
  console.log(`   Primary Role: ${doreen.role}`);
  console.log(`   Additional Roles: ${doreen.additionalRoles}`);
  
  console.log("\n" + "=" .repeat(70));
  console.log("Step 2: Enable Car Request Workflow (HR Approval)");
  console.log("=" .repeat(70));
  
  // First, clear old configs
  await prisma.escalationRule.deleteMany();
  await prisma.workflowStep.deleteMany();
  await prisma.workflowConfig.deleteMany();
  console.log(`✅ Cleared old workflow configs`);
  
  // Create car workflow
  const carWf = await prisma.workflowConfig.create({
    data: { requestType: "car", name: "Car Request Approval", isActive: true }
  });
  console.log(`✅ Created Car Request Workflow`);
  
  // Add HR approval step
  const step = await prisma.workflowStep.create({
    data: { 
      workflowConfigId: carWf.id, 
      stepOrder: 1, 
      stepName: "HR Approval", 
      statusLabel: "Pending HR", 
      roleResponsible: "hr", 
      isFinal: true 
    }
  });
  console.log(`✅ Added HR Approval Step:`);
  console.log(`   Step: ${step.stepName}`);
  console.log(`   Role: ${step.roleResponsible}`);
  console.log(`   Final: ${step.isFinal}`);
  
  console.log("\n" + "=" .repeat(70));
  console.log("Step 3: Verify Configuration");
  console.log("=" .repeat(70));
  
  const hrUser = await prisma.user.findFirst({
    where: { OR: [{ role: "hr" }, { additionalRoles: { contains: "hr" } }] },
    select: { id: true, name: true, email: true, role: true, additionalRoles: true }
  });
  
  if (hrUser) {
    console.log(`✅ HR User Found: ${hrUser.name}`);
    console.log(`   Email: ${hrUser.email}`);
    console.log(`   Primary Role: ${hrUser.role}`);
    console.log(`   Additional: ${hrUser.additionalRoles}`);
  }
  
  const workflow = await prisma.workflowConfig.findFirst({
    where: { requestType: "car", isActive: true },
    include: { steps: true }
  });
  
  if (workflow) {
    console.log(`✅ Workflow Verified: ${workflow.name}`);
    console.log(`   Type: ${workflow.requestType}`);
    console.log(`   Active: ${workflow.isActive}`);
    console.log(`   Steps: ${workflow.steps.length}`);
  }
  
  console.log("\n" + "=" .repeat(70));
  console.log("✅ SETUP COMPLETE");
  console.log("=" .repeat(70));
  console.log(`\n🚗 Car requests will now route to HR (Doreen Mbabazi)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
