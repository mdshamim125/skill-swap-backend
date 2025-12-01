import express from "express";
import { UserDashboardController } from "./userDashboard.controller";
import auth from "../../middlewares/auth";
import { Role } from "@prisma/client";

const router = express.Router();

// User must be logged in (any role)
router.get(
  "/analytics",
  auth(Role.USER, Role.MENTOR, Role.ADMIN),
  UserDashboardController.getUserDashboardStats
);

export const UserDashboardRoutes = router;
