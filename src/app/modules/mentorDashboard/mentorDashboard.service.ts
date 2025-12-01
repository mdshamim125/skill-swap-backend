import { BookingStatus } from "@prisma/client";
import { prisma } from "../../shared/prisma";

class MentorDashboardService {
  // 1. Total earnings
  async getEarnings(mentorId: string) {
    const result = await prisma.booking.aggregate({
      where: { mentorId, status: BookingStatus.COMPLETED },
      _sum: { pricePaid: true },
    });

    return {
      totalEarnings: result._sum.pricePaid || 0,
    };
  }

  // 2. Booked sessions count + upcoming sessions
  async getSessionStats(mentorId: string) {
    const totalSessions = await prisma.booking.count({
      where: { mentorId },
    });

    const upcoming = await prisma.booking.count({
      where: {
        mentorId,
        scheduledAt: { gte: new Date() },
        status: BookingStatus.ACCEPTED,
      },
    });

    return {
      totalSessions,
      upcomingSessions: upcoming,
    };
  }

  // 3. Review statistics
  async getReviewStats(mentorId: string) {
    const reviews = await prisma.review.findMany({
      where: { targetUserId: mentorId },
      orderBy: { createdAt: "desc" },
    });

    const avgRating =
      reviews.reduce((a, c) => a + c.rating, 0) / (reviews.length || 1);

    return {
      totalReviews: reviews.length,
      averageRating: Number(avgRating.toFixed(2)),
      recentReviews: reviews.slice(0, 5),
    };
  }

  // 4. Skill stats (bookings per skill)
  async getSkillStats(mentorId: string) {
    const skills = await prisma.skill.findMany({
      where: { ownerId: mentorId },
      include: {
        bookings: true,
      },
    });

    return skills.map((skill) => ({
      skillId: skill.id,
      title: skill.title,
      totalBookings: skill.bookings.length,
    }));
  }

  // 5. Combined dashboard data
  async getMentorDashboard(mentorId: string) {
    const [earnings, sessions, reviews, skills] = await Promise.all([
      this.getEarnings(mentorId),
      this.getSessionStats(mentorId),
      this.getReviewStats(mentorId),
      this.getSkillStats(mentorId),
    ]);

    return {
      earnings,
      sessions,
      reviews,
      skills,
    };
  }
}

export const mentorDashboardService = new MentorDashboardService();
