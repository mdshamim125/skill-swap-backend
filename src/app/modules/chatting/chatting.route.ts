import express from "express";
import { ChatController } from "./chatting.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

router.get("/:otherUserId", auth(), ChatController.getMessages);

export const ChatRoutes = router;
