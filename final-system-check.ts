import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 FINAL SYSTEM CHECK - Transport Approval Workflow\n");
  
  console.log("=" .repeat(60));
  console.log("1. WORKFLOW CONFIGURATION");
  console.log("=" .repeat(60));
  
  const workflows = await prisma.workflowConfig.findMany({
    where: { isActive: true },
    include: { steps: { orderBy: { stepOrder: "asc" } } }
  });
  
  workflows.forEach(wf => {
    console.log(`\n📋 ${wf.name} (Type: ${wf.requestType})`);
    wf.steps.forEach(step => {
      console.log(`   ├─ Step ${step.stepOrder}: ${step.stepName} (${step.roleResponsible})`);
    });
  });
  
  console.log("\n" + "=" .repeat(60));
  console.log("2. USER ROLES - WHO CAN APPROVE WHAT");
  console.log("=" .repeat(60));
  
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, additionalRoles: true }
  });
  
  const usersByRole: any = {};
  users.forEach(user => {
    const roles = [user.role];
    if (user.additionalRoles) {
      roles.push(...user.additionalRoles.split(","));
    }
    roles.forEach(role => {
      if (!usersByRole[role]) usersByRole[role] = [];
      usersByRole[role].push(user);
    });
  });
  
  Object.entries(usersByRole).forEach(([role, roleUsers]: [string, any]) => {
    console.log(`\n👤 ${role.toUpperCase()}`);
    (roleUsers as any[]).forEach(u => {
      console.log(`   ├─ ${u.name} (${u.email})`);
    });
  });
  
  console.log("\n" + "=" .repeat(60));
  console.log("3. TRANSPORT APPROVAL - SPECIFIC VALIDATION");
  console.log("=" .repeat(60));
  
  const carWf = workflows.find(w => w.requestType === "car");
  if (carWf) {
    const step = carWf.steps[0];
    console.log(`\n✅ Transport Approvers (${step.roleResponsible}):`);
    
    const transportApprovers = await prisma.user.findMany({
      where: {
        OR: [
          { role: "hr" as any },
          { additionalRoles: { contains: "hr" } }
        ]
      },
      select: { id: true, name: true, email: true }
    });
    
    if (transportApprovers.length > 0) {
      transportApprovers.forEach(user => {
        console.log(`   ✅ ${user.name} (${user.email}) - ID: ${user.id}`);
      });
    } else {
      console.log(`   ❌ NO TRANSPORT APPROVERS FOUND!`);
    }
  }
  
  console.log("\n" + "=" .repeat(60));
  console.log("4. DOREEN MBABAZI - SPECIFIC CHECK");
  console.log("=" .repeat(60));
  
  const doreen = users.find(u => u.email === "dmbabazi@centrika.rw");
  if (doreen) {
    console.log(`\n✅ Found: ${doreen.name}`);
    console.log(`   Primary Role: ${doreen.role}`);
    console.log(`   Additional Roles: ${doreen.additionalRoles || "None"}`);
    
    const canApproveCar = doreen.role === "hr" || (doreen.additionalRoles && doreen.additionalRoles.includes("hr"));
    console.log(`   Can Approve Transport: ${canApproveCar ? "✅ YES" : "❌ NO"}`);
    
    const canApproveLeaveDept = doreen.role === "head_of_department" || (doreen.additionalRoles && doreen.additionalRoles.includes("head_of_department"));
    console.log(`   Can Approve Leave (HOD): ${canApproveLeaveDept ? "✅ YES" : "❌ NO"}`);
  } else {
    console.log(`\n❌ Doreen not found!`);
  }
  
  console.log("\n" + "=" .repeat(60));
  console.log("✅ SYSTEM CHECK COMPLETE");
  console.log("=" .repeat(60) + "\n");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
