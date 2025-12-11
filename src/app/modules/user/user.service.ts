import { Request } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../../shared/prisma";
import { fileUploader } from "../../helper/fileUploader";
import { IOptions, paginationHelper } from "../../helper/paginationHelper";
import { Prisma, Role, UserStatus } from "@prisma/client";
import { userSearchableFields, userFilterableFields } from "./user.constant";

// ===============================
// CREATE USER (any role)
// ===============================
// ===============================
// CREATE USER (any role)
// ===============================
const createUser = async (req: Request, role: Role) => {
  let avatarUrl: string | undefined;

  // Upload avatar if provided
  if (req.file) {
    const uploaded = await fileUploader.uploadToCloudinary(req.file);
    avatarUrl = uploaded?.secure_url;
  }

  const hashedPassword = await bcrypt.hash(req.body.password, 10);

  const result = await prisma.$transaction(async (tx) => {
    // Get default free bookings from system settings
    const settings = await tx.systemSetting.findFirst();
    const defaultFreeBookings = settings?.freeBookings ?? 3;

    // Create User
    const createdUser = await tx.user.create({
      data: {
        email: req.body.email,
        password: hashedPassword,
        role,
        name: req.body.name,
        avatar: avatarUrl,
        isVerified: false, // user is not verified on registration
        freeBookingsLeft: role === "USER" ? defaultFreeBookings : 0, // mentor gets 0 free bookings

        // Remove isPremium & premiumExpires (managed by subscription system)
      },
    });

    // Create Profile
    await tx.profile.create({
      data: {
        userId: createdUser.id,
        bio: req.body.bio ?? "",
        avatarUrl: avatarUrl ?? "",
        interests: req.body.interests ?? [],
        languages: req.body.languages ?? [],
        country: req.body.country ?? "",
        city: req.body.city ?? "",
        hourlyRate: role === "MENTOR" ? req.body.hourlyRate ?? 0 : 0, // only mentor has hourlyRate
        phone: req.body.phone ?? "",
      },
    });

    // Return user without password
    return {
      ...createdUser,
      password: undefined,
    };
  });

  return result;
};

// ===============================
// GET ALL USERS
// export const getAllFromDB = async (
//   params: any,
//   options: any,
//   requester: { id: string; role: Role }
// ) => {
//   const { page, limit, skip, sortBy, sortOrder } =
//     paginationHelper.calculatePagination(options);

//   const { searchTerm, ...filters } = params;

//   const andConditions: Prisma.UserWhereInput[] = [];

//   // Search
//   if (searchTerm) {
//     const searchConditions = ["name", "email"].map((field) => ({
//       [field]: { contains: searchTerm, mode: "insensitive" },
//     }));
//     andConditions.push({ OR: searchConditions });
//   }

//   // Filters
//   if (Object.keys(filters).length > 0) {
//     Object.entries(filters).forEach(([key, value]) => {
//       andConditions.push({ [key]: value });
//     });
//   }

//   // RBAC: control who can see whom
//   if (requester.role === Role.USER) {
//     // Users see only active mentors
//     andConditions.push({
//       role: Role.MENTOR,
//       isPremium: true,
//       premiumExpires: { gt: new Date() },
//     });
//   } else if (requester.role === Role.MENTOR) {
//     // Mentors see users + admins (exclude self)
//     andConditions.push({
//       OR: [{ role: Role.USER }, { role: Role.ADMIN }],
//     });
//   } // Admins can see everyone, no extra filter

//   const whereConditions: Prisma.UserWhereInput =
//     andConditions.length > 0 ? { AND: andConditions } : {};

//   const users = await prisma.user.findMany({
//     skip,
//     take: limit,
//     where: whereConditions,
//     orderBy: { [sortBy]: sortOrder },
//     include: { profile: true },
//   });

//   const total = await prisma.user.count({ where: whereConditions });

//   // Remove password
//   const safeUsers = users.map(({ password, ...rest }) => rest);

//   return { meta: { page, limit, total }, data: safeUsers };
// };

