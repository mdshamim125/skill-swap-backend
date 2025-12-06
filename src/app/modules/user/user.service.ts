import { Request } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../../shared/prisma";
import { fileUploader } from "../../helper/fileUploader";
import { IOptions, paginationHelper } from "../../helper/paginationHelper";
import { Prisma, Role } from "@prisma/client";
import { userSearchableFields, userFilterableFields } from "./user.constant";

// ===============================
// CREATE USER (any role)
// ===============================
const createUser = async (req: Request, role: Role) => {
  let avatarUrl: string | undefined;

  if (req.file) {
    const uploaded = await fileUploader.uploadToCloudinary(req.file);
    avatarUrl = uploaded?.secure_url;
  }

  const hashedPassword = await bcrypt.hash(req.body.password, 10);

  const result = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        email: req.body.email,
        password: hashedPassword,
        role,
        name: req.body.name,
        avatar: avatarUrl,
        isVerified: req.body.isVerified || false,
        isPremium: req.body.isPremium || false,
        premiumExpires: req.body.premiumExpires,
      },
    });

    await tx.profile.create({
      data: {
        userId: createdUser.id,
        bio: req.body.bio ?? "",
        avatarUrl: avatarUrl ?? "",
        interests: req.body.interests ?? [],
        languages: req.body.languages ?? [],
        country: req.body.country ?? "",
        city: req.body.city ?? "",
        hourlyRate: req.body.hourlyRate ?? 0,
        phone: req.body.phone ?? "",
      },
    });

    return {
      ...createdUser,
      password: undefined, // hide password
    };
  });

  return result;
};

// ===============================
// GET ALL USERS
// Admin: can see all
// User: only see themselves
// ===============================
const getAllFromDB = async (
  params: any,
  options: IOptions,
  requester: { id: string; role: Role }
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const { searchTerm, ...filters } = params;

  const andConditions: Prisma.UserWhereInput[] = [];

  if (searchTerm) {
    const searchConditions = userSearchableFields.map((field) => {
      const [relation, key] = field.split(".");
      return relation
        ? {
            [relation]: {
              [key]: { contains: searchTerm, mode: "insensitive" },
            },
          }
        : { [field]: { contains: searchTerm, mode: "insensitive" } };
    });
    andConditions.push({ OR: searchConditions });
  }

  if (Object.keys(filters).length > 0) {
    Object.entries(filters).forEach(([key, value]) => {
      if (userFilterableFields.includes(key)) {
        const [relation, field] = key.split(".");
        if (relation) {
          andConditions.push({ [relation]: { [field]: value } });
        } else {
          andConditions.push({ [key]: value });
        }
      }
    });
  }

  // RBAC: normal users can only see themselves and active mentors
  if (requester.role !== Role.ADMIN) {
    andConditions.push({
      OR: [
        { id: requester.id }, // always show self
        {
          role: Role.MENTOR,
          isPremium: true,
          premiumExpires: { gt: new Date() }, // only active premium mentors
        },
      ],
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

  // remove password before returning
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

export const UserService = {
  createUser,
  getAllFromDB,
  getById,
  updateUser,
  deleteUser,
  updateUserRole,
};
