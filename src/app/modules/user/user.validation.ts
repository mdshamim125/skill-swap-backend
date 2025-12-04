import z from "zod";

export const RoleEnum = z.enum(["USER", "PREMIUM_USER", "MENTOR", "ADMIN"]);
export const UserStatusEnum = z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]);

const passwordSchema = z
  .string()
  .min(6, "Password must be at least 6 characters");

const ProfileSchema = z.object({
  bio: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  hourlyRate: z.coerce.number().optional(),

  interests: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),

  expertise: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]),
  experience: z.coerce.number().int().nonnegative().optional(),
});

export const createUserSchemaValidation = z.object({
  email: z.string().email("Valid email required"),
  name: z.string().min(1, "Name is required"),
  password: passwordSchema,
  avatar: z.string().url().optional(),
  role: RoleEnum.optional(), // default: USER
  status: UserStatusEnum.optional(),
  isVerified: z.boolean().optional(),
  isPremium: z.boolean().optional(),
  premiumExpires: z.string().datetime().optional(),
  profile: ProfileSchema.optional(),
});

export const updateUserSchemaValidation = z
  .object({
    email: z.string().email().optional(),
    name: z.string().optional(),
    password: passwordSchema.optional(),
    avatar: z.string().url().optional(),
    role: RoleEnum.optional(),
    status: UserStatusEnum.optional(),
    isVerified: z.boolean().optional(),
    isPremium: z.boolean().optional(),
    premiumExpires: z.string().datetime().optional(),
    profile: ProfileSchema.optional(),
  })
  .partial();
