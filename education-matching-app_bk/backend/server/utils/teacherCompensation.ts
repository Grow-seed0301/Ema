/**
 * Backend-specific copy of teacherCompensation utility.
 * This file is separate from the root-level version to ensure proper module resolution
 * during backend build/deployment with esbuild.
 * 
 * Calculate teacher compensation (報酬) based on lesson rating (評価)
 *
 * @param rating - The rating given by the student (1-5 stars)
 * @returns The compensation amount in yen
 */
export function calculateTeacherCompensation(rating: number): number {
  // Validate rating is within expected range
  if (rating < 1 || rating > 5) {
    throw new Error(
      `Invalid rating: ${rating}. Rating must be between 1 and 5.`,
    );
  }

  if (rating <= 1.9) {
    return 1500;
  } else if (rating <= 2.9) {
    return 2000;
  } else if (rating <= 3.9) {
    return 2500;
  } else if (rating <= 4.9) {
    return 3000;
  } else {
    // rating >= 5.0
    return 3500;
  }
}
