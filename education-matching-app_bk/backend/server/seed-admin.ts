import { db } from "./db";
import { admins } from "@shared/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "./auth";

const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "admin123";
const ADMIN_NAME = "Administrator";

async function seedAdmin() {
  console.log("Checking for existing admin...");
  
  const [existingAdmin] = await db
    .select()
    .from(admins)
    .where(eq(admins.email, ADMIN_EMAIL));

  if (existingAdmin) {
    console.log("Admin already exists.");
    return;
  }

  console.log("Creating admin...");
  const hashedPassword = await hashPassword(ADMIN_PASSWORD);
  
  await db.insert(admins).values({
    email: ADMIN_EMAIL,
    password: hashedPassword,
    name: ADMIN_NAME,
  });

  console.log("Admin created successfully!");
  console.log(`Email: ${ADMIN_EMAIL}`);
  console.log(`Password: ${ADMIN_PASSWORD}`);
}

seedAdmin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error seeding admin:", error);
    process.exit(1);
  });
