import type { Express } from "express";
import { storage } from "../../storage";
import {
  handleForgotPassword,
  handleVerifyCode,
  handleResetPassword,
} from "../shared/password";

/**
 * Register student password reset routes
 */
export function registerStudentPasswordRoutes(app: Express): void {
  /**
   * @swagger
   * /student/forgot-password:
   *   post:
   *     summary: Request password reset code
   *     description: Send a 6-digit verification code to the user's email for password reset
   *     tags: [Students]
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
   *                 example: "student@example.com"
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
  app.post("/api/student/forgot-password", async (req, res) => {
    await handleForgotPassword(req, res, {
      userType: "student",
      getUserByEmail: storage.getUserByEmail.bind(storage),
    });
  });

  /**
   * @swagger
   * /student/verify-code:
   *   post:
   *     summary: Verify password reset code
   *     description: Verify the 6-digit code sent to user's email
   *     tags: [Students]
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
  app.post("/api/student/verify-code", async (req, res) => {
    await handleVerifyCode(req, res, {
      userType: "student",
    });
  });

  /**
   * @swagger
   * /student/reset-password:
   *   post:
   *     summary: Reset password
   *     description: Reset user password after code verification
   *     tags: [Students]
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
  app.post("/api/student/reset-password", async (req, res) => {
    await handleResetPassword(req, res, {
      userType: "student",
      getUserByEmail: storage.getUserByEmail.bind(storage),
      updateUserPassword: storage.updateUserPassword.bind(storage),
    });
  });
}
