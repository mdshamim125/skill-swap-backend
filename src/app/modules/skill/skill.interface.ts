import { SkillLevel } from "@prisma/client";

export interface ISkillCreatePayload {
  title: string;
  category: string;                // required
  description?: string | null;     // optional
  level?: SkillLevel;              // optional
  pricePerHour?: number | null;    // optional
  tags?: string[];                 // optional
  isPublished?: boolean;           // optional (admin use)
  
  isCustom?: boolean;              // true = user-created, false = admin-created
  createdBy?: string | null;       // userId if custom, null if admin
}


export interface ISkillUpdatePayload {
  title?: string;
  category?: string;
  description?: string | null;
  level?: SkillLevel;
  pricePerHour?: number | null;
  tags?: string[];
  isPublished?: boolean;

  isCustom?: boolean;             // rarely changed, but included for safety
}
