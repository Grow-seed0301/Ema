import { db } from "./db";
import { faqCategories } from "@shared/schema";
import { eq } from "drizzle-orm";

const defaultCategories = [
  { name: "すべて", sortOrder: 0 },
  { name: "アカウント", sortOrder: 1 },
  { name: "レッスン予約", sortOrder: 2 },
  { name: "料金", sortOrder: 3 },
  { name: "先生の探し方", sortOrder: 4 },
  { name: "トラブル", sortOrder: 5 },
];

async function seedFaqCategories() {
  try {
    console.log("🌱 Seeding FAQ categories...");

    for (const category of defaultCategories) {
      const existing = await db
        .select()
        .from(faqCategories)
        .where(eq(faqCategories.name, category.name))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(faqCategories).values({
          name: category.name,
          sortOrder: category.sortOrder,
          isActive: true,
        });
        console.log(`✅ Created FAQ category: ${category.name}`);
      } else {
        console.log(`⏭️  FAQ category already exists: ${category.name}`);
      }
    }

    console.log("✨ FAQ categories seeding completed!");
  } catch (error) {
    console.error("❌ Error seeding FAQ categories:", error);
    throw error;
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedFaqCategories()
    .then(() => {
      console.log("Seed completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seed failed:", error);
      process.exit(1);
    });
}

export { seedFaqCategories };
