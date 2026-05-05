import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "msebagabo@centrika.rw" }
  });
  
  if (!user) {
    console.log("❌ User not found");
    return;
  }
  
  await prisma.user.delete({
    where: { id: user.id }
  });
  
  console.log(`✅ User deleted: ${user.email} (${user.name})`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
