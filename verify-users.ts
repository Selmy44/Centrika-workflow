import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      password: true,
      role: true,
      staffId: true,
    },
    orderBy: { id: 'asc' }
  });
  
  console.log("📋 Users in Database:");
  users.forEach(u => {
    console.log(`ID: ${u.id}, Email: ${u.email}, Name: ${u.name}, Role: ${u.role}, Staff ID: ${u.staffId}, Password Hash: ${u.password?.substring(0, 20)}...`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
