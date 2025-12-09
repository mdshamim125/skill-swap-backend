// src/app/modules/chat/chat.service.ts
import { prisma } from "../../shared/prisma";

export const chatService = {
  // -----------------------------
  // Create or return existing conversation
  // -----------------------------
  async createOrGetConversation(userAId: string, userBId: string) {
    const existing = await prisma.conversation.findFirst({
      where: {
        OR: [
          { userAId, userBId },
          { userAId: userBId, userBId: userAId },
        ],
      },
      include: {
        userA: { select: { id: true, name: true, avatar: true, role: true } },
        userB: { select: { id: true, name: true, avatar: true, role: true } },
      },
    });

    if (existing) return existing;

    // Create new conversation
    return prisma.conversation.create({
      data: { userAId, userBId },
      include: {
        userA: { select: { id: true, name: true, avatar: true, role: true } },
        userB: { select: { id: true, name: true, avatar: true, role: true } },
      },
    });
  },

  // -----------------------------
  // Get logged-in user's conversations
  // -----------------------------
  async getUserConversations(userId: string) {
    const conversations = await prisma.conversation.findMany({
      where: { OR: [{ userAId: userId }, { userBId: userId }] },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        userA: { select: { id: true, name: true, avatar: true, role: true } },
        userB: { select: { id: true, name: true, avatar: true, role: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return conversations.map((c) => ({
      ...c,
      otherUser: c.userA.id === userId ? c.userB : c.userA,
    }));
  },

  // -----------------------------
  // Get messages inside conversation
  // -----------------------------
  async getConversationMessages(conversationId: string, take = 50, skip = 0) {
    return prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      take,
      skip,
      include: {
        sender: { select: { id: true, name: true, avatar: true, role: true } },
      },
    });
  },

  // -----------------------------
  // Create message in conversation
  // -----------------------------
  async createMessage(userAId: string, userBId: string, text: string) {
    // Ensure conversation exists
    const conv = await this.createOrGetConversation(userAId, userBId);

    const message = await prisma.message.create({
      data: {
        conversationId: conv.id,
        senderId: userAId,
        receiverId: conv.userAId === userAId ? conv.userBId : conv.userAId,
        text,
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true, role: true } },
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conv.id },
      data: { updatedAt: new Date() },
    });

    return message;
  },
};
