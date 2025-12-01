import express from "express";
import { mentorDashboardController } from "./mentorDashboard.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

router.get(
  "/mentor/dashboard",
  auth("MENTOR"),   // Only mentors
  mentorDashboardController.getDashboard
);

export default router;
