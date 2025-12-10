import express, { NextFunction, Request, Response } from "express";
import auth from "../../middlewares/auth";
import { Role } from "@prisma/client";
import { BookingValidation } from "./booking.validation";
import { BookingController } from "./booking.controller";

const router = express.Router();

// ===============================
// CREATE BOOKING (Mentee Only)
// ===============================
router.post("/create", auth(Role.USER, Role.PREMIUM_USER), (req, res, next) => {
  const parsed = BookingValidation.createBookingSchema.parse(req.body);
  req.body = parsed;
  return BookingController.createBooking(req, res);
});

// ===============================
// GET BOOKINGS (As Mentee)
// ===============================
router.get(
  "/my-bookings",
  auth(Role.USER, Role.PREMIUM_USER),
  BookingController.getMyBookings
);

// ===============================
// GET BOOKINGS (As Mentor)
// ===============================
router.get("/mentor", auth(Role.MENTOR), BookingController.getBookingsAsMentor);

// ===============================
// GET SINGLE BOOKING (Mentor or Mentee)
// ===============================
router.get(
  "/:id",
  auth(Role.USER, Role.PREMIUM_USER, Role.MENTOR),
  BookingController.getSingleBooking
);

// ===============================
// UPDATE BOOKING STATUS (Mentor Only)
// ===============================
router.patch(
  "/:id/status",
  auth(Role.MENTOR),
  (req: Request, res: Response, next: NextFunction) => {
    const parsed = BookingValidation.updateStatusSchema.parse(req.body);
    req.body = parsed;
    return BookingController.updateBookingStatus(req, res);
  }
);

// ===============================
// CANCEL BOOKING (Mentee Only)
// ===============================
router.patch(
  "/:id/cancel",
  auth(Role.USER, Role.PREMIUM_USER),
  BookingController.cancelBooking
);

export const bookingRoutes = router;
