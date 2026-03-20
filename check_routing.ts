import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // 1. Check all requests
  const allReqs = await prisma.request.findMany({
    include: { user: true, approvals: { include: { approver: true } }, leaveRequest: true },
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  console.log(`Total requests in DB: ${allReqs.length}`);
  allReqs.forEach(r => {
    console.log(`\n--- Request #${r.id} ---`);
    console.log(`  Type: ${r.type} | Status: ${r.status} | Level: ${r.currentApprovalLevel}`);
    console.log(`  By: ${r.user.name} (${r.user.email})`);
    console.log(`  InitialApproverId: ${r.initialApproverId}`);
    console.log(`  Leave: ${r.leaveRequest ? `${r.leaveRequest.startDate} - ${r.leaveRequest.endDate}` : 'none'}`);
    console.log(`  Approvals: ${r.approvals.length}`);
    r.approvals.forEach(a => {
      console.log(`    - ${a.approver.name} (${a.approver.email}) [${a.approvalLevel}] => ${a.status}`);
    });
  });

  // 2. Check all notifications
  const notifs = await prisma.notification.findMany({ orderBy: { createdAt: 'desc' }, take: 10 });
  console.log(`\nTotal notifications: ${notifs.length}`);
  notifs.forEach(n => {
    console.log(`  - User ${n.userId}: ${n.title} [${n.type}] read=${n.isRead}`);
  });

  // 3. Check form submissions
  const forms = await prisma.formSubmission.findMany({ take: 10 });
  console.log(`\nTotal form submissions: ${forms.length}`);
  forms.forEach(f => {
    const data = JSON.parse(f.formData);
    console.log(`  - Request ${f.requestId}: employeeName=${data.employeeName}, leaveType=${data.leaveType}, startDate=${data.startDate}`);
  });

  // 4. Check Gad's info
  const gad = await prisma.user.findFirst({ where: { email: 'gagaba@centrika.rw' } });
  console.log(`\nGad: id=${gad?.id}, role=${gad?.role}, additionalRoles=${gad?.additionalRoles}`);
  
  // 5. Check Ed's info
  const ed = await prisma.user.findFirst({ where: { email: 'ehitimana@centrika.rw' } });
  console.log(`Ed: id=${ed?.id}, role=${ed?.role}, managerId=${ed?.managerId}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
