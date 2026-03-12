import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated, isAdmin, hashPassword, comparePasswords } from "../auth";
import { 
  insertPlanSchema, 
  updateTermsOfServiceSchema, 
  updatePrivacyPolicySchema, 
  insertFaqCategorySchema,
  updateFaqCategorySchema,
  insertFaqSchema, 
  updateFaqSchema, 
  updateAdminSettingsSchema,
  insertSubjectCategorySchema,
  updateSubjectCategorySchema,
  insertSubjectSchema,
  updateSubjectSchema,
  insertSubjectGroupSchema,
  updateSubjectGroupSchema
} from "@shared/schema";
import { z } from "zod";
import { 
  stripPassword, 
  stripPasswordsFromUsers, 
  stripPasswordsFromBookings, 
  stripPasswordsFromPayments 
} from "../utils/password";
import { sendSuccess, sendError } from "../utils/apiResponse";
import { formatTimeAgo, formatDateWithDots } from "../utils/dateTime";

const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const updateUserSchema = z.object({
  name: z.string().optional(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().optional(),
  avatarUrl: z.string().nullable().optional(),
  dateOfBirth: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  learningGoal: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

const updatePlanSchema = z.object({
  name: z.string().optional(),
  nameEn: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  price: z.string().optional(),
  totalLessons: z.number().optional(),
  durationDays: z.number().optional(),
  features: z.array(z.string()).nullable().optional(),
  isActive: z.boolean().optional(),
  isRecommended: z.boolean().optional(),
  isAdditionalOption: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

const updateBookingSchema = z.object({
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]).optional(),
  cancelReason: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

const updateTermsOfServiceSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  version: z.string().optional(),
  isActive: z.boolean().optional(),
});

export function registerAdminRoutes(app: Express): void {
  /**
   * @swagger
   * /admin/login:
   *   post:
   *     summary: Admin login
   *     description: Authenticate admin user with email and password
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LoginRequest'
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Admin'
   *       400:
   *         description: Invalid data
   *       401:
   *         description: Invalid email or password
   */
  app.post("/api/admin/login", async (req, res) => {
    try {
      const parsed = adminLoginSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, "Invalid data", "VALIDATION_ERROR", 400);
      }

      const { email, password } = parsed.data;
      const admin = await storage.getAdminByEmail(email);
      if (!admin) {
        return sendError(res, "Invalid email or password", "INVALID_CREDENTIALS", 401);
      }

      const isValid = await comparePasswords(password, admin.password);
      if (!isValid) {
        return sendError(res, "Invalid email or password", "INVALID_CREDENTIALS", 401);
      }

      req.session.adminId = admin.id;
      const { password: _, ...adminWithoutPassword } = admin;
      sendSuccess(res, adminWithoutPassword);
    } catch (error) {
      console.error("Error logging in:", error);
      sendError(res, "Failed to login", "LOGIN_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /admin/logout:
   *   post:
   *     summary: Admin logout
   *     description: End the current admin session
   *     tags: [Authentication]
   *     security:
   *       - sessionAuth: []
   *     responses:
   *       200:
   *         description: Logged out successfully
   */
  app.post("/api/admin/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return sendError(res, "Failed to logout", "LOGOUT_FAILED", 500);
      }
      sendSuccess(res, { message: "ログアウトしました" });
    });
  });

  /**
   * @swagger
   * /admin/user:
   *   get:
   *     summary: Get current admin
   *     description: Get the currently authenticated admin user
   *     tags: [Authentication]
   *     security:
   *       - sessionAuth: []
   *     responses:
   *       200:
   *         description: Current admin user
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Admin'
   *       401:
   *         description: Unauthorized
   */
  app.get("/api/admin/user", isAuthenticated, async (req, res) => {
    try {
      const adminId = req.session.adminId!;
      const admin = await storage.getAdmin(adminId);
      if (!admin) {
        return sendError(res, "Admin not found", "USER_NOT_FOUND", 404);
      }
      const { password: _, ...adminWithoutPassword } = admin;
      sendSuccess(res, adminWithoutPassword);
    } catch (error) {
      console.error("Error fetching admin:", error);
      sendError(res, "Failed to fetch admin", "FETCH_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /admin/stats:
   *   get:
   *     summary: Get dashboard statistics
   *     description: Get overview statistics for the admin dashboard
   *     tags: [Dashboard]
   *     security:
   *       - sessionAuth: []
   *     responses:
   *       200:
   *         description: Dashboard statistics
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/DashboardStats'
   *       401:
   *         description: Unauthorized
   */
  app.get("/api/admin/stats", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      sendSuccess(res, stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      sendError(res, "Failed to fetch stats", "FETCH_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /admin/revenue-chart:
   *   get:
   *     summary: Get revenue chart data
   *     description: Get revenue data for chart visualization
   *     tags: [Dashboard]
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: query
   *         name: days
   *         schema:
   *           type: integer
   *           default: 30
   *         description: Number of days to include (1-365)
   *     responses:
   *       200:
   *         description: Revenue chart data
   */
  app.get("/api/admin/revenue-chart", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const days = Math.min(Math.max(parseInt(req.query.days as string) || 30, 1), 365);
      const data = await storage.getRevenueChart(days);
      sendSuccess(res, data);
    } catch (error) {
      console.error("Error fetching revenue chart:", error);
      sendError(res, "Failed to fetch revenue chart", "FETCH_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /admin/lesson-chart:
   *   get:
   *     summary: Get lesson chart data
   *     description: Get lesson/booking data for chart visualization
   *     tags: [Dashboard]
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: query
   *         name: days
   *         schema:
   *           type: integer
   *           default: 30
   *         description: Number of days to include (1-365)
   *     responses:
   *       200:
   *         description: Lesson chart data
   */
  app.get("/api/admin/lesson-chart", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const days = Math.min(Math.max(parseInt(req.query.days as string) || 30, 1), 365);
      const data = await storage.getLessonChart(days);
      sendSuccess(res, data);
    } catch (error) {
      console.error("Error fetching lesson chart:", error);
      sendError(res, "Failed to fetch lesson chart", "FETCH_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /admin/users:
   *   get:
   *     summary: Get all users
   *     description: Get paginated list of all users with optional filters
   *     tags: [Users]
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [active, inactive, all]
   *     responses:
   *       200:
   *         description: Paginated list of users
   */
  app.get("/api/admin/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const page = Math.max(parseInt(req.query.page as string) || 1, 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 10, 1), 100);
      const search = req.query.search as string;
      const status = req.query.status as string;
      // Note: role parameter removed as users table now only contains students
      const result = await storage.getAllUsers({ page, limit, search, status });
      // Safe to divide by limit as it's guaranteed to be >= 1 (constrained above)
      const totalPages = Math.ceil(result.total / limit);
      sendSuccess(res, { 
        ...result, 
        users: stripPasswordsFromUsers(result.users),
        page,
        totalPages
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      sendError(res, "Failed to fetch users", "FETCH_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /admin/users/{id}:
   *   patch:
   *     summary: Update user
   *     description: Update an existing user
   *     tags: [Users]
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       200:
   *         description: User updated
   *       404:
   *         description: User not found
   */
  app.patch("/api/admin/users/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const existingUser = await storage.getUser(id);
      if (!existingUser) {
        return sendError(res, "User not found", "USER_NOT_FOUND", 404);
      }
      
      const parsed = updateUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, "Invalid update data", "VALIDATION_ERROR", 400);
      }
      
      const user = await storage.updateUser(id, parsed.data);
      sendSuccess(res, user ? stripPassword(user) : null);
    } catch (error) {
      console.error("Error updating user:", error);
      sendError(res, "Failed to update user", "UPDATE_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /admin/users/{id}:
   *   delete:
   *     summary: Delete user
   *     description: Delete a user by ID
   *     tags: [Users]
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       204:
   *         description: User deleted
   *       404:
   *         description: User not found
   */
  app.delete("/api/admin/users/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteUser(id);
      if (!deleted) {
        return sendError(res, "User not found", "USER_NOT_FOUND", 404);
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user:", error);
      sendError(res, "Failed to delete user", "DELETE_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /admin/teachers:
   *   get:
   *     summary: Get all teachers
   *     description: Get paginated list of teachers
   *     tags: [Teachers]
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Paginated list of teachers
   */
  app.get("/api/admin/teachers", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const page = Math.max(parseInt(req.query.page as string) || 1, 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 10, 1), 100);
      const search = req.query.search as string;
      const result = await storage.getAllTeachers({ page, limit, search });
      sendSuccess(res, { ...result, teachers: stripPasswordsFromUsers(result.teachers) });
    } catch (error) {
      console.error("Error fetching teachers:", error);
      sendError(res, "Failed to fetch teachers", "FETCH_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /admin/teachers/{id}:
   *   patch:
   *     summary: Update teacher
   *     description: Update teacher user and profile data
   *     tags: [Teachers]
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Teacher updated
   *       404:
   *         description: Teacher not found
   */
  app.patch("/api/admin/teachers/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const existingTeacher = await storage.getTeacher(id);
      if (!existingTeacher) {
        return sendError(res, "Teacher not found", "USER_NOT_FOUND", 404);
      }
      
      // Since teacher data is now in one table, we can update all fields at once
      const updateData = req.body;
      
      if (Object.keys(updateData).length > 0) {
        await storage.updateTeacher(id, updateData);
      }
      
      const teacher = await storage.getTeacher(id);
      
      sendSuccess(res, stripPassword(teacher!));
    } catch (error) {
      console.error("Error updating teacher:", error);
      sendError(res, "Failed to update teacher", "UPDATE_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /admin/teachers/{id}:
   *   delete:
   *     summary: Delete teacher
   *     description: Delete a teacher by ID
   *     tags: [Teachers]
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       204:
   *         description: Teacher deleted
   *       404:
   *         description: Teacher not found
   */
  app.delete("/api/admin/teachers/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteTeacher(id);
      if (!deleted) {
        return sendError(res, "Teacher not found", "USER_NOT_FOUND", 404);
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting teacher:", error);
      sendError(res, "Failed to delete teacher", "DELETE_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /admin/plans:
   *   get:
   *     summary: Get all plans
   *     description: Get paginated list of all subscription plans
   *     tags: [Plans]
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *     responses:
   *       200:
   *         description: Paginated list of plans
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 plans:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Plan'
   *                 total:
   *                   type: integer
   *                 page:
   *                   type: integer
   *                 totalPages:
   *                   type: integer
   */
  app.get("/api/admin/plans", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const page = req.query.page ? Math.max(parseInt(req.query.page as string) || 1, 1) : undefined;
      const limit = req.query.limit ? Math.min(Math.max(parseInt(req.query.limit as string) || 10, 1), 100) : undefined;
      
      const result = await storage.getAllPlans(page ? { page, limit } : undefined);
      sendSuccess(res, result);
    } catch (error) {
      console.error("Error fetching plans:", error);
      sendError(res, "Failed to fetch plans", "FETCH_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /admin/plans:
   *   post:
   *     summary: Create plan
   *     description: Create a new subscription plan
   *     tags: [Plans]
   *     security:
   *       - sessionAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Plan'
   *     responses:
   *       201:
   *         description: Plan created
   */
  app.post("/api/admin/plans", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const parsed = insertPlanSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, "Invalid plan data", "VALIDATION_ERROR", 400);
      }
      const plan = await storage.createPlan(parsed.data);
      sendSuccess(res, plan, 201);
    } catch (error) {
      console.error("Error creating plan:", error);
      sendError(res, "Failed to create plan", "CREATE_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /admin/plans/{id}:
   *   patch:
   *     summary: Update plan
   *     description: Update an existing plan
   *     tags: [Plans]
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Plan updated
   *       404:
   *         description: Plan not found
   */
  app.patch("/api/admin/plans/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const existingPlan = await storage.getPlan(id);
      if (!existingPlan) {
        return sendError(res, "Plan not found", "PLAN_NOT_FOUND", 404);
      }
      
      const parsed = updatePlanSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, "Invalid update data", "VALIDATION_ERROR", 400);
      }
      
      const plan = await storage.updatePlan(id, parsed.data);
      sendSuccess(res, plan);
    } catch (error) {
      console.error("Error updating plan:", error);
      sendError(res, "Failed to update plan", "UPDATE_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /admin/plans/{id}:
   *   delete:
   *     summary: Delete plan
   *     description: Delete a plan by ID
   *     tags: [Plans]
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       204:
   *         description: Plan deleted
   *       404:
   *         description: Plan not found
   */
  app.delete("/api/admin/plans/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deletePlan(id);
      if (!deleted) {
        return sendError(res, "Plan not found", "PLAN_NOT_FOUND", 404);
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting plan:", error);
      sendError(res, "Failed to delete plan", "DELETE_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /admin/lessons:
   *   get:
   *     summary: Get all lessons
   *     description: Get paginated list of lesson bookings
   *     tags: [Lessons]
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [pending, confirmed, completed, cancelled]
   *     responses:
   *       200:
   *         description: Paginated list of lessons
   */
  app.get("/api/admin/lessons", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const page = Math.max(parseInt(req.query.page as string) || 1, 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 10, 1), 100);
      const status = req.query.status as string;
      const result = await storage.getAllBookings({ page, limit, status });
      const totalPages = Math.ceil(result.total / limit);
      sendSuccess(res, { 
        lessons: stripPasswordsFromBookings(result.bookings),
        total: result.total,
        page,
        totalPages
      });
    } catch (error) {
      console.error("Error fetching lessons:", error);
      sendError(res, "Failed to fetch lessons", "FETCH_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /admin/lessons/{id}:
   *   patch:
   *     summary: Update lesson
   *     description: Update a lesson/booking status
   *     tags: [Lessons]
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Lesson updated
   *       404:
   *         description: Lesson not found
   */
  app.patch("/api/admin/lessons/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const existingBooking = await storage.getBooking(id);
      if (!existingBooking) {
        return sendError(res, "Lesson not found", "LESSON_NOT_FOUND", 404);
      }
      
      const parsed = updateBookingSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, "Invalid update data", "VALIDATION_ERROR", 400);
      }
      
      const booking = await storage.updateBooking(id, parsed.data);
      sendSuccess(res, booking);
    } catch (error) {
      console.error("Error updating lesson:", error);
      sendError(res, "Failed to update lesson", "UPDATE_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /admin/payments:
   *   get:
   *     summary: Get all payments
   *     description: Get paginated list of payments
   *     tags: [Payments]
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [pending, completed, failed, refunded]
   *     responses:
   *       200:
   *         description: Paginated list of payments
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 payments:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Payment'
   *                 total:
   *                   type: integer
   *                 page:
   *                   type: integer
   *                 limit:
   *                   type: integer
   */
  app.get("/api/admin/payments", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const page = Math.max(parseInt(req.query.page as string) || 1, 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 10, 1), 100);
      const status = req.query.status as string;
      const result = await storage.getAllPayments({ page, limit, status });
      sendSuccess(res, { ...result, payments: stripPasswordsFromPayments(result.payments) });
    } catch (error) {
      console.error("Error fetching payments:", error);
      sendError(res, "Failed to fetch payments", "FETCH_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /admin/inquiries:
   *   get:
   *     summary: Get all inquiries
   *     description: Get paginated list of inquiries
   *     tags: [Inquiries]
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [pending, resolved]
   *     responses:
   *       200:
   *         description: Paginated list of inquiries
   */
  app.get("/api/admin/inquiries", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const page = Math.max(parseInt(req.query.page as string) || 1, 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 10, 1), 100);
      const status = req.query.status as string;
      const result = await storage.getAllInquiries({ page, limit, status });
      sendSuccess(res, result);
    } catch (error) {
      console.error("Error fetching inquiries:", error);
      sendError(res, "Failed to fetch inquiries", "FETCH_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /admin/inquiries/{id}:
   *   patch:
   *     summary: Update inquiry status
   *     description: Update the status of an inquiry
   *     tags: [Inquiries]
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               status:
   *                 type: string
   *                 enum: [pending, resolved]
   *     responses:
   *       200:
   *         description: Inquiry status updated
   *       404:
   *         description: Inquiry not found
   */
  app.patch("/api/admin/inquiries/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!status || !["pending", "resolved"].includes(status)) {
        return sendError(res, "Invalid status", "VALIDATION_ERROR", 400);
      }
      
      const inquiry = await storage.updateInquiryStatus(id, status);
      if (!inquiry) {
        return sendError(res, "Inquiry not found", "INQUIRY_NOT_FOUND", 404);
      }
      sendSuccess(res, inquiry);
    } catch (error) {
      console.error("Error updating inquiry:", error);
      sendError(res, "Failed to update inquiry", "UPDATE_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /admin/terms-of-service:
   *   get:
   *     summary: Get terms of service
   *     description: Get the single terms of service record
   *     tags: [Terms of Service]
   *     security:
   *       - sessionAuth: []
   *     responses:
   *       200:
   *         description: Terms of service
   */
  app.get("/api/admin/terms-of-service", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const terms = await storage.getTermsOfService();
      sendSuccess(res, terms);
    } catch (error) {
      console.error("Error fetching terms:", error);
      sendError(res, "Failed to fetch terms", "FETCH_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /admin/terms-of-service:
   *   patch:
   *     summary: Update terms of service
   *     description: Update the terms of service content
   *     tags: [Terms of Service]
   *     security:
   *       - sessionAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               title:
   *                 type: string
   *               content:
   *                 type: string
   *     responses:
   *       200:
   *         description: Terms updated
   */
  app.patch("/api/admin/terms-of-service", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const parsed = updateTermsOfServiceSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, "Invalid terms data", "VALIDATION_ERROR", 400);
      }
      
      const terms = await storage.updateTermsOfService(parsed.data);
      sendSuccess(res, terms);
    } catch (error) {
      console.error("Error updating terms:", error);
      sendError(res, "Failed to update terms", "UPDATE_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /admin/privacy-policy:
   *   get:
   *     summary: Get privacy policy
   *     description: Get the single privacy policy record
   *     tags: [Privacy Policy]
   *     security:
   *       - sessionAuth: []
   *     responses:
   *       200:
   *         description: Privacy policy
   */
  app.get("/api/admin/privacy-policy", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const policy = await storage.getPrivacyPolicy();
      sendSuccess(res, policy);
    } catch (error) {
      console.error("Error fetching privacy policy:", error);
      sendError(res, "Failed to fetch privacy policy", "FETCH_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /admin/privacy-policy:
   *   patch:
   *     summary: Update privacy policy
   *     description: Update the privacy policy content
   *     tags: [Privacy Policy]
   *     security:
   *       - sessionAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               title:
   *                 type: string
   *               content:
   *                 type: string
   *     responses:
   *       200:
   *         description: Privacy policy updated
   */
  app.patch("/api/admin/privacy-policy", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const parsed = updatePrivacyPolicySchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, "Invalid privacy policy data", "VALIDATION_ERROR", 400);
      }
      
      const policy = await storage.updatePrivacyPolicy(parsed.data);
      sendSuccess(res, policy);
    } catch (error) {
      console.error("Error updating privacy policy:", error);
      sendError(res, "Failed to update privacy policy", "UPDATE_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /admin/faq-categories:
   *   get:
   *     summary: Get all FAQ categories
   *     description: Get list of all FAQ categories
   *     tags: [FAQ Management]
   *     security:
   *       - sessionAuth: []
   *     responses:
   *       200:
   *         description: List of FAQ categories
   */
  app.get("/api/admin/faq-categories", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const categories = await storage.getAllFaqCategories();
      sendSuccess(res, categories);
    } catch (error) {
      console.error("Error fetching FAQ categories:", error);
      sendError(res, "Failed to fetch FAQ categories", "FETCH_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /admin/faq-categories:
   *   post:
   *     summary: Create FAQ category
   *     description: Create a new FAQ category
   *     tags: [FAQ Management]
   *     security:
   *       - sessionAuth: []
   */
  app.post("/api/admin/faq-categories", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const parsed = insertFaqCategorySchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, "Invalid category data", "VALIDATION_ERROR", 400);
      }
      const category = await storage.createFaqCategory(parsed.data);
      sendSuccess(res, category, 201);
    } catch (error) {
      console.error("Error creating FAQ category:", error);
      sendError(res, "Failed to create FAQ category", "CREATE_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /admin/faq-categories/{id}:
   *   patch:
   *     summary: Update FAQ category
   *     description: Update an existing FAQ category
   *     tags: [FAQ Management]
   *     security:
   *       - sessionAuth: []
   */
  app.patch("/api/admin/faq-categories/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const existing = await storage.getFaqCategory(id);
      if (!existing) {
        return sendError(res, "FAQ category not found", "NOT_FOUND", 404);
      }
      
      const parsed = updateFaqCategorySchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, "Invalid update data", "VALIDATION_ERROR", 400);
      }
      
      const category = await storage.updateFaqCategory(id, parsed.data);
      sendSuccess(res, category);
    } catch (error) {
      console.error("Error updating FAQ category:", error);
      sendError(res, "Failed to update FAQ category", "UPDATE_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /admin/faq-categories/{id}:
   *   delete:
   *     summary: Delete FAQ category
   *     description: Delete a FAQ category by ID
   *     tags: [FAQ Management]
   *     security:
   *       - sessionAuth: []
   */
  app.delete("/api/admin/faq-categories/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if category exists
      const category = await storage.getFaqCategory(id);
      if (!category) {
        return sendError(res, "FAQ category not found", "NOT_FOUND", 404);
      }
      
      // Check if any FAQs are using this category
      const faqs = await storage.getAllFaqs({ category: category.name });
      if (faqs.length > 0) {
        return sendError(
          res, 
          `Cannot delete category "${category.name}" because ${faqs.length} FAQ(s) are using it. Please reassign or delete those FAQs first.`,
          "CATEGORY_IN_USE", 
          400
        );
      }
      
      const deleted = await storage.deleteFaqCategory(id);
      if (!deleted) {
        return sendError(res, "FAQ category not found", "NOT_FOUND", 404);
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting FAQ category:", error);
      sendError(res, "Failed to delete FAQ category", "DELETE_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /admin/faqs:
   *   get:
   *     summary: Get all FAQs
   *     description: Get list of all FAQs with optional filters
   *     tags: [FAQs]
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: query
   *         name: category
   *         schema:
   *           type: string
   *       - in: query
   *         name: isActive
   *         schema:
   *           type: boolean
   *     responses:
   *       200:
   *         description: List of FAQs
   */
  app.get("/api/admin/faqs", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
      
      const faqs = await storage.getAllFaqs({ category, isActive });
      sendSuccess(res, faqs);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      sendError(res, "Failed to fetch FAQs", "FETCH_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /admin/faqs/{id}:
   *   get:
   *     summary: Get FAQ by ID
   *     description: Get a single FAQ by its ID
   *     tags: [FAQs]
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: FAQ details
   *       404:
   *         description: FAQ not found
   */
  app.get("/api/admin/faqs/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const faq = await storage.getFaq(id);
      if (!faq) {
        return sendError(res, "FAQ not found", "FAQ_NOT_FOUND", 404);
      }
      sendSuccess(res, faq);
    } catch (error) {
      console.error("Error fetching FAQ:", error);
      sendError(res, "Failed to fetch FAQ", "FETCH_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /admin/faqs:
   *   post:
   *     summary: Create FAQ
   *     description: Create a new FAQ
   *     tags: [FAQs]
   *     security:
   *       - sessionAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               question:
   *                 type: string
   *               answer:
   *                 type: string
   *               category:
   *                 type: string
   *               sortOrder:
   *                 type: number
   *               isActive:
   *                 type: boolean
   *     responses:
   *       201:
   *         description: FAQ created
   */
  app.post("/api/admin/faqs", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const parsed = insertFaqSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, "Invalid FAQ data", "VALIDATION_ERROR", 400);
      }
      const faq = await storage.createFaq(parsed.data);
      sendSuccess(res, faq, 201);
    } catch (error) {
      console.error("Error creating FAQ:", error);
      sendError(res, "Failed to create FAQ", "CREATE_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /admin/faqs/{id}:
   *   patch:
   *     summary: Update FAQ
   *     description: Update an existing FAQ
   *     tags: [FAQs]
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: FAQ updated
   *       404:
   *         description: FAQ not found
   */
  app.patch("/api/admin/faqs/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const existingFaq = await storage.getFaq(id);
      if (!existingFaq) {
        return sendError(res, "FAQ not found", "FAQ_NOT_FOUND", 404);
      }
      
      const parsed = updateFaqSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, "Invalid update data", "VALIDATION_ERROR", 400);
      }
      
      const faq = await storage.updateFaq(id, parsed.data);
      sendSuccess(res, faq);
    } catch (error) {
      console.error("Error updating FAQ:", error);
      sendError(res, "Failed to update FAQ", "UPDATE_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /admin/faqs/{id}:
   *   delete:
   *     summary: Delete FAQ
   *     description: Delete an FAQ by ID
   *     tags: [FAQs]
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       204:
   *         description: FAQ deleted
   *       404:
   *         description: FAQ not found
   */
  app.delete("/api/admin/faqs/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteFaq(id);
      if (!deleted) {
        return sendError(res, "FAQ not found", "FAQ_NOT_FOUND", 404);
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting FAQ:", error);
      sendError(res, "Failed to delete FAQ", "DELETE_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /admin/admin-settings:
   *   get:
   *     summary: Get admin settings
   *     description: Get the admin settings (administrator email)
   *     tags: [Admin Settings]
   *     security:
   *       - sessionAuth: []
   *     responses:
   *       200:
   *         description: Admin settings
   */
  app.get("/api/admin/admin-settings", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const settings = await storage.getAdminSettings();
      sendSuccess(res, settings);
    } catch (error) {
      console.error("Error fetching admin settings:", error);
      sendError(res, "Failed to fetch admin settings", "FETCH_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /admin/admin-settings:
   *   patch:
   *     summary: Update admin settings
   *     description: Update the admin settings (administrator email)
   *     tags: [Admin Settings]
   *     security:
   *       - sessionAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               adminEmail:
   *                 type: string
   *               notifyOnNewInquiry:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Admin settings updated
   */
  app.patch("/api/admin/admin-settings", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const parsed = updateAdminSettingsSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, "Invalid admin settings data", "VALIDATION_ERROR", 400);
      }
      
      const settings = await storage.updateAdminSettings(parsed.data);
      sendSuccess(res, settings);
    } catch (error) {
      console.error("Error updating admin settings:", error);
      sendError(res, "Failed to update admin settings", "UPDATE_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /admin/chats:
   *   get:
   *     summary: Get all chats (admin)
   *     description: Retrieve all chats between students and teachers for admin monitoring
   *     tags: [Admin, Chats]
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *     responses:
   *       200:
   *         description: List of all chats retrieved successfully
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Failed to get chats
   */
  app.get("/api/admin/chats", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const page = Math.max(parseInt(req.query.page as string) || 1, 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 20, 1), 100);

      const result = await storage.getAllChats({ page, limit });

      // Format chats for admin view
      const formattedChats = result.chats.map((chat) => {
        const participant1 = chat.participant1;
        const participant2 = chat.participant2;
        const lastMessage = chat.lastMessage;

        // Format time ago
        const timeAgo = lastMessage?.createdAt ? formatTimeAgo(lastMessage.createdAt) : "";

        return {
          id: chat.id,
          participant1Id: participant1?.id || "",
          participant1Name: participant1?.name || "不明なユーザー",
          participant1Avatar: participant1?.avatarUrl || null,
          participant1Type: chat.participant1Type || "user",
          participant2Id: participant2?.id || "",
          participant2Name: participant2?.name || "不明なユーザー",
          participant2Avatar: participant2?.avatarUrl || null,
          participant2Type: chat.participant2Type || "user",
          lastMessage: lastMessage?.text || "",
          lastMessageTime: lastMessage?.createdAt?.toISOString() || "",
          timeAgo,
          createdAt: chat.createdAt?.toISOString() || "",
        };
      });

      sendSuccess(res, {
        chats: formattedChats,
        total: result.total,
        page,
        totalPages: Math.ceil(result.total / limit),
      });
    } catch (error) {
      console.error("Error getting all chats:", error);
      sendError(res, "Failed to get chats", "FETCH_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /admin/chats/{chatId}/messages:
   *   get:
   *     summary: Get messages for a specific chat (admin)
   *     description: Retrieve messages for a specific chat for admin monitoring
   *     tags: [Admin, Chats]
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: chatId
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: before
   *         schema:
   *           type: string
   *           format: date-time
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 50
   *     responses:
   *       200:
   *         description: Messages retrieved successfully
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Chat not found
   *       500:
   *         description: Failed to get messages
   */
  app.get(
    "/api/admin/chats/:chatId/messages",
    isAuthenticated,
    isAdmin,
    async (req, res) => {
      try {
        const { chatId } = req.params;
        const { before, limit = "50" } = req.query;

        // Verify chat exists
        const chat = await storage.getChat(chatId);
        if (!chat) {
          return sendError(res, "Chat not found", "NOT_FOUND", 404);
        }

        // Get chat participants for context
        const chatWithParticipants = await storage.getChatWithParticipants(chatId);

        const result = await storage.getChatMessages(chatId, {
          before: before as string,
          limit: parseInt(limit as string, 10),
        });

        const formattedMessages = result.messages.map((msg) => {
          const time = new Date(msg.createdAt!);
          const hours = time.getHours().toString().padStart(2, "0");
          const minutes = time.getMinutes().toString().padStart(2, "0");

          return {
            id: msg.id,
            senderId: msg.senderId,
            senderType: msg.senderType,
            text: msg.text || "",
            createdAt: msg.createdAt?.toISOString() || "",
            time: `${hours}:${minutes}`,
            isRead: msg.isRead || false,
            isImage: !!msg.imageUrl,
            imageUrl: msg.imageUrl || null,
          };
        });

        sendSuccess(res, {
          messages: formattedMessages,
          hasMore: result.hasMore,
          chat: chatWithParticipants ? {
            id: chatWithParticipants.id,
            participant1: chatWithParticipants.participant1 ? {
              id: chatWithParticipants.participant1.id,
              name: chatWithParticipants.participant1.name,
              avatarUrl: chatWithParticipants.participant1.avatarUrl || null,
            } : null,
            participant2: chatWithParticipants.participant2 ? {
              id: chatWithParticipants.participant2.id,
              name: chatWithParticipants.participant2.name,
              avatarUrl: chatWithParticipants.participant2.avatarUrl || null,
            } : null,
          } : null,
        });
      } catch (error) {
        console.error("Error getting messages:", error);
        sendError(res, "Failed to get messages", "FETCH_FAILED", 500);
      }
    }
  );

  /**
   * @swagger
   * /admin/subject-categories:
   *   get:
   *     summary: Get all subject categories
   *     description: Get list of all subject categories
   *     tags: [Subject Management]
   *     security:
   *       - sessionAuth: []
   *     responses:
   *       200:
   *         description: List of subject categories
   */
  app.get("/api/admin/subject-categories", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const categories = await storage.getAllSubjectCategories();
      sendSuccess(res, categories);
    } catch (error) {
      console.error("Error fetching subject categories:", error);
      sendError(res, "Failed to fetch subject categories", "FETCH_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /admin/subject-categories:
   *   post:
   *     summary: Create subject category
   *     description: Create a new subject category
   *     tags: [Subject Management]
   *     security:
   *       - sessionAuth: []
   */
  app.post("/api/admin/subject-categories", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const parsed = insertSubjectCategorySchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, "Invalid category data", "VALIDATION_ERROR", 400);
      }
      const category = await storage.createSubjectCategory(parsed.data);
      sendSuccess(res, category, 201);
    } catch (error) {
      console.error("Error creating subject category:", error);
      sendError(res, "Failed to create subject category", "CREATE_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /admin/subject-categories/{id}:
   *   patch:
   *     summary: Update subject category
   *     description: Update an existing subject category
   *     tags: [Subject Management]
   *     security:
   *       - sessionAuth: []
   */
  app.patch("/api/admin/subject-categories/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const existing = await storage.getSubjectCategory(id);
      if (!existing) {
        return sendError(res, "Subject category not found", "NOT_FOUND", 404);
      }
      
      const parsed = updateSubjectCategorySchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, "Invalid update data", "VALIDATION_ERROR", 400);
      }
      
      const category = await storage.updateSubjectCategory(id, parsed.data);
      sendSuccess(res, category);
    } catch (error) {
      console.error("Error updating subject category:", error);
      sendError(res, "Failed to update subject category", "UPDATE_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /admin/subject-categories/{id}:
   *   delete:
   *     summary: Delete subject category
   *     description: Delete a subject category by ID
   *     tags: [Subject Management]
   *     security:
   *       - sessionAuth: []
   */
  app.delete("/api/admin/subject-categories/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteSubjectCategory(id);
      if (!deleted) {
        return sendError(res, "Subject category not found", "NOT_FOUND", 404);
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting subject category:", error);
      sendError(res, "Failed to delete subject category", "DELETE_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /admin/subjects:
   *   get:
   *     summary: Get all subjects
   *     description: Get list of all subjects, optionally filtered by category
   *     tags: [Subject Management]
   *     security:
   *       - sessionAuth: []
   */
  app.get("/api/admin/subjects", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const categoryId = req.query.categoryId as string | undefined;
      const subjects = await storage.getAllSubjects(categoryId);
      sendSuccess(res, subjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      sendError(res, "Failed to fetch subjects", "FETCH_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /admin/subjects:
   *   post:
   *     summary: Create subject
   *     description: Create a new subject
   *     tags: [Subject Management]
   *     security:
   *       - sessionAuth: []
   */
  app.post("/api/admin/subjects", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const parsed = insertSubjectSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, "Invalid subject data", "VALIDATION_ERROR", 400);
      }
      const subject = await storage.createSubject(parsed.data);
      sendSuccess(res, subject, 201);
    } catch (error) {
      console.error("Error creating subject:", error);
      sendError(res, "Failed to create subject", "CREATE_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /admin/subjects/{id}:
   *   patch:
   *     summary: Update subject
   *     description: Update an existing subject
   *     tags: [Subject Management]
   *     security:
   *       - sessionAuth: []
   */
  app.patch("/api/admin/subjects/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const existing = await storage.getSubject(id);
      if (!existing) {
        return sendError(res, "Subject not found", "NOT_FOUND", 404);
      }
      
      const parsed = updateSubjectSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, "Invalid update data", "VALIDATION_ERROR", 400);
      }
      
      const subject = await storage.updateSubject(id, parsed.data);
      sendSuccess(res, subject);
    } catch (error) {
      console.error("Error updating subject:", error);
      sendError(res, "Failed to update subject", "UPDATE_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /admin/subjects/{id}:
   *   delete:
   *     summary: Delete subject
   *     description: Delete a subject by ID
   *     tags: [Subject Management]
   *     security:
   *       - sessionAuth: []
   */
  app.delete("/api/admin/subjects/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteSubject(id);
      if (!deleted) {
        return sendError(res, "Subject not found", "NOT_FOUND", 404);
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting subject:", error);
      sendError(res, "Failed to delete subject", "DELETE_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /admin/subject-groups:
   *   get:
   *     summary: Get all subject groups
   *     description: Get list of all subject groups, optionally filtered by subject
   *     tags: [Subject Management]
   *     security:
   *       - sessionAuth: []
   */
  app.get("/api/admin/subject-groups", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const subjectId = req.query.subjectId as string | undefined;
      const groups = await storage.getAllSubjectGroups(subjectId);
      sendSuccess(res, groups);
    } catch (error) {
      console.error("Error fetching subject groups:", error);
      sendError(res, "Failed to fetch subject groups", "FETCH_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /admin/subject-groups:
   *   post:
   *     summary: Create subject group
   *     description: Create a new subject group
   *     tags: [Subject Management]
   *     security:
   *       - sessionAuth: []
   */
  app.post("/api/admin/subject-groups", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const parsed = insertSubjectGroupSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, "Invalid subject group data", "VALIDATION_ERROR", 400);
      }
      const group = await storage.createSubjectGroup(parsed.data);
      sendSuccess(res, group, 201);
    } catch (error) {
      console.error("Error creating subject group:", error);
      sendError(res, "Failed to create subject group", "CREATE_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /admin/subject-groups/{id}:
   *   patch:
   *     summary: Update subject group
   *     description: Update an existing subject group
   *     tags: [Subject Management]
   *     security:
   *       - sessionAuth: []
   */
  app.patch("/api/admin/subject-groups/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const existing = await storage.getSubjectGroup(id);
      if (!existing) {
        return sendError(res, "Subject group not found", "NOT_FOUND", 404);
      }
      
      const parsed = updateSubjectGroupSchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, "Invalid update data", "VALIDATION_ERROR", 400);
      }
      
      const group = await storage.updateSubjectGroup(id, parsed.data);
      sendSuccess(res, group);
    } catch (error) {
      console.error("Error updating subject group:", error);
      sendError(res, "Failed to update subject group", "UPDATE_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /admin/subject-groups/{id}:
   *   delete:
   *     summary: Delete subject group
   *     description: Delete a subject group by ID
   *     tags: [Subject Management]
   *     security:
   *       - sessionAuth: []
   */
  app.delete("/api/admin/subject-groups/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteSubjectGroup(id);
      if (!deleted) {
        return sendError(res, "Subject group not found", "NOT_FOUND", 404);
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting subject group:", error);
      sendError(res, "Failed to delete subject group", "DELETE_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /admin/transfer-requests:
   *   get:
   *     summary: Get all transfer requests
   *     description: Get all transfer requests with optional status filter
   *     tags: [Admin - Rewards Management]
   *     security:
   *       - sessionAuth: []
   */
  app.get("/api/admin/transfer-requests", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const offset = (pageNum - 1) * limitNum;

      const { db } = await import("../db");
      const { transferRequests, teachers } = await import("../../shared/schema");
      const { eq, and, desc, sql } = await import("drizzle-orm");

      // Build query conditions
      const conditions = [];
      if (status && typeof status === 'string') {
        conditions.push(eq(transferRequests.status, status));
      }

      // Get transfer requests with teacher information
      const query = db
        .select({
          id: transferRequests.id,
          teacherId: transferRequests.teacherId,
          teacherName: teachers.name,
          teacherEmail: teachers.email,
          amount: transferRequests.amount,
          transferFee: transferRequests.transferFee,
          netAmount: transferRequests.netAmount,
          status: transferRequests.status,
          requestDate: transferRequests.requestDate,
          completedDate: transferRequests.completedDate,
          notes: transferRequests.notes,
        })
        .from(transferRequests)
        .leftJoin(teachers, eq(transferRequests.teacherId, teachers.id))
        .orderBy(desc(transferRequests.requestDate))
        .limit(limitNum)
        .offset(offset);

      const transferList = conditions.length > 0 
        ? await query.where(and(...conditions))
        : await query;

      // Get total count
      const countQuery = db
        .select({ count: sql<number>`COUNT(*)` })
        .from(transferRequests);
      
      const countResult = conditions.length > 0
        ? await countQuery.where(and(...conditions))
        : await countQuery;

      const totalCount = Number(countResult[0]?.count || 0);

      const items = transferList.map((transfer) => ({
        id: transfer.id,
        teacherId: transfer.teacherId,
        teacherName: transfer.teacherName,
        teacherEmail: transfer.teacherEmail,
        amount: Number(transfer.amount),
        transferFee: Number(transfer.transferFee),
        netAmount: Number(transfer.netAmount),
        status: transfer.status,
        requestDate: formatDateWithDots(transfer.requestDate),
        completedDate: formatDateWithDots(transfer.completedDate),
        notes: transfer.notes,
      }));

      sendSuccess(res, {
        items,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limitNum),
        },
      });
    } catch (error) {
      console.error("Error fetching transfer requests:", error);
      sendError(res, "Failed to fetch transfer requests", "FETCH_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /admin/transfer-requests/{id}:
   *   put:
   *     summary: Update transfer request status
   *     description: Update the status of a transfer request
   *     tags: [Admin - Rewards Management]
   *     security:
   *       - sessionAuth: []
   */
  app.put("/api/admin/transfer-requests/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      // Validate status
      const validStatuses = ["pending", "processing", "completed", "failed"];
      if (!status || !validStatuses.includes(status)) {
        return sendError(res, "Invalid status. Must be one of: pending, processing, completed, failed", "VALIDATION_ERROR", 400);
      }

      const { db } = await import("../db");
      const { transferRequests } = await import("../../shared/schema");
      const { eq } = await import("drizzle-orm");

      // Check if transfer request exists
      const [existing] = await db
        .select()
        .from(transferRequests)
        .where(eq(transferRequests.id, id));

      if (!existing) {
        return sendError(res, "Transfer request not found", "NOT_FOUND", 404);
      }

      // Update transfer request
      const updateData: any = {
        status,
        updatedAt: new Date(),
      };

      if (notes !== undefined) {
        updateData.notes = notes;
      }

      if (status === "completed" && !existing.completedDate) {
        updateData.completedDate = new Date();
      }

      const [updated] = await db
        .update(transferRequests)
        .set(updateData)
        .where(eq(transferRequests.id, id))
        .returning();

      sendSuccess(res, {
        id: updated.id,
        status: updated.status,
        completedDate: updated.completedDate,
        notes: updated.notes,
        message: "Transfer request updated successfully",
      });
    } catch (error) {
      console.error("Error updating transfer request:", error);
      sendError(res, "Failed to update transfer request", "UPDATE_FAILED", 500);
    }
  });
}
