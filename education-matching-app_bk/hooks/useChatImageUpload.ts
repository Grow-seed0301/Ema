import { useState } from "react";
import { Alert } from "react-native";
import { apiService } from "@/services/api";

interface UseChatImageUploadReturn {
  isUploading: boolean;
  uploadChatImage: (chatId: string, uri: string) => Promise<string | null>;
}

/**
 * Custom hook for uploading chat images to the server.
 * Handles the complete upload flow: get upload URL, upload to storage, send image message.
 *
 * @returns {UseChatImageUploadReturn} Object containing:
 *   - isUploading: boolean indicating if an upload is in progress
 *   - uploadChatImage: function to upload an image given chat ID and local URI
 *
 * @example
 * ```tsx
 * const { isUploading, uploadChatImage } = useChatImageUpload();
 *
 * const handleImageSelection = async (localUri: string) => {
 *   const messageId = await uploadChatImage(chatId, localUri);
 *   if (messageId) {
 *     // Image sent successfully
 *   }
 * };
 * ```
 */
export function useChatImageUpload(): UseChatImageUploadReturn {
  const [isUploading, setIsUploading] = useState(false);

  const uploadChatImage = async (
    chatId: string,
    uri: string
  ): Promise<string | null> => {
    try {
      setIsUploading(true);

      // Get the upload URL from the server
      const uploadUrlResponse = await apiService.getChatImageUploadUrl(chatId);
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

      // Send the image message
      const sendImageResponse = await apiService.sendChatImage(
        chatId,
        storageURL
      );
      if (!sendImageResponse.success || !sendImageResponse.data?.id) {
        throw new Error("Failed to send image message");
      }

      return sendImageResponse.data.id;
    } catch (error) {
      console.error("Error uploading chat image:", error);
      Alert.alert("エラー", "画像の送信に失敗しました", [{ text: "OK" }]);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    isUploading,
    uploadChatImage,
  };
}
