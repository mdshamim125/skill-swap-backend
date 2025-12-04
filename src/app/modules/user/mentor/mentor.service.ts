import { IOptions, paginationHelper } from "../../../helper/paginationHelper";
import { prisma } from "../../../shared/prisma";

interface MentorSearchParams {
  searchTerm?: string;
  skills?: string[]; // optional skill filters
  category?: string;
}

export const getActiveMentors = async (
  params: MentorSearchParams,
  options: IOptions
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const { searchTerm, skills, category } = params;

  const andConditions: any[] = [];

  // Search by name or profile.expertise
  if (searchTerm) {
    andConditions.push({
      OR: [
        { name: { contains: searchTerm, mode: "insensitive" } },
        {
          profile: { expertise: { contains: searchTerm, mode: "insensitive" } },
        },
      ],
    });
  }

  // Category filter
  if (category) {
    andConditions.push({
      offeredSkills: { some: { category } },
    });
  }

  // Skills filter
  if (skills && skills.length > 0) {
    andConditions.push({
      offeredSkills: { some: { tags: { hasSome: skills } } },
    });
  }

  // Premium active mentor filter
  andConditions.push({
    role: "MENTOR",
    isPremium: true,
    premiumExpires: { gt: new Date() },
  });

  // Must have at least one published skill
  andConditions.push({
    offeredSkills: { some: { isPublished: true } },
  });

  const whereConditions = { AND: andConditions };

  // 🔥 Fetch mentors with profile.skills relation included
  const mentors = await prisma.user.findMany({
    where: whereConditions,
    include: {
      profile: {
        include: {
          skills: true, // ⭐ Fetch skills linked to profile
        },
      },
      offeredSkills: true, // keep your published skills list
    },
    skip,
    take: limit,
    orderBy: { [sortBy || "createdAt"]: sortOrder || "desc" },
  });

  const total = await prisma.user.count({ where: whereConditions });

  return { meta: { page, limit, total }, data: mentors };
};

export const getSingleActiveMentor = async (id: string) => {
  const whereConditions: any = {
    id,
    role: "MENTOR",
    isPremium: true,
    premiumExpires: { gt: new Date() },
    offeredSkills: {
      some: { isPublished: true },
    },
  };

  const mentor = await prisma.user.findFirst({
    where: whereConditions,
    include: {
      profile: {
        include: {
          skills: true, // 🔥 Fetch profile.skills relation
        },
      },
      offeredSkills: {
        where: { isPublished: true },
      },
    },
  });

  if (!mentor) {
    return {
      success: false,
      message: "Active mentor not found",
      data: null,
    };
  }

  return {
    success: true,
    message: "Mentor fetched successfully",
    data: mentor,
  };
};
