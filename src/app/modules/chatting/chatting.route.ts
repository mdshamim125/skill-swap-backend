// src/app/modules/chat/chat.route.ts
import express from "express";
import auth from "../../middlewares/auth";
import { chatController } from "./chatting.controller";

const router = express.Router();

router.post("/create", auth(), chatController.createConversation);
router.get("/my-conversations", auth(), chatController.getConversations);
router.get("/:conversationId", auth(), chatController.getMessages);
router.post("/messages/send", auth(), chatController.sendMessage);
router.post("/:conversationId/join", auth(), chatController.joinConversation);


export const chatRoute = router;
