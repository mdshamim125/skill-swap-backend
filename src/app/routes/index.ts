import express from "express";
import { userRoutes } from "../modules/user/user.routes";
import { authRoutes } from "../modules/auth/auth.routes";
import { skillRoutes } from "../modules/skill/skill.route";
import { bookingRoutes } from "../modules/booking/booking.route";
import { mentorRoutes } from "../modules/user/mentor/mentor.route";
import { ReviewRoutes } from "../modules/review/review.routes";
import { DashboardRoutes } from "../modules/dashboard/dashboard.route";
import { subscriptionRoute } from "../modules/subscription/subscription.route";
import { chatRoute } from "../modules/chatting/chatting.route";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/user",
    route: userRoutes,
  },
  {
    path: "/mentors",
    route: mentorRoutes,
  },
  {
    path: "/auth",
    route: authRoutes,
  },
  {
    path: "/skills",
    route: skillRoutes,
  },
  {
    path: "/bookings",
    route: bookingRoutes,
  },
  {
    path: "/subscriptions",
    route: subscriptionRoute,
  },
  {
    path: "/chat",
    route: chatRoute,
  },
  {
    path: "/reviews",
    route: ReviewRoutes,
  },
  {
    path: "/dashboard",
    route: DashboardRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
