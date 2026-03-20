import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const hods = [
    { name: "Gad AGABA", email: "gad@centrika.rw", role: "head_of_department", position: "Head of Tech" },
    { name: "Doreen MBABAZI", email: "doreen@centrika.rw", role: "head_of_department", position: "Head of Administration" },
    { name: "Odilon ISHIMWE", email: "odilon@centrika.rw", role: "head_of_department", position: "Head of Operations" },
    { name: "Patrick NDABARASA", email: "patrick@centrika.rw", role: "head_of_finance", position: "Head of Finance" }
  ];

  for (const hod of hods) {
    // Try to find if user exists by exact name if email isn't exact, or we just upsert by email
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { name: hod.name },
          { email: hod.email }
        ]
      }
    });

    if (existing) {
      console.log(`Updating existing HOD: ${existing.name}`);
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          role: hod.role as any,
          position: hod.position
        }
      });
    } else {
      console.log(`Creating new HOD: ${hod.name}`);
      await prisma.user.create({
        data: {
          name: hod.name,
          email: hod.email,
          password: "password123", // Default password
          role: hod.role as any,
          position: hod.position,
          staffId: `HOD-${Math.floor(Math.random() * 1000)}`,
          openId: `seed-oid-${Math.floor(Math.random() * 100000)}`
        }
      });
    }
  }

  console.log("Successfully seeded HODs.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
