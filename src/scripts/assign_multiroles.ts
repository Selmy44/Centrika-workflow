import { PrismaClient } from "@prisma/client";
import { parseAdditionalRoles } from "../shared/roles";

const prisma = new PrismaClient();

async function main() {
  console.log("Assigning multiple roles to specific users...");

  // 1. Assign HOD + HR to hntaganzwa@centrika.rw
  const hrUser = await prisma.user.findUnique({ where: { email: "hntaganzwa@centrika.rw" } });
  if (hrUser) {
    await prisma.user.update({
      where: { id: hrUser.id },
      data: {
        role: "head_of_department",
        additionalRoles: "hr"
      }
    });
    console.log("Updated hntaganzwa@centrika.rw to HOD + HR");
  } else {
    console.warn("User hntaganzwa@centrika.rw not found");
  }

  // 2. Assign HOD + Finance to pndabarasa@centrika.rw
  const financeUser = await prisma.user.findUnique({ where: { email: "pndabarasa@centrika.rw" } });
  if (financeUser) {
    await prisma.user.update({
      where: { id: financeUser.id },
      data: {
        role: "head_of_department",
        additionalRoles: "head_of_finance"
      }
    });
    console.log("Updated pndabarasa@centrika.rw to HOD + Head of Finance");
  } else {
    console.warn("User pndabarasa@centrika.rw not found");
  }

  // 3. Assign Admin to snshuti@centrika.rw
  const snshutiUser = await prisma.user.findUnique({ where: { email: "snshuti@centrika.rw" } });
  if (snshutiUser) {
    const additionalRoles = parseAdditionalRoles(snshutiUser.additionalRoles);
    if (!additionalRoles.includes("admin")) {
      additionalRoles.push("admin");
    }
    await prisma.user.update({
      where: { id: snshutiUser.id },
      data: {
        additionalRoles: additionalRoles.join(", ")
      }
    });
    console.log("Updated snshuti@centrika.rw with additional 'admin' role");
  } else {
    console.warn("User snshuti@centrika.rw not found");
  }

  console.log("Done updating multi-roles!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
