import type { Request, Response } from "express";
import { storage } from "../../storage";
import { hashPassword } from "../../auth";
import { sendSuccess, sendError } from "../../utils/apiResponse";

type UserType = "teacher" | "student";

interface ForgotPasswordOptions {
  userType: UserType;
  getUserByEmail: (email: string) => Promise<any>;
}

interface VerifyCodeOptions {
  userType: UserType;
}

interface ResetPasswordOptions {
  userType: UserType;
  getUserByEmail: (email: string) => Promise<any>;
  updateUserPassword: (userId: string, hashedPassword: string) => Promise<void>;
}

/**
 * Common handler for forgot password request
 */
export async function handleForgotPassword(
  req: Request,
  res: Response,
  options: ForgotPasswordOptions
): Promise<void> {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      return sendError(res, "Email is required", "VALIDATION_ERROR", 400);
    }

    // Check if user exists
    const user = await options.getUserByEmail(email);
    if (!user) {
      return sendError(res, "Email not found", "NOT_FOUND", 404);
    }

    // Generate verification code
    const { generateVerificationCode, sendPasswordResetEmail } = await import(
      "../../utils/email"
    );
    const code = generateVerificationCode();

    // Store the code in database with 15-minute expiry
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // Delete any existing reset tokens for this user before creating a new one
    await storage.deletePasswordResetTokensByEmail(email, options.userType);

    await storage.createPasswordResetToken({
      email,
      code,
      userType: options.userType,
      expiresAt,
    });

    // Send email
    const emailSent = await sendPasswordResetEmail(email, code, user.name);

    if (!emailSent) {
      return sendError(
        res,
        "Failed to send verification code",
        "EMAIL_SEND_FAILED",
        500
      );
    }

    sendSuccess(res, { message: "確認コードをメールアドレスに送信しました" });
  } catch (error) {
    console.error("Error in forgot-password:", error);
    sendError(res, "Failed to process request", "INTERNAL_ERROR", 500);
  }
}

/**
 * Common handler for verification code validation
 */
export async function handleVerifyCode(
  req: Request,
  res: Response,
  options: VerifyCodeOptions
): Promise<void> {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return sendError(
        res,
        "Email and code are required",
        "VALIDATION_ERROR",
        400
      );
    }

    // Find the token
    const token = await storage.findPasswordResetToken(
      email,
      code,
      options.userType
    );

    if (!token) {
      return sendError(res, "Invalid verification code", "INVALID_CODE", 400);
    }

    // Check if token is expired
    if (new Date() > new Date(token.expiresAt)) {
      return sendError(
        res,
        "Verification code has expired",
        "CODE_EXPIRED",
        400
      );
    }

    // Check if token is already used
    if (token.isUsed) {
      return sendError(
        res,
        "Verification code has already been used",
        "CODE_USED",
        400
      );
    }

    sendSuccess(res, { message: "確認コードの検証に成功しました" });
  } catch (error) {
    console.error("Error in verify-code:", error);
    sendError(res, "Failed to verify code", "INTERNAL_ERROR", 500);
  }
}

/**
 * Common handler for password reset
 */
export async function handleResetPassword(
  req: Request,
  res: Response,
  options: ResetPasswordOptions
): Promise<void> {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return sendError(
        res,
        "Email, code, and new password are required",
        "VALIDATION_ERROR",
        400
      );
    }

    if (newPassword.length < 8) {
      return sendError(
        res,
        "Password must be at least 8 characters",
        "VALIDATION_ERROR",
        400
      );
    }

    // Find and verify the token
    const token = await storage.findPasswordResetToken(
      email,
      code,
      options.userType
    );

    if (!token) {
      return sendError(res, "Invalid verification code", "INVALID_CODE", 400);
    }

    if (new Date() > new Date(token.expiresAt)) {
      return sendError(
        res,
        "Verification code has expired",
        "CODE_EXPIRED",
        400
      );
    }

    if (token.isUsed) {
      return sendError(
        res,
        "Verification code has already been used",
        "CODE_USED",
        400
      );
    }

    // Get user
    const user = await options.getUserByEmail(email);
    if (!user) {
      return sendError(res, `${options.userType === "teacher" ? "Teacher" : "User"} not found`, "NOT_FOUND", 404);
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await options.updateUserPassword(user.id, hashedPassword);

    // Mark token as used
    await storage.markPasswordResetTokenAsUsed(token.id);

    sendSuccess(res, { message: "パスワードがリセットされました" });
  } catch (error) {
    console.error("Error in reset-password:", error);
    sendError(res, "Failed to reset password", "INTERNAL_ERROR", 500);
  }
}
