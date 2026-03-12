import type { Request, Response } from "express";
import { storage } from "../../storage";
import { sendError, sendSuccess } from "../../utils/apiResponse";
import { generateVerificationCode, sendEmailVerificationCode } from "../../utils/email";
import { logErrorToDatabase } from "../../utils/errorLogger";
import { generateAccessToken, generateRefreshToken } from "../../utils/jwt";
import { stripPassword } from "../../utils/password";
import { z } from "zod";

const sendOtpSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

const verifyOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

type UserType = "teacher" | "student";

interface SendOtpOptions {
  userType: UserType;
  getUserByEmail: (email: string) => Promise<any>;
  updateUser: (id: string, data: any) => Promise<any>;
}

interface VerifyOtpOptions {
  userType: UserType;
  getUserByEmail: (email: string) => Promise<any>;
  updateUser: (id: string, data: any) => Promise<any>;
}

/**
 * Common handler for sending OTP verification code
 */
export async function handleSendOtp(
  req: Request,
  res: Response,
  options: SendOtpOptions
): Promise<void> {
  try {
    const parsed = sendOtpSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, "Invalid data", "VALIDATION_ERROR", 400);
    }

    const { email, name } = parsed.data;

    // Get user
    const user = await options.getUserByEmail(email);
    if (!user) {
      return sendError(res, "User not found", "USER_NOT_FOUND", 404);
    }

    // Check if already verified
    if (user.emailVerified) {
      return sendError(res, "Email already verified", "ALREADY_VERIFIED", 400);
    }

    // Generate verification code
    const code = generateVerificationCode();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user with verification code
    await options.updateUser(user.id, {
      verificationCode: code,
      verificationCodeExpiry: expiry,
    });

    // Send email
    const emailSent = await sendEmailVerificationCode(
      email,
      code,
      name || user.name
    );

    if (!emailSent) {
      return sendError(
        res,
        "Failed to send verification email",
        "EMAIL_SEND_FAILED",
        500
      );
    }

    sendSuccess(res, {
      message: "確認コードを送信しました",
      email: email,
    });
  } catch (error) {
    console.error(`Error sending OTP for ${options.userType}:`, error);
    await logErrorToDatabase(error as Error, req, {
      errorCode: "SEND_OTP_FAILED",
      statusCode: 500,
      userType: options.userType,
    });
    sendError(res, "Failed to send verification code", "SEND_OTP_FAILED", 500);
  }
}

/**
 * Common handler for verifying OTP code
 */
export async function handleVerifyOtp(
  req: Request,
  res: Response,
  options: VerifyOtpOptions
): Promise<void> {
  try {
    const parsed = verifyOtpSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, "Invalid data", "VALIDATION_ERROR", 400);
    }

    const { email, code } = parsed.data;

    // Get user
    const user = await options.getUserByEmail(email);
    if (!user) {
      return sendError(res, "User not found", "USER_NOT_FOUND", 404);
    }

    // Check if already verified
    if (user.emailVerified) {
      return sendError(res, "Email already verified", "ALREADY_VERIFIED", 400);
    }

    // Check if code matches
    if (user.verificationCode !== code) {
      return sendError(res, "Invalid verification code", "INVALID_CODE", 400);
    }

    // Check if code has expired
    if (!user.verificationCodeExpiry || new Date() > new Date(user.verificationCodeExpiry)) {
      return sendError(
        res,
        "Verification code has expired",
        "CODE_EXPIRED",
        400
      );
    }

    // Mark email as verified and clear verification code
    await options.updateUser(user.id, {
      emailVerified: true,
      verificationCode: null,
      verificationCodeExpiry: null,
    });

    // Generate tokens for the user
    const accessToken = generateAccessToken(user.id, options.userType);
    const refreshToken = generateRefreshToken(user.id, options.userType);

    sendSuccess(res, {
      message: "メールアドレスが確認されました",
      user: stripPassword(user),
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error(`Error verifying OTP for ${options.userType}:`, error);
    await logErrorToDatabase(error as Error, req, {
      errorCode: "VERIFY_OTP_FAILED",
      statusCode: 500,
      userType: options.userType,
    });
    sendError(
      res,
      "Failed to verify code",
      "VERIFY_OTP_FAILED",
      500
    );
  }
}
