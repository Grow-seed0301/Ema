import type { Request, Response } from "express";
import { storage } from "../../storage";
import { sendSuccess, sendError } from "../../utils/apiResponse";
import { formatTimeAgo } from "../../utils/dateTime";
import { toFullImageUrl } from "../../utils/url";

type UserType = "teacher" | "student";

interface ChatOptions {
  userType: UserType;
}

/**
 * Common handler to get user's chat list
 */
export async function handleGetChats(
  req: Request,
  res: Response,
  options: ChatOptions
): Promise<void> {
  try {
    const userId = req.userId || req.session.userId!;
    const chats = await storage.getUserChats(userId);

    // Filter out chats without messages
    const chatsWithMessages = chats.filter((chat) => chat.lastMessage);

    const formattedChats = chatsWithMessages.map((chat) => {
      const participant = chat.participant;
      const lastMessage = chat.lastMessage;

      // Format time ago
      const timeAgo = formatTimeAgo(lastMessage?.createdAt);

      // Extract subjects based on participant type
      let subjects: Array<{ label: string; color: string }> = [];
      
      if (participant) {
        // Check if participant is a teacher (has subjects array)
        if ("subjects" in participant && participant.subjects) {
          // Teacher: use subjects and subjectGroups fields
          const teacherSubjects = participant.subjects as string[];
          const subjectGroups = (participant.subjectGroups as Record<string, string[]>) || {};
          
          subjects = teacherSubjects.map((subject) => {
            const groups = subjectGroups[subject] || [];
            const label = groups.length > 0 
              ? `${subject} (${groups.join(", ")})`
              : subject;
            return {
              label,
              color: "#3B82F6", // Default color
            };
          });
        } 
        // Check if participant is a student (has learningGoal field)
        else if ("learningGoal" in participant && participant.learningGoal) {
          try {
            // Student: parse learningGoal JSON to extract subjects and subjectGroups
            const learningGoalData = JSON.parse(participant.learningGoal as string);
            const studentSubjects = learningGoalData.subjects || [];
            const subjectGroups = learningGoalData.subjectGroups || {};
            
            subjects = studentSubjects.map((subject: string) => {
              const groups = subjectGroups[subject] || [];
              const label = groups.length > 0 
                ? `${subject} (${groups.join(", ")})`
                : subject;
              return {
                label,
                color: "#3B82F6", // Default color
              };
            });
          } catch (error) {
            console.error("Error parsing learningGoal:", error);
            subjects = [];
          }
        }
      }

      return {
        id: chat.id,
        participantId: participant?.id || "",
        participantName: participant?.name || "不明なユーザー",
        participantAvatar: participant?.avatarUrl || null,
        participantAvatarColor: participant?.avatarColor || "#3B82F6",
        lastMessage: lastMessage?.text || "",
        lastMessageTime: lastMessage?.createdAt?.toISOString() || "",
        timeAgo,
        unreadCount: chat.unreadCount || 0,
        subjects,
      };
    });

    sendSuccess(res, formattedChats);
  } catch (error) {
    console.error("Error getting chats:", error);
    sendError(res, "Failed to get chats", "FETCH_FAILED", 500);
  }
}

/**
 * Common handler to get or create chat with a participant
 */
export async function handleGetOrCreateChat(
  req: Request,
  res: Response,
  options: ChatOptions & {
    getParticipant: (participantId: string) => Promise<any>;
    participantLabel: string;
  }
): Promise<void> {
  try {
    const userId = req.userId || req.session.userId!;
    const { participantId } = req.params;

    // Check if participant exists
    const participant = await options.getParticipant(participantId);
    if (!participant) {
      return sendError(res, `${options.participantLabel} not found`, "NOT_FOUND", 404);
    }

    // Try to get existing chat
    let chat = await storage.getChatBetweenUsers(userId, participantId);

    // If no chat exists, create one
    if (!chat) {
      chat = await storage.createChat({
        participant1Id: userId,
        participant2Id: participantId,
      });
    }

    sendSuccess(res, {
      id: chat.id,
      participant1Id: chat.participant1Id,
      participant2Id: chat.participant2Id,
      createdAt: chat.createdAt?.toISOString(),
    });
  } catch (error) {
    console.error("Error getting or creating chat:", error);
    sendError(res, "Failed to get or create chat", "OPERATION_FAILED", 500);
  }
}