export const getAllFromDB = async (
  params: any,
  options: any,
  requester: { id: string; role: Role }
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const { searchTerm, role, premium, status, ...filters } = params;

  const andConditions: Prisma.UserWhereInput[] = [];

  // Search
  if (searchTerm) {
    const searchConditions = userSearchableFields.map((field) => ({
      [field]: { contains: searchTerm, mode: "insensitive" },
    }));
    andConditions.push({ OR: searchConditions });
  }

  // Role filter (only if valid enum)
  if (role && role !== "") {
    andConditions.push({ role: role as Role });
  }

  // Premium filter
  if (premium && premium !== "") {
    andConditions.push({ isPremium: premium === "true" });
  }

  // Status filter
  if (status && status !== "") {
    andConditions.push({ status: status as UserStatus });
  }

  // Other filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      andConditions.push({ [key]: value });
    }
  });

  // RBAC - restrict visible users
  if (requester.role === Role.USER) {
    andConditions.push({
      role: Role.MENTOR,
      isPremium: true,
      premiumExpires: { gt: new Date() },
    });
  } else if (requester.role === Role.MENTOR) {
    andConditions.push({
      OR: [{ role: Role.USER }, { role: Role.ADMIN }],
    });
  }

  const whereConditions: Prisma.UserWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const users = await prisma.user.findMany({
    skip,
    take: limit,
    where: whereConditions,
    orderBy: { [sortBy]: sortOrder },
    include: { profile: true },
  });

  const total = await prisma.user.count({ where: whereConditions });

  // Remove passwords
  const safeUsers = users.map(({ password, ...rest }) => rest);

  return { meta: { page, limit, total }, data: safeUsers };
};

// ===============================
// GET SINGLE USER
// ===============================
const getById = async (id: string, requester: { id: string; role: Role }) => {
  if (requester.role !== Role.ADMIN && requester.id !== id) {
    throw new Error("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: { id },
    include: { profile: true },
  });

  if (!user) throw new Error("User not found");

  const { password, ...safeUser } = user;
  return safeUser;
};

// ===============================
// UPDATE USER PROFILE (with RBAC)
// ===============================
const updateUser = async (req: Request) => {
  const userId = req.user?.id;
  if (!userId) throw new Error("Unauthorized or missing user ID");

  const profileData = req.body;

  return await prisma.$transaction(async (tx) => {
    // Negative hourly rate protection
    if (profileData.hourlyRate && profileData.hourlyRate < 0)
      throw new Error("Hourly rate cannot be negative");

    return await tx.profile.update({
      where: { userId },
      data: {
        bio: profileData.bio,
        country: profileData.country,
        city: profileData.city,
        phone: profileData.phone,
        hourlyRate: profileData.hourlyRate,
        interests: profileData.interests,
        languages: profileData.languages,

        skills: profileData.skills?.length
          ? ({
              set: [],
              connect: profileData.skills.map((id: string) => ({ id })),
            } as any)
          : ({ set: [] } as any),

        avatarUrl: profileData.avatarUrl ?? undefined,
      },
    });
  });
};

// ===============================
// DELETE USER (RBAC)
// ===============================
const deleteUser = async (
  targetUserId: string,
  requester: { id: string; role: Role }
) => {
  if (requester.role !== Role.ADMIN && requester.id !== targetUserId) {
    throw new Error("Unauthorized");
  }

  return prisma.user.delete({ where: { id: targetUserId } });
};

// ===============================
// UPDATE USER ROLE (Admin Only)
// ===============================
const updateUserRole = async (
  userId: string,
  newRole: Role,
  requesterRole: Role
) => {
  if (requesterRole !== Role.ADMIN) throw new Error("Unauthorized");

  if (!Object.values(Role).includes(newRole)) {
    throw new Error("Invalid role");
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  });

  return updatedUser;
};

// ===============================
// GET TOP RATED MENTORS
// ===============================
const getTopRatedMentors = async () => {
  const mentors = await prisma.user.findMany({
    where: {
      role: "MENTOR", // Must be mentor
      // isPremium: true, // Must be premium mentor
      // premiumExpires: { gt: new Date() }, // Premium must still be active
      averageRating: { gte: 0 }, // Has rating
    },

    orderBy: [
      { averageRating: "desc" }, // Sort by rating first
      { reviewsReceived: { _count: "desc" } }, // Then by number of reviews
    ],

    take: 6, // Top 6 premium mentors

    include: {
      profile: { include: { skills: true } },
      reviewsReceived: true,
    },
  });

  return mentors.map(({ password, ...safe }) => safe);
};

export const UserService = {
  createUser,
  getAllFromDB,
  getById,
  updateUser,
  deleteUser,
  updateUserRole,
  getTopRatedMentors,
};
