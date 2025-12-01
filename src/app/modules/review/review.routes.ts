import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { ReviewValidation } from "./review.validation";
import { ReviewController } from "./review.controller";

const router = express.Router();

// Create review
router.post(
  "/",
  auth("STUDENT"), // Only students can review
  validateRequest(ReviewValidation.create),
  ReviewController.createReview
);

// Get all reviews for a mentor
router.get("/mentor/:mentorId", ReviewController.getReviewsForMentor);

// Update own review
router.patch(
  "/:id",
  auth(),
  validateRequest(ReviewValidation.update),
  ReviewController.updateReview
);

// Delete own review
router.delete("/:id", auth(), ReviewController.deleteReview);

export const ReviewRoutes = router;
