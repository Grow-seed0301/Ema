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
 * Parse and validate teacher profile update data
 */
function validateAndParseTeacherUpdateData(body: any, currentUser?: any) {
  const {
    name,
    nickname,
    avatarUrl,
    dateOfBirth,
    bio,
    phone,
    gender,
    address,
    specialty,
    subjects,
    subjectGroups,
    experience,
    experienceYears,
    teachingStyles,
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

  // Teacher-specific fields
  if (specialty !== undefined) updateData.specialty = specialty;
  if (subjects !== undefined) updateData.subjects = subjects;
  if (subjectGroups !== undefined) updateData.subjectGroups = subjectGroups;
  if (experience !== undefined) updateData.experience = experience;
  if (experienceYears !== undefined) {
    // Handle both string and number types, parse as integer or null if not valid
    const parsed = typeof experienceYears === 'number' 
      ? experienceYears 
      : parseInt(String(experienceYears), 10);
    updateData.experienceYears = isNaN(parsed) ? null : parsed;
  }
  if (teachingStyles !== undefined) updateData.teachingStyles = teachingStyles;

  // Auto-update onboarding completion flags
  // Mark basic profile as complete when profile update is called
  updateData.isProfileComplete = true;

  // Mark credentials/teaching info as complete when profile update is called
  updateData.isCredentialsComplete = true;

  return { updateData };
}

/**
 * Register teacher profile routes
 */
export function registerTeacherProfileRoutes(app: Express): void {
  /**
   * @swagger
   * /teacher/user:
   *   get:
   *     summary: Get current teacher
   *     description: Get the currently authenticated teacher user
   *     tags: [Teachers]
   *     security:
   *       - sessionAuth: []
   *     responses:
   *       200:
   *         description: Current teacher user
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/User'
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Teacher not found
   *       500:
   *         description: Failed to fetch teacher
   */
  app.get("/api/teacher/user", isAuthenticated, async (req, res) => {
    await handleGetUser(req, res, {
      userType: "teacher",
      getUser: storage.getTeacher.bind(storage),
    });
  });

  /**
   * @swagger
   * /teacher/user:
   *   patch:
   *     summary: Update teacher profile
   *     description: Update the currently authenticated teacher's profile
   *     tags: [Teachers]
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
   *               specialty:
   *                 type: string
   *               subjects:
   *                 type: array
   *                 items:
   *                   type: string
   *               experience:
   *                 type: string
   *               experienceYears:
   *                 type: integer
   *                 description: Years of teaching experience
   *               teachingStyles:
   *                 type: array
   *                 items:
   *                   type: string
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
   *         description: Teacher not found
   *       500:
   *         description: Failed to update profile
   */
  app.patch("/api/teacher/user", isAuthenticated, async (req, res) => {
    await handleUpdateUser(req, res, {
      userType: "teacher",
      getUser: storage.getTeacher.bind(storage),
      updateUser: storage.updateTeacher.bind(storage),
      validateAndParseUpdateData: validateAndParseTeacherUpdateData,
    });
  });

  /**
   * @swagger
   * /teacher/profile-image/upload:
   *   post:
   *     summary: Get upload URL for profile image
   *     description: Get a presigned URL for uploading teacher's profile image
   *     tags: [Teachers]
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
  app.post(
    "/api/teacher/profile-image/upload",
    isAuthenticated,
    async (req, res) => {
      await handleGetProfileImageUploadURL(req, res, {
        userType: "teacher",
        getUser: storage.getTeacher.bind(storage),
      });
    }
  );

  /**
   * @swagger
   * /teacher/profile-image:
   *   put:
   *     summary: Update teacher profile image
   *     description: Set the profile image URL for the current teacher after upload
   *     tags: [Teachers]
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
   *         description: Teacher not found
   *       500:
   *         description: Failed to update profile image
   */
  app.put("/api/teacher/profile-image", isAuthenticated, async (req, res) => {
    await handleUpdateProfileImage(req, res, {
      userType: "teacher",
      getUser: storage.getTeacher.bind(storage),
      updateUser: storage.updateTeacher.bind(storage),
    });
  });
}
