import { z } from "zod";
import { BookingStatus } from "@prisma/client";

export const BookingValidation = {
  createBookingSchema: z.object({
    mentorId: z.string().uuid(),
    skillId: z.string().uuid(),
    scheduledAt: z.string().datetime(),
    durationMin: z.number().min(15),
  }),

  updateStatusSchema: z.object({
    status: z.nativeEnum(BookingStatus),
  }),
};
