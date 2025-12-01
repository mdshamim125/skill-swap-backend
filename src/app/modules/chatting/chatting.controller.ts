import { Request, Response } from "express";
import chattingService from "./chatting.service";

export const ChatController = {
  getMessages: async (req: Request, res: Response) => {
    const user = req.user!;
    const { otherUserId } = req.params;

    const messages = await chattingService.getMessages(user.id, otherUserId);

    res.status(200).json({
      success: true,
      data: messages,
    });
  },
};
