import "dotenv/config";
import { upsertUser, connectDatabase, prisma } from "../src/db.js";

async function seed() {
  await connectDatabase();
  console.log("[Database] Connected to PostgreSQL for seeding");

  const heads = [
    {
      openId: "seed:doreen",
      name: "Doreen MBABAZI",
      email: "doreen.mbabazi@centrika.com",
      loginMethod: "dev",
      role: "head_of_department" as const,
      department: "Administration",
      position: "Head of Administration",
    },
    {
      openId: "seed:patrick",
      name: "Patrick NDABARASA",
      email: "patrick.ndabarasa@centrika.com",
      loginMethod: "dev",
      role: "head_of_department" as const,
      department: "Finance",
      position: "Head of Finance",
    },
    {
      openId: "seed:gad",
      name: "Gad AGABA",
      email: "gad.agaba@centrika.com",
      loginMethod: "dev",
      role: "head_of_department" as const,
      department: "Technology",
      position: "Head of IT",
    },
    {
      openId: "seed:odilon",
      name: "Odilon TUYISHIME",
      email: "odilon.tuyishime@centrika.com",
      loginMethod: "dev",
      role: "head_of_department" as const,
      department: "Operations",
      position: "Head of Operations",
    },
    {
      openId: "seed:tresor",
      name: "Tresor NGASA",
      email: "tresor.ngasa@centrika.com",
      loginMethod: "dev",
      role: "ceo_md" as const,
      position: "CEO/MD",
    },
    {
      openId: "seed:eric",
      name: "Eric KAMANZI",
      email: "eric.kamanzi@centrika.com",
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
