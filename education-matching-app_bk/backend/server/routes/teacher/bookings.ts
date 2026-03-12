import type { Express } from "express";
import { storage } from "../../storage";
import { isAuthenticated } from "../../auth";
import { sendSuccess, sendError } from "../../utils/apiResponse";
import { calculateAge, formatDateAsJapanese } from "../../utils/dateTime";
import { stripPassword } from "../../utils/password";

/**
 * Register teacher booking-related routes
 */
export function registerTeacherBookingRoutes(app: Express): void {
  /**
   * @swagger
   * /teacher/bookings:
   *   get:
   *     summary: Get teacher bookings
   *     description: Get a list of bookings for the teacher with optional status filter
   *     tags: [Teachers]
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *         description: Filter by booking status (pending, confirmed, completed, cancelled)
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
   *         description: List of teacher bookings
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Failed to fetch bookings
   */
  app.get("/api/teacher/bookings", isAuthenticated, async (req, res) => {
    try {
      const teacherId = req.userId || req.session.userId!;
      const status = req.query.status as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await storage.getTeacherBookings(teacherId, { status, page, limit });

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
          studentId: booking.studentId,
          studentName: booking.student?.name || "Unknown Student",
          studentAvatar: booking.student?.avatarUrl || null,
          avatarColor: booking.student?.avatarColor || "#3B82F6",
          lessonType: booking.lessonType,
          date: formattedDate,
          startTime: booking.startTime,
          endTime: booking.endTime,
          time: `${booking.startTime} 〜 ${booking.endTime}`,
          dayOfWeek,
          format: booking.format || "online",
          status: booking.status || "pending",
          notes: booking.notes || "",
          cancelReason: booking.cancelReason || null,
          hasReview: booking.hasReview || false,
          review: booking.review ? {
            rating: booking.review.rating,
            content: booking.review.content || undefined,
            createdAt: booking.review.createdAt?.toISOString(),
          } : undefined,
          createdAt: booking.createdAt,
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
      console.error("Error fetching teacher bookings:", error);
      sendError(res, "Failed to fetch teacher bookings", "FETCH_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /teacher/bookings/{id}/approve:
   *   post:
   *     summary: Approve a booking request
   *     description: Approve a pending booking request
   *     tags: [Teachers]
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Booking ID
   *     responses:
   *       200:
   *         description: Booking approved successfully
   *       400:
   *         description: Invalid booking or already processed
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Booking not found
   *       500:
   *         description: Failed to approve booking
   */
  app.post("/api/teacher/bookings/:id/approve", isAuthenticated, async (req, res) => {
    try {
      const teacherId = req.userId || req.session.userId!;
      const bookingId = req.params.id;

      // Get the booking to verify it belongs to this teacher and is pending
      const booking = await storage.getBooking(bookingId);

      if (!booking) {
        sendError(res, "Booking not found", "NOT_FOUND", 404);
        return;
      }

      if (booking.teacherId !== teacherId) {
        sendError(res, "Unauthorized to approve this booking", "UNAUTHORIZED", 401);
        return;
      }

      if (booking.status !== "pending") {
        sendError(res, "Booking is not in pending status", "INVALID_STATUS", 400);
        return;
      }

      // Update booking status to confirmed
      const updatedBooking = await storage.updateBookingStatus(bookingId, "confirmed");

      sendSuccess(res, {
        booking: updatedBooking,
        message: "Booking approved successfully",
      });
    } catch (error) {
      console.error("Error approving booking:", error);
      sendError(res, "Failed to approve booking", "UPDATE_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /teacher/bookings/{id}/reject:
   *   post:
   *     summary: Reject a booking request
   *     description: Reject a pending booking request
   *     tags: [Teachers]
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Booking ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               reason:
   *                 type: string
   *                 description: Reason for rejection
   *     responses:
   *       200:
   *         description: Booking rejected successfully
   *       400:
   *         description: Invalid booking or already processed
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Booking not found
   *       500:
   *         description: Failed to reject booking
   */
  app.post("/api/teacher/bookings/:id/reject", isAuthenticated, async (req, res) => {
    try {
      const teacherId = req.userId || req.session.userId!;
      const bookingId = req.params.id;
      const { reason } = req.body;

      // Get the booking to verify it belongs to this teacher and is pending
      const booking = await storage.getBooking(bookingId);

      if (!booking) {
        sendError(res, "Booking not found", "NOT_FOUND", 404);
        return;
      }

      if (booking.teacherId !== teacherId) {
        sendError(res, "Unauthorized to reject this booking", "UNAUTHORIZED", 401);
        return;
      }

      if (booking.status !== "pending") {
        sendError(res, "Booking is not in pending status", "INVALID_STATUS", 400);
        return;
      }

      // Update booking status to cancelled with reason
      const updatedBooking = await storage.updateBookingStatus(bookingId, "cancelled", reason);

      sendSuccess(res, {
        booking: updatedBooking,
        message: "Booking rejected successfully",
      });
    } catch (error) {
      console.error("Error rejecting booking:", error);
      sendError(res, "Failed to reject booking", "UPDATE_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /teacher/students/{studentId}:
   *   get:
   *     summary: Get student details
   *     description: Get detailed profile information for a specific student. Teachers can only view students they have bookings with. Returns the same format as /student/user endpoint.
   *     tags: [Teachers]
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: studentId
   *         required: true
   *         schema:
   *           type: string
   *         description: The student's unique identifier
   *     responses:
   *       200:
   *         description: Student profile details (same format as /student/user)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Access denied - no booking relationship with this student
   *       404:
   *         description: Student not found
   *       500:
   *         description: Failed to fetch student details
   */
  app.get("/api/teacher/students/:studentId", isAuthenticated, async (req, res) => {
    try {
      const teacherId = req.userId || req.session.userId!;
      const { studentId } = req.params;

      // Verify teacher has a booking with this student
      const hasBooking = await storage.hasTeacherStudentBooking(teacherId, studentId);
      
      if (!hasBooking) {
        sendError(res, "Access denied. No booking relationship with this student.", "FORBIDDEN", 403);
        return;
      }

      // Get student details
      const student = await storage.getUser(studentId);

      if (!student) {
        sendError(res, "Student not found", "NOT_FOUND", 404);
        return;
      }

      // Return the same format as /student/user endpoint (full user object without password)
      sendSuccess(res, stripPassword(student));
    } catch (error) {
      console.error("Error fetching student details:", error);
      sendError(res, "Failed to fetch student details", "FETCH_FAILED", 500);
    }
  });
}
