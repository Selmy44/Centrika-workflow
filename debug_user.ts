import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "sebagabomoses25@gmail.com";
  const user = await prisma.user.findFirst({
    where: { email }
  });

  if (!user) {
    console.log(`User not found: ${email}`);
    process.exit(1);
  }

  console.log("User found:");
  console.log(`ID: ${user.id}`);
  console.log(`Email: ${user.email}`);
  console.log(`Password Hash: ${user.password}`);
  
  const testPassword = "Centrika@2024";
  const isValid = await bcrypt.compare(testPassword, user.password || "");
  console.log(`Is password '${testPassword}' valid? ${isValid}`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
