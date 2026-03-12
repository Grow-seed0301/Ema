import { db } from "./db";
import { sql } from "drizzle-orm";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.resolve(__dirname, "..", "migrations");
const MIGRATION_FILE = "0007_add_bank_account_and_transfer_requests.sql";

async function runMigration() {
  try {
    console.log(`Running migration: ${MIGRATION_FILE}`);
    
    const migrationPath = path.join(MIGRATIONS_DIR, MIGRATION_FILE);
    const migrationSQL = await fs.readFile(migrationPath, "utf-8");
    
    // Remove line comments and split by semicolons
    // Note: This simple approach works for our migration which only has line comments
    // For more complex SQL with inline comments or /* */ comments, use a proper SQL parser
    const lines = migrationSQL.split("\n");
    const cleanedSQL = lines
      .filter((line) => !line.trim().startsWith("--"))
      .join("\n");
    
    const statements = cleanedSQL
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    
    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 80)}...`);
      await db.execute(sql.raw(statement));
    }
    
    console.log("✓ Migration completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("✗ Migration failed:", error);
    process.exit(1);
  }
}

runMigration();
