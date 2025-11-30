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
      },
    });

    await tx.profile.create({
      data: {
        userId: createdUser.id,
        bio: req.body.bio,
        avatarUrl,
        interests: req.body.interests ?? [],
        languages: req.body.languages ?? [],
        skills: req.body.skills ?? [],
        expertise: req.body.expertise,
        country: req.body.country,
        city: req.body.city,
        experience: req.body.experience,
        hourlyRate: req.body.hourlyRate,
        phone: req.body.phone,
      },
    });

    return createdUser;
  });

  return result;
};

// ===============================
// GET ALL USERS
// ===============================
const getAllFromDB = async (params: any, options: IOptions) => {
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

  return { meta: { page, limit, total }, data: users };
};

// ===============================
// GET SINGLE USER
// ===============================
const getById = async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
    include: { profile: true },
  });
};

// ===============================
// UPDATE USER PROFILE
// ===============================
const updateUser = async (id: string, payload: any) => {
  let avatarUrl: string | undefined;

  if (payload.file) {
    const uploaded = await fileUploader.uploadToCloudinary(payload.file);
    avatarUrl = uploaded?.secure_url;
  }

  const result = await prisma.$transaction(async (tx) => {
    if (payload.email || payload.password) {
      await tx.user.update({
        where: { id },
        data: {
          email: payload.email,
          password: payload.password
            ? await bcrypt.hash(payload.password, 10)
            : undefined,
        },
      });
    }

    const { email, password, file, ...profileData } = payload;

    await tx.profile.update({
      where: { userId: id },
      data: { ...profileData, avatarUrl: avatarUrl ?? profileData.avatarUrl },
    });

    return true;
  });

  return result;
};

// ===============================
// DELETE USER
// ===============================
const deleteUser = async (id: string) => {
  return prisma.user.delete({ where: { id } });
};

// ===============================
// UPDATE USER ROLE (Admin Only)
// ===============================
const updateUserRole = async (userId: string, newRole: Role) => {
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
