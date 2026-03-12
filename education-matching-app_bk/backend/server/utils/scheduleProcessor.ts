import { parseDateAsLocal, formatDateAsLocalString } from "./dateTime";

interface TimeSlot {
  id?: string;
  startTime: string;
  endTime: string;
  isBooked?: boolean;
}

interface Availability {
  id: string;
  date: Date | string;
  startTime: string | null;
  endTime: string | null;
  isBooked: boolean;
  repeatEnabled: boolean;
  dayOfWeek: string | null;
}

export interface DayScheduleData {
  date: string;
  timeSlots: Array<{
    id: string;
    startTime: string;
    endTime: string;
    isBooked?: boolean;
  }>;
  repeatEnabled: boolean;
  dayOfWeek: string | null;
  hasBookedSlots?: boolean;
  hasAvailableSlots?: boolean;
}

/**
 * Helper function to get day of week in Japanese
 */
function getDayOfWeekJapanese(date: Date): string {
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
 * Process teacher availabilities and convert them into a schedule map organized by day
 * This function handles both regular (one-time) and recurring availabilities
 * 
 * @param availabilities - Array of availability records from the database
 * @param year - The target year
 * @param month - The target month (1-12)
 * @returns A map of schedule data keyed by day of month (1-31)
 */
export function processTeacherSchedule(
  availabilities: Availability[],
  year: number,
  month: number
): Record<string, DayScheduleData> {
  const scheduleMap: Record<string, DayScheduleData> = {};

  // Separate recurring and non-recurring availabilities
  const recurringAvailabilities: Availability[] = [];
  const regularAvailabilities: Availability[] = [];

  availabilities.forEach((avail) => {
    if (avail.repeatEnabled && avail.dayOfWeek) {
      recurringAvailabilities.push(avail);
    } else {
      regularAvailabilities.push(avail);
    }
  });

  // Process regular (non-recurring) availabilities first
  regularAvailabilities.forEach((avail) => {
    // Parse the date properly to avoid timezone issues
    const availDate = parseDateAsLocal(avail.date);
    const availYear = availDate.getFullYear();
    const availMonth = availDate.getMonth() + 1;

    // Only include records for the requested month
    if (availYear === year && availMonth === month) {
      const dateKey = availDate.getDate().toString();

      if (!scheduleMap[dateKey]) {
        scheduleMap[dateKey] = {
          date: avail.date as string,
          timeSlots: [],
          repeatEnabled: avail.repeatEnabled,
          dayOfWeek: avail.dayOfWeek,
          hasBookedSlots: false,
          hasAvailableSlots: false,
        };
      }

      // Add time slot if start and end times exist
      if (avail.startTime && avail.endTime) {
        scheduleMap[dateKey].timeSlots.push({
          id: avail.id,
          startTime: avail.startTime,
          endTime: avail.endTime,
          isBooked: avail.isBooked,
        });

        // Track booking status
        if (avail.isBooked) {
          scheduleMap[dateKey].hasBookedSlots = true;
        } else {
          scheduleMap[dateKey].hasAvailableSlots = true;
        }
      }
    }
  });

  // Process recurring availabilities - generate entries for all matching days in the month
  recurringAvailabilities.forEach((avail) => {
    const targetDayOfWeek = avail.dayOfWeek;
    if (!targetDayOfWeek) return;

    // Find all days in the requested month that match the dayOfWeek
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month - 1, day);
      const currentDayOfWeek = getDayOfWeekJapanese(currentDate);

      // If this day matches the recurring schedule's day of week
      if (currentDayOfWeek === targetDayOfWeek) {
        const dateKey = day.toString();

        // Only add recurring schedule if there's no explicit schedule for this date already
        // This ensures that one-time schedule changes override recurring patterns
        if (!scheduleMap[dateKey]) {
          scheduleMap[dateKey] = {
            date: formatDateAsLocalString(currentDate),
            timeSlots: [],
            repeatEnabled: true,
            dayOfWeek: avail.dayOfWeek,
            hasBookedSlots: false,
            hasAvailableSlots: false,
          };
        }

        // Add time slot if start and end times exist
        if (avail.startTime && avail.endTime) {
          // Generate unique ID for this recurring time slot instance
          const uniqueSlotId = `${avail.id}_${formatDateAsLocalString(currentDate)}`;
          scheduleMap[dateKey].timeSlots.push({
            id: uniqueSlotId,
            startTime: avail.startTime,
            endTime: avail.endTime,
            isBooked: false, // Recurring slots are never pre-booked
          });
          scheduleMap[dateKey].hasAvailableSlots = true;
        }
      }
    }
  });

  return scheduleMap;
}
