import type { Express } from "express";
import { storage } from "../../storage";
import { isAuthenticated } from "../../auth";
import {
  handleGetChats,
  handleGetOrCreateChat,
  handleGetChatMessages,
  handleSendMessage,
  handleMarkMessagesAsRead,
  handleGetChatImageUploadURL,
  handleSendImageMessage,
} from "../shared/chat";

/**
 * Register student chat routes
 */
export function registerStudentChatRoutes(app: Express): void {
  /**
   * @swagger
   * /student/chats:
   *   get:
   *     summary: Get user's chat list
   *     description: Retrieve all chats for the authenticated student
   *     tags: [Chats]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Chat list retrieved successfully
   *       401:
   *         description: Unauthorized
   *       500:
   *         description: Failed to get chats
   */
  app.get("/api/student/chats", isAuthenticated, async (req, res) => {
    await handleGetChats(req, res, {
      userType: "student",
    });
  });

  /**
   * @swagger
   * /student/chats/with/{participantId}:
   *   get:
   *     summary: Get or create chat with a participant
   *     description: Get an existing chat with a participant (teacher), or create a new one if it doesn't exist
   *     tags: [Chats]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: participantId
   *         required: true
   *         schema:
   *           type: string
   *         description: ID of the participant (teacher) to chat with
   *     responses:
   *       200:
   *         description: Chat retrieved or created successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 id:
   *                   type: string
   *                 participant1Id:
   *                   type: string
   *                 participant2Id:
   *                   type: string
   *                 createdAt:
   *                   type: string
   *                   format: date-time
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Participant not found
   *       500:
   *         description: Failed to get or create chat
   */
  app.get("/api/student/chats/with/:participantId", isAuthenticated, async (req, res) => {
    await handleGetOrCreateChat(req, res, {
      userType: "student",
      getParticipant: storage.getTeacher.bind(storage),
      participantLabel: "Teacher",
    });
  });

  /**
   * @swagger
   * /student/chats/{chatId}/messages:
   *   get:
   *     summary: Get messages for a chat
   *     description: Retrieve messages for a specific chat
   *     tags: [Chats]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: chatId
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: before
   *         schema:
   *           type: string
   *           format: date-time
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 50
   *     responses:
   *       200:
   *         description: Messages retrieved successfully
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Chat not found
   *       500:
   *         description: Failed to get messages
   */
  app.get("/api/student/chats/:chatId/messages", isAuthenticated, async (req, res) => {
    await handleGetChatMessages(req, res, {
      userType: "student",
    });
  });

  /**
   * @swagger
   * /student/chats/{chatId}/messages:
   *   post:
   *     summary: Send a message
   *     description: Send a new message in a chat
   *     tags: [Chats]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: chatId
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [text]
   *             properties:
   *               text:
   *                 type: string
   *     responses:
   *       201:
   *         description: Message sent successfully
   *       400:
   *         description: Invalid data
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Chat not found
   *       500:
   *         description: Failed to send message
   */
  app.post("/api/student/chats/:chatId/messages", isAuthenticated, async (req, res) => {
    await handleSendMessage(req, res, {
      userType: "student",
    });
  });

  /**
   * @swagger
   * /student/chats/{chatId}/read:
   *   post:
   *     summary: Mark messages as read
   *     description: Mark all messages in a chat as read for the authenticated user
   *     tags: [Chats]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: chatId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Messages marked as read
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Chat not found
   *       500:
   *         description: Failed to mark messages as read
   */
  app.post("/api/student/chats/:chatId/read", isAuthenticated, async (req, res) => {
    await handleMarkMessagesAsRead(req, res, {
      userType: "student",
    });
  });

  /**
   * @swagger
   * /student/chats/{chatId}/image/upload:
   *   post:
   *     summary: Get upload URL for chat image
   *     description: Get a presigned URL for uploading an image to a chat
   *     tags: [Chats]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: chatId
   *         required: true
   *         schema:
   *           type: string
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
   *       403:
   *         description: Not a participant of this chat
   *       404:
   *         description: Chat not found
   *       500:
   *         description: Failed to get upload URL
   */
  app.post("/api/student/chats/:chatId/image/upload", isAuthenticated, async (req, res) => {
    await handleGetChatImageUploadURL(req, res, {
      userType: "student",
    });
  });

  /**
   * @swagger
   * /student/chats/{chatId}/image:
   *   post:
   *     summary: Send an image message
   *     description: Send an image message in a chat after uploading
   *     tags: [Chats]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: chatId
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [imageURL]
   *             properties:
   *               imageURL:
   *                 type: string
   *                 description: URL of the uploaded image
   *     responses:
   *       201:
   *         description: Image message sent successfully
   *       400:
   *         description: Invalid data
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Not a participant of this chat
   *       404:
   *         description: Chat not found
   *       500:
   *         description: Failed to send image message
   */
  app.post("/api/student/chats/:chatId/image", isAuthenticated, async (req, res) => {
    await handleSendImageMessage(req, res, {
      userType: "student",
    });
  });
}
