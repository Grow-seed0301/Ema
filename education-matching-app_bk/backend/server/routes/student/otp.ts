import type { Express } from "express";
import { storage } from "../../storage";
import { handleSendOtp, handleVerifyOtp } from "../shared/otp";

/**
 * @swagger
 * /api/student/send-otp:
 *   post:
 *     tags: [Student Auth]
 *     summary: Send OTP verification code to student email
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
export function registerStudentOtpRoutes(app: Express): void {
  app.post("/api/student/send-otp", async (req, res) => {
    await handleSendOtp(req, res, {
      userType: "student",
      getUserByEmail: storage.getUserByEmail.bind(storage),
      updateUser: storage.updateUser.bind(storage),
    });
  });

  /**
   * @swagger
   * /api/student/verify-otp:
   *   post:
   *     tags: [Student Auth]
   *     summary: Verify OTP code for student email
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
  app.post("/api/student/verify-otp", async (req, res) => {
    await handleVerifyOtp(req, res, {
      userType: "student",
      getUserByEmail: storage.getUserByEmail.bind(storage),
      updateUser: storage.updateUser.bind(storage),
    });
  });
}
