import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { verifyAccessToken } from "./utils/jwt";
import { DEFAULT_NODE_ENV } from "./constants/env";
import { getErrorMessage, ERROR_MESSAGE_KEYS } from "./utils/errorMessages";

declare module "express-session" {
  interface SessionData {
    adminId?: string;
    userId?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
    }
  }
}

export function getSession() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is required for session storage");
  }
  
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: (process.env.NODE_ENV || DEFAULT_NODE_ENV) === "production",
      maxAge: sessionTtl,
    },
  });
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePasswords(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // First, try to authenticate with JWT token from Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      const payload = verifyAccessToken(token);
      req.userId = payload.userId;
      req.userRole = payload.role;
      return next();
    } catch (error) {
      // Token invalid, continue to check session
    }
  }

  // Fall back to session-based authentication
  if (!req.session.adminId && !req.session.userId) {
    return res.status(401).json({ message: getErrorMessage(ERROR_MESSAGE_KEYS.UNAUTHORIZED) });
  }
  
  // Set userId from session for backwards compatibility
  if (req.session.userId) {
    req.userId = req.session.userId;
  }
  
  next();
};

export const isAdmin: RequestHandler = async (req, res, next) => {
  if (!req.session.adminId) {
    return res.status(401).json({ message: getErrorMessage(ERROR_MESSAGE_KEYS.UNAUTHORIZED) });
  }
  
  const admin = await storage.getAdmin(req.session.adminId);
  if (!admin) {
    return res.status(403).json({ message: getErrorMessage(ERROR_MESSAGE_KEYS.FORBIDDEN_ADMIN_ACCESS_REQUIRED) });
  }
  
  next();
};
