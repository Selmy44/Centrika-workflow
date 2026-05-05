import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash("Rwanda@123", 10);
  
  const users = await prisma.user.findMany();
  
  console.log("🔄 Updating all user passwords to 'Rwanda@123'...\n");
  
  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });
    console.log(`✅ Updated: ${user.email} (${user.name}) - Role: ${user.role}`);
  }
  
  console.log("\n🎉 All passwords updated successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
