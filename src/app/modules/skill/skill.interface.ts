import { SkillLevel } from "@prisma/client";

export interface ISkillCreatePayload {
  title: string;
  category: string;               // required
  description?: string | null;    // optional
  level?: SkillLevel;            // optional, fallback to default
  pricePerHour?: number | null;   // optional
  tags?: string[];                // optional
  isPublished?: boolean;          // optional
}

export interface ISkillUpdatePayload {
  title?: string;
  category?: string;
  description?: string | null;
  level?: SkillLevel;
  pricePerHour?: number | null;
  tags?: string[];
  isPublished?: boolean;
  file?: Express.Multer.File;
}
