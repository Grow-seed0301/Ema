import type { Express } from "express";
import { storage } from "../../storage";
import { isAuthenticated } from "../../auth";
import { sendSuccess, sendError } from "../../utils/apiResponse";
import { parseDateAsLocal, formatDateAsLocalString } from "../../utils/dateTime";
import { processTeacherSchedule, type DayScheduleData } from "../../utils/scheduleProcessor";

// TimeSlot interface for POST request body
interface TimeSlot {
  id?: string;
  startTime: string;
  endTime: string;
}

/**
 * Register teacher schedule routes
 */
export function registerTeacherScheduleRoutes(app: Express): void {
  /**
   * @swagger
   * /teacher/schedule:
   *   get:
   *     summary: Get teacher schedule
   *     description: Get the teacher's availability schedule for a specific month
   *     tags: [Teachers]
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: query
   *         name: year
   *         schema:
   *           type: integer
   *         description: Year (e.g., 2024)
   *       - in: query
   *         name: month
   *         schema:
   *           type: integer
   *         description: Month (1-12)
   *     responses:
   *       200:
   *         description: Schedule retrieved successfully
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Failed to retrieve schedule
   */
  app.get("/api/teacher/schedule", isAuthenticated, async (req, res) => {
    try {
      const userId = req.userId || req.session.userId!;
      
      // Validate and parse year parameter
      const yearParam = req.query.year as string | undefined;
      const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();
      if (isNaN(year) || year < 2000 || year > 2100) {
        return sendError(
          res,
          "Invalid year parameter. Must be between 2000 and 2100",
          "VALIDATION_ERROR",
          400
        );
      }
      
      // Validate and parse month parameter
      const monthParam = req.query.month as string | undefined;
      const month = monthParam ? parseInt(monthParam) : new Date().getMonth() + 1;
      if (isNaN(month) || month < 1 || month > 12) {
        return sendError(
          res,
          "Invalid month parameter. Must be between 1 and 12",
          "VALIDATION_ERROR",
          400
        );
      }

      const teacher = await storage.getTeacher(userId);
      if (!teacher) {
        return sendError(res, "Teacher not found", "USER_NOT_FOUND", 404);
      }

      // Get all availability records for the teacher
      const availabilities = await storage.getTeacherAvailability(userId);

      // Process availabilities into schedule map
      const scheduleMap = processTeacherSchedule(availabilities, year, month);

      sendSuccess(res, {
        schedule: scheduleMap,
        year,
        month,
      });
    } catch (error) {
      console.error("Error retrieving schedule:", error);
      sendError(res, "Failed to retrieve schedule", "FETCH_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /teacher/schedule:
   *   post:
   *     summary: Save teacher schedule
   *     description: Save or update the teacher's availability schedule
   *     tags: [Teachers]
   *     security:
   *       - sessionAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               date:
   *                 type: string
   *                 format: date-time
   *               timeSlots:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                     startTime:
   *                       type: string
   *                     endTime:
   *                       type: string
   *               dayStatuses:
   *                 type: object
   *               repeatEnabled:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Schedule saved successfully
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Failed to save schedule
   */
  app.post("/api/teacher/schedule", isAuthenticated, async (req, res) => {
    try {
      const userId = req.userId || req.session.userId!;
      const {
        date,
        timeSlots,
        dayStatuses,
        repeatEnabled,
        dayOfWeek,
      } = req.body;

      if (!date) {
        return sendError(
          res,
          "Date is required",
          "VALIDATION_ERROR",
          400
        );
      }

      // Validate time slots structure if provided
      if (timeSlots && Array.isArray(timeSlots) && timeSlots.length > 0) {
        for (const slot of timeSlots) {
          if (!slot.startTime || !slot.endTime) {
            return sendError(
              res,
              "Each time slot must have startTime and endTime",
              "VALIDATION_ERROR",
              400
            );
          }
        }
      }

      const teacher = await storage.getTeacher(userId);
      if (!teacher) {
        return sendError(res, "Teacher not found", "USER_NOT_FOUND", 404);
      }

      // Save schedule data to the teacherAvailability table
      // Parse the date string (YYYY-MM-DD) as local date to avoid timezone issues
      const scheduleDate = parseDateAsLocal(date);

      // First, delete any existing availability for the same date using bulk delete
      await storage.deleteTeacherAvailabilityByDate(userId, scheduleDate);

      // Then, create new availability records based on timeSlots
      // Note: Availability is now determined solely by the presence of time slots.
      // If time slots exist, the day is available. If no time slots exist, the day is unavailable.
      let availabilityRecords;

      if (timeSlots && Array.isArray(timeSlots) && timeSlots.length > 0) {
        // Create records for each time slot
        availabilityRecords = timeSlots.map((slot: TimeSlot) => ({
          teacherId: userId,
          date: scheduleDate,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isBooked: false,
          repeatEnabled: repeatEnabled || false,
          dayOfWeek: dayOfWeek || null,
        }));
      } else {
        // If no time slots, don't create any records (day is unavailable)
        availabilityRecords = [];
      }

      if (availabilityRecords.length > 0) {
        await storage.createTeacherAvailabilityBulk(availabilityRecords);
      }

      sendSuccess(res, {
        message: "Schedule saved successfully",
        schedule: {
          date,
          timeSlots: timeSlots || [],
          dayStatuses,
          repeatEnabled,
          dayOfWeek,
        },
      });
    } catch (error) {
      console.error("Error saving schedule:", error);
      sendError(res, "Failed to save schedule", "SAVE_FAILED", 500);
    }
  });
}
