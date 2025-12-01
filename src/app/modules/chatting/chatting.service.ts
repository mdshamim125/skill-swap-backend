import { prisma } from "../../shared/prisma";

const getRoomId = (a: string, b: string) => {
  return [a, b].sort().join("_"); // unique & predictable
};

const getOrCreateConversation = async (userAId: string, userBId: string) => {
  const existing = await prisma.conversation.findFirst({
    where: {
      OR: [
        { userAId, userBId },
        { userAId: userBId, userBId: userAId },
      ],
    },
  });

  if (existing) return existing;

  return prisma.conversation.create({
    data: { userAId, userBId },
  });
};

const saveMessage = async ({
  senderId,
  receiverId,
  text,
}: {
  senderId: string;
  receiverId: string;
  text: string;
}) => {
  const conv = await getOrCreateConversation(senderId, receiverId);

  const message = await prisma.message.create({
    data: {
      senderId,
      receiverId,
      text,
      conversationId: conv.id,
    },
    include: {
      conversation: false,
    },
  });

  return message;
};

const getMessages = async (user1: string, user2: string) => {
  const conv = await getOrCreateConversation(user1, user2);

  return prisma.message.findMany({
    where: {
      conversationId: conv.id,
    },
    orderBy: { createdAt: "asc" },
  });
};

export default {
  getRoomId,
  saveMessage,
  getMessages,
};
