import type { Express } from "express";
import { storage } from "../../storage";
import { isAuthenticated } from "../../auth";
import { sendSuccess, sendError } from "../../utils/apiResponse";

/**
 * Register student booking-related routes
 */
export function registerStudentBookingRoutes(app: Express): void {
  /**
   * @swagger
   * /student/bookings/upcoming:
   *   get:
   *     summary: Get upcoming bookings
   *     description: Get a list of upcoming bookings for the student
   *     tags: [Students]
   *     security:
   *       - sessionAuth: []
   *     responses:
   *       200:
   *         description: List of upcoming bookings
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Failed to fetch upcoming bookings
   */
  app.get("/api/student/bookings/upcoming", isAuthenticated, async (req, res) => {
    try {
      const userId = req.userId || req.session.userId!;
      const bookings = await storage.getUpcomingBookings(userId);

      // Format bookings for API response
      const formattedBookings = bookings.map((booking) => {
        const date = new Date(booking.date);
        const daysOfWeek = ["日", "月", "火", "水", "木", "金", "土"];
        const dayOfWeek = daysOfWeek[date.getDay()];

        return {
          id: booking.id,
          teacherId: booking.teacherId,
          teacherName: booking.teacher?.name || "Unknown Teacher",
          teacherAvatar: booking.teacher?.avatarUrl || null,
          avatarColor: booking.teacher?.avatarColor || "#3B82F6",
          lessonTitle: booking.lessonType,
          date: booking.date.toISOString().split("T")[0],
          time: `${booking.startTime} - ${booking.endTime}`,
          dayOfWeek,
          format: booking.format || "online",
          status: booking.status || "pending",
        };
      });

      sendSuccess(res, formattedBookings);
    } catch (error) {
      console.error("Error fetching upcoming bookings:", error);
      sendError(res, "Failed to fetch upcoming bookings", "FETCH_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /student/bookings/history:
   *   get:
   *     summary: Get booking history
   *     description: Get a list of all bookings for the student
   *     tags: [Students]
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *         description: Filter by booking status (all, pending, confirmed, completed, cancelled)
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *         description: Page number for pagination
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *         description: Number of items per page
   *     responses:
   *       200:
   *         description: List of booking history
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Failed to fetch booking history
   */
  app.get("/api/student/bookings/history", isAuthenticated, async (req, res) => {
    try {
      const userId = req.userId || req.session.userId!;
      const status = req.query.status as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;

      const result = await storage.getBookingHistory(userId, { status, page, limit });

      // Format bookings for API response
      const daysOfWeek = ["日", "月", "火", "水", "木", "金", "土"];
      const formattedBookings = result.bookings.map((booking) => {
        const date = new Date(booking.date);
        const dayOfWeek = daysOfWeek[date.getDay()];
        
        // Format date as YYYY/MM/DD
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const formattedDate = `${year}/${month}/${day}`;

        return {
          id: booking.id,
          teacherId: booking.teacherId,
          teacherName: booking.teacher?.name || "Unknown Teacher",
          teacherAvatar: booking.teacher?.avatarUrl || null,
          avatarColor: booking.teacher?.avatarColor || "#3B82F6",
          lessonTitle: booking.lessonType,
          date: formattedDate,
          time: `${booking.startTime} 〜 ${booking.endTime}`,
          startTime: booking.startTime,
          endTime: booking.endTime,
          dayOfWeek,
          status: booking.status || "pending",
          isCompleted: booking.status === "completed",
          hasReview: booking.hasReview || false,
        };
      });

      const response = {
        bookings: formattedBookings,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(result.total / limit),
          totalItems: result.total,
        },
      };

      sendSuccess(res, response);
    } catch (error) {
      console.error("Error fetching booking history:", error);
      sendError(res, "Failed to fetch booking history", "FETCH_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /student/bookings:
   *   post:
   *     summary: Create a new booking
   *     description: Create a new lesson booking
   *     tags: [Students]
   *     security:
   *       - sessionAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - teacherId
   *               - lessonType
   *               - date
   *               - timeSlot
   *             properties:
   *               teacherId:
   *                 type: string
   *               lessonType:
   *                 type: string
   *               date:
   *                 type: string
   *                 format: date
   *               timeSlot:
   *                 type: string
   *               format:
   *                 type: string
   *     responses:
   *       200:
   *         description: Booking created successfully
   *       400:
   *         description: Invalid request data
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Failed to create booking
   */
  app.post("/api/student/bookings", isAuthenticated, async (req, res) => {
    try {
      const userId = req.userId || req.session.userId!;
      const { teacherId, lessonType, date, timeSlot, format } = req.body;

      // Validate required fields
      if (!teacherId || !lessonType || !date || !timeSlot) {
        sendError(res, "Missing required fields", "VALIDATION_ERROR", 400);
        return;
      }

      // Check if user has remaining lessons
      const userTotalLessons = await storage.getUserTotalLessons(userId);
      
      if (userTotalLessons <= 0) {
        sendError(
          res,
          "残りのレッスン数が不足しています。プランを購入してください。",
          "INSUFFICIENT_LESSONS",
          400
        );
        return;
      }

      // Validate date format and that it's a future date
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        sendError(res, "Invalid date format. Expected YYYY-MM-DD", "VALIDATION_ERROR", 400);
        return;
      }

      // Parse date and validate it's in the future
      const bookingDate = new Date(date);
      if (isNaN(bookingDate.getTime())) {
        sendError(res, "Invalid date", "VALIDATION_ERROR", 400);
        return;
      }

      const now = new Date();
      now.setHours(0, 0, 0, 0); // Reset to start of day for comparison
      if (bookingDate < now) {
        sendError(res, "Booking date must be in the future", "VALIDATION_ERROR", 400);
        return;
      }
      
      // Parse time slot (e.g., "10:00" or "10:00 - 11:00")
      let startTime = timeSlot;
      let endTime = timeSlot;
      
      if (timeSlot.includes('-')) {
        const [start, end] = timeSlot.split('-').map((t: string) => t.trim());
        startTime = start;
        endTime = end;
      } else {
        // If only start time provided, assume 1 hour duration
        const [hours, minutes] = timeSlot.split(':').map((n: string) => parseInt(n, 10));
        const endHour = hours + 1;
        endTime = `${String(endHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      }

      // Get teacher details and validate teacher exists
      const teacher = await storage.getTeacher(teacherId);
      if (!teacher) {
        sendError(res, "Teacher not found", "NOT_FOUND", 404);
        return;
      }

      // Create booking
      const booking = await storage.createBooking({
        studentId: userId,
        teacherId,
        lessonType,
        date: bookingDate,
        startTime,
        endTime,
        format: format || "online",
        price: null,
      });

      // Decrement user's totalLessons (atomic operation)
      try {
        await storage.decrementUserTotalLessons(userId);
      } catch (error) {
        // If decrement fails (e.g., race condition), we should still have the booking
        // but log the error. The booking exists but lesson wasn't decremented.
        console.error("Failed to decrement lessons after booking:", error);
        // Continue to return the booking response
      }

      // Format response
      const daysOfWeek = ["日", "月", "火", "水", "木", "金", "土"];
      const dayOfWeek = daysOfWeek[bookingDate.getDay()];

      const response = {
        id: booking.id,
        teacherId: booking.teacherId,
        teacherName: teacher.name,
        lessonType: booking.lessonType,
        date: booking.date.toISOString().split("T")[0],
        time: `${booking.startTime} - ${booking.endTime}`,
        dayOfWeek,
        format: booking.format,
        status: booking.status,
        price: booking.price ? parseFloat(booking.price) : 0,
        createdAt: booking.createdAt?.toISOString() || new Date().toISOString(),
      };

      sendSuccess(res, response);
    } catch (error) {
      console.error("Error creating booking:", error);
      sendError(res, "Failed to create booking", "CREATE_FAILED", 500);
    }
  });
}
