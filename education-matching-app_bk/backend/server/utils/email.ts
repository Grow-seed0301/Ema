import nodemailer from "nodemailer";
import { randomInt } from "crypto";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { DEFAULT_NODE_ENV, DEFAULT_SMTP_PORT, DEFAULT_SMTP_SECURE, DEFAULT_EMAIL_FROM, DEFAULT_SMTP_USER, DEFAULT_SMTP_PASS } from "../constants/env";
import { storage } from "../storage";

// ES module compatibility: get __dirname equivalent
// Handle both ESM and CJS environments
function getBaseDir(): string {
  try {
    // In ESM environment, import.meta.url is available
    if (typeof import.meta !== 'undefined' && import.meta.url) {
      const __filename = fileURLToPath(import.meta.url);
      return dirname(__filename);
    }
  } catch (error) {
    // Log if unexpected error occurs accessing import.meta
    console.warn('Failed to resolve path from import.meta.url:', error);
  }
  
  // In CJS/bundled environment, use the directory of the main module
  // The build script (script/build.ts) bundles the server to dist/index.cjs
  // and copies templates to dist/templates, so both are in the dist/ directory.
  // require.main.filename will be dist/index.cjs, and dirname gives us dist/
  // Note: In CommonJS, 'require' is available as a global
  if (typeof require !== 'undefined' && require.main?.filename) {
    return dirname(require.main.filename);
  }
  
  // Fallback: use process.argv[1] (path to the main script)
  // This should work if the above methods fail
  return dirname(process.argv[1] || process.cwd());
}

const __dirname = getBaseDir();

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

// Create a transporter based on environment
function createTransporter() {
  const nodeEnv = process.env.NODE_ENV || DEFAULT_NODE_ENV;
  
  // In production, use a real SMTP service
  // For development/testing, we'll use console logging
  if (nodeEnv === "production" && process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || DEFAULT_SMTP_PORT),
      secure: (process.env.SMTP_SECURE || DEFAULT_SMTP_SECURE) === "true",
      auth: {
        user: process.env.SMTP_USER || DEFAULT_SMTP_USER,
        pass: process.env.SMTP_PASS || DEFAULT_SMTP_PASS,
      },
    });
  }

  // For development, create a test account or log to console
  if (process.env.ETHEREAL_USER && process.env.ETHEREAL_PASS) {
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: process.env.ETHEREAL_USER,
        pass: process.env.ETHEREAL_PASS,
      },
    });
  }

  // Fallback: Create a test transporter that logs to console
  console.warn("No email configuration found. Emails will only be logged to console.");
  return nodemailer.createTransport({
    streamTransport: true,
    newline: 'unix',
    buffer: true,
  });
}

/**
 * Send an email using nodemailer
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  let status: "sent" | "failed" = "sent";
  let errorMessage: string | undefined;
  
  try {
    const transporter = createTransporter();

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || DEFAULT_EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log("Email sent:", info.messageId);
    
    // For development, log the preview URL
    if ((process.env.NODE_ENV || DEFAULT_NODE_ENV) !== "production") {
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }

    status = "sent";
  } catch (error) {
    console.error("Error sending email:", error);
    status = "failed";
    errorMessage = error instanceof Error ? error.message : "Unknown error";
  } finally {
    // Save email log to database
    try {
      await storage.createEmailLog({
        recipient: options.to,
        subject: options.subject,
        textContent: options.text || null,
        htmlContent: options.html || null,
        status,
        errorMessage: errorMessage || null,
      });
    } catch (logError) {
      console.error("Error saving email log:", logError);
      // Don't fail the email send if logging fails
    }
  }

  return status === "sent";
}

// Cache for loaded templates to avoid reading files on every email send
const templateCache = new Map<string, string>();

/**
 * Load email template from file and replace placeholders
 */
function loadTemplate(templateName: string, variables: Record<string, string>): string {
  // Validate template name to prevent directory traversal attacks
  if (!/^[a-z0-9-]+\.(txt|html)$/i.test(templateName)) {
    throw new Error('Invalid template name');
  }
  
  // Check cache first
  const cacheKey = templateName;
  if (!templateCache.has(cacheKey)) {
    // Read and cache template
    const templatePath = join(__dirname, 'templates', templateName);
    templateCache.set(cacheKey, readFileSync(templatePath, 'utf-8'));
  }
  
  let template = templateCache.get(cacheKey)!;
  
  // Replace all {{variable}} placeholders with actual values
  // Using a single pass with string replacement for better performance
  template = template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] || match;
  });
  
  return template;
}

/**
 * Send password reset code email
 */
export async function sendPasswordResetEmail(
  email: string,
  code: string,
  userName?: string,
): Promise<boolean> {
  const subject = "【Education App】パスワードリセットの認証コード";
  
  const variables = {
    userName: userName ? ` ${userName}様` : "",
    code: code,
  };
  
  const text = loadTemplate('password-reset.txt', variables);
  const html = loadTemplate('password-reset.html', variables);

  return sendEmail({
    to: email,
    subject,
    text,
    html,
  });
}

/**
 * Generate a random 6-digit verification code using cryptographically secure random numbers
 */
export function generateVerificationCode(): string {
  // Generate a random number between 100000 and 999999
  const code = randomInt(100000, 1000000);
  return code.toString();
}

/**
 * Send email verification code
 */
export async function sendEmailVerificationCode(
  email: string,
  code: string,
  userName?: string,
): Promise<boolean> {
  const subject = "【Education App】メールアドレス認証コード";
  
  const variables = {
    userName: userName ? ` ${userName}` : "",
    code: code,
  };
  
  const text = loadTemplate('email-verification.txt', variables);
  const html = loadTemplate('email-verification.html', variables);

  return sendEmail({
    to: email,
    subject,
    text,
    html,
  });
}
