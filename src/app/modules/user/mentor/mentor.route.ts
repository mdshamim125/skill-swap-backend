import express from "express";
import { MentorController } from "./mentor.controller";
import auth from "../../../middlewares/auth";
import { Role } from "@prisma/client";

const router = express.Router();

// Get list of active mentors (mentee only)
router.get(
  "/",
  auth(Role.PREMIUM_USER, Role.USER),
  MentorController.listMentors
);

export const mentorRoutes = router;
