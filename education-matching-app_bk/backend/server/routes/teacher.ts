import type { Express } from "express";
import { registerTeacherAuthRoutes } from "./teacher/auth";
import { registerTeacherProfileRoutes } from "./teacher/profile";
import { registerTeacherPasswordRoutes } from "./teacher/password";
import { registerTeacherScheduleRoutes } from "./teacher/schedule";
import { registerTeacherChatRoutes } from "./teacher/chat";
import { registerTeacherCredentialsRoutes } from "./teacher/credentials";
import { registerTeacherBookingRoutes } from "./teacher/bookings";
import { registerTeacherOtpRoutes } from "./teacher/otp";
import { setupTeacherRewardsRoutes } from "./teacher/rewards";

/**
 * Register all teacher routes
 */
export function registerTeacherRoutes(app: Express): void {
  registerTeacherAuthRoutes(app);
  registerTeacherOtpRoutes(app);
  registerTeacherProfileRoutes(app);
  registerTeacherPasswordRoutes(app);
  registerTeacherScheduleRoutes(app);
  registerTeacherChatRoutes(app);
  registerTeacherCredentialsRoutes(app);
  registerTeacherBookingRoutes(app);
  setupTeacherRewardsRoutes(app);
}
