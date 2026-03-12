import type { Express } from "express";
import { registerStudentAuthRoutes } from "./student/auth";
import { registerStudentProfileRoutes } from "./student/profile";
import { registerStudentPasswordRoutes } from "./student/password";
import { registerStudentTeacherRoutes } from "./student/teachers";
import { registerStudentBookingRoutes } from "./student/bookings";
import { registerStudentChatRoutes } from "./student/chat";
import { registerStudentPlanRoutes } from "./student/plans";
import { registerStudentPaymentRoutes } from "./student/payments";
import { registerStudentOtpRoutes } from "./student/otp";

/**
 * Register all student routes
 */
export function registerStudentRoutes(app: Express): void {
  registerStudentAuthRoutes(app);
  registerStudentOtpRoutes(app);
  registerStudentProfileRoutes(app);
  registerStudentPasswordRoutes(app);
  registerStudentTeacherRoutes(app);
  registerStudentBookingRoutes(app);
  registerStudentChatRoutes(app);
  registerStudentPlanRoutes(app);
  registerStudentPaymentRoutes(app);
}
