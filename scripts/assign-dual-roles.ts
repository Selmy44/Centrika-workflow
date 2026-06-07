import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Assigning dual roles to specific staff...');

  // 1. Henry NTAGANZWA (HOD + HR)
  console.log('\nProcessing Henry NTAGANZWA (hntaganzwa@centrika.rw)...');
  const henry = await prisma.user.findFirst({
    where: { email: 'hntaganzwa@centrika.rw' }
  });

  if (henry) {
    const updatedHenry = await prisma.user.update({
      where: { id: henry.id },
      data: {
        role: 'head_of_department',
        additionalRoles: 'hr'
      }
    });
    console.log(`✅ Successfully updated Henry. Base Role: ${updatedHenry.role}, Additional Roles: ${updatedHenry.additionalRoles}`);
  } else {
    console.log('❌ User hntaganzwa@centrika.rw not found in database.');
  }

  // 2. Patrick NDABARASA (HOD + Head of Finance)
  console.log('\nProcessing Patrick NDABARASA (pndabarasa@centrika.rw)...');
  const patrick = await prisma.user.findFirst({
    where: { email: 'pndabarasa@centrika.rw' }
  });

  if (patrick) {
    const updatedPatrick = await prisma.user.update({
      where: { id: patrick.id },
      data: {
        role: 'head_of_department',
        additionalRoles: 'head_of_finance'
      }
    });
    console.log(`✅ Successfully updated Patrick. Base Role: ${updatedPatrick.role}, Additional Roles: ${updatedPatrick.additionalRoles}`);
  } else {
    console.log('❌ User pndabarasa@centrika.rw not found in database.');
  }
}

main()
  .catch(e => {
    console.error('Error executing script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('\nScript finished.');
  });
