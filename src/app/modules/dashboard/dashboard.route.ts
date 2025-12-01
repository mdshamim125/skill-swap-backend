import express from "express";
import { DashboardController } from "./dashboard.controller";
import auth from "../../middlewares/auth";
import { Role } from "@prisma/client";

const router = express.Router();

// 🔐 Only admin can access analytics
router.get(
  "/analytics",
  auth(Role.ADMIN),
  DashboardController.getDashboardStats
);

export const DashboardRoutes = router;
