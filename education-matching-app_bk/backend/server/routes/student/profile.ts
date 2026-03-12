import type { Express } from "express";
import { storage } from "../../storage";
import { isAuthenticated } from "../../auth";
import {
  handleGetUser,
  handleUpdateUser,
  handleGetProfileImageUploadURL,
  handleUpdateProfileImage,
  parseDateOfBirth,
} from "../shared/profile";

/**
 * Parse and validate student profile update data
 */
function validateAndParseStudentUpdateData(body: any, currentUser?: any) {
  const {
    name,
    nickname,
    avatarUrl,
    dateOfBirth,
    bio,
    phone,
    gender,
    address,
    learningGoal,
  } = body;

  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (nickname !== undefined) updateData.nickname = nickname;
  if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
  
  if (dateOfBirth !== undefined) {
    const result = parseDateOfBirth(dateOfBirth);
    if (result.error) {
      return { updateData: {}, error: result.error };
    }
    if ('parsedDate' in result) {
      updateData.dateOfBirth = result.parsedDate;
    }
  }
  
  if (bio !== undefined) updateData.bio = bio;
  if (phone !== undefined) updateData.phone = phone;
  if (gender !== undefined) updateData.gender = gender;
  if (address !== undefined) updateData.address = address;
  if (learningGoal !== undefined) updateData.learningGoal = learningGoal;

  // Auto-update onboarding completion flags
  // Mark basic profile as complete when profile update is called
  updateData.isProfileComplete = true;

  // Mark learning info as complete when profile update is called
  updateData.isLearningInfoComplete = true;

  return { updateData };
}

/**
 * Register student profile routes
 */
export function registerStudentProfileRoutes(app: Express): void {
  /**
   * @swagger
   * /student/user:
   *   get:
   *     summary: Get current student
   *     description: Get the currently authenticated student user
   *     tags: [Students]
   *     security:
   *       - sessionAuth: []
   *     responses:
   *       200:
   *         description: Current student user
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Student not found
   *       500:
   *         description: Failed to fetch student
   */
  app.get("/api/student/user", isAuthenticated, async (req, res) => {
    await handleGetUser(req, res, {
      userType: "student",
      getUser: storage.getUser.bind(storage),
    });
  });

  /**
   * @swagger
   * /student/user:
   *   patch:
   *     summary: Update student profile
   *     description: Update the currently authenticated student's profile
   *     tags: [Students]
   *     security:
   *       - sessionAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               avatarUrl:
   *                 type: string
   *               dateOfBirth:
   *                 type: string
   *                 format: date-time
   *               bio:
   *                 type: string
   *               phone:
   *                 type: string
   *               gender:
   *                 type: string
   *               address:
   *                 type: string
   *               learningGoal:
   *                 type: string
   *     responses:
   *       200:
   *         description: Profile updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Student not found
   *       500:
   *         description: Failed to update profile
   */
  app.patch("/api/student/user", isAuthenticated, async (req, res) => {
    await handleUpdateUser(req, res, {
      userType: "student",
      getUser: storage.getUser.bind(storage),
      updateUser: storage.updateUser.bind(storage),
      validateAndParseUpdateData: validateAndParseStudentUpdateData,
    });
  });

  /**
   * @swagger
   * /student/profile-image/upload:
   *   post:
   *     summary: Get upload URL for profile image
   *     description: Get a presigned URL for uploading student's profile image
   *     tags: [Students]
   *     security:
   *       - sessionAuth: []
   *     responses:
   *       200:
   *         description: Upload URL generated
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 uploadURL:
   *                   type: string
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Failed to get upload URL
   */
  app.post("/api/student/profile-image/upload", isAuthenticated, async (req, res) => {
    await handleGetProfileImageUploadURL(req, res, {
      userType: "student",
      getUser: storage.getUser.bind(storage),
    });
  });

  /**
   * @swagger
   * /student/profile-image:
   *   put:
   *     summary: Update student profile image
   *     description: Set the profile image URL for the current student after upload
   *     tags: [Students]
   *     security:
   *       - sessionAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               profileImageURL:
   *                 type: string
   *     responses:
   *       200:
   *         description: Profile image updated
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Student not found
   *       500:
   *         description: Failed to update profile image
   */
  app.put("/api/student/profile-image", isAuthenticated, async (req, res) => {
    await handleUpdateProfileImage(req, res, {
      userType: "student",
      getUser: storage.getUser.bind(storage),
      updateUser: storage.updateUser.bind(storage),
    });
  });
}
