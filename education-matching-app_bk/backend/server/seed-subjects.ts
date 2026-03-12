import { db } from "./db";
import { subjectCategories, subjects, subjectGroups } from "@shared/schema";
import { eq } from "drizzle-orm";

interface SubjectData {
  name: string;
  description?: string;
  targetElementary?: boolean;
  targetJuniorHigh?: boolean;
  targetHighSchool?: boolean;
  targetUniversityAdult?: boolean;
  isPopular?: boolean;
  groups?: string[];
}

interface CategoryData {
  name: string;
  sortOrder: number;
  subjects: SubjectData[];
}

const categoriesData: CategoryData[] = [
  {
    name: "学習教科",
    sortOrder: 1,
    subjects: [
      {
        name: "英語",
        targetElementary: true,
        targetJuniorHigh: true,
        targetHighSchool: true,
        targetUniversityAdult: true,
        isPopular: true,
        groups: ["文法", "読解", "リスニング", "スピーキング"],
      },
      {
        name: "国語",
        targetElementary: true,
        targetJuniorHigh: true,
        targetHighSchool: true,
        isPopular: true,
        groups: ["現代文", "古文", "漢文", "作文"],
      },
      {
        name: "数学",
        targetElementary: true,
        targetJuniorHigh: true,
        targetHighSchool: true,
        targetUniversityAdult: true,
        isPopular: true,
        groups: ["計算", "代数", "幾何", "統計"],
      },
      {
        name: "理科",
        targetElementary: true,
        targetJuniorHigh: true,
        targetHighSchool: true,
        isPopular: true,
        groups: ["物理", "化学", "生物", "地学"],
      },
      {
        name: "社会",
        targetElementary: true,
        targetJuniorHigh: true,
        targetHighSchool: true,
        isPopular: true,
        groups: ["地理", "歴史", "公民", "現代社会"],
      },
    ],
  },
  {
    name: "ビジネススキル",
    sortOrder: 2,
    subjects: [
      {
        name: "経理",
        targetUniversityAdult: true,
        isPopular: true,
        groups: ["簿記", "会計", "財務諸表の基礎"],
      },
      {
        name: "Webマーケティング",
        targetUniversityAdult: true,
        isPopular: true,
        groups: ["SEO", "SNS運用", "広告運用"],
      },
      {
        name: "投資",
        targetUniversityAdult: true,
        groups: ["株式", "投資信託", "資産運用の基礎知識"],
      },
      {
        name: "一般教養",
        targetUniversityAdult: true,
        groups: ["ビジネスマナー", "経済", "法律の基礎"],
      },
    ],
  },
  {
    name: "プログラミング・IT",
    sortOrder: 3,
    subjects: [
      {
        name: "情報処理",
        targetHighSchool: true,
        targetUniversityAdult: true,
        isPopular: true,
        groups: ["アルゴリズム", "データ構造", "コンピュータサイエンスの基礎"],
      },
      {
        name: "プログラミング言語",
        targetJuniorHigh: true,
        targetHighSchool: true,
        targetUniversityAdult: true,
        isPopular: true,
        groups: ["Python", "JavaScript", "Java", "C++など"],
      },
      {
        name: "ゲーム理論",
        targetHighSchool: true,
        targetUniversityAdult: true,
        groups: ["ゲーム開発の基礎", "Unity", "Unreal Engine"],
      },
    ],
  },
  {
    name: "音楽・クリエイティブ",
    sortOrder: 4,
    subjects: [
      {
        name: "動画編集",
        targetJuniorHigh: true,
        targetHighSchool: true,
        targetUniversityAdult: true,
        isPopular: true,
        groups: ["Premiere Pro", "Final Cut Pro", "After Effects"],
      },
      {
        name: "音楽理論",
        targetElementary: true,
        targetJuniorHigh: true,
        targetHighSchool: true,
        targetUniversityAdult: true,
        groups: ["楽典", "和声", "作曲", "編曲の基礎"],
      },
    ],
  },
  {
    name: "資格対策",
    sortOrder: 5,
    subjects: [
      {
        name: "英検",
        targetElementary: true,
        targetJuniorHigh: true,
        targetHighSchool: true,
        targetUniversityAdult: true,
        isPopular: true,
        groups: ["5級", "4級", "3級", "準2級", "2級", "準1級", "1級"],
      },
      {
        name: "簿記",
        targetHighSchool: true,
        targetUniversityAdult: true,
        isPopular: true,
        groups: ["日商簿記3級", "日商簿記2級"],
      },
      {
        name: "情報処理技術者試験",
        targetHighSchool: true,
        targetUniversityAdult: true,
        groups: ["基本情報", "応用情報"],
      },
      {
        name: "その他",
        targetElementary: true,
        targetJuniorHigh: true,
        targetHighSchool: true,
        targetUniversityAdult: true,
        groups: ["TOEIC", "漢検", "数検など"],
      },
    ],
  },
];

async function seedSubjects() {
  console.log("Starting subject seeding...");

  try {
    // Check if categories already exist
    const existingCategories = await db.select().from(subjectCategories);
    if (existingCategories.length > 0) {
      console.log("Subject categories already exist. Skipping seeding.");
      return;
    }

    for (const categoryData of categoriesData) {
      console.log(`Creating category: ${categoryData.name}`);
      
      // Create category
      const [category] = await db
        .insert(subjectCategories)
        .values({
          name: categoryData.name,
          sortOrder: categoryData.sortOrder,
          isActive: true,
        })
        .returning();

      console.log(`  Category created with ID: ${category.id}`);

      // Create subjects for this category
      for (let i = 0; i < categoryData.subjects.length; i++) {
        const subjectData = categoryData.subjects[i];
        console.log(`  Creating subject: ${subjectData.name}`);

        const [subject] = await db
          .insert(subjects)
          .values({
            categoryId: category.id,
            name: subjectData.name,
            isPopular: subjectData.isPopular || false,
            targetElementary: subjectData.targetElementary || false,
            targetJuniorHigh: subjectData.targetJuniorHigh || false,
            targetHighSchool: subjectData.targetHighSchool || false,
            targetUniversityAdult: subjectData.targetUniversityAdult || false,
            sortOrder: i,
            isActive: true,
          })
          .returning();

        console.log(`    Subject created with ID: ${subject.id}`);

        // Create subject groups if any
        if (subjectData.groups && subjectData.groups.length > 0) {
          for (let j = 0; j < subjectData.groups.length; j++) {
            const groupName = subjectData.groups[j];
            console.log(`    Creating group: ${groupName}`);

            await db.insert(subjectGroups).values({
              subjectId: subject.id,
              name: groupName,
              sortOrder: j,
              isActive: true,
            });
          }
        }
      }
    }

    console.log("\nSubject seeding completed successfully!");
    
    // Print summary
    const totalCategories = await db.select().from(subjectCategories);
    const totalSubjects = await db.select().from(subjects);
    const totalGroups = await db.select().from(subjectGroups);
    
    console.log("\n=== Summary ===");
    console.log(`Total categories: ${totalCategories.length}`);
    console.log(`Total subjects: ${totalSubjects.length}`);
    console.log(`Total groups: ${totalGroups.length}`);
    
  } catch (error) {
    console.error("Error seeding subjects:", error);
    throw error;
  }
}

seedSubjects()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
