import { BookingStatus } from "@prisma/client";
import { prisma } from "../../shared/prisma";

const FREE_USER_BOOKING_LIMIT = 3;

const createBooking = async (menteeId: string, data: any) => {
  const { mentorId, skillId, scheduledAt, durationMin } = data;

  // ----------------------------
  // 1. Fetch mentee info
  // ----------------------------
  const mentee = await prisma.user.findUnique({
    where: { id: menteeId },
    select: { isPremium: true, premiumExpires: true },
  });
  if (!mentee) throw new Error("Mentee not found");

  // ----------------------------
  // 2. Mentee premium check
  // ----------------------------
  const menteePremiumValid =
    mentee.isPremium &&
    mentee.premiumExpires &&
    new Date(mentee.premiumExpires) > new Date();

  if (!menteePremiumValid) {
    const activeBookings = await prisma.booking.count({
      where: {
        menteeId,
        status: { in: [BookingStatus.PENDING, BookingStatus.ACCEPTED] },
      },
    });

    if (activeBookings >= FREE_USER_BOOKING_LIMIT) {
      throw new Error(
        `Free users can only have ${FREE_USER_BOOKING_LIMIT} active bookings. Upgrade to premium for unlimited sessions.`
      );
    }
  }

  // ----------------------------
  // 3. Fetch skill & mentor info
  // ----------------------------
  const skill = await prisma.skill.findUnique({
    where: { id: skillId },
    include: { owner: true }, // include mentor
  });
  if (!skill) throw new Error("Skill not found");

  // Prevent self-booking
  if (skill.ownerId === menteeId) {
    throw new Error("You cannot book your own skill");
  }

  // ----------------------------
  // 4. Mentor premium check
  // ----------------------------
  const mentor = skill.owner;

  const mentorPremiumValid =
    mentor.isPremium &&
    mentor.premiumExpires &&
    new Date(mentor.premiumExpires) > new Date();

  if (!mentorPremiumValid) {
    throw new Error("This mentor's premium has expired. You cannot book them.");
  }

  // ----------------------------
  // 5. Create booking
  // ----------------------------
  return prisma.booking.create({
    data: {
      menteeId,
      mentorId,
      skillId,
      scheduledAt: new Date(scheduledAt),
      durationMin,
    },
  });
};


const getBookingsAsMentee = async (menteeId: string) => {
  return prisma.booking.findMany({
    where: { menteeId },
    include: {
      mentor: true,
      skill: true,
    },
    orderBy: { scheduledAt: "desc" },
  });
};

const getBookingsAsMentor = async (mentorId: string) => {
  return prisma.booking.findMany({
    where: { mentorId },
    include: {
      mentee: true,
      skill: true,
    },
    orderBy: { scheduledAt: "desc" },
  });
};

const getSingleBooking = async (id: string) => {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      mentee: true,
      mentor: true,
      skill: true,
      reviews: true,
    },
  });

  if (!booking) throw new Error("Booking not found");

  return booking;
};

const FREE_MENTOR_ACTIVE_BOOKING_LIMIT = 10;

const updateBookingStatus = async (
  mentorId: string,
  bookingId: string,
  status: BookingStatus
) => {
  // Fetch booking first
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });
  if (!booking) throw new Error("Booking not found");

  // Ensure correct mentor
  if (booking.mentorId !== mentorId) {
    throw new Error("Not authorized");
  }

  // Fetch mentor premium info
  const mentor = await prisma.user.findUnique({
    where: { id: mentorId },
    select: { isPremium: true, premiumExpires: true },
  });

  const isPremiumValid =
    mentor?.isPremium &&
    mentor?.premiumExpires &&
    new Date(mentor.premiumExpires) > new Date();

  // -----------------------------------------
  // PREMIUM LIMIT: Free mentors can't accept too many
  // -----------------------------------------
  if (status === BookingStatus.ACCEPTED && !isPremiumValid) {
    const activeBookings = await prisma.booking.count({
      where: {
        mentorId,
        status: { in: [BookingStatus.PENDING, BookingStatus.ACCEPTED] },
      },
    });

    if (activeBookings >= FREE_MENTOR_ACTIVE_BOOKING_LIMIT) {
      throw new Error(
        `Free mentors can accept only ${FREE_MENTOR_ACTIVE_BOOKING_LIMIT} active bookings. Upgrade to premium for unlimited sessions.`
      );
    }
  }

  // -----------------------------------------
  // Update booking status
  // -----------------------------------------
  return prisma.booking.update({
    where: { id: bookingId },
    data: { status },
  });
};

const cancelBooking = async (menteeId: string, bookingId: string) => {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new Error("Booking not found");

  if (booking.menteeId !== menteeId) {
    throw new Error("Not authorized");
  }

  return prisma.booking.update({
    where: { id: bookingId },
    data: { status: BookingStatus.CANCELLED },
  });
};

export const bookingService = {
  createBooking,
  getBookingsAsMentee,
  getBookingsAsMentor,
  getSingleBooking,
  updateBookingStatus,
  cancelBooking,
};
