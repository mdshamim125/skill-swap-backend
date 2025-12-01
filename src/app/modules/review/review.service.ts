import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";
import { IReviewCreate, IReviewUpdate } from "./review.interface";
import { prisma } from "../../shared/prisma";

const createReview = async (
  payload: IReviewCreate,
  reviewerId: string
) => {
  const { targetUserId, bookingId, rating, comment } = payload;

  // 1. Confirm that user has booking with mentor
  const eligibleBooking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      menteeId: reviewerId,
      mentorId: targetUserId,
      status: "COMPLETED",
    },
  });

  if (!eligibleBooking) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You cannot review this mentor because you have no completed booking with them."
    );
  }

  // 2. Prevent duplicate review per booking
  const exists = await prisma.review.findFirst({
    where: {
      reviewerId,
      targetUserId,
      bookingId,
    },
  });

  if (exists) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You have already reviewed this booking."
    );
  }

  // 3. Create the review
  const review = await prisma.review.create({
    data: {
      reviewerId,
      targetUserId,
      bookingId,
      rating,
      comment,
    },
  });

  // 4. Update mentor average rating
  await updateMentorAverageRating(targetUserId);

  return review;
};

// Update mentor Avg Rating
const updateMentorAverageRating = async (mentorId: string) => {
  const result = await prisma.review.aggregate({
    where: { targetUserId: mentorId },
    _avg: { rating: true },
  });

  await prisma.user.update({
    where: { id: mentorId },
    data: {
      averageRating: result._avg.rating ?? 0,
    },
  });
};

const getReviewsForMentor = async (mentorId: string) => {
  return await prisma.review.findMany({
    where: { targetUserId: mentorId },
    include: {
      reviewer: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

const updateReview = async (
  id: string,
  payload: IReviewUpdate,
  userId: string
) => {
  const review = await prisma.review.findUnique({ where: { id } });

  if (!review) throw new ApiError(404, "Review not found");
  if (review.reviewerId !== userId)
    throw new ApiError(403, "You can only edit your own review");

  const updated = await prisma.review.update({
    where: { id },
    data: payload,
  });

  await updateMentorAverageRating(review.targetUserId);

  return updated;
};

const deleteReview = async (id: string, userId: string) => {
  const review = await prisma.review.findUnique({ where: { id } });

  if (!review) throw new ApiError(404, "Review not found");
  if (review.reviewerId !== userId)
    throw new ApiError(403, "You can only delete your own review");

  await prisma.review.delete({ where: { id } });

  await updateMentorAverageRating(review.targetUserId);

  return true;
};

export const ReviewService = {
  createReview,
  getReviewsForMentor,
  updateReview,
  deleteReview,
};
