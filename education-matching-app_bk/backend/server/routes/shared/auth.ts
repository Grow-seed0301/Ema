import type { Request, Response } from "express";
import { storage } from "../../storage";
import { hashPassword, comparePasswords } from "../../auth";
import { stripPassword } from "../../utils/password";
import { userRegistrationSchema } from "../../utils/schemas";
import { sendSuccess, sendError } from "../../utils/apiResponse";
import { generateAccessToken, generateRefreshToken } from "../../utils/jwt";
import { logErrorToDatabase } from "../../utils/errorLogger";
import { getErrorMessageWithParams, ERROR_MESSAGE_KEYS } from "../../utils/errorMessages";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type UserType = "teacher" | "student";

interface RegisterOptions {
  userType: UserType;
  getExistingUser: (email: string) => Promise<any>;
  createUser: (data: any) => Promise<any>;
}

interface LoginOptions {
  userType: UserType;
  getUserByEmail: (email: string) => Promise<any>;
}

/**
 * Common registration handler for both teachers and students
 */
export async function handleRegister(
  req: Request,
  res: Response,
  options: RegisterOptions
): Promise<void> {
  try {
    const parsed = userRegistrationSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, "Invalid data", "VALIDATION_ERROR", 400);
    }

    const { name, email, password } = parsed.data;

    // Check if user already exists
    const existingUser = await options.getExistingUser(email);
    if (existingUser) {
      return sendError(res, "Email already exists", "EMAIL_EXISTS", 409);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user (not verified yet)
    const user = await options.createUser({
      name,
      email,
      password: hashedPassword,
    });

    // Return user info without tokens (user needs to verify email first)
    sendSuccess(
      res,
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          emailVerified: false,
        },
        message: "登録が完了しました。メールを確認してください。",
      },
      201
    );
  } catch (error) {
    console.error(`Error registering ${options.userType}:`, error);
    // Log error to database
    await logErrorToDatabase(error as Error, req, {
      errorCode: "REGISTRATION_FAILED",
      statusCode: 500,
      userType: options.userType,
    });
    const errorMessage = getErrorMessageWithParams(ERROR_MESSAGE_KEYS.FAILED_TO_REGISTER_USER, { userType: options.userType });
    sendError(res, errorMessage, "REGISTRATION_FAILED", 500);
  }
}

/**
 * Common login handler for both teachers and students
 */
export async function handleLogin(
  req: Request,
  res: Response,
  options: LoginOptions
): Promise<void> {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, "Invalid data", "VALIDATION_ERROR", 400);
    }

    const { email, password } = parsed.data;
    const user = await options.getUserByEmail(email);

    // Ensure user exists and has a password set
    // (OAuth users may not have passwords)
    if (!user || !user.password) {
      return sendError(
        res,
        "Invalid email or password",
        "INVALID_CREDENTIALS",
        401
      );
    }

    const isValid = await comparePasswords(password, user.password);
    if (!isValid) {
      return sendError(
        res,
        "Invalid email or password",
        "INVALID_CREDENTIALS",
        401
      );
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id, options.userType);
    const refreshToken = generateRefreshToken(user.id, options.userType);

    req.session.userId = user.id;
    sendSuccess(res, {
      user: stripPassword(user),
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error(`Error logging in ${options.userType}:`, error);
    // Log error to database
    await logErrorToDatabase(error as Error, req, {
      errorCode: "LOGIN_FAILED",
      statusCode: 500,
      userType: options.userType,
    });
    sendError(res, "Failed to login", "LOGIN_FAILED", 500);
  }
}

/**
 * Common logout handler for both teachers and students
 */
export function handleLogout(req: Request, res: Response): void {
  req.session.destroy((err) => {
    if (err) {
      return sendError(res, "Failed to logout", "LOGOUT_FAILED", 500);
    }
    sendSuccess(res, { message: "ログアウトしました" });
  });
}
