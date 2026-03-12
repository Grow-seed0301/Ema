import type { Express } from "express";
import { storage } from "../../storage";
import { handleRegister, handleLogin, handleLogout } from "../shared/auth";

/**
 * Register student authentication routes
 */
export function registerStudentAuthRoutes(app: Express): void {
  /**
   * @swagger
   * /student/register:
   *   post:
   *     summary: Student registration
   *     description: Register a new student user
   *     tags: [Students]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [name, email, password]
   *             properties:
   *               name:
   *                 type: string
   *                 example: "John Doe"
   *               email:
   *                 type: string
   *                 format: email
   *                 example: "student@example.com"
   *               password:
   *                 type: string
   *                 format: password
   *                 example: "password123"
   *     responses:
   *       201:
   *         description: Student registered successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       400:
   *         description: Invalid data
   *       409:
   *         description: Email already exists
   *       500:
   *         description: Failed to register student
   */
  app.post("/api/student/register", async (req, res) => {
    await handleRegister(req, res, {
      userType: "student",
      getExistingUser: storage.getUserByEmail.bind(storage),
      createUser: storage.createUser.bind(storage),
    });
  });

  /**
   * @swagger
   * /student/login:
   *   post:
   *     summary: Student login
   *     description: Authenticate student user with email and password
   *     tags: [Students]
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
   *               $ref: '#/components/schemas/User'
   *       400:
   *         description: Invalid data
   *       401:
   *         description: Invalid email or password
   *       500:
   *         description: Failed to login
   */
  app.post("/api/student/login", async (req, res) => {
    await handleLogin(req, res, {
      userType: "student",
      getUserByEmail: storage.getUserByEmail.bind(storage),
    });
  });

  /**
   * @swagger
   * /student/logout:
   *   post:
   *     summary: Student logout
   *     description: End the current student session
   *     tags: [Students]
   *     security:
   *       - sessionAuth: []
   *     responses:
   *       200:
   *         description: Logged out successfully
   *       500:
   *         description: Failed to logout
   */
  app.post("/api/student/logout", (req, res) => {
    handleLogout(req, res);
  });
}
