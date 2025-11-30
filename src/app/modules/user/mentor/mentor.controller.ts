import { Request, Response } from "express";
import { getActiveMentors } from "./mentor.service";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";

const listMentors = catchAsync(async (req: Request, res: Response) => {
  const filters = {
    searchTerm: req.query.searchTerm as string,
    skills: req.query.skills ? (req.query.skills as string).split(",") : undefined,
    category: req.query.category as string,
  };

  const options = {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    sortBy: req.query.sortBy as string,
    sortOrder: (req.query.sortOrder as "asc" | "desc") || "desc",
  };

  const result = await getActiveMentors(filters, options);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Mentors retrieved successfully!",
    meta: result.meta,
    data: result.data,
  });
});

export const MentorController = { listMentors };
