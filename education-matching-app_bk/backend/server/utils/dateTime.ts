/**
 * Format a date as a relative time string in Japanese
 * @param date - The date to format (null or undefined returns an empty string)
 * @returns A string like "たった今", "5分前", "2時間前", "昨日", "12/24", or "" if date is null/undefined
 */
export function formatTimeAgo(date: Date | null | undefined): string {
  if (!date) {
    return '';
  }

  const now = new Date();
  const messageTime = new Date(date);
  const diffMs = now.getTime() - messageTime.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return 'たった今';
  } else if (diffMins < 60) {
    return `${diffMins}分前`;
  } else if (diffHours < 24) {
    return `${diffHours}時間前`;
  } else if (diffDays === 1) {
    return '昨日';
  } else {
    return `${messageTime.getMonth() + 1}/${messageTime.getDate()}`;
  }
}

/**
 * Format a date as a detailed relative time string in Japanese (includes weeks and months)
 * @param date - The date to format (null returns "今")
 * @returns A string like "今", "5分前", "2時間前", "3日前", "2週間前", "1ヶ月前"
 */
export function formatDetailedTimeAgo(date: Date | null): string {
  if (!date) return "今";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  
  if (diffMonths > 0) {
    return `${diffMonths}ヶ月前`;
  } else if (diffWeeks > 0) {
    return `${diffWeeks}週間前`;
  } else if (diffDays > 0) {
    return `${diffDays}日前`;
  } else if (diffHours > 0) {
    return `${diffHours}時間前`;
  } else if (diffMins > 0) {
    return `${diffMins}分前`;
  }
  return "今";
}

/**
 * Calculate age from date of birth
 * @param dateOfBirth - The date of birth (null returns 0)
 * @returns The calculated age in years
 */
export function calculateAge(dateOfBirth: Date | null): number {
  if (!dateOfBirth) return 0;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

/**
 * Parse a date string (YYYY-MM-DD) or Date object to a Date object at midnight local time
 * This prevents timezone conversion issues when storing/retrieving dates
 * @param dateInput - Date string in YYYY-MM-DD format or Date object
 * @returns Date object at midnight local time
 * @throws Error if the date string format is invalid
 */
export function parseDateAsLocal(dateInput: string | Date): Date {
  if (dateInput instanceof Date) {
    return dateInput;
  }
  
  // Validate and parse YYYY-MM-DD string as local date
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!datePattern.test(dateInput)) {
    throw new Error(`Invalid date format: ${dateInput}. Expected YYYY-MM-DD format.`);
  }
  
  const [year, month, day] = dateInput.split('-').map(Number);
  
  // Validate date components
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    throw new Error(`Invalid date components in: ${dateInput}`);
  }
  
  if (month < 1 || month > 12) {
    throw new Error(`Invalid month in: ${dateInput}. Month must be between 1 and 12.`);
  }
  
  if (day < 1 || day > 31) {
    throw new Error(`Invalid day in: ${dateInput}. Day must be between 1 and 31.`);
  }
  
  const date = new Date(year, month - 1, day, 0, 0, 0, 0);
  
  // Verify the date is valid (handles cases like Feb 30, Apr 31, etc.)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    throw new Error(`Invalid date: ${dateInput}. The date does not exist.`);
  }
  
  return date;
}

/**
 * Format a date as YYYY-MM-DD string in local timezone
 * This prevents timezone conversion issues when storing/retrieving dates
 * @param date Date object
 * @returns Date string in YYYY-MM-DD format (e.g., "2026-01-20")
 */
export function formatDateAsLocalString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a date as Japanese date string (YYYY年 MM月 DD日)
 * @param date - The date to format
 * @returns A string like "2007年 5月 12日"
 */
export function formatDateAsJapanese(date: Date | null | undefined): string | undefined {
  if (!date) return undefined;
  
  const dateObj = new Date(date);
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth() + 1;
  const day = dateObj.getDate();
  return `${year}年 ${month}月 ${day}日`;
}

/**
 * Format a date as dot-separated date string (YYYY.MM.DD)
 * @param date - The date to format
 * @returns A string like "2023.10.25"
 */
export function formatDateWithDots(date: Date | null | undefined): string {
  if (!date) return "";
  
  const dateObj = new Date(date);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}
