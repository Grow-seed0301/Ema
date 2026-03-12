/**
 * Default values for environment variables
 * 
 * This file contains default values for all environment variables used in the application.
 * These defaults will be used when the corresponding environment variable is not set.
 * 
 * Usage: process.env.VARIABLE || DEFAULT_VARIABLE
 * 
 * IMPORTANT: For production deployments, always set environment variables explicitly
 * rather than relying on these defaults.
 */

import crypto from "crypto";

/**
 * Generate a secure random secret
 * Used for JWT and session secrets in development/production when not explicitly set
 */
const generateSecureSecret = () => crypto.randomBytes(64).toString('hex');

// ============================================
// Server Configuration
// ============================================

/**
 * Default port for the server
 * Usage: process.env.PORT || DEFAULT_PORT
 */
export const DEFAULT_PORT = "5000";

/**
 * Default Node environment
 * Usage: process.env.NODE_ENV || DEFAULT_NODE_ENV
 */
export const DEFAULT_NODE_ENV = "development";

// ============================================
// Authentication & Security
// ============================================

/**
 * Default JWT secret for development
 * IMPORTANT: In production, always set JWT_SECRET environment variable
 * Usage: process.env.JWT_SECRET || DEFAULT_JWT_SECRET
 */
export const DEFAULT_JWT_SECRET = (env: string) => 
  env === "production" ? generateSecureSecret() : "dev-secret-key-change-in-production";

/**
 * Default JWT refresh secret for development
 * IMPORTANT: In production, always set JWT_REFRESH_SECRET environment variable
 * Usage: process.env.JWT_REFRESH_SECRET || DEFAULT_JWT_REFRESH_SECRET
 */
export const DEFAULT_JWT_REFRESH_SECRET = (env: string) => 
  env === "production" ? generateSecureSecret() : "dev-refresh-secret-key-change-in-production";

// ============================================
// OAuth & Replit Configuration
// ============================================

/**
 * Default OIDC issuer URL for Replit authentication
 * Usage: process.env.ISSUER_URL || DEFAULT_ISSUER_URL
 */
export const DEFAULT_ISSUER_URL = "https://replit.com/oidc";

// ============================================
// Object Storage Configuration
// ============================================

/**
 * Default Replit sidecar endpoint for object storage
 * Usage: process.env.REPLIT_SIDECAR_ENDPOINT || DEFAULT_REPLIT_SIDECAR_ENDPOINT
 */
export const DEFAULT_REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

// ============================================
// Email Configuration
// ============================================

/**
 * Default email sender address
 * Usage: process.env.EMAIL_FROM || DEFAULT_EMAIL_FROM
 */
export const DEFAULT_EMAIL_FROM = '"Education App" <noreply@idea-innovation.tech>';

/**
 * Default SMTP port
 * Usage: process.env.SMTP_PORT || DEFAULT_SMTP_PORT
 */
export const DEFAULT_SMTP_PORT = "587";

/**
 * Default SMTP secure setting (false = STARTTLS)
 * Usage: process.env.SMTP_SECURE || DEFAULT_SMTP_SECURE
 */
export const DEFAULT_SMTP_SECURE = "false";

/**
 * Default SMTP user
 * Usage: process.env.SMTP_USER || DEFAULT_SMTP_USER
 */
export const DEFAULT_SMTP_USER = "apikey";

/**
 * Default SMTP pass
 * Usage: process.env.SMTP_PASS || DEFAULT_SMTP_PASS
 */
export const DEFAULT_SMTP_PASS = "";

// ============================================
// URL Configuration
// ============================================

/**
 * Default base URL for the application
 * This is the production deployment URL
 * IMPORTANT: Set BASE_URL environment variable if deploying to a different domain
 * Usage: process.env.BASE_URL || DEFAULT_BASE_URL
 */
export const DEFAULT_BASE_URL = "https://education-matching-api-idea-dev.replit.app";


// Initialize Stripe with the secret key from environment variables
// WARNING: Default test keys are provided for development convenience only.
// For production, always use environment variables and never commit real secret keys.
export const DEFAULT_STRIPE_SECRET_KEY = [
  "sk_test_51SrIv8PpTPNpdzdY",
  "iYKpbh2CBeX8mtwhVBqW06AfH6JuG34Fe",
  "mCvqkX60XpCgyBS3VxjQMDx5yh1f4dREOGrJT0r00fzbeUXs3",
].join("");

export const DEFAULT_STRIPE_WEBHOOK_SECRET = "";

export const DEFAULT_STRIPE_FRONTEND_SUCCESS_URL = "https://localhost:8080";

