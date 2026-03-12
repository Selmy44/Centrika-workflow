import postgres from "postgres";

async function run() {
    console.log("Connecting to default postgres database...");
    const sql = postgres("postgres://postgres:1231@localhost:5432/postgres");

    try {
        console.log("Dropping oneportal database if it exists...");
        await sql`DROP DATABASE IF EXISTS oneportal WITH (FORCE);`;

        console.log("Creating fresh oneportal database...");
        await sql`CREATE DATABASE oneportal;`;

        console.log("Database reset successfully.");
    } catch (error) {
        console.error("Failed to reset database:", error);
    } finally {
        await sql.end();
    }
}

run();
