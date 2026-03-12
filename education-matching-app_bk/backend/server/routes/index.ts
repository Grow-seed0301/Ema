import type { Express } from "express";
import { registerAdminRoutes } from "./admin";
import { registerTeacherRoutes } from "./teacher";
import { registerStudentRoutes } from "./student";
import { storage } from "../storage";
import { insertInquirySchema } from "@shared/schema";
import { sendSuccess, sendError } from "../utils/apiResponse";

export function registerRoleBasedRoutes(app: Express): void {
  registerAdminRoutes(app);
  registerTeacherRoutes(app);
  registerStudentRoutes(app);
  
  /**
   * @swagger
   * /inquiries:
   *   post:
   *     summary: Submit inquiry
   *     description: Submit a new inquiry/contact form (public endpoint)
   *     tags: [Inquiries]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               email:
   *                 type: string
   *               message:
   *                 type: string
   *     responses:
   *       201:
   *         description: Inquiry submitted successfully
   *       400:
   *         description: Invalid data
   */
  app.post("/api/inquiries", async (req, res) => {
    try {
      const parsed = insertInquirySchema.safeParse(req.body);
      if (!parsed.success) {
        return sendError(res, "Invalid inquiry data", "VALIDATION_ERROR", 400);
      }
      const inquiry = await storage.createInquiry(parsed.data);
      sendSuccess(res, inquiry, 201);
    } catch (error) {
      console.error("Error creating inquiry:", error);
      sendError(res, "Failed to submit inquiry", "CREATE_FAILED", 500);
    }
  });
  
  /**
   * @swagger
   * /terms-of-service:
   *   get:
   *     summary: Get terms of service
   *     description: Get the terms of service (public endpoint)
   *     tags: [Terms of Service]
   *     responses:
   *       200:
   *         description: Terms of service
   */
  app.get("/api/terms-of-service", async (req, res) => {
    try {
      const terms = await storage.getTermsOfService();
      sendSuccess(res, terms);
    } catch (error) {
      console.error("Error fetching terms:", error);
      sendError(res, "Failed to fetch terms", "FETCH_FAILED", 500);
    }
  });
  
  /**
   * @swagger
   * /privacy-policy:
   *   get:
   *     summary: Get privacy policy
   *     description: Get the privacy policy (public endpoint)
   *     tags: [Privacy Policy]
   *     responses:
   *       200:
   *         description: Privacy policy
   */
  app.get("/api/privacy-policy", async (req, res) => {
    try {
      const policy = await storage.getPrivacyPolicy();
      sendSuccess(res, policy);
    } catch (error) {
      console.error("Error fetching privacy policy:", error);
      sendError(res, "Failed to fetch privacy policy", "FETCH_FAILED", 500);
    }
  });
  
  /**
   * @swagger
   * /faq-categories:
   *   get:
   *     summary: Get active FAQ categories
   *     description: Get list of active FAQ categories for public display (public endpoint)
   *     tags: [FAQs]
   *     responses:
   *       200:
   *         description: List of active FAQ categories
   */
  app.get("/api/faq-categories", async (req, res) => {
    try {
      const categories = await storage.getAllFaqCategories();
      const activeCategories = categories.filter(cat => cat.isActive);
      sendSuccess(res, activeCategories);
    } catch (error) {
      console.error("Error fetching FAQ categories:", error);
      sendError(res, "Failed to fetch FAQ categories", "FETCH_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /faqs:
   *   get:
   *     summary: Get active FAQs
   *     description: Get list of active FAQs for public display (public endpoint)
   *     tags: [FAQs]
   *     parameters:
   *       - in: query
   *         name: category
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: List of active FAQs
   */
  app.get("/api/faqs", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const faqs = await storage.getAllFaqs({ category, isActive: true });
      sendSuccess(res, faqs);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      sendError(res, "Failed to fetch FAQs", "FETCH_FAILED", 500);
    }
  });

  /**
   * @swagger
   * /subjects:
   *   get:
   *     summary: Get all subjects with categories
   *     description: Get list of all active subjects grouped by categories (public endpoint)
   *     tags: [Subjects]
   *     responses:
   *       200:
   *         description: List of subject categories with subjects
   */
  app.get("/api/subjects", async (req, res) => {
    try {
      const categories = await storage.getAllSubjectCategories();
      const allSubjects = await storage.getAllSubjects();
      const allGroups = await storage.getAllSubjectGroups();
      
      // Filter only active categories, subjects, and groups
      const activeCategories = categories.filter(cat => cat.isActive);
      const activeSubjects = allSubjects.filter(subj => subj.isActive);
      const activeGroups = allGroups.filter(group => group.isActive);
      
      // Group subjects by category and include groups for each subject
      const categoriesWithSubjects = activeCategories.map(category => ({
        id: category.id,
        name: category.name,
        sortOrder: category.sortOrder,
        subjects: activeSubjects
          .filter(subject => subject.categoryId === category.id)
          .map(subject => ({
            id: subject.id,
            name: subject.name,
            isPopular: subject.isPopular,
            targetElementary: subject.targetElementary,
            targetJuniorHigh: subject.targetJuniorHigh,
            targetHighSchool: subject.targetHighSchool,
            targetUniversityAdult: subject.targetUniversityAdult,
            sortOrder: subject.sortOrder,
            groups: activeGroups
              .filter(group => group.subjectId === subject.id)
              .map(group => ({
                id: group.id,
                name: group.name,
                sortOrder: group.sortOrder,
              })),
          })),
      }));
      
      sendSuccess(res, { categories: categoriesWithSubjects });
    } catch (error) {
      console.error("Error fetching subjects:", error);
      sendError(res, "Failed to fetch subjects", "FETCH_FAILED", 500);
    }
  });
  
  /**
   * @swagger
   * /objects/{objectPath}:
   *   get:
   *     summary: Get uploaded object
   *     description: Retrieve an uploaded file by its object path (public access for public visibility files)
   *     tags: [Files]
   *     parameters:
   *       - in: path
   *         name: objectPath
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: File content
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Object not found
   */
  app.get("/objects/*", async (req, res) => {
    try {
      const { ObjectStorageService, ObjectNotFoundError } = await import("../objectStorage");
      const { ObjectPermission } = await import("../objectAcl");
      const { verifyAccessToken } = await import("../utils/jwt");
      const objectStorageService = new ObjectStorageService();
      
      // Extract userId from JWT token or session for access control
      let userId: string | undefined;
      
      // First, try to authenticate with JWT token from Authorization header
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        try {
          const payload = verifyAccessToken(token);
          userId = payload.userId;
        } catch (error) {
          // Token invalid, continue to check session
        }
      }
      
      // Fall back to session-based authentication
      if (!userId && req.session.userId) {
        userId = req.session.userId;
      }
      
      // Check if it's a public object path
      let objectFile;
      if (req.path.startsWith("/objects/public/")) {
        objectFile = await objectStorageService.getPublicObjectFile(req.path);
      } else {
        objectFile = await objectStorageService.getObjectEntityFile(req.path);
      }
      
      const canAccess = await objectStorageService.canAccessObjectEntity({
        userId,
        objectFile,
        requestedPermission: ObjectPermission.READ,
      });
      
      if (!canAccess) {
        return res.sendStatus(401);
      }
      
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error fetching object:", error);
      const { ObjectNotFoundError } = await import("../objectStorage");
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });
}
