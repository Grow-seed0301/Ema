/**
 * Dry-run test for subject seed data structure
 * This script validates the data structure without requiring a database connection
 */

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

function testDataStructure(): boolean {
  console.log("=== Subject Master Data Structure Test ===\n");

  let totalSubjects = 0;
  let totalGroups = 0;
  let popularSubjects = 0;

  for (const category of categoriesData) {
    console.log(`\n📚 Category: ${category.name} (sortOrder: ${category.sortOrder})`);
    console.log(`   Subjects count: ${category.subjects.length}`);

    for (const subject of category.subjects) {
      totalSubjects++;
      if (subject.isPopular) popularSubjects++;
      
      const targets = [];
      if (subject.targetElementary) targets.push("小学生");
      if (subject.targetJuniorHigh) targets.push("中学生");
      if (subject.targetHighSchool) targets.push("高校生");
      if (subject.targetUniversityAdult) targets.push("大学生・社会人");
      
      console.log(`   - ${subject.name}${subject.isPopular ? " ⭐" : ""}`);
      console.log(`     Target: ${targets.join(", ")}`);
      
      if (subject.groups && subject.groups.length > 0) {
        totalGroups += subject.groups.length;
        console.log(`     Groups: ${subject.groups.join(", ")}`);
      }
    }
  }

  console.log("\n=== Summary ===");
  console.log(`Total categories: ${categoriesData.length}`);
  console.log(`Total subjects: ${totalSubjects}`);
  console.log(`Popular subjects: ${popularSubjects}`);
  console.log(`Total groups: ${totalGroups}`);

  console.log("\n=== Validation ===");
  let isValid = true;

  // Check that all categories have names
  for (const category of categoriesData) {
    if (!category.name || category.name.trim() === "") {
      console.error(`❌ Category without name found`);
      isValid = false;
    }

    // Check that all subjects have names
    for (const subject of category.subjects) {
      if (!subject.name || subject.name.trim() === "") {
        console.error(`❌ Subject without name found in category: ${category.name}`);
        isValid = false;
      }

      // Check that at least one target is specified
      const hasTarget = subject.targetElementary || subject.targetJuniorHigh || 
                       subject.targetHighSchool || subject.targetUniversityAdult;
      if (!hasTarget) {
        console.error(`❌ Subject "${subject.name}" has no target audience specified`);
        isValid = false;
      }
    }
  }

  if (isValid) {
    console.log("✅ All data structure validations passed!");
  } else {
    console.log("❌ Some validations failed. Please check the data.");
  }

  console.log("\n=== Test Complete ===\n");
  return isValid;
}

// Run test and exit with appropriate code
const success = testDataStructure();
process.exit(success ? 0 : 1);
