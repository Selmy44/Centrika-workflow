import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 CHECKING REQUEST ROUTING LOGIC\n");
  
  // 1. Check if there are any users with HR role
  const hrUsers = await prisma.user.findMany({
    where: {
      OR: [
        { role: "hr" },
        { additionalRoles: { contains: "hr" } }
      ]
    },
    select: { 
      id: true, 
      email: true, 
      name: true, 
      role: true, 
      additionalRoles: true 
    }
  });
  
  console.log("📋 USERS WITH HR ROLE:");
  if (hrUsers.length > 0) {
    hrUsers.forEach(u => {
      console.log(`✅ ${u.name} (${u.email})`);
      console.log(`   Role: ${u.role}, Additional: ${u.additionalRoles || 'None'}`);
    });
  } else {
    console.log("❌ NO USERS WITH HR ROLE FOUND!");
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("📋 ALL USERS IN DATABASE:");
  console.log("=".repeat(60) + "\n");
  
  const allUsers = await prisma.user.findMany({
    select: { 
      id: true, 
      email: true, 
      name: true, 
      role: true, 
      additionalRoles: true 
    },
    orderBy: { id: 'asc' }
  });
  
  allUsers.forEach(u => {
    const roles = [u.role];
    if (u.additionalRoles) {
      roles.push(`+ ${u.additionalRoles}`);
    }
    console.log(`ID: ${u.id} | ${u.name.padEnd(20)} | ${u.email.padEnd(25)} | ${roles.join(', ')}`);
  });
  
  console.log("\n" + "=".repeat(60));
  console.log("🚗 CAR REQUEST ROUTING TEST");
  console.log("=".repeat(60) + "\n");
  
  console.log("When an employee submits a CAR request:");
  console.log("- System looks for user with: role='hr' OR additionalRoles contains 'hr'");
  
  if (hrUsers.length > 0) {
    console.log(`✅ REQUEST WILL ROUTE TO: ${hrUsers[0].name} (${hrUsers[0].email})`);
  } else {
    console.log(`❌ NO HR USER FOUND - REQUEST ROUTING WILL FAIL!`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
