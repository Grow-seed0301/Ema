import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import type { Express } from "express";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Education Admin Dashboard API",
      version: "1.0.0",
      description: "API documentation for the Education Admin Dashboard - Japanese Language Learning Platform",
      contact: {
        name: "API Support",
      },
    },
    servers: [
      {
        url: "/api",
        description: "API Server",
      },
    ],
    components: {
      securitySchemes: {
        sessionAuth: {
          type: "apiKey",
          in: "cookie",
          name: "connect.sid",
          description: "Session-based authentication",
        },
      },
      schemas: {
        Admin: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            email: { type: "string", format: "email", example: "admin@example.com" },
            name: { type: "string", example: "Admin User" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            email: { type: "string", format: "email" },
            name: { type: "string" },
            firstName: { type: "string", nullable: true },
            lastName: { type: "string", nullable: true },
            phone: { type: "string", nullable: true },
            isActive: { type: "boolean" },
            avatarUrl: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        Plan: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            nameEn: { type: "string", nullable: true },
            description: { type: "string", nullable: true },
            price: { type: "string" },
            totalLessons: { type: "integer" },
            durationDays: { type: "integer" },
            features: { type: "array", items: { type: "string" }, nullable: true },
            isActive: { type: "boolean" },
            sortOrder: { type: "integer" },
          },
        },
        Booking: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            studentId: { type: "string", format: "uuid" },
            teacherId: { type: "string", format: "uuid" },
            scheduledAt: { type: "string", format: "date-time" },
            duration: { type: "integer" },
            status: { type: "string", enum: ["pending", "confirmed", "completed", "cancelled"] },
            notes: { type: "string", nullable: true },
            cancelReason: { type: "string", nullable: true },
          },
        },
        Payment: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            userId: { type: "string", format: "uuid" },
            planId: { type: "string", format: "uuid" },
            amount: { type: "string" },
            status: { type: "string", enum: ["pending", "completed", "failed", "refunded"] },
            paymentMethod: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        DashboardStats: {
          type: "object",
          properties: {
            totalUsers: { type: "integer" },
            totalTeachers: { type: "integer" },
            totalLessons: { type: "integer" },
            totalRevenue: { type: "string" },
            monthlyRevenue: { type: "string" },
            activeSubscriptions: { type: "integer" },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email", example: "admin@example.com" },
            password: { type: "string", example: "admin123" },
          },
        },
        Error: {
          type: "object",
          properties: {
            message: { type: "string" },
          },
        },
        PaginatedResponse: {
          type: "object",
          properties: {
            total: { type: "integer" },
            page: { type: "integer" },
            limit: { type: "integer" },
            totalPages: { type: "integer" },
          },
        },
      },
    },
    tags: [
      { name: "Authentication", description: "Admin authentication endpoints" },
      { name: "Dashboard", description: "Dashboard statistics and charts" },
      { name: "Users", description: "User management endpoints" },
      { name: "Students", description: "Student authentication and management" },
      { name: "Teachers", description: "Teacher management endpoints" },
      { name: "Plans", description: "Subscription plan management" },
      { name: "Lessons", description: "Lesson/Booking management" },
      { name: "Payments", description: "Payment management" },
    ],
  },
  apis: ["./server/routes/**/*.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export function setupSwagger(app: Express): void {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Education Admin API Documentation",
  }));

  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });
}
