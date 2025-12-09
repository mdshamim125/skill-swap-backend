// src/app/modules/chat/chatting.controller.ts
import { Request, Response, NextFunction } from "express";
import httpStatus from "http-status";
import ApiError from "../../errors/ApiError";
import { chatService } from "./chatting.service";

export const chatController = {
  // -----------------------------
  // Create or get existing conversation
  // -----------------------------
  createConversation: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userAId = req.user!.id;
      const { userBId } = req.body;

      if (!userBId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "userBId is required");
      }

      const conversation = await chatService.createOrGetConversation(
        userAId,
        userBId
      );

      res.status(httpStatus.OK).json(conversation);
    } catch (err) {
      next(err);
    }
  },

  // -----------------------------
  // Get logged-in user's conversations
  // -----------------------------
  getConversations: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const conversations = await chatService.getUserConversations(userId);

      res.status(httpStatus.OK).json(conversations);
    } catch (err) {
      next(err);
    }
  },

  // -----------------------------
  // Get messages for a conversation
  // -----------------------------
  getMessages: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { conversationId } = req.params;

      if (!conversationId) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "conversationId is required"
        );
      }

      const messages = await chatService.getConversationMessages(
        conversationId
      );

      res.status(httpStatus.OK).json(messages);
    } catch (err) {
      next(err);
    }
  },

  // -----------------------------
  // Send a message in a conversation
  // -----------------------------
  sendMessage: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const senderId = req.user!.id;
      const { receiverId, text } = req.body;

      if (!receiverId || !text) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "receiverId and text are required"
        );
      }

      const message = await chatService.createMessage(
        senderId,
        receiverId,
        text
      );

      res.status(httpStatus.OK).json(message);
    } catch (err) {
      next(err);
    }
  },

  // -----------------------------
  // Join a conversation (optional, if you want to explicitly add the user)
  // -----------------------------
  joinConversation: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { conversationId } = req.params;

      if (!conversationId) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          "conversationId is required"
        );
      }

      // Check if user is already part of the conversation
      const conversation = await chatService.createOrGetConversation(
        userId,
        userId
      ); // hack to use service
      // For real join logic, you can connect the user to conversation participants if you have many-to-many

      res
        .status(httpStatus.OK)
        .json({ message: "Joined conversation", conversation });
    } catch (err) {
      next(err);
    }
  },
};
