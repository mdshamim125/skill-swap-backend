// Base user input (common fields)
export interface BaseUserInput {
  email: string;
  password: string;
  role: "USER" | "PREMIUM_USER" | "MENTOR" | "ADMIN"; // can also use Role enum
}

// Profile details
export interface ProfileInput {
  bio?: string;
  avatarUrl?: string;
  interests?: string[];
  languages?: string[];
  skills?: string[];
  expertise?: string;
  country?: string;
  city?: string;
  experience?: string;
  hourlyRate?: number;
  phone?: string;
}

// Full input for creating a user with profile
export interface CreateUserInput extends BaseUserInput, ProfileInput {}
