import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { users } from "../../drizzle/schema";
import { sql } from "drizzle-orm";

async function cleanup() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("[Database] DATABASE_URL not set");
    process.exit(1);
  }

  const client = postgres(databaseUrl);
  const db = drizzle(client);
  console.log("[Database] Connected to PostgreSQL");

  // Delete old duplicate entries
  const result = await db.delete(users).where(
    sql`email IN ('doreen.mbabazi@centrika.com', 'patrick.ndabarasa@centrika.com') 
        AND role != 'head_of_department'`
  );

  console.log("✅ Cleanup complete - removed duplicate role entries");
  
  await client.end();
  process.exit(0);
}

cleanup().catch((e) => {
  console.error("Cleanup failed:", e);
  process.exit(1);
});
