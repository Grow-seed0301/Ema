/**
 * Determine user type based on age
 * @param age - The age in years
 * @returns User type in Japanese: "中学生", "高校生", "大学生", or "社会人"
 */
export function getUserType(age: number): string {
  if (age < 15) return "中学生";
  if (age >= 15 && age < 18) return "高校生";
  if (age >= 18 && age < 23) return "大学生";
  return "社会人";
}