/**
 * Common handler to get messages for a chat
 */
export async function handleGetChatMessages(
  req: Request,
  res: Response,
  options: ChatOptions
): Promise<void> {
  try {
    const userId = req.userId || req.session.userId!;
    const { chatId } = req.params;
    const { before, limit = "50" } = req.query;

    // Verify chat exists and user is a participant
    const chat = await storage.getChat(chatId);
    if (!chat) {
      return sendError(res, "Chat not found", "NOT_FOUND", 404);
    }

    if (chat.participant1Id !== userId && chat.participant2Id !== userId) {
      return sendError(
        res,
        "Unauthorized to access this chat",
        "UNAUTHORIZED",
        403
      );
    }

    const result = await storage.getChatMessages(chatId, {
      before: before as string,
      limit: parseInt(limit as string, 10),
      userId,
    });

    const formattedMessages = result.messages.map((msg) => {
      const time = new Date(msg.createdAt!);
      const hours = time.getHours().toString().padStart(2, "0");
      const minutes = time.getMinutes().toString().padStart(2, "0");

      return {
        id: msg.id,
        senderId: msg.senderId,
        senderType: msg.senderType,
        text: msg.text || "",
        createdAt: msg.createdAt?.toISOString() || "",
        time: `${hours}:${minutes}`,
        isMe: msg.isMe || false,
        isRead: msg.isRead || false,
        isImage: !!msg.imageUrl,
        imageUrl: msg.imageUrl || null,
      };
    });

    sendSuccess(res, {
      messages: formattedMessages,
      hasMore: result.hasMore,
    });
  } catch (error) {
    console.error("Error getting messages:", error);
    sendError(res, "Failed to get messages", "FETCH_FAILED", 500);
  }
}

/**
 * Common handler to send a message in a chat
 */
export async function handleSendMessage(
  req: Request,
  res: Response,
  options: ChatOptions
): Promise<void> {
  try {
    const userId = req.userId || req.session.userId!;
    const { chatId } = req.params;
    const { text } = req.body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return sendError(
        res,
        "Message text is required",
        "VALIDATION_ERROR",
        400
      );
    }

    // Verify chat exists and user is a participant
    const chat = await storage.getChat(chatId);
    if (!chat) {
      return sendError(res, "Chat not found", "NOT_FOUND", 404);
    }

    if (chat.participant1Id !== userId && chat.participant2Id !== userId) {
      return sendError(
        res,
        "Unauthorized to send messages in this chat",
        "UNAUTHORIZED",
        403
      );
    }

    // Determine sender type based on user type
    const senderType = options.userType === "teacher" ? "teacher" : "user";

    const message = await storage.sendMessage({
      chatId,
      senderId: userId,
      senderType,
      text: text.trim(),
    });

    const time = new Date(message.createdAt!);
    const hours = time.getHours().toString().padStart(2, "0");
    const minutes = time.getMinutes().toString().padStart(2, "0");

    sendSuccess(
      res,
      {
        id: message.id,
        senderId: message.senderId,
        senderType: message.senderType,
        text: message.text,
        createdAt: message.createdAt?.toISOString(),
        time: `${hours}:${minutes}`,
      },
      201
    );
  } catch (error) {
    console.error("Error sending message:", error);
    sendError(res, "Failed to send message", "SEND_FAILED", 500);
  }
}

/**
 * Common handler to mark messages as read in a chat
 */
