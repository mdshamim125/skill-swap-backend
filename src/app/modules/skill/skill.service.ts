import { prisma } from "../../shared/prisma";
import { ISkillCreatePayload, ISkillUpdatePayload } from "./skill.interface";
import { Prisma, Role } from "@prisma/client";
import { paginationHelper, IOptions } from "../../helper/paginationHelper";
import { skillSearchableFields, skillFilterableFields } from "./skill.constant";

// ===============================
// Admin creates skill
// ===============================
const createSkill = async (
  admin: { id: string; role: Role },
  payload: ISkillCreatePayload,
) => {
  if (admin.role !== Role.ADMIN) {
    throw new Error("Only admin can create skills");
  }

  let imageUrl: string | undefined;


  const created = await prisma.skill.create({
    data: {
      title: payload.title,
      category: payload.category ?? null,
      description: payload.description ?? null,
      level: payload.level ?? "BEGINNER",
      pricePerHour: payload.pricePerHour ?? null,
      tags: payload.tags ?? [],
      isPublished: payload.isPublished ?? true,
      isCustom: false,          // always false for admin
      createdBy: null,          // admin-created skill
      ownerId: admin.id,        // admin is the owner in this context
      ...(imageUrl ? { imageUrl } : {}),
    },
  });

  return created;
};

// ===============================
// Get All Skills
// Search + Filters + Pagination
// ===============================
const getAllSkills = async (params: any, options: IOptions) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);
  const { searchTerm, priceMin, priceMax, ...filters } = params;

  const andConditions: Prisma.SkillWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: skillSearchableFields.map((field) => ({
        [field]: { contains: searchTerm, mode: "insensitive" },
      })),
    });
  }

  if (priceMin) {
    andConditions.push({ pricePerHour: { gte: Number(priceMin) } });
  }
  if (priceMax) {
    andConditions.push({ pricePerHour: { lte: Number(priceMax) } });
  }

  Object.entries(filters).forEach(([key, value]) => {
    if (skillFilterableFields.includes(key)) {
      andConditions.push({ [key]: value } as any);
    }
  });

  const whereConditions =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const data = await prisma.skill.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
  });

  const total = await prisma.skill.count({ where: whereConditions });

  return { meta: { page, limit, total }, data };
};

// ===============================
// Get Single Skill
// ===============================
const getSkillById = async (id: string) => {
  return prisma.skill.findUnique({ where: { id } });
};

const getSkills = async () => {
  const skills = await prisma.skill.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return skills;
};

// ===============================
// Update Skill (Admin only)
// ===============================
const updateSkill = async (
  skillId: string,
  payload: ISkillUpdatePayload,
  admin: { id: string; role: Role }
) => {
  if (admin.role !== Role.ADMIN) {
    throw new Error("Only admin can update skills");
  }

  const skill = await prisma.skill.findUnique({ where: { id: skillId } });
  if (!skill) throw new Error("Skill not found");


  const updated = await prisma.skill.update({
    where: { id: skillId },
    data: {
      title: payload.title ?? skill.title,
      category: payload.category ?? skill.category,
      description: payload.description ?? skill.description,
      level: payload.level ?? skill.level,
      pricePerHour: payload.pricePerHour ?? skill.pricePerHour,
      tags: payload.tags ?? skill.tags,
      isPublished:
        payload.isPublished !== undefined
          ? payload.isPublished
          : skill.isPublished,
    },
  });

  return updated;
};

// ===============================
// Delete Skill (Admin only)
// ===============================
const deleteSkill = async (skillId: string, admin: { id: string; role: Role }) => {
  if (admin.role !== Role.ADMIN) {
    throw new Error("Only admin can delete skills");
  }

  return prisma.skill.delete({ where: { id: skillId } });
};

export const SkillService = {
  createSkill,
  getAllSkills,
  getSkillById,
  updateSkill,
  deleteSkill,
  getSkills
};
