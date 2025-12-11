import express from "express";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { ReviewValidation } from "./review.validation";
import { ReviewController } from "./review.controller";
import { Role } from "@prisma/client";

const router = express.Router();

// Create review
router.post(
  "/",
  auth(),
  validateRequest(ReviewValidation.create),
  ReviewController.createReview
);

router.get("/mentor", auth(Role.MENTOR), ReviewController.getAllReviews);

// Get all reviews for a mentor
router.get("/mentor", ReviewController.getReviewsForMentor);

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
