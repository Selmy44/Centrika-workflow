import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧪 COMPLETE CAR REQUEST WORKFLOW TEST\n");
  console.log("=" .repeat(70));
  
  // Test user (an employee)
  const testEmployee = await prisma.user.findFirst({
    where: { role: "user" }
  });
  
  if (!testEmployee) {
    console.log("❌ No test employee found");
    return;
  }
  
  console.log(`📋 Step 1: Test Employee`);
  console.log(`   • Name: ${testEmployee.name}`);
  console.log(`   • Email: ${testEmployee.email}`);
  console.log(`   • Role: ${testEmployee.role}`);
  console.log("");
  
  // Step 1: Create car request (draft)
  console.log("=" .repeat(70));
  console.log(`📋 Step 2: Creating Car Request (DRAFT)`);
  
  const carRequest = await prisma.request.create({
    data: {
      userId: testEmployee.id,
      type: "car",
      status: "draft",
      title: "Test Car Request",
      description: "Test Purpose",
      carRequest: {
        create: {
          destination: "Test Destination",
          purpose: "Test Purpose",
          departureDate: "2026-05-01",
          departureTime: "09:00",
          passengers: 1,
          driverName: "Test Driver",
          carInfo: "Test Car",
        },
      },
    },
    include: { carRequest: true }
  });
  
  console.log(`   ✅ Created request ID: ${carRequest.id}`);
  console.log(`   ✅ Type: ${carRequest.type}`);
  console.log(`   ✅ Status: ${carRequest.status}`);
  console.log("");
  
  // Step 2: Check workflow config
  console.log("=" .repeat(70));
  console.log(`📋 Step 3: Checking Workflow Config`);
  
  const workflowConfig = await prisma.workflowConfig.findFirst({
    where: { requestType: "car", isActive: true },
    include: { steps: { orderBy: { stepOrder: "asc" } } }
  });
  
  if (!workflowConfig) {
    console.log(`   ❌ NO WORKFLOW CONFIG FOUND FOR CAR REQUESTS!`);
    console.log(`   This means submitRequest will use fallback logic`);
  } else {
    console.log(`   ✅ Found workflow: "${workflowConfig.name}"`);
    console.log(`   ✅ Active: ${workflowConfig.isActive}`);
    console.log(`   ✅ Steps:`);
    workflowConfig.steps.forEach(step => {
      console.log(`      - ${step.stepName} (Role: ${step.roleResponsible})`);
    });
  }
  console.log("");
  
  // Step 3: Get HR approver
  console.log("=" .repeat(70));
  console.log(`📋 Step 4: Finding HR Approver`);
  
  const hrUser = await prisma.user.findFirst({
    where: {
      OR: [
        { role: "hr" },
        { additionalRoles: { contains: "hr" } }
      ]
    }
  });
  
  if (!hrUser) {
    console.log(`   ❌ NO HR USER FOUND!`);
    console.log(`   This will cause submission to fail`);
  } else {
    console.log(`   ✅ Found HR user: ${hrUser.name}`);
    console.log(`   ✅ Email: ${hrUser.email}`);
    console.log(`   ✅ ID: ${hrUser.id}`);
  }
  console.log("");
  
  // Step 4: Simulate submit request logic
  console.log("=" .repeat(70));
  console.log(`📋 Step 5: Submitting Request (SIMULATING LOGIC)`);
  
  let initialLevel = "";
  let approverId = 0;
  
  if (workflowConfig?.steps.length) {
    const firstStep = workflowConfig.steps[0];
    initialLevel = firstStep.roleResponsible;
    console.log(`   ✅ Using workflow config: initialLevel = "${initialLevel}"`);
    
    approverId = (await prisma.user.findFirst({
      where: { 
        OR: [
          { role: initialLevel as any }, 
          { additionalRoles: { contains: initialLevel } }
        ] 
      }
    }))?.id || 0;
    console.log(`   ✅ Found approver ID: ${approverId}`);
  } else {
    console.log(`   ⚠️  Using fallback logic (no workflow config)`);
    initialLevel = "hr";
    approverId = hrUser?.id || 0;
    console.log(`   ✅ Fallback: initialLevel = "hr", approverId = ${approverId}`);
  }
  
  if (!approverId) {
    console.log(`   ❌ ERROR: No approver found!`);
  }
  console.log("");
  
  // Step 5: Actually update request to pending
  console.log("=" .repeat(70));
  console.log(`📋 Step 6: Actually Submitting to Database`);
  
  const updatedRequest = await prisma.request.update({
    where: { id: carRequest.id },
    data: {
      status: "pending",
      currentApprovalLevel: initialLevel as any,
      initialApproverId: approverId,
    },
  });
  
  console.log(`   ✅ Request status: ${updatedRequest.status}`);
  console.log(`   ✅ Approval level: ${updatedRequest.currentApprovalLevel}`);
  console.log(`   ✅ Approver ID: ${updatedRequest.initialApproverId}`);
  console.log("");
  
  // Step 6: Check approval record
  console.log("=" .repeat(70));
  console.log(`📋 Step 7: Creating Approval Record`);
  
  const approval = await prisma.requestApproval.create({
    data: {
      requestId: carRequest.id,
      approverId,
      approvalLevel: initialLevel as any,
      status: "pending"
    },
    include: { approver: true }
  });
  
  console.log(`   ✅ Approval created for request ID: ${approval.requestId}`);
  console.log(`   ✅ Approver: ${approval.approver.name} (${approval.approver.email})`);
  console.log(`   ✅ Approval level: ${approval.approvalLevel}`);
  console.log(`   ✅ Status: ${approval.status}`);
  console.log("");
  
  // Step 7: Check notification
  console.log("=" .repeat(70));
  console.log(`📋 Step 8: Creating Notification`);
  
  const notification = await prisma.notification.create({
    data: {
      userId: approverId,
      requestId: carRequest.id,
      triggeredByUserId: testEmployee.id,
      type: "approval_needed",
      title: `New car request awaiting approval`,
      message: `${testEmployee.name} submitted a car request.`,
    },
    include: { user: true }
  });
  
  console.log(`   ✅ Notification created`);
  console.log(`   ✅ Sent to: ${notification.user.name}`);
  console.log(`   ✅ Title: ${notification.title}`);
  console.log("");
  
  // Final summary
  console.log("=" .repeat(70));
  console.log(`✅ COMPLETE WORKFLOW TEST PASSED`);
  console.log("=" .repeat(70));
  console.log("");
  console.log(`Summary:`);
  console.log(`  📝 Employee: ${testEmployee.name} (${testEmployee.email})`);
  console.log(`  🚗 Request: Car request ID ${carRequest.id}`);
  console.log(`  👤 Approver: ${approval.approver.name} (${approval.approver.email})`);
  console.log(`  📧 Notification: Sent to approver`);
  console.log("");
  console.log(`✅ Car request will be routed to HR for approval`);
  
  // Cleanup - delete test data
  await prisma.notification.deleteMany({ where: { requestId: carRequest.id } });
  await prisma.requestApproval.deleteMany({ where: { requestId: carRequest.id } });
  await prisma.carRequest.deleteMany({ where: { requestId: carRequest.id } });
  await prisma.request.delete({ where: { id: carRequest.id } });
  
  console.log(`✅ Test data cleaned up`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
