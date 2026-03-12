import jwt from "jsonwebtoken";
import { DEFAULT_JWT_SECRET, DEFAULT_JWT_REFRESH_SECRET, DEFAULT_NODE_ENV } from "../constants/env";

const nodeEnv = process.env.NODE_ENV || DEFAULT_NODE_ENV;
const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_JWT_SECRET(nodeEnv);
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || DEFAULT_JWT_REFRESH_SECRET(nodeEnv);

// Log warning in production if using generated secrets
if (nodeEnv === "production" && (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET)) {
  console.warn("Warning: JWT_SECRET or JWT_REFRESH_SECRET not set. Using auto-generated secrets (tokens will be invalidated on restart).");
}

const ACCESS_TOKEN_EXPIRY = "15m"; // 15 minutes
const REFRESH_TOKEN_EXPIRY = "7d"; // 7 days

export interface JwtPayload {
  userId: string;
  role: string;
}

/**
 * Generate an access token for a user
 * @param userId - The user's ID
 * @param role - The user's role (student, teacher, admin)
 * @returns JWT access token
 */
export function generateAccessToken(userId: string, role: string): string {
  const payload: JwtPayload = { userId, role };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

/**
 * Generate a refresh token for a user
 * @param userId - The user's ID
 * @param role - The user's role (student, teacher, admin)
 * @returns JWT refresh token
 */
export function generateRefreshToken(userId: string, role: string): string {
  const payload: JwtPayload = { userId, role };
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

/**
 * Verify an access token
 * @param token - The JWT access token to verify
 * @returns Decoded payload if valid
 * @throws Error if token is invalid or expired
 */
export function verifyAccessToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    throw new Error("Invalid or expired access token");
  }
}

/**
 * Verify a refresh token
 * @param token - The JWT refresh token to verify
 * @returns Decoded payload if valid
 * @throws Error if token is invalid or expired
 */
export function verifyRefreshToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as JwtPayload;
  } catch (error) {
    throw new Error("Invalid or expired refresh token");
  }
}
