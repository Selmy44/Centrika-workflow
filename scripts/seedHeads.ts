#!/usr/bin/env tsx
import "dotenv/config";
import { getDb } from "../src/db";
import { upsertUser } from "../src/db";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("[Database] DATABASE_URL not set");
    process.exit(1);
  }

  // Create a direct connection for seeding
  const client = postgres(databaseUrl);
  const db = drizzle(client);
  console.log("[Database] Connected to PostgreSQL for seeding");

  const heads = [
    {
      openId: "seed:doreen",
      name: "Doreen MBABAZI",
      email: "doreen.mbabazi@centrika.com",
      loginMethod: "dev",
      role: "head_of_department",
      department: "Administration",
      position: "Head of Administration",
    },
    {
      openId: "seed:patrick",
      name: "Patrick NDABARASA",
      email: "patrick.ndabarasa@centrika.com",
      loginMethod: "dev",
      role: "head_of_department",
      department: "Finance",
      position: "Head of Finance",
    },
    {
      openId: "seed:gad",
      name: "Gad AGABA",
      email: "gad.agaba@centrika.com",
      loginMethod: "dev",
      role: "head_of_department",
      department: "Technology",
      position: "Head of IT",
    },
    {
      openId: "seed:odilon",
      name: "Odilon TUYISHIME",
      email: "odilon.tuyishime@centrika.com",
      loginMethod: "dev",
      role: "head_of_department",
      department: "Operations",
      position: "Head of Operations",
    },
    {
      openId: "seed:tresor",
      name: "Tresor NGASA",
      email: "tresor.ngasa@centrika.com",
      loginMethod: "dev",
      role: "ceo_md",
      position: "CEO/MD",
    },
    {
      openId: "seed:eric",
      name: "Eric KAMANZI",
      email: "eric.kamanzi@centrika.com",
      loginMethod: "dev",
      role: "ceo_md",
      position: "CEO/MD",
    },
  ];

  for (const h of heads) {
    try {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      await upsertUser(h);
      console.log(`✅ Upserted user: ${h.name} (${h.role})`);
    } catch (err) {
      console.error(`❌ Failed to upsert ${h.name}:`, err);
    }
  }

  console.log("Seeding complete.");
  
  // Close the connection
  await client.end();
  process.exit(0);
}


seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
