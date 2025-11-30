// src/modules/skill/skill.validation.ts
import { z } from "zod";

export const createSkillSchema = z.object({
  title: z.string().min(2, "Title too short"),
  category: z.string().optional(),
  description: z.string().optional(),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]).optional(),
  pricePerHour: z.number().nonnegative().optional(),
  tags: z.array(z.string()).optional(),
  isPublished: z.boolean().optional(),
});

export const updateSkillSchema = createSkillSchema.partial();
