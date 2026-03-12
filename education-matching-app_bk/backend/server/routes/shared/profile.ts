import type { Request, Response } from "express";
import { storage } from "../../storage";
import { stripPassword } from "../../utils/password";
import { sendSuccess, sendError } from "../../utils/apiResponse";
import { toFullImageUrl } from "../../utils/url";

type UserType = "teacher" | "student";

interface GetUserOptions {
  userType: UserType;
  getUser: (userId: string) => Promise<any>;
}

interface UpdateUserOptions {
  userType: UserType;
  getUser: (userId: string) => Promise<any>;
  updateUser: (userId: string, data: any) => Promise<any>;
  validateAndParseUpdateData: (body: any, currentUser?: any) => { updateData: any; error?: { message: string; code: string; status: number } };
}

interface ProfileImageUploadOptions {
  userType: UserType;
  getUser: (userId: string) => Promise<any>;
}

interface ProfileImageUpdateOptions {
  userType: UserType;
  getUser: (userId: string) => Promise<any>;
  updateUser: (userId: string, data: any) => Promise<any>;
}

/**
 * Common handler to get current user profile
 */
export async function handleGetUser(
  req: Request,
  res: Response,
  options: GetUserOptions
): Promise<void> {
  try {
    const userId = req.userId || req.session.userId!;
    const user = await options.getUser(userId);

    if (!user) {
      return sendError(res, `${options.userType === "teacher" ? "Teacher" : "Student"} not found`, "USER_NOT_FOUND", 404);
    }

    sendSuccess(res, stripPassword(user));
  } catch (error) {
    console.error(`Error fetching ${options.userType}:`, error);
    sendError(res, `Failed to fetch ${options.userType}`, "FETCH_FAILED", 500);
  }
}

/**
 * Common handler to update user profile
 */
export async function handleUpdateUser(
  req: Request,
  res: Response,
  options: UpdateUserOptions
): Promise<void> {
  try {
    const userId = req.userId || req.session.userId!;
    const user = await options.getUser(userId);

    if (!user) {
      return sendError(res, `${options.userType === "teacher" ? "Teacher" : "Student"} not found`, "USER_NOT_FOUND", 404);
    }

    // Validate and parse update data, passing current user for context
    const { updateData, error } = options.validateAndParseUpdateData(req.body, user);
    
    if (error) {
      return sendError(res, error.message, error.code, error.status);
    }

    const updatedUser = await options.updateUser(userId, updateData);

    if (!updatedUser) {
      return sendError(res, "Failed to update profile", "UPDATE_FAILED", 500);
    }

    sendSuccess(res, stripPassword(updatedUser));
  } catch (error) {
    console.error(`Error updating ${options.userType} profile:`, error);
    sendError(res, "Failed to update profile", "UPDATE_FAILED", 500);
  }
}

/**
 * Common date of birth parser for profile updates
 */
export function parseDateOfBirth(dateOfBirth: any): { parsedDate?: Date | null; error?: { message: string; code: string; status: number } } {
  if (dateOfBirth === undefined) {
    // Return without parsedDate field when value is undefined
    return {};
  }
  
  if (dateOfBirth === null) {
    return { parsedDate: null };
  }
  
  const parsed = new Date(dateOfBirth);
  if (isNaN(parsed.getTime())) {
    return {
      parsedDate: null,
      error: {
        message: "Invalid date format",
        code: "VALIDATION_ERROR",
        status: 400,
      },
    };
  }
  
  return { parsedDate: parsed };
}

/**
 * Common handler to get profile image upload URL
 */
export async function handleGetProfileImageUploadURL(
  req: Request,
  res: Response,
  options: ProfileImageUploadOptions
): Promise<void> {
  try {
    const userId = req.userId || req.session.userId!;
    const user = await options.getUser(userId);

    if (!user) {
      return sendError(res, `${options.userType === "teacher" ? "Teacher" : "Student"} not found`, "USER_NOT_FOUND", 404);
    }

    const { ObjectStorageService } = await import("../../objectStorage");
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getPublicObjectUploadURL();
    res.json({ uploadURL });
  } catch (error) {
    console.error("Error getting upload URL:", error);
    sendError(res, "Failed to get upload URL", "UPLOAD_FAILED", 500);
  }
}

/**
 * Common handler to update profile image
 */
export async function handleUpdateProfileImage(
  req: Request,
  res: Response,
  options: ProfileImageUpdateOptions
): Promise<void> {
  try {
    const userId = req.userId || req.session.userId!;
    const { profileImageURL } = req.body;

    if (!profileImageURL) {
      return sendError(
        res,
        "profileImageURL is required",
        "VALIDATION_ERROR",
        400
      );
    }

    const existingUser = await options.getUser(userId);
    if (!existingUser) {
      return sendError(res, `${options.userType === "teacher" ? "Teacher" : "Student"} not found`, "NOT_FOUND", 404);
    }

    const { ObjectStorageService } = await import("../../objectStorage");
    const objectStorageService = new ObjectStorageService();

    const objectPath = await objectStorageService.trySetPublicObjectAclPolicy(
      profileImageURL,
      {
        owner: userId,
        visibility: "public",
      }
    );

    // Convert the object path to a full URL with the domain
    const fullImageUrl = toFullImageUrl(objectPath);

    const updatedUser = await options.updateUser(userId, { avatarUrl: fullImageUrl });
    sendSuccess(res, {
      message: "Profile image updated",
      objectPath: fullImageUrl,
      user: stripPassword(updatedUser!),
    });
  } catch (error) {
    console.error("Error updating profile image:", error);
    sendError(res, "Failed to update profile image", "UPDATE_FAILED", 500);
  }
}
