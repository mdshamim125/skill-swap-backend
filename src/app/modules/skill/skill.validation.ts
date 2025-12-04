import { z } from "zod";

export const createSkillSchema = z.object({
  title: z.string().min(2, "Title is too short"),
  category: z.string().min(2, "Category is required"),
  description: z.string().optional(),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]).optional(),
  pricePerHour: z.number().nonnegative("Price cannot be negative").optional(),
  tags: z.array(z.string()).optional(),
  isPublished: z.boolean().optional(),

  // New fields (will be injected by backend, not user)
  isCustom: z.boolean().optional(),
  createdBy: z.string().nullable().optional(),
});
