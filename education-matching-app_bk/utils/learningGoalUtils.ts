/**
 * Utility functions for parsing and handling learning goal data
 */

export interface LearningGoalData {
  grade?: string;
  subjects?: string[];
  subjectGroups?: Record<string, string[]>;
  goal?: string;
  style?: string;
}

/**
 * Parse learning goal text (JSON string or plain text) into structured data
 * @param learningGoalText - The learning goal text from user profile
 * @returns Parsed learning goal data with defaults
 */
export function parseLearningGoalText(
  learningGoalText?: string | null
): LearningGoalData {
  if (!learningGoalText) {
    return {};
  }

  try {
    const parsed = JSON.parse(learningGoalText);
    
    // Validate that parsed result is a plain object (not null, array, or other types)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      console.warn('Parsed learningGoalText is not a valid object, treating as plain text');
      return { goal: learningGoalText };
    }
    
    // Validate and sanitize each property to prevent prototype pollution
    const isValidSubjectGroups = 
      parsed.subjectGroups && 
      typeof parsed.subjectGroups === 'object' && 
      !Array.isArray(parsed.subjectGroups);
    
    return {
      grade: typeof parsed.grade === 'string' ? parsed.grade : undefined,
      subjects: Array.isArray(parsed.subjects) ? parsed.subjects : undefined,
      subjectGroups: isValidSubjectGroups ? parsed.subjectGroups : undefined,
      goal: typeof parsed.goal === 'string' ? parsed.goal : undefined,
      style: typeof parsed.style === 'string' ? parsed.style : undefined,
    };
  } catch (e) {
    // If parsing fails, treat as plain text goal (backward compatibility)
    // Only log a sanitized message to avoid exposing sensitive information
    const errorMessage = e instanceof Error ? e.message : 'Unknown parsing error';
    console.warn('Failed to parse learningGoalText as JSON:', errorMessage);
    return {
      goal: learningGoalText,
    };
  }
}

/**
 * Get student grade with fallback
 * @param learningGoalText - The learning goal text from user profile
 * @param fallback - Fallback value if grade is not found (default: "未設定")
 * @returns The student grade or fallback
 */
export function getStudentGrade(
  learningGoalText?: string | null,
  fallback: string = "未設定"
): string {
  const data = parseLearningGoalText(learningGoalText);
  return data.grade || fallback;
}

/**
 * Get learning goal text with fallback
 * @param learningGoalText - The learning goal text from user profile
 * @param fallback - Fallback value if goal is not found (default: "未設定")
 * @returns The learning goal or fallback
 */
export function getLearningGoal(
  learningGoalText?: string | null,
  fallback: string = "未設定"
): string {
  const data = parseLearningGoalText(learningGoalText);
  return data.goal || fallback;
}
