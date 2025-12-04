import express from "express";
import { MentorController } from "./mentor.controller";
import { Role } from "@prisma/client";

const router = express.Router();

// Get list of active mentors (mentee only)
router.get(
  "/",
  // auth(Role.PREMIUM_USER, Role.USER),
  MentorController.listMentors
);

// ⭐️ Get single active mentor
router.get(
  "/:id",
  // auth(Role.PREMIUM_USER, Role.USER),
  MentorController.getSingleMentor
);

export const mentorRoutes = router;
