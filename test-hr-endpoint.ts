import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧪 Testing HR User Retrieval Logic\n");
  
  // Simulate what the new listByRole endpoint does
  const hrUsers = await prisma.user.findMany({
    where: {
      OR: [
        { role: "hr" },
        { additionalRoles: { contains: "hr" } }
      ]
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      additionalRoles: true,
    },
    orderBy: { name: "asc" }
  });
  
  console.log("✅ HR Users Found:");
  if (hrUsers.length > 0) {
    hrUsers.forEach(user => {
      console.log(`   • ${user.name} (${user.email}) - ID: ${user.id}`);
    });
  } else {
    console.log("   ❌ No HR users found!");
  }
  
  console.log("\n📋 Frontend will display:");
  if (hrUsers.length > 0) {
    console.log(`   ✅ HR Approver: ${hrUsers[0].name}`);
  } else {
    console.log(`   ⚠️  HR Approver: Assigning...`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
