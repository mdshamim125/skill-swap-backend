// src/modules/skill/skill.service.ts
import { prisma } from "../../shared/prisma";
import { ISkillCreatePayload, ISkillUpdatePayload } from "./skill.interface";
import { fileUploader } from "../../helper/fileUploader";
import { Prisma, Role } from "@prisma/client";
import { paginationHelper, IOptions } from "../../helper/paginationHelper";
import { skillSearchableFields, skillFilterableFields } from "./skill.constant";

// Create skill (ownerId from authenticated user)
const createSkill = async (
  ownerId: string,
  payload: ISkillCreatePayload,
  file?: Express.Multer.File
) => {
  let imageUrl: string | undefined;

  if (file) {
    const uploaded = await fileUploader.uploadToCloudinary(file);
    imageUrl = uploaded?.secure_url;
  }

  const created = await prisma.skill.create({
    data: {
      title: payload.title,
      category: payload.category ?? null,
      description: payload.description ?? null,
      level: payload.level ?? "BEGINNER",
      pricePerHour: payload.pricePerHour ?? null,
      tags: payload.tags ?? [],
      isPublished: payload.isPublished ?? true,
      owner: { connect: { id: ownerId } },
      // if you have image field on Skill, adjust accordingly:
      ...(imageUrl ? { imageUrl } : {}),
    },
  });

  return created;
};

// Get all skills with search, filters, pagination
const getAllSkills = async (params: any, options: IOptions) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);
  const { searchTerm, priceMin, priceMax, ...filters } = params;

  const andConditions: Prisma.SkillWhereInput[] = [];

  if (searchTerm) {
    const searchConditions = skillSearchableFields.map((field) => {
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

  // numeric filters
  if (priceMin) {
    andConditions.push({ pricePerHour: { gte: Number(priceMin) } });
  }
  if (priceMax) {
    andConditions.push({ pricePerHour: { lte: Number(priceMax) } });
  }

  if (Object.keys(filters).length > 0) {
    Object.entries(filters).forEach(([key, value]) => {
      if (skillFilterableFields.includes(key)) {
        // simple mapping; ownerId is not a relation object name in prisma but a field
        if (key === "ownerId") {
          andConditions.push({ ownerId: String(value) as any });
        } else {
          andConditions.push({ [key]: value } as any);
        }
      }
    });
  }

  const whereConditions: Prisma.SkillWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const data = await prisma.skill.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          profile: { select: { avatarUrl: true } },
        },
      },
    },
  });

  const total = await prisma.skill.count({ where: whereConditions });

  return { meta: { page, limit, total }, data };
};

// Get single skill by id
const getSkillById = async (id: string) => {
  return prisma.skill.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          profile: { select: { avatarUrl: true } },
        },
      },
    },
  });
};

// Update skill (only owner or admin)
const updateSkill = async (
  skillId: string,
  payload: ISkillUpdatePayload,
  requester: { id: string; role: Role }
) => {
  const skill = await prisma.skill.findUnique({ where: { id: skillId } });
  if (!skill) throw new Error("Skill not found");

  // RBAC: only owner or admin can update
  if (requester.role !== Role.ADMIN && skill.ownerId !== requester.id) {
    throw new Error("Unauthorized");
  }

  let imageUrl: string | undefined;
  if ((payload as any).file) {
    const uploaded = await fileUploader.uploadToCloudinary(
      (payload as any).file
    );
    imageUrl = uploaded?.secure_url;
  }

  const updateData: any = {};
  if (payload.title !== undefined) updateData.title = payload.title;
  if (payload.category !== undefined) updateData.category = payload.category;
  if (payload.description !== undefined)
    updateData.description = payload.description;
  if (payload.level !== undefined) updateData.level = payload.level;
  if (payload.pricePerHour !== undefined)
    updateData.pricePerHour = payload.pricePerHour;
  if (payload.tags !== undefined) updateData.tags = payload.tags;
  if (payload.isPublished !== undefined)
    updateData.isPublished = payload.isPublished;
  if (imageUrl) updateData.imageUrl = imageUrl;

  const updated = await prisma.skill.update({
    where: { id: skillId },
    data: updateData,
  });

  return updated;
};

// Delete skill (only owner or admin)
const deleteSkill = async (
  skillId: string,
  requester: { id: string; role: Role }
) => {
  const skill = await prisma.skill.findUnique({ where: { id: skillId } });
  if (!skill) throw new Error("Skill not found");

  if (requester.role !== Role.ADMIN && skill.ownerId !== requester.id) {
    throw new Error("Unauthorized");
  }

  return prisma.skill.delete({ where: { id: skillId } });
};

export const SkillService = {
  createSkill,
  getAllSkills,
  getSkillById,
  updateSkill,
  deleteSkill,
};
