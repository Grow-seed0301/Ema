import type { Express } from "express";
import { storage } from "../../storage";
import {
  handleForgotPassword,
  handleVerifyCode,
  handleResetPassword,
} from "../shared/password";

/**
 * Register teacher password reset routes
 */
export function registerTeacherPasswordRoutes(app: Express): void {
  /**
   * @swagger
   * /teacher/forgot-password:
   *   post:
   *     summary: Request password reset code for teacher
   *     description: Send a 6-digit verification code to the teacher's email for password reset
   *     tags: [Teachers]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email]
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: "teacher@example.com"
   *     responses:
   *       200:
   *         description: Verification code sent successfully
   *       400:
   *         description: Invalid email
   *       404:
   *         description: Email not found
   *       500:
   *         description: Failed to send code
   */
  app.post("/api/teacher/forgot-password", async (req, res) => {
    await handleForgotPassword(req, res, {
      userType: "teacher",
      getUserByEmail: storage.getTeacherByEmail.bind(storage),
    });
  });

  /**
   * @swagger
   * /teacher/verify-code:
   *   post:
   *     summary: Verify password reset code for teacher
   *     description: Verify the 6-digit code sent to teacher's email
   *     tags: [Teachers]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email, code]
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               code:
   *                 type: string
   *                 example: "123456"
   *     responses:
   *       200:
   *         description: Code verified successfully
   *       400:
   *         description: Invalid code or expired
   *       500:
   *         description: Failed to verify code
   */
  app.post("/api/teacher/verify-code", async (req, res) => {
    await handleVerifyCode(req, res, {
      userType: "teacher",
    });
  });

  /**
   * @swagger
   * /teacher/reset-password:
   *   post:
   *     summary: Reset password for teacher
   *     description: Reset teacher password after code verification
   *     tags: [Teachers]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [email, code, newPassword]
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               code:
   *                 type: string
   *               newPassword:
   *                 type: string
   *                 minLength: 8
   *     responses:
   *       200:
   *         description: Password reset successfully
   *       400:
   *         description: Invalid data
   *       500:
   *         description: Failed to reset password
   */
  app.post("/api/teacher/reset-password", async (req, res) => {
    await handleResetPassword(req, res, {
      userType: "teacher",
      getUserByEmail: storage.getTeacherByEmail.bind(storage),
      updateUserPassword: storage.updateTeacherPassword.bind(storage),
    });
  });
}
