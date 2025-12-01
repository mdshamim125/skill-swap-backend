export interface IDashboardStats {
  totalUsers: number;
  totalMentors: number;
  totalAdmins: number;
  totalConversations: number;
  totalMessages: number;
  recentUsers: any[];
  recentConversations: any[];
  dailySignups: {
    date: string;
    count: number;
  }[];
  dailyMessages: {
    date: string;
    count: number;
  }[];
}
