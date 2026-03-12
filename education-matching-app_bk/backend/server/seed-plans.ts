import { db } from "./db";
import { plans } from "../shared/schema";
import { eq } from "drizzle-orm";

interface PlanSeedData {
  id: string;
  name: string;
  nameEn?: string;
  description?: string;
  price: string;
  totalLessons: number;
  durationDays: number;
  features: string[];
  isActive: boolean;
  sortOrder: number;
}

const plansData: PlanSeedData[] = [
  {
    id: 'light',
    name: 'ライトプラン',
    nameEn: 'Light Plan',
    description: '気軽に始められる基本プラン',
    price: '19800',
    totalLessons: 3,
    durationDays: 30,
    features: ['月3回レッスン'],
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'standard',
    name: 'スタンダードプラン',
    nameEn: 'Standard Plan',
    description: '最も人気のあるバランスプラン',
    price: '27500',
    totalLessons: 5,
    durationDays: 30,
    features: ['月5回レッスン'],
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 'premium',
    name: 'プレミアムプラン',
    nameEn: 'Premium Plan',
    description: '充実のサポート付きプラン',
    price: '35200',
    totalLessons: 6,
    durationDays: 30,
    features: ['月6回レッスン', '月1回教師レポート作成'],
    isActive: true,
    sortOrder: 3,
  },
];

async function seedPlans() {
  console.log("🌱 Seeding plans...");

  try {
    for (const planData of plansData) {
      // Check if plan already exists
      const existingPlan = await db
        .select()
        .from(plans)
        .where(eq(plans.id, planData.id))
        .limit(1);

      if (existingPlan.length > 0) {
        console.log(`⏭️  Plan "${planData.name}" already exists, skipping...`);
      } else {
        await db.insert(plans).values(planData);
        console.log(`✅ Created plan: ${planData.name} (${planData.nameEn})`);
      }
    }

    console.log("✅ Plans seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding plans:", error);
    throw error;
  }
}

// Run the seed function
seedPlans()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to seed plans:", error);
    process.exit(1);
  });
