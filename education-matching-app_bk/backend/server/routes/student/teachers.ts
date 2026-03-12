import type { Express } from "express";
import { storage } from "../../storage";
import { isAuthenticated } from "../../auth";
import { sendSuccess, sendError } from "../../utils/apiResponse";
import { calculateAge, formatDetailedTimeAgo, parseDateAsLocal, formatDateAsLocalString } from "../../utils/dateTime";
import { getUserType } from "../../utils/user";
import { db } from "../../db";
import { favorites } from "@shared/schema";
import { eq } from "drizzle-orm";
import { processTeacherSchedule } from "../../utils/scheduleProcessor";

/**
 * Register student teacher-related routes (search, favorites, reviews)
 */
export function registerStudentTeacherRoutes(app: Express): void {
  /**
   * @swagger
   * /student/teachers/search:
   *   get:
   *     summary: Search teachers
   *     description: Search for teachers with various filters and sorting options
   *     tags: [Students]
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: query
   *         name: q
   *         schema:
   *           type: string
   *         description: Search query (name, email)
   *       - in: query
   *         name: subjects
   *         schema:
   *           type: string
   *         description: Comma-separated subjects to filter by
   *       - in: query
   *         name: subjectGroups
   *         schema:
   *           type: string
   *         description: JSON string of subject groups to filter by (e.g. {"Math":["Algebra","Geometry"]})
   *       - in: query
   *         name: ratingMin
   *         schema:
   *           type: number
   *         description: Minimum rating (0-5)
   *       - in: query
   *         name: gender
   *         schema:
   *           type: string
   *           enum: [male, female, other]
   *         description: Filter by gender
   *       - in: query
   *         name: experienceYears
   *         schema:
   *           type: string
   *           enum: ['0', '1', '3', '5']
   *         description: Filter by teacher experience years (0=<1年, 1=1年以上, 3=3年以上, 5=5年以上)
   *       - in: query
   *         name: sortBy
   *         schema:
   *           type: string
   *           enum: [rating, reviewCount, createdAt]
   *         description: Sort by field
   *       - in: query
   *         name: sortOrder
   *         schema:
   *           type: string
   *           enum: [asc, desc]
   *         description: Sort order
   *       - in: query
   *         name: page
   *         schema:
   *           type: number
   *           default: 1
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: number
   *           default: 20
   *         description: Results per page
   *     responses:
   *       200:
   *         description: Search results
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 teachers:
   *                   type: array
   *                   items:
   *                     type: object
   *                 pagination:
   *                   type: object
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Failed to search teachers
   */
  app.get("/api/student/teachers/search", isAuthenticated, async (req, res) => {
    try {
      const userId = req.userId || req.session.userId!;

      // Parse query parameters
      const q = req.query.q as string | undefined;
      const subjects = req.query.subjects as string | undefined;
      const subjectGroups = req.query.subjectGroups as string | undefined;
      const ratingMin = req.query.ratingMin
        ? parseFloat(req.query.ratingMin as string)
        : undefined;
      const gender = req.query.gender as string | undefined;
      const experienceYears = req.query.experienceYears as string | undefined;
      const sortBy = req.query.sortBy as string | undefined;
      const sortOrder = req.query.sortOrder as string | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      // Search teachers using storage
      const { teachers, total } = await storage.searchTeachers({
        page,
        limit,
        q,
        subjects,
        subjectGroups,
        ratingMin,
        gender,
        experienceYears,
        sortBy,
        sortOrder,
        userId,
      });

      // Get user's favorites
      const userFavorites = await db
        .select()
        .from(favorites)
        .where(eq(favorites.userId, userId));
      const favoriteTeacherIds = new Set(userFavorites.map((f) => f.teacherId));

      // Format response
      const formattedTeachers = teachers.map((teacher) => {
        return {
          id: teacher.id,
          name: teacher.name,
          age: calculateAge(teacher.dateOfBirth),
          avatarUrl: teacher.avatarUrl || null,
          avatarColor: teacher.avatarColor || "#3B82F6",
          specialty: teacher.specialty || "",
          subjects: teacher.subjects || [],
          subjectGroups: teacher.subjectGroups || {},
          rating: teacher.rating ? parseFloat(teacher.rating) : 0,
          reviewCount: teacher.reviewCount || 0,
          totalLessons: teacher.totalLessons || 0,
          favorites: String(teacher.favoriteCount || 0),
          isFavorite: favoriteTeacherIds.has(teacher.id),
          experienceYears: teacher.experienceYears || 0,
        };
      });

      // Calculate pagination
      const totalPages = Math.ceil(total / limit);
      const pagination = {
        currentPage: page,
        totalPages,
        totalItems: total,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      };

      sendSuccess(res, {
        teachers: formattedTeachers,
        pagination,
      });
    } catch (error) {
      console.error("Error searching teachers:", error);
      sendError(res, "Failed to search teachers", "SEARCH_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /student/teachers/recommended:
   *   get:
   *     summary: Get recommended teachers
   *     description: Get a list of recommended teachers for the student
   *     tags: [Students]
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: Number of teachers to return
   *     responses:
   *       200:
   *         description: List of recommended teachers
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Failed to fetch recommended teachers
   */
  app.get(
    "/api/student/teachers/recommended",
    isAuthenticated,
    async (req, res) => {
      try {
        const userId = req.userId || req.session.userId!;
        const limit = parseInt(req.query.limit as string) || 10;

        const teachers = await storage.getRecommendedTeachers(userId, limit);

        // Format teachers for API response
        const formattedTeachers = teachers.map((teacher) => {
          const age = teacher.dateOfBirth
            ? new Date().getFullYear() -
              new Date(teacher.dateOfBirth).getFullYear()
            : 25;

          return {
            id: teacher.id,
            name: teacher.name,
            age,
            avatarUrl: teacher.avatarUrl,
            avatarColor: teacher.avatarColor || "#3B82F6",
            specialty: teacher.specialty || "専門科目",
            subjects: teacher.subjects || [],
            rating: Number(teacher.rating || 0),
            reviewCount: teacher.reviewCount || 0,
            favorites: String(teacher.favoriteCount || 0),
            isFavorite: teacher.isFavorite,
            experienceYears: teacher.experienceYears || 0,
          };
        });

        sendSuccess(res, formattedTeachers);
      } catch (error) {
        console.error("Error fetching recommended teachers:", error);
        sendError(
          res,
          "Failed to fetch recommended teachers",
          "FETCH_FAILED",
          500
        );
      }
    }
  );

  /**
   * @swagger
   * /student/teachers/{teacherId}:
   *   get:
   *     summary: Get teacher details
   *     description: Get detailed information about a specific teacher
   *     tags: [Students]
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: teacherId
   *         required: true
   *         schema:
   *           type: string
   *         description: Teacher ID
   *     responses:
   *       200:
   *         description: Teacher details
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Teacher not found
   *       500:
   *         description: Failed to fetch teacher details
   */
  app.get(
    "/api/student/teachers/:teacherId",
    isAuthenticated,
    async (req, res) => {
      try {
        const userId = req.userId || req.session.userId!;
        const { teacherId } = req.params;

        // Get teacher details
        const teacher = await storage.getTeacher(teacherId);

        if (!teacher) {
          return sendError(res, "Teacher not found", "NOT_FOUND", 404);
        }

        // Check if teacher is in user's favorites
        const userFavorites = await db
          .select()
          .from(favorites)
          .where(eq(favorites.userId, userId));
        const isFavorite = userFavorites.some((f) => f.teacherId === teacherId);

        // Get teacher credentials (qualifications)
        const credentials = await storage.getTeacherCredentials(teacherId);

        // Format teacher details for response
        const teacherDetails = {
          id: teacher.id,
          name: teacher.name,
          age: calculateAge(teacher.dateOfBirth),
          gender: teacher.gender || "other",
          avatarUrl: teacher.avatarUrl || null,
          avatarColor: teacher.avatarColor || "#3B82F6",
          bio: teacher.bio || "",
          specialty: teacher.specialty || "",
          subjects: teacher.subjects || [],
          subjectGroups: teacher.subjectGroups || {},
          rating: teacher.rating ? parseFloat(teacher.rating) : 0,
          reviewCount: teacher.reviewCount || 0,
          totalStudents: teacher.totalStudents || 0,
          totalLessons: teacher.totalLessons || 0,
          isFavorite,
          experience: teacher.experience || "",
          experienceYears: teacher.experienceYears || 0,
          teachingStyles: teacher.teachingStyles || [],
          credentials,
        };

        sendSuccess(res, teacherDetails);
      } catch (error) {
        console.error("Error fetching teacher details:", error);
        sendError(
          res,
          "Failed to fetch teacher details",
          "FETCH_FAILED",
          500
        );
      }
    }
  );

  /**
   * @swagger
   * /student/users/me/favorite-teachers:
   *   get:
   *     summary: Get favorite teachers
   *     description: Get a list of favorite teachers for the current student
   *     tags: [Students]
   *     security:
   *       - sessionAuth: []
   *     responses:
   *       200:
   *         description: List of favorite teachers
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: string
   *                   name:
   *                     type: string
   *                   age:
   *                     type: number
   *                   avatarUrl:
   *                     type: string
   *                   avatarColor:
   *                     type: string
   *                   specialty:
   *                     type: string
   *                   rating:
   *                     type: number
   *                   reviewCount:
   *                     type: number
   *                   favorites:
   *                     type: string
   *                   isFavorite:
   *                     type: boolean
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Failed to fetch favorite teachers
   */
  app.get(
    "/api/student/users/me/favorite-teachers",
    isAuthenticated,
    async (req, res) => {
      try {
        const userId = req.userId || req.session.userId!;

        // Get favorite teachers
        const favoriteTeachers = await storage.getFavoriteTeachers(userId);

        // Format teachers for API response
        const formattedTeachers = favoriteTeachers.map((teacher) => {
          return {
            id: teacher.id,
            name: teacher.name,
            age: calculateAge(teacher.dateOfBirth),
            avatarUrl: teacher.avatarUrl || null,
            avatarColor: teacher.avatarColor || "#3B82F6",
            specialty: teacher.specialty || "",
            rating: teacher.rating ? parseFloat(teacher.rating) : 0,
            reviewCount: teacher.reviewCount || 0,
            favorites: String(teacher.favoriteCount || 0),
            isFavorite: true,
            experienceYears: teacher.experienceYears || 0,
          };
        });

        sendSuccess(res, formattedTeachers);
      } catch (error) {
        console.error("Error fetching favorite teachers:", error);
        sendError(
          res,
          "Failed to fetch favorite teachers",
          "FETCH_FAILED",
          500
        );
      }
    }
  );

  /**
   * @swagger
   * /student/teachers/{teacherId}/favorite:
   *   post:
   *     summary: Toggle favorite teacher
   *     description: Add or remove a teacher from the student's favorite list
   *     tags: [Students]
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: teacherId
   *         required: true
   *         schema:
   *           type: string
   *         description: Teacher ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - isFavorite
   *             properties:
   *               isFavorite:
   *                 type: boolean
   *                 description: true to add to favorites, false to remove
   *     responses:
   *       200:
   *         description: Favorite status updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 isFavorite:
   *                   type: boolean
   *                 totalFavorites:
   *                   type: number
   *       400:
   *         description: Invalid request
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Teacher not found
   *       500:
   *         description: Failed to update favorite status
   */
  app.post(
    "/api/student/teachers/:teacherId/favorite",
    isAuthenticated,
    async (req, res) => {
      try {
        const userId = req.userId || req.session.userId!;
        const { teacherId } = req.params;
        const { isFavorite } = req.body;

        // Validate request body
        if (typeof isFavorite !== "boolean") {
          return sendError(
            res,
            "isFavorite must be a boolean",
            "VALIDATION_ERROR",
            400
          );
        }

        // Check if teacher exists
        const teacher = await storage.getTeacher(teacherId);
        if (!teacher) {
          return sendError(res, "Teacher not found", "TEACHER_NOT_FOUND", 404);
        }

        // Add or remove favorite
        if (isFavorite) {
          await storage.addFavoriteTeacher(userId, teacherId);
        } else {
          await storage.removeFavoriteTeacher(userId, teacherId);
        }

        // Get updated favorite count
        const totalFavorites = await storage.getFavoriteCount(teacherId);

        sendSuccess(res, {
          isFavorite,
          totalFavorites,
        });
      } catch (error) {
        console.error("Error toggling favorite teacher:", error);
        sendError(
          res,
          "Failed to update favorite status",
          "UPDATE_FAILED",
          500
        );
      }
    }
  );

  /**
   * @swagger
   * /student/teachers/{teacherId}/reviews:
   *   get:
   *     summary: Get teacher reviews
   *     description: Get reviews for a specific teacher with stats and pagination
   *     tags: [Students]
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: teacherId
   *         required: true
   *         schema:
   *           type: string
   *         description: Teacher ID
   *       - in: query
   *         name: filter
   *         schema:
   *           type: string
   *           enum: [all, 5, 4, 3, 2, 1]
   *         description: Filter reviews by rating
   *       - in: query
   *         name: page
   *         schema:
   *           type: number
   *           default: 1
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: number
   *           default: 10
   *         description: Results per page
   *     responses:
   *       200:
   *         description: Reviews retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 reviews:
   *                   type: array
   *                   items:
   *                     type: object
   *                 stats:
   *                   type: object
   *                   properties:
   *                     averageRating:
   *                       type: number
   *                     totalReviews:
   *                       type: number
   *                     ratingDistribution:
   *                       type: object
   *                 pagination:
   *                   type: object
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Teacher not found
   *       500:
   *         description: Failed to fetch reviews
   */
  app.get(
    "/api/student/teachers/:teacherId/reviews",
    isAuthenticated,
    async (req, res) => {
      try {
        const { teacherId } = req.params;
        const filter = req.query.filter as string | undefined;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        // Check if teacher exists
        const teacher = await storage.getTeacher(teacherId);
        if (!teacher) {
          return sendError(res, "Teacher not found", "TEACHER_NOT_FOUND", 404);
        }

        // Get reviews with stats
        const { reviews: teacherReviews, stats, total } = await storage.getTeacherReviews(teacherId, {
          filter,
          page,
          limit,
        });

        // Format reviews for API response
        const formattedReviews = teacherReviews.map((review) => {
          const student = review.student;
          const age = calculateAge(student?.dateOfBirth || null);
          // Use stored userType if available, otherwise infer from age
          const userType = review.userType || getUserType(age);

          return {
            id: review.id,
            userId: review.studentId,
            userType,
            gender: student?.gender || "男性",
            avatarColor: student?.avatarColor || "#3B82F6",
            rating: review.rating,
            content: review.content || "",
            createdAt:
              review.createdAt?.toISOString() || new Date().toISOString(),
            timeAgo: formatDetailedTimeAgo(review.createdAt),
          };
        });

        // Calculate pagination
        const totalPages = Math.ceil(total / limit);
        const pagination = {
          currentPage: page,
          totalPages,
          totalItems: total,
        };

        sendSuccess(res, {
          reviews: formattedReviews,
          stats,
          pagination,
        });
      } catch (error) {
        console.error("Error fetching teacher reviews:", error);
        sendError(res, "Failed to fetch reviews", "FETCH_FAILED", 500);
      }
    }
  );

  /**
   * @swagger
   * /student/reviews/latest:
   *   get:
   *     summary: Get latest reviews
   *     description: Get the latest reviews from all users
   *     tags: [Students]
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *         description: Number of reviews to return
   *     responses:
   *       200:
   *         description: List of latest reviews
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Failed to fetch latest reviews
   */
  app.get("/api/student/reviews/latest", isAuthenticated, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const reviews = await storage.getLatestReviews(limit);

      // Format reviews for API response
      const formattedReviews = reviews.map((review) => {
        const createdAt = new Date(review.createdAt!);
        const now = new Date();
        const diffMs = now.getTime() - createdAt.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        let timeAgo = "今";
        if (diffDays > 0) {
          timeAgo = `${diffDays}日前`;
        } else if (diffHours > 0) {
          timeAgo = `${diffHours}時間前`;
        } else if (diffMins > 0) {
          timeAgo = `${diffMins}分前`;
        }

        return {
          id: review.id,
          teacherId: review.teacherId,
          teacherName: review.teacher?.name || "Unknown Teacher",
          rating: review.rating,
          content: review.content || "",
          userType: review.userType || "大学生",
          createdAt:
            review.createdAt?.toISOString() || new Date().toISOString(),
          timeAgo,
          avatarColor: review.teacher?.avatarColor || "#3B82F6",
        };
      });

      sendSuccess(res, formattedReviews);
    } catch (error) {
      console.error("Error fetching latest reviews:", error);
      sendError(res, "Failed to fetch latest reviews", "FETCH_FAILED", 500);
    }
  });

  /**
   * @openapi
   * /student/reviews:
   *   post:
   *     summary: Submit a review for a completed lesson
   *     description: Create a review for a teacher after completing a lesson
   *     tags:
   *       - Student
   *       - Reviews
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - bookingId
   *               - teacherId
   *               - rating
   *               - content
   *             properties:
   *               bookingId:
   *                 type: string
   *                 description: ID of the booking being reviewed
   *               teacherId:
   *                 type: string
   *                 description: ID of the teacher being reviewed
   *               rating:
   *                 type: integer
   *                 minimum: 1
   *                 maximum: 5
   *                 description: Rating from 1 to 5 stars
   *               content:
   *                 type: string
   *                 description: Review comment text
   *     responses:
   *       200:
   *         description: Review created successfully
   *       400:
   *         description: Invalid request data
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Failed to create review
   */
  app.post("/api/student/reviews", isAuthenticated, async (req, res) => {
    try {
      const userId = req.userId || req.session.userId!;

      const { bookingId, teacherId, rating, content } = req.body;

      // Validate required fields
      if (!bookingId || !teacherId || !rating) {
        return sendError(
          res,
          "Missing required fields: bookingId, teacherId, rating",
          "INVALID_REQUEST",
          400
        );
      }

      // Validate rating range
      if (rating < 1 || rating > 5) {
        return sendError(
          res,
          "Rating must be between 1 and 5",
          "INVALID_RATING",
          400
        );
      }

      // Verify the booking belongs to the user
      const booking = await storage.getBooking(bookingId);
      if (!booking) {
        return sendError(res, "Booking not found", "NOT_FOUND", 404);
      }

      if (booking.studentId !== userId) {
        return sendError(
          res,
          "You can only review your own bookings",
          "FORBIDDEN",
          403
        );
      }

      // Verify the booking is confirmed (completed)
      if (booking.status !== "confirmed") {
        return sendError(
          res,
          "You can only review confirmed bookings",
          "INVALID_STATUS",
          400
        );
      }

      // Get user type from the user profile
      const student = await storage.getUser(userId);
      const userType = student?.userType || "大学生";

      // Create the review
      const review = await storage.createReview({
        bookingId,
        studentId: userId,
        teacherId,
        rating,
        content: content || "",
        userType,
      });

      sendSuccess(res, {
        id: review.id,
        rating: review.rating,
        content: review.content,
        createdAt: review.createdAt?.toISOString() || new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Error creating review:", error);
      if (error.message?.includes("already exists")) {
        return sendError(
          res,
          "You have already reviewed this booking",
          "DUPLICATE_REVIEW",
          400
        );
      }
      sendError(res, "Failed to create review", "CREATE_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /student/teachers/{teacherId}/schedule:
   *   get:
   *     summary: Get teacher schedule
   *     description: Get the teacher's availability schedule for a specific month
   *     tags: [Students]
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: teacherId
   *         required: true
   *         schema:
   *           type: string
   *         description: Teacher ID
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
   *       404:
   *         description: Teacher not found
   *       500:
   *         description: Failed to retrieve schedule
   */
  app.get(
    "/api/student/teachers/:teacherId/schedule",
    isAuthenticated,
    async (req, res) => {
      try {
        const { teacherId } = req.params;

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
        const month = monthParam
          ? parseInt(monthParam)
          : new Date().getMonth() + 1;
        if (isNaN(month) || month < 1 || month > 12) {
          return sendError(
            res,
            "Invalid month parameter. Must be between 1 and 12",
            "VALIDATION_ERROR",
            400
          );
        }

        const teacher = await storage.getTeacher(teacherId);
        if (!teacher) {
          return sendError(res, "Teacher not found", "TEACHER_NOT_FOUND", 404);
        }

        // Get all availability records for the teacher
        const availabilities = await storage.getTeacherAvailability(teacherId);

        // Process availabilities into schedule map using shared utility
        const scheduleMap = processTeacherSchedule(availabilities, year, month);

        sendSuccess(res, {
          schedule: scheduleMap,
          year,
          month,
        });
      } catch (error) {
        console.error("Error retrieving teacher schedule:", error);
        sendError(res, "Failed to retrieve schedule", "FETCH_FAILED", 500);
      }
    }
  );
}
