import type { Express } from "express";
import { storage } from "../../storage";
import { isAuthenticated } from "../../auth";
import type { UpdateTeacherCredential } from "@shared/schema";

/**
 * Register teacher credentials routes
 */
export function registerTeacherCredentialsRoutes(app: Express): void {
  /**
   * @swagger
   * /teacher/credentials:
   *   get:
   *     summary: Get teacher credentials
   *     description: Get all credentials for the currently authenticated teacher
   *     tags: [Teachers]
   *     security:
   *       - sessionAuth: []
   *     responses:
   *       200:
   *         description: List of credentials
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Failed to fetch credentials
   */
  app.get("/api/teacher/credentials", isAuthenticated, async (req, res) => {
    try {
      // userId from session is the teacher ID for authenticated teachers
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const credentials = await storage.getTeacherCredentials(userId);
      res.json({ credentials });
    } catch (error) {
      console.error("Error fetching credentials:", error);
      res.status(500).json({ error: "Failed to fetch credentials" });
    }
  });

  /**
   * @swagger
   * /teacher/credentials:
   *   post:
   *     summary: Create a new credential
   *     description: Create a new credential entry for the teacher
   *     tags: [Teachers]
   *     security:
   *       - sessionAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - type
   *               - title
   *             properties:
   *               type:
   *                 type: string
   *                 enum: [education, career, qualification]
   *               title:
   *                 type: string
   *               organization:
   *                 type: string
   *               startDate:
   *                 type: string
   *               endDate:
   *                 type: string
   *               description:
   *                 type: string
   *               sortOrder:
   *                 type: integer
   *     responses:
   *       201:
   *         description: Credential created successfully
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Failed to create credential
   */
  app.post("/api/teacher/credentials", isAuthenticated, async (req, res) => {
    try {
      // userId from session is the teacher ID for authenticated teachers
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { type, title, organization, startDate, endDate, description, sortOrder } = req.body;

      if (!type || !title) {
        return res.status(400).json({ error: "Type and title are required" });
      }

      const credential = await storage.createTeacherCredential({
        teacherId: userId,
        type,
        title,
        organization,
        startDate,
        endDate,
        description,
        sortOrder: sortOrder ?? 0,
      });

      res.status(201).json({ credential });
    } catch (error) {
      console.error("Error creating credential:", error);
      res.status(500).json({ error: "Failed to create credential" });
    }
  });

  /**
   * @swagger
   * /teacher/credentials/{id}:
   *   patch:
   *     summary: Update a credential
   *     description: Update an existing credential entry
   *     tags: [Teachers]
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               type:
   *                 type: string
   *                 enum: [education, career, qualification]
   *               title:
   *                 type: string
   *               organization:
   *                 type: string
   *               startDate:
   *                 type: string
   *               endDate:
   *                 type: string
   *               description:
   *                 type: string
   *               sortOrder:
   *                 type: integer
   *     responses:
   *       200:
   *         description: Credential updated successfully
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - credential does not belong to user
   *       404:
   *         description: Credential not found
   *       500:
   *         description: Failed to update credential
   */
  app.patch("/api/teacher/credentials/:id", isAuthenticated, async (req, res) => {
    try {
      // userId from session is the teacher ID for authenticated teachers
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { id } = req.params;
      const { type, title, organization, startDate, endDate, description, sortOrder } = req.body;

      // Verify the credential belongs to the teacher
      const existingCredential = await storage.getTeacherCredential(id);
      if (!existingCredential) {
        return res.status(404).json({ error: "Credential not found" });
      }

      if (existingCredential.teacherId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const updateData: UpdateTeacherCredential = {};
      if (type !== undefined) updateData.type = type;
      if (title !== undefined) updateData.title = title;
      if (organization !== undefined) updateData.organization = organization;
      if (startDate !== undefined) updateData.startDate = startDate;
      if (endDate !== undefined) updateData.endDate = endDate;
      if (description !== undefined) updateData.description = description;
      if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

      const credential = await storage.updateTeacherCredential(id, updateData);
      res.json({ credential });
    } catch (error) {
      console.error("Error updating credential:", error);
      res.status(500).json({ error: "Failed to update credential" });
    }
  });

  /**
   * @swagger
   * /teacher/credentials/{id}:
   *   delete:
   *     summary: Delete a credential
   *     description: Delete a credential entry
   *     tags: [Teachers]
   *     security:
   *       - sessionAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Credential deleted successfully
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden - credential does not belong to user
   *       404:
   *         description: Credential not found
   *       500:
   *         description: Failed to delete credential
   */
  app.delete("/api/teacher/credentials/:id", isAuthenticated, async (req, res) => {
    try {
      // userId from session is the teacher ID for authenticated teachers
      const userId = req.session.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { id } = req.params;

      // Verify the credential belongs to the teacher
      const existingCredential = await storage.getTeacherCredential(id);
      if (!existingCredential) {
        return res.status(404).json({ error: "Credential not found" });
      }

      if (existingCredential.teacherId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const deleted = await storage.deleteTeacherCredential(id);
      if (!deleted) {
        return res.status(404).json({ error: "Credential not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting credential:", error);
      res.status(500).json({ error: "Failed to delete credential" });
    }
  });
}
