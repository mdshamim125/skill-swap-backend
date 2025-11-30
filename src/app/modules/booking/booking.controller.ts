import { Request, Response } from "express";
import { bookingService } from "./booking.service";

const createBooking = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const data = req.body;

  const booking = await bookingService.createBooking(userId, data);
  res.status(201).json({ message: "Booking created", booking });
};

const getMyBookings = async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const bookings = await bookingService.getBookingsAsMentee(userId);
  res.json({ bookings });
};

const getBookingsAsMentor = async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const bookings = await bookingService.getBookingsAsMentor(userId);
  res.json({ bookings });
};

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
