import type { Response } from "express";
import { getErrorMessage, type ErrorMessageKey } from "./errorMessages";

/**
 * Standard API response format that matches the frontend ApiResponse<T> interface
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  message?: string;
}

/**
 * Send a successful API response with data
 * @param res - Express response object
 * @param data - Data to send in the response
 * @param statusCode - HTTP status code (defaults to 200)
 */
export function sendSuccess<T>(res: Response, data: T, statusCode: number = 200): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };
  res.status(statusCode).json(response);
}

/**
 * Send an error API response
 * @param res - Express response object
 * @param message - Error message key or string (will be translated to Japanese if it's a valid key)
 * @param code - Error code (defaults to "UNKNOWN")
 * @param statusCode - HTTP status code (defaults to 500)
 * 
 * Note: The message field is duplicated at the top level for backwards compatibility
 * with clients that may check either location
 */
export function sendError(
  res: Response,
  message: ErrorMessageKey | string,
  code: string = "UNKNOWN",
  statusCode: number = 500
): void {
  // Get the translated message (handles both constants and legacy strings)
  const translatedMessage = getErrorMessage(message);
  const response: ApiResponse<never> = {
    success: false,
    error: {
      code,
      message: translatedMessage,
    },
    message: translatedMessage, // Include top-level message for compatibility
  };
  res.status(statusCode).json(response);
}
