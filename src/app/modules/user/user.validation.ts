import z from "zod";

export const RoleEnum = z.enum(["USER", "PREMIUM_USER", "MENTOR", "ADMIN"]);
export const UserStatusEnum = z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]);

const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters");

const profileSchema = z.object({
  bio: z.string().optional(),
  avatarUrl: z.string().url().optional(),
  interests: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  expertise: z.string().optional(),
  travelStyles: z.array(z.string()).optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  experience: z.string().optional(),
  hourlyRate: z.number().optional(),
  phone: z.string().optional(),
});

export const createUserSchemaValidation = z.object({
  password: passwordSchema,
  user: z.object({
    email: z.string().email("Valid email required"),
    name: z.string().min(1, "Name is required"),
    avatar: z.string().url().optional(),
    role: RoleEnum.optional(), // default: USER
    status: UserStatusEnum.optional(),
    isVerified: z.boolean().optional(),
    isPremium: z.boolean().optional(),
    premiumExpires: z.string().datetime().optional(),
    profile: profileSchema.optional(),
  }),
});

export const updateUserSchemaValidation = z.object({
  password: passwordSchema.optional(),
  user: z
    .object({
      email: z.string().email().optional(),
      name: z.string().optional(),
      avatar: z.string().url().optional(),
      role: RoleEnum.optional(),
      status: UserStatusEnum.optional(),
      isVerified: z.boolean().optional(),
      isPremium: z.boolean().optional(),
      premiumExpires: z.string().datetime().optional(),
      profile: profileSchema.optional(),
    })
    .partial(),
});
