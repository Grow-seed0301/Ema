import type { Express } from "express";
import { storage } from "../../storage";
import { handleSendOtp, handleVerifyOtp } from "../shared/otp";

/**
 * @swagger
 * /api/teacher/send-otp:
 *   post:
 *     tags: [Teacher Auth]
 *     summary: Send OTP verification code to teacher email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Verification code sent successfully
 *       400:
 *         description: Invalid data or email already verified
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to send verification code
 */
export function registerTeacherOtpRoutes(app: Express): void {
  app.post("/api/teacher/send-otp", async (req, res) => {
    await handleSendOtp(req, res, {
      userType: "teacher",
      getUserByEmail: storage.getTeacherByEmail.bind(storage),
      updateUser: storage.updateTeacher.bind(storage),
    });
  });

  /**
   * @swagger
   * /api/teacher/verify-otp:
   *   post:
   *     tags: [Teacher Auth]
   *     summary: Verify OTP code for teacher email
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - code
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               code:
   *                 type: string
   *                 minLength: 6
   *                 maxLength: 6
   *     responses:
   *       200:
   *         description: Email verified successfully
   *       400:
   *         description: Invalid data, code, or email already verified
   *       404:
   *         description: User not found
   *       500:
   *         description: Failed to verify code
   */
  app.post("/api/teacher/verify-otp", async (req, res) => {
    await handleVerifyOtp(req, res, {
      userType: "teacher",
      getUserByEmail: storage.getTeacherByEmail.bind(storage),
      updateUser: storage.updateTeacher.bind(storage),
    });
  });
}
