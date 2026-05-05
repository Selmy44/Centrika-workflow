import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 DEBUG: Car Request Submission Logic\n");
  
  // 1. Check workflow config
  const workflowConfig = await prisma.workflowConfig.findFirst({
    where: { requestType: "car", isActive: true },
    include: { steps: { orderBy: { stepOrder: "asc" } } }
  });
  
  console.log("1️⃣  WORKFLOW CONFIG FOR CAR:");
  if (workflowConfig) {
    console.log(`   ✅ Found: ${workflowConfig.name}`);
    console.log(`   Active: ${workflowConfig.isActive}`);
    console.log(`   Steps: ${workflowConfig.steps.length}`);
    workflowConfig.steps.forEach(step => {
      console.log(`   - ${step.stepName} (Role: ${step.roleResponsible})`);
    });
  } else {
    console.log("   ❌ NO WORKFLOW CONFIG FOUND!");
  }
  
  console.log("\n2️⃣  FINDING HR USER:");
  const hrUser = await prisma.user.findFirst({
    where: { 
      OR: [
        { role: "hr" }, 
        { additionalRoles: { contains: "hr" } }
      ] 
    },
    select: { id: true, email: true, name: true }
  });
  
  if (hrUser) {
    console.log(`   ✅ Found HR user: ${hrUser.name} (ID: ${hrUser.id})`);
  } else {
    console.log(`   ❌ NO HR USER FOUND!`);
  }
  
  console.log("\n3️⃣  SIMULATING CAR REQUEST SUBMISSION:");
  console.log("   When employee submits car request:");
  
  // Simulate the logic
  let initialLevel = "";
  let approverId = 0;
  
  if (workflowConfig?.steps.length) {
    const firstStep = workflowConfig.steps[0];
    initialLevel = firstStep.roleResponsible;
    console.log(`   ✓ Found workflow, firstStep role: "${initialLevel}"`);
    
    if (initialLevel === "head_of_department") {
      console.log(`   - Would look for HOD (managerId)`);
      approverId = 0; // No managerId set
    } else {
      console.log(`   - Looking for user with role: "${initialLevel}"`);
      const user = await prisma.user.findFirst({
        where: { 
          OR: [
            { role: initialLevel as any }, 
            { additionalRoles: { contains: initialLevel } }
          ] 
        }
      });
      approverId = user?.id || 0;
      console.log(`   - Found approver ID: ${approverId}`);
    }
  } else {
    console.log(`   ⚠️  No workflow config - using fallback logic`);
    initialLevel = "hr";
    const user = await prisma.user.findFirst({
      where: { 
        OR: [
          { role: "hr" }, 
          { additionalRoles: { contains: "hr" } }
        ] 
      }
    });
    approverId = user?.id || 0;
    console.log(`   - Fallback: Set to HR, approver ID: ${approverId}`);
  }
  
  console.log("\n4️⃣  FINAL RESULT:");
  console.log(`   Approval Level: "${initialLevel}"`);
  console.log(`   Approver ID: ${approverId}`);
  
  if (approverId === 0) {
    console.log("   ❌ PROBLEM: approverId is 0 - NO ONE WILL APPROVE!");
  } else {
    console.log("   ✅ Will be assigned to approver");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
