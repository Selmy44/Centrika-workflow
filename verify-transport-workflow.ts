import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("📋 Transport Request Approval Workflow Verification\n");
  
  // 1. Check workflow config for car requests
  const carWorkflow = await prisma.workflowConfig.findFirst({
    where: { requestType: "car", isActive: true },
    include: { steps: { orderBy: { stepOrder: "asc" } } }
  });
  
  if (carWorkflow) {
    console.log("✅ Car/Transport Workflow Found:");
    console.log(`   Name: ${carWorkflow.name}`);
    console.log(`   Active: ${carWorkflow.isActive}`);
    console.log(`   Approval Steps:`);
    carWorkflow.steps.forEach((step: any) => {
      console.log(`   - Step ${step.stepOrder}: ${step.stepName} (Role: ${step.roleResponsible}, Final: ${step.isFinal})`);
    });
  } else {
    console.log("❌ No car workflow found");
  }
  
  console.log("\n");
  
  // 2. Check HR users (who can approve transport)
  const hrUsers = await prisma.user.findMany({
    where: {
      OR: [
        { role: "hr" },
        { additionalRoles: { contains: "hr" } }
      ]
    },
    select: { id: true, email: true, name: true, role: true, additionalRoles: true }
  });
  
  console.log("✅ HR Users (Can Approve Transport Requests):");
  hrUsers.forEach(user => {
    console.log(`   - ${user.name} (${user.email})`);
    console.log(`     Primary Role: ${user.role}, Additional Roles: ${user.additionalRoles || 'None'}`);
  });
  
  if (hrUsers.length === 0) {
    console.log("   ❌ No HR users found!");
  }
  
  console.log("\n");
  
  // 3. Specifically check Doreen
  const doreen = await prisma.user.findUnique({
    where: { email: "dmbabazi@centrika.rw" },
    select: { id: true, email: true, name: true, role: true, additionalRoles: true }
  });
  
  if (doreen) {
    console.log("✅ Doreen Mbabazi Status:");
    console.log(`   Email: ${doreen.email}`);
    console.log(`   Primary Role: ${doreen.role}`);
    console.log(`   Additional Roles: ${doreen.additionalRoles || 'None'}`);
    
    const isHR = doreen.role === "hr" || (doreen.additionalRoles && doreen.additionalRoles.includes("hr"));
    console.log(`   Can Approve Transport: ${isHR ? '✅ YES' : '❌ NO'}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
