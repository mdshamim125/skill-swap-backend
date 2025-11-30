import z from "zod";

//
// COMMON FIELDS
//
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

//
// =============== USER CREATE ===============
//
export const createUserValidationSchema = z.object({
  password: passwordSchema,
  user: z.object({
    name: z.string().nonempty("Name is required"),
    email: z.string().email("Valid email is required"),
    bio: z.string().optional(),
    skills: z.array(z.string()).optional(),
    interests: z.array(z.string()).optional(),
    profileImage: z.string().url().optional(),
  }),
});

//
// =============== USER UPDATE ===============
//
export const updateUserValidationSchema = z.object({
  password: passwordSchema.optional(),
  user: z
    .object({
      name: z.string().optional(),
      email: z.string().email().optional(),
      bio: z.string().optional(),
      skills: z.array(z.string()).optional(),
      interests: z.array(z.string()).optional(),
      profileImage: z.string().url().optional(),
    })
    .partial(),
});

//
// =============== MENTOR CREATE ===============
//
export const createMentorValidationSchema = z.object({
  password: passwordSchema,
  mentor: z.object({
    name: z.string().nonempty("Name is required"),
    email: z.string().email("Valid email is required"),
    expertise: z.array(z.string()).min(1, "At least one expertise required"),
    yearsOfExperience: z.number().min(0, "Experience must be positive"),
    bio: z.string().optional(),
    hourlyRate: z.number().min(1, "Hourly rate must be at least 1"),
    profileImage: z.string().url().optional(),
    languages: z.array(z.string()).optional(),
  }),
});

//
// =============== MENTOR UPDATE ===============
//
export const updateMentorValidationSchema = z.object({
  password: passwordSchema.optional(),
  mentor: z
    .object({
      name: z.string().optional(),
      email: z.string().email().optional(),
      expertise: z.array(z.string()).optional(),
      yearsOfExperience: z.number().optional(),
      bio: z.string().optional(),
      hourlyRate: z.number().optional(),
      profileImage: z.string().url().optional(),
      languages: z.array(z.string()).optional(),
    })
    .partial(),
});

//
// =============== ADMIN CREATE ===============
//
export const createAdminValidationSchema = z.object({
  password: passwordSchema,
  admin: z.object({
    name: z.string().nonempty("Admin name is required"),
    email: z.string().email("Valid email is required"),
  }),
});

//
// =============== ADMIN UPDATE ===============
//
export const updateAdminValidationSchema = z.object({
  password: passwordSchema.optional(),
  admin: z
    .object({
      name: z.string().optional(),
      email: z.string().email().optional(),
    })
    .partial(),
});

//
// EXPORT ALL VALIDATIONS
//
export const UserValidation = {
  createUserValidationSchema,
  updateUserValidationSchema,

  createMentorValidationSchema,
  updateMentorValidationSchema,

  createAdminValidationSchema,
  updateAdminValidationSchema,
};
