import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function main() {
  const emails = ["pndabarasa@centrika.rw", "tngassa@centrika.rw"];
  const newPassword = "Rwanda@123";
  
  // Create database connection
  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client);
  
  console.log(`\n🔐 Updating passwords for users...\n`);
  
  for (const email of emails) {
    console.log(`📧 Processing: ${email}`);
    
    // Query user by email
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const user = result.length > 0 ? result[0] : null;
    
    if (user) {
      console.log(`   ✅ User found: ${user.name}`);
      
      // Hash the password using bcrypt (required for login to work)
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update password
      await db
        .update(users)
        .set({
          password: hashedPassword,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));
      
      console.log(`   ✅ Password hashed and updated to: ${newPassword}\n`);
    } else {
      console.log(`   ❌ User not found\n`);
    }
  }
  
  console.log(`✅ All updates complete!`);
  await client.end();
  process.exit(0);
}

main().catch(error => {
  console.error("Error:", error);
  process.exit(1);
});
