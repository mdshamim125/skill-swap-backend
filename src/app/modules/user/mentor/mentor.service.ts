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

  // Search by name or expertise
  if (searchTerm) {
    andConditions.push({
      OR: [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { profile: { expertise: { contains: searchTerm, mode: "insensitive" } } },
      ],
    });
  }

  // Filter by category
  if (category) {
    andConditions.push({
      skillsOffered: { some: { category: category } },
    });
  }

  // Filter by skills
  if (skills && skills.length > 0) {
    andConditions.push({
      skillsOffered: { some: { tags: { hasSome: skills } } },
    });
  }

  // Only active premium mentors
  andConditions.push({
    role: "MENTOR",
    isPremium: true,
    premiumExpires: { gt: new Date() },
  });

  // Only mentors with at least one published skill
  andConditions.push({
    skillsOffered: { some: { isPublished: true } },
  });

  const whereConditions = { AND: andConditions };

  // Fetch mentors with pagination
  const mentors = await prisma.user.findMany({
    where: whereConditions,
    include: { profile: true, skillsOffered: true },
    skip,
    take: limit,
    orderBy: { [sortBy || "createdAt"]: sortOrder || "desc" },
  });

  const total = await prisma.user.count({ where: whereConditions });

  return { meta: { page, limit, total }, data: mentors };
};
