import { useState } from "react";
import { Alert } from "react-native";
import apiService from "@/services/api";

interface UseProfileImageUploadReturn {
  isUploading: boolean;
  uploadImage: (uri: string) => Promise<string | null>;
}

/**
 * Custom hook for uploading profile images to the server.
 * Handles the complete upload flow: get upload URL, upload to storage, update profile.
 *
 * @returns {UseProfileImageUploadReturn} Object containing:
 *   - isUploading: boolean indicating if an upload is in progress
 *   - uploadImage: function to upload an image given its local URI
 *
 * @example
 * ```tsx
 * const { isUploading, uploadImage } = useProfileImageUpload();
 *
 * const handleImageSelection = async (localUri: string) => {
 *   const serverUrl = await uploadImage(localUri);
 *   if (serverUrl) {
 *     setProfileImage(serverUrl);
 *   }
 * };
 * ```
 */
export function useProfileImageUpload(): UseProfileImageUploadReturn {
  const [isUploading, setIsUploading] = useState(false);

  const uploadImage = async (uri: string): Promise<string | null> => {
    try {
      setIsUploading(true);

      // Get the upload URL from the server
      const uploadUrlResponse = await apiService.getProfileImageUploadUrl();
      if (!uploadUrlResponse.success || !uploadUrlResponse.data?.uploadURL) {
        throw new Error("Failed to get upload URL");
      }

      const uploadURL = uploadUrlResponse.data.uploadURL;

      // Fetch the image as a blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Upload the image to the presigned URL
      const uploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: blob,
        headers: {
          "Content-Type": blob.type || "image/jpeg",
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image");
      }

      // Extract the base storage URL (without query parameters)
      // The presigned URL contains temporary signature parameters that should be removed
      const url = new URL(uploadURL);
      const storageURL = `${url.origin}${url.pathname}`;

      // Update the profile with the uploaded image URL
      const updateResponse = await apiService.updateProfileImage(storageURL);
      if (!updateResponse.success || !updateResponse.data?.objectPath) {
        throw new Error("Failed to update profile image");
      }

      return updateResponse.data.objectPath;
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert("エラー", "画像のアップロードに失敗しました", [
        { text: "OK" },
      ]);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    isUploading,
    uploadImage,
  };
}
