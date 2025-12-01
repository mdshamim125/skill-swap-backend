import { z } from "zod";

export const ReviewValidation = {
  create: z.object({
    body: z.object({
      targetUserId: z.string(),
      bookingId: z.string(),
      rating: z.number().min(1).max(5),
      comment: z.string().optional(),
    }),
  }),

  update: z.object({
    body: z.object({
      rating: z.number().min(1).max(5).optional(),
      comment: z.string().optional(),
    }),
  }),
};
