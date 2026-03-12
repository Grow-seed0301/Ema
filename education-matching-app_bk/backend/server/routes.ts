import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { registerRoleBasedRoutes } from "./routes/index";
import { setupSwagger } from "./swagger";
import { setupOAuth } from "./oauthConfig";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  // Setup OAuth for SNS login
  setupOAuth(app);

  // Setup Swagger API documentation
  setupSwagger(app);

  // Register role-based routes
  registerRoleBasedRoutes(app);

  return httpServer;
}
