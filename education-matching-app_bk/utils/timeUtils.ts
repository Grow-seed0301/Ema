/**
 * Convert time string (HH:mm) to Date object
 * @param timeStr Time string in HH:mm format (e.g., "09:00", "13:30")
 * @returns Date object with the specified time
 */
export function timeStringToDate(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * Convert Date object to time string (HH:mm)
 * @param date Date object
 * @returns Time string in HH:mm format (e.g., "09:00", "13:30")
 */
export function dateToTimeString(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Calculate time until lesson starts and return Japanese text
 * @param dateStr Date string in YYYY-MM-DD format (e.g., "2026-01-20")
 * @param timeStr Time string in HH:mm format (e.g., "09:00", "13:30") or time range format (e.g., "09:00 - 10:00")
 * @returns Japanese text describing time until lesson (e.g., "あと1時間で開始", "あと30分で開始")
 */
export function getTimeUntilLesson(dateStr: string, timeStr: string): string {
  // Extract start time if timeStr is in range format (e.g., "09:00 - 10:00")
  const startTime = timeStr.split(" - ")[0].trim();
  
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = startTime.split(":").map(Number);
  
  const lessonDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
  
  // Check if the date is valid
  if (isNaN(lessonDate.getTime())) {
    return "日時が不正です";
  }
  
  const now = new Date();
  
  const diffMs = lessonDate.getTime() - now.getTime();
  
  // If lesson has already started or passed
  if (diffMs <= 0) {
    return "開始時刻を過ぎています";
  }
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const remainingMinutes = diffMinutes % 60;
  
  // If more than 24 hours away
  if (diffHours >= 24) {
    const diffDays = Math.floor(diffHours / 24);
    return `あと${diffDays}日で開始`;
  }
  
  // If more than 1 hour away
  if (diffHours > 0) {
    if (remainingMinutes > 0) {
      return `あと${diffHours}時間${remainingMinutes}分で開始`;
    }
    return `あと${diffHours}時間で開始`;
  }
  
  // Less than 1 hour
  return `あと${diffMinutes}分で開始`;
}
