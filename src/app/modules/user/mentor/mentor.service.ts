import { IOptions, paginationHelper } from "../../../helper/paginationHelper";
import { prisma } from "../../../shared/prisma";

interface MentorSearchParams {
  searchTerm?: string;
  skills?: string[]; // optional skill filters
  category?: string;
}

// export const getActiveMentors = async (
//   params: MentorSearchParams,
//   options: IOptions
// ) => {
//   const { page, limit, skip, sortBy, sortOrder } =
//     paginationHelper.calculatePagination(options);

//   const { searchTerm, skills, category } = params;

//   const andConditions: any[] = [];

//   // --------------------------------------
//   // 🔍 SEARCH (Name + Profile.bio + Profile.expertise + OfferedSkills.title)
//   // --------------------------------------
//   if (searchTerm && searchTerm.trim() !== "") {
//     const keyword = searchTerm.trim();

//     andConditions.push({
//       OR: [
//         // USER NAME SEARCH
//         { name: { contains: keyword, mode: "insensitive" } },

//         // PROFILE BIO SEARCH
//         {
//           profile: {
//             bio: { contains: keyword, mode: "insensitive" },
//           },
//         },

//         // PROFILE EXPERTISE SEARCH (BEGINNER, INTERMEDIATE, ADVANCED)
//         // user types: "advanced" -> matches enum
//         {
//           profile: {
//             expertise: {
//               equals: keyword.toUpperCase(), // convert user text → ENUM
//             },
//           },
//         },

//         // OFFERED SKILL TITLES SEARCH
//         {
//           offeredSkills: {
//             some: {
//               title: {
//                 contains: keyword,
//                 mode: "insensitive",
//               },
//             },
//           },
//         },
//       ],
//     });
//   }

//   // --------------------------------------
//   // 🏷 CATEGORY FILTER
//   // --------------------------------------
//   if (category && category !== "all") {
//     andConditions.push({
//       offeredSkills: {
//         some: {
//           category,
//         },
//       },
//     });
//   }

//   // --------------------------------------
//   // 🧠 SKILLS FILTER
//   // --------------------------------------
//   if (skills && skills.length > 0 && !skills.includes("all")) {
//     andConditions.push({
//       offeredSkills: {
//         some: {
//           title: { in: skills },
//         },
//       },
//     });
//   }

//   // --------------------------------------
//   // 🎖 PREMIUM MENTORS ONLY
//   // --------------------------------------
//   andConditions.push({
//     role: "MENTOR",
//     isPremium: true,
//     premiumExpires: { gt: new Date() },
//   });

//   // --------------------------------------
//   // 📌 MUST HAVE PUBLISHED SKILLS
//   // --------------------------------------
//   // andConditions.push({
//   //   offeredSkills: {
//   //     some: {
//   //       isPublished: true,
//   //     },
//   //   },
//   // });

//   // --------------------------------------
//   // WHERE FINAL
//   // --------------------------------------
//   const whereConditions = { AND: andConditions };

//   // --------------------------------------
//   // 📌 MAIN QUERY
//   // --------------------------------------
//   const mentors = await prisma.user.findMany({
//     where: whereConditions,

//     include: {
//       profile: { include: { skills: true } },
//       offeredSkills: true,
//     },

//     skip,
//     take: limit,

//     orderBy: {
//       [sortBy || "createdAt"]: sortOrder || "desc",
//     },
//   });

//   const total = await prisma.user.count({ where: whereConditions });

//   return {
//     meta: { page, limit, total },
//     data: mentors,
//   };
// };

export const getActiveMentors = async (
  params: MentorSearchParams,
  options: IOptions
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const {  skills, category } = params;
  const searchTerm = params.searchTerm || "";


  const andConditions: any[] = [];

  // ----------------------------
  // 🔍 SEARCH (Name + Bio + Expertise + Profile Skills)
  // ----------------------------
  if (searchTerm?.trim()) {
    const keyword = searchTerm.trim();

    andConditions.push({
      OR: [
        { name: { contains: keyword, mode: "insensitive" } },

        { profile: { bio: { contains: keyword, mode: "insensitive" } } },

        {
          profile: {
            expertise: {
              contains: keyword, // "begin" matches "BEGINNER"
              mode: "insensitive",
            },
          },
        },

        {
          profile: {
            skills: {
              some: {
                title: { contains: keyword, mode: "insensitive" },
              },
            },
          },
        },
      ],
    });
  }

  // ----------------------------
  // 🏷 CATEGORY FILTER
  // ----------------------------
  if (category && category !== "all") {
    andConditions.push({
      profile: {
        skills: {
          some: { category },
        },
      },
    });
  }

  // ----------------------------
  // 🎯 SKILL FILTER
  // ----------------------------
  if (skills && skills.length > 0 && !skills.includes("all")) {
    andConditions.push({
      profile: {
        skills: {
          some: { title: { in: skills } },
        },
      },
    });
  }

  // ----------------------------
  // 🟡 ONLY ACTIVE PREMIUM MENTORS
  // ----------------------------
  andConditions.push({
    role: "MENTOR",
    isPremium: true,
    premiumExpires: { gt: new Date() },
  });

  const whereConditions = { AND: andConditions };

  // ----------------------------
  // 📌 MAIN QUERY
  // ----------------------------
  const mentors = await prisma.user.findMany({
    where: whereConditions,

    include: {
      profile: {
        include: {
          skills: true,
        },
      },
    },

    skip,
    take: limit,

    orderBy: {
      [sortBy || "createdAt"]: sortOrder || "desc",
    },
  });

  const total = await prisma.user.count({ where: whereConditions });

  return {
    meta: { page, limit, total },
    data: mentors,
  };
};

export const getSingleActiveMentor = async (id: string) => {
  const whereConditions: any = {
    id,
    role: "MENTOR",
    isPremium: true,
    premiumExpires: { gt: new Date() },
    // offeredSkills: {
    //   some: { isPublished: true },
    // },
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
