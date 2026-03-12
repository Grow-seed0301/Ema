import type { Request, Response, NextFunction } from "express";
import { db } from "../db";
import { errorLogs } from "@shared/schema";

interface ErrorLogData {
  errorMessage: string;
  errorStack?: string;
  errorCode?: string;
  statusCode?: number;
  method?: string;
  url?: string;
  userId?: string;
  userType?: string;
  metadata?: Record<string, any>;
}

/**
 * Sanitize sensitive data from request body
 */
function sanitizeRequestData(data: any): any {
  if (!data || typeof data !== 'object') return data;
  
  const sensitiveFields = ['password', 'token', 'accessToken', 'refreshToken', 'secret', 'apiKey'];
  const sanitized = { ...data };
  
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

/**
 * Log an error to the database
 * @param error - The error object or message
 * @param req - Optional Express request object for context
 * @param additionalData - Additional data to include in the log
 */
export async function logErrorToDatabase(
  error: Error | string,
  req?: Request,
  additionalData?: Partial<ErrorLogData>
): Promise<void> {
  try {
    const errorMessage = typeof error === "string" ? error : error.message;
    const errorStack = typeof error === "string" ? undefined : error.stack;

    const logData: ErrorLogData = {
      errorMessage,
      errorStack,
      method: req?.method,
      url: req?.originalUrl || req?.url,
      ...additionalData,
    };

    await db.insert(errorLogs).values(logData);
  } catch (logError) {
    // If logging fails, just log to console to avoid infinite loop
    console.error("Failed to log error to database:", logError);
  }
}

/**
 * Express middleware to log errors to the database
 */
export function errorLoggingMiddleware(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log the error to database asynchronously
  logErrorToDatabase(err, req, {
    errorCode: err.code,
    statusCode: err.status || err.statusCode || 500,
    metadata: {
      body: sanitizeRequestData(req.body),
      query: req.query,
      params: req.params,
    },
  }).catch((logError) => {
    console.error("Error logging middleware failed:", logError);
  });

  // Pass to the next error handler
  next(err);
}
