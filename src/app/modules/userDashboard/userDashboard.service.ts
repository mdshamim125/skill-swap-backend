import { prisma } from "../../shared/prisma";

const getUserAnalytics = async (userId: string) => {
  // Total messages sent by user
  const totalMessagesSent = await prisma.message.count({
    where: { senderId: userId },
  });

  // Total messages received by user
  const totalMessagesReceived = await prisma.message.count({
    where: { receiverId: userId },
  });

  // Total conversations
  const totalConversations = await prisma.conversation.count({
    where: {
      OR: [{ userAId: userId }, { userBId: userId }],
    },
  });

  // Recent conversations (latest 5)
  const recentConversations = await prisma.conversation.findMany({
    where: {
      OR: [{ userAId: userId }, { userBId: userId }],
    },
    include: {
      userA: { include: { profile: true } },
      userB: { include: { profile: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });

  // Last 7 days message activity
  const dailyMessages = await prisma.$queryRaw`
    SELECT 
      DATE("createdAt") as date,
      COUNT(*) as count
    FROM "Message"
    WHERE "senderId" = ${userId}
      AND "createdAt" > NOW() - INTERVAL '7 days'
    GROUP BY DATE("createdAt")
    ORDER BY DATE("createdAt") ASC;
  `;

  return {
    totalMessagesSent,
    totalMessagesReceived,
    totalConversations,
    recentConversations,
    dailyMessages,
  };
};

export const UserDashboardService = {
  getUserAnalytics,
};
