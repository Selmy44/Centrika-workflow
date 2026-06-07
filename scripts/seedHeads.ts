import "dotenv/config";
import { upsertUser, connectDatabase, prisma } from "../src/db.js";

async function seed() {
  await connectDatabase();
  console.log("[Database] Connected to PostgreSQL for seeding");

  const heads = [
    {
      openId: "seed:henry",
      name: "Henry NTAGANZWA",
      password: "Rwanda@123",
      email: "hntaganzwa@centrika.rw",
      loginMethod: "dev",
      role: "head_of_department" as const,
      additionalRoles: "hr",
      department: "Administration",
      position: "HR Manager",
    },
    {
      openId: "seed:patrick",
      name: "Patrick NDABARASA",
      password: "Rwanda@123",
      email: "pndabarasa@centrika.rw",
      loginMethod: "dev",
      role: "head_of_department" as const,
      additionalRoles: "head_of_finance",
      department: "Finance",
      position: "Head of Finance",
    },
    {
      openId: "seed:gad",
      name: "Gad AGABA",
      password: "Rwanda@123",
      email: "gagaba@centrika.rw",
      loginMethod: "dev",
      role: "head_of_department" as const,
      department: "Technology",
      position: "Head of IT",
    },
    {
      openId: "seed:odilon",
      name: "Odilon TUYISHIME",
      password: "Rwanda@123",
      email: "otuyishime@centrika.rw",
      loginMethod: "dev",
      role: "head_of_department" as const,
      department: "Operations",
      position: "Head of Operations",
    },
    {
      openId: "seed:tresor",
      name: "Tresor NGASSA",
      password: "Rwanda@123",
      email: "tngassa@centrika.rw",
      loginMethod: "dev",
      role: "ceo_md" as const,
      position: "CEO/MD",
    },
    {
      openId: "seed:eric",
      name: "Eric KAMANZI",
      password: "Rwanda@123",
      email: "ekamanzi@centrika.rw",
      loginMethod: "dev",
      role: "ceo_md" as const,
      position: "CEO/MD",
    },
  ];

  for (const h of heads) {
    try {
      await upsertUser(h as any);
      console.log(`✅ Upserted user: ${h.name} (${h.role})`);
    } catch (err) {
      console.error(`❌ Failed to upsert ${h.name}:`, err);
    }
  }

  console.log("Seeding complete.");
  await prisma.$disconnect();
  process.exit(0);
}


seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