export async function handleMarkMessagesAsRead(
  req: Request,
  res: Response,
  options: ChatOptions
): Promise<void> {
  try {
    const userId = req.userId || req.session.userId!;
    const { chatId } = req.params;

    // Verify chat exists and user is a participant
    const chat = await storage.getChat(chatId);
    if (!chat) {
      return sendError(res, "Chat not found", "NOT_FOUND", 404);
    }

    if (chat.participant1Id !== userId && chat.participant2Id !== userId) {
      return sendError(
        res,
        "Unauthorized to access this chat",
        "UNAUTHORIZED",
        403
      );
    }

    await storage.markMessagesAsRead(chatId, userId);
    sendSuccess(res, { success: true });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    sendError(res, "Failed to mark messages as read", "UPDATE_FAILED", 500);
  }
}

/**
 * Common handler to get chat image upload URL
 */
export async function handleGetChatImageUploadURL(
  req: Request,
  res: Response,
  options: ChatOptions
): Promise<void> {
  try {
    const userId = req.userId || req.session.userId!;
    const { chatId } = req.params;

    // Verify chat exists and user is a participant
    const chat = await storage.getChat(chatId);
    if (!chat) {
      return sendError(res, "Chat not found", "NOT_FOUND", 404);
    }

    if (chat.participant1Id !== userId && chat.participant2Id !== userId) {
      return sendError(
        res,
        "Unauthorized to access this chat",
        "UNAUTHORIZED",
        403
      );
    }

    const { ObjectStorageService } = await import("../../objectStorage");
    const objectStorageService = new ObjectStorageService();
    const uploadURL = await objectStorageService.getChatImageUploadURL();
    res.json({ uploadURL });
  } catch (error) {
    console.error("Error getting chat image upload URL:", error);
    sendError(res, "Failed to get upload URL", "UPLOAD_FAILED", 500);
  }
}

/**
 * Common handler to send an image message in a chat
 */
export async function handleSendImageMessage(
  req: Request,
  res: Response,
  options: ChatOptions
): Promise<void> {
  try {
    const userId = req.userId || req.session.userId!;
    const { chatId } = req.params;
    const { imageURL } = req.body;

    if (!imageURL || typeof imageURL !== "string") {
      return sendError(
        res,
        "imageURL is required",
        "VALIDATION_ERROR",
        400
      );
    }

    // Verify chat exists and user is a participant
    const chat = await storage.getChat(chatId);
    if (!chat) {
      return sendError(res, "Chat not found", "NOT_FOUND", 404);
    }

    if (chat.participant1Id !== userId && chat.participant2Id !== userId) {
      return sendError(
        res,
        "Unauthorized to send messages in this chat",
        "UNAUTHORIZED",
        403
      );
    }

    const { ObjectStorageService } = await import("../../objectStorage");
    const objectStorageService = new ObjectStorageService();

    // Normalize and set ACL for the image
    const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
      imageURL,
      {
        owner: userId,
        visibility: "private",
        allowedUsers: [chat.participant1Id, chat.participant2Id],
      }
    );

    // Convert the object path to a full URL with the domain
    const fullImageUrl = toFullImageUrl(objectPath);

    // Determine sender type based on user type
    const senderType = options.userType === "teacher" ? "teacher" : "user";

    // Send the message with the full image URL
    const message = await storage.sendMessage({
      chatId,
      senderId: userId,
      senderType,
      text: "",
      imageUrl: fullImageUrl,
    });

    const time = new Date(message.createdAt!);
    const hours = time.getHours().toString().padStart(2, "0");
    const minutes = time.getMinutes().toString().padStart(2, "0");

    sendSuccess(
      res,
      {
        id: message.id,
        senderId: message.senderId,
        senderType: message.senderType,
        text: message.text,
        imageUrl: message.imageUrl,
        createdAt: message.createdAt?.toISOString(),
        time: `${hours}:${minutes}`,
      },
      201
    );
  } catch (error) {
    console.error("Error sending image message:", error);
    sendError(res, "Failed to send image message", "SEND_FAILED", 500);
  }
}
