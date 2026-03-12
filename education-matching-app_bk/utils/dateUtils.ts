/**
 * Get day of week in Japanese
 * @param date Date object
 * @returns Japanese day name (e.g., "月曜日", "火曜日")
 */
export function getDayOfWeek(date: Date): string {
  const days = [
    "日曜日",
    "月曜日",
    "火曜日",
    "水曜日",
    "木曜日",
    "金曜日",
    "土曜日",
  ];
  return days[date.getDay()];
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
