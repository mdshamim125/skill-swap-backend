import { prisma } from "../../shared/prisma";
import { Role } from "@prisma/client";

const getStats = async () => {
  // Total Counts
  const totalUsers = await prisma.user.count();
  const totalMentors = await prisma.user.count({ where: { role: Role.MENTOR } });
  const totalAdmins = await prisma.user.count({ where: { role: Role.ADMIN } });

  const totalConversations = await prisma.conversation.count();
  const totalMessages = await prisma.message.count();

  // Last 5 registered users
  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { profile: true }
  });

  // Recent Conversations (latest 5)
  const recentConversations = await prisma.conversation.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      userA: true,
      userB: true,
    },
  });

  // Daily Signups - last 7 days
  const dailySignups = await prisma.$queryRaw`
    SELECT 
      DATE("createdAt") as date,
      COUNT(*) as count
    FROM "User"
    WHERE "createdAt" > NOW() - INTERVAL '7 days'
    GROUP BY DATE("createdAt")
    ORDER BY DATE("createdAt") ASC;
  `;

  // Daily Messages - last 7 days
  const dailyMessages = await prisma.$queryRaw`
    SELECT 
      DATE("createdAt") as date,
      COUNT(*) as count
    FROM "Message"
    WHERE "createdAt" > NOW() - INTERVAL '7 days'
    GROUP BY DATE("createdAt")
    ORDER BY DATE("createdAt") ASC;
  `;

  return {
    totalUsers,
    totalMentors,
    totalAdmins,
    totalConversations,
    totalMessages,
    recentUsers,
    recentConversations,
    dailySignups,
    dailyMessages,
  };
};

export const DashboardService = {
  getStats,
};
