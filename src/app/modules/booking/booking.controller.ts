import { Request, Response } from "express";
import { bookingService } from "./booking.service";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import pick from "../../helper/pick";

const createBooking = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const data = req.body;

  if (!userId) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const booking = await bookingService.createBooking(userId, data);
  res.status(201).json({ message: "Booking created", booking });
};

const getMyBookings = catchAsync(async (req, res) => {
  const menteeId = req.user!.id;
  const pagination = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

  const result = await bookingService.getBookingsAsMentee(menteeId, pagination);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Bookings fetched successfully",
    data: result,
  });
});

const getBookingsAsMentor = catchAsync(async (req, res) => {
  const userId = req.user!.id;

  const result = await bookingService.getBookingsAsMentor(userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Bookings fetched successfully",
    data: result,
  });
});

export const getSingleBooking = async (req: Request, res: Response) => {
  const { id } = req.params;

  const booking = await bookingService.getSingleBooking(id);
  res.json({ booking });
};

const updateBookingStatus = async (req: Request, res: Response) => {
  const mentorId = req.user!.id;
  const { id } = req.params;
  const { status } = req.body;

  const booking = await bookingService.updateBookingStatus(
    mentorId,
    id,
    status
  );
  res.json({ message: "Status updated", booking });
};

const cancelBooking = async (req: Request, res: Response) => {
  const menteeId = req.user!.id;
  const { id } = req.params;

  const booking = await bookingService.cancelBooking(menteeId, id);
  res.json({ message: "Booking cancelled", booking });
};

export const BookingController = {
  createBooking,
  getMyBookings,
  getBookingsAsMentor,
  getSingleBooking,
  updateBookingStatus,
  cancelBooking,
};
