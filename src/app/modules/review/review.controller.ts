import httpStatus from "http-status";
import { ReviewService } from "./review.service";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";

const createReview = catchAsync(async (req, res) => {
  const reviewerId = req.user!.id;

  const result = await ReviewService.createReview(req.body, reviewerId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Review created successfully",
    data: result,
  });
});

const getAllReviews = catchAsync(async (req, res) => {
  const mentorId = req.user!.id;

  

  const result = await ReviewService.getAllReviews(mentorId);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Reviews fetched successfully",
    data: result,
  });
});

const getReviewsForMentor = catchAsync(async (req, res) => {
  const mentorId = req.user!.id;

  const result = await ReviewService.getReviewsForMentor(mentorId);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Mentor reviews fetched successfully",
    data: result,
  });
});

const updateReview = catchAsync(async (req, res) => {
  const result = await ReviewService.updateReview(
    req.params.id,
    req.body,
    req.user!.id
  );

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Review updated successfully",
    data: result,
  });
});

const deleteReview = catchAsync(async (req, res) => {
  await ReviewService.deleteReview(req.params.id, req.user!.id);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Review deleted successfully",
    data: null,
  });
});

export const ReviewController = {
  createReview,
  getReviewsForMentor,
  updateReview,
  deleteReview,
  getAllReviews,
};
