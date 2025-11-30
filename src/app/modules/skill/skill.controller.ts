// src/modules/skill/skill.controller.ts
import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { SkillService } from "./skill.service";
import { paginationHelper } from "../../helper/paginationHelper";
import { Role } from "@prisma/client";
import pick from "../../helper/pick";
import { skillFilterableFields } from "./skill.constant";

// CREATE SKILL
const createSkill = catchAsync(async (req: Request, res: Response) => {
  // auth middleware must set req.user
  const requester = req.user!;
  const payload = req.body;
  const file = req.file as Express.Multer.File | undefined;

  const result = await SkillService.createSkill(requester.id, payload, file);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Skill created successfully",
    data: result,
  });
});

// GET ALL SKILLS
const getAllSkills = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, skillFilterableFields);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await SkillService.getAllSkills({ ...filters, ...req.query }, options);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Skills retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

// GET SKILL BY ID
const getSkillById = catchAsync(async (req: Request, res: Response) => {
  const result = await SkillService.getSkillById(req.params.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Skill retrieved successfully",
    data: result,
  });
});

// UPDATE SKILL
const updateSkill = catchAsync(async (req: Request, res: Response) => {
  const requester = req.user!;
  const payload = { ...req.body, file: req.file };
  const result = await SkillService.updateSkill(req.params.id, payload, { id: requester.id, role: requester.role });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Skill updated successfully",
    data: result,
  });
});

// DELETE SKILL
const deleteSkill = catchAsync(async (req: Request, res: Response) => {
  const requester = req.user!;
  const result = await SkillService.deleteSkill(req.params.id, { id: requester.id, role: requester.role });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Skill deleted successfully",
    data: result,
  });
});

export const SkillController = {
  createSkill,
  getAllSkills,
  getSkillById,
  updateSkill,
  deleteSkill,
};
