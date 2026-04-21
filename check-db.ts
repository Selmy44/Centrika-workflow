import { prisma } from "./src/db";

async function main() {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`Total users in database: ${users.length}`);
    console.log("\nUsers:");
    users.forEach(u => {
      console.log(`  - ${u.email} (${u.name}) - Role: ${u.role} - Created: ${u.createdAt}`);
    });
    
    // Check specifically for ehitimana
    const ehiti = await prisma.user.findFirst({
      where: { email: { contains: "ehitimana", mode: "insensitive" } }
    });
    
    if (ehiti) {
      console.log(`\nFound ehitimana: ${JSON.stringify(ehiti, null, 2)}`);
    } else {
      console.log("\nNo user with 'ehitimana' found in database");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
