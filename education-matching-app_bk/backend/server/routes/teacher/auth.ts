import type { Express } from "express";
import { storage } from "../../storage";
import { handleRegister, handleLogin, handleLogout } from "../shared/auth";

/**
 * Register teacher authentication routes
 */
export function registerTeacherAuthRoutes(app: Express): void {
  /**
   * @swagger
   * /teacher/register:
   *   post:
   *     summary: Teacher registration
   *     description: Register a new teacher user
   *     tags: [Teachers]
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
   *                 example: "Jane Smith"
   *               email:
   *                 type: string
   *                 format: email
   *                 example: "teacher@example.com"
   *               password:
   *                 type: string
   *                 format: password
   *                 example: "password123"
   *     responses:
   *       201:
   *         description: Teacher registered successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       400:
   *         description: Invalid data
   *       409:
   *         description: Email already exists
   *       500:
   *         description: Failed to register teacher
   */
  app.post("/api/teacher/register", async (req, res) => {
    await handleRegister(req, res, {
      userType: "teacher",
      getExistingUser: storage.getTeacherByEmail.bind(storage),
      createUser: storage.createTeacher.bind(storage),
    });
  });

  /**
   * @swagger
   * /teacher/login:
   *   post:
   *     summary: Teacher login
   *     description: Authenticate teacher user with email and password
   *     tags: [Teachers]
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
  app.post("/api/teacher/login", async (req, res) => {
    await handleLogin(req, res, {
      userType: "teacher",
      getUserByEmail: storage.getTeacherByEmail.bind(storage),
    });
  });

  /**
   * @swagger
   * /teacher/logout:
   *   post:
   *     summary: Teacher logout
   *     description: End the current teacher session
   *     tags: [Teachers]
   *     security:
   *       - sessionAuth: []
   *     responses:
   *       200:
   *         description: Logged out successfully
   *       500:
   *         description: Failed to logout
   */
  app.post("/api/teacher/logout", (req, res) => {
    handleLogout(req, res);
  });
}
