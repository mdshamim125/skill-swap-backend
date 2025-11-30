import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { UserService } from "./user.service";
import pick from "../../helper/pick";
import { userFilterableFields } from "./user.constant";
import { Role } from "@prisma/client";

// ===============================
// CREATE USER (any role)
// ===============================
const createUser = catchAsync(async (req: Request, res: Response) => {
  const role = req.body.role as Role; // role passed in request
  const result = await UserService.createUser(req, role);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: `${role} created successfully!`,
    data: result,
  });
});

// ===============================
// GET ALL USERS
// ===============================
const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, userFilterableFields);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);

  const result = await UserService.getAllFromDB(filters, options);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Users retrieved successfully!",
    meta: result.meta,
    data: result.data,
  });
});

// ===============================
// GET SINGLE USER
// ===============================
const getUserById = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getById(req.params.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User retrieved successfully!",
    data: result,
  });
});

// ===============================
// UPDATE USER PROFILE
// ===============================
const updateUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.updateUser(req.params.id, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User updated successfully!",
    data: result,
  });
});

// ===============================
// DELETE USER
// ===============================
const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.deleteUser(req.params.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User deleted successfully!",
    data: result,
  });
});

// ===============================
// UPDATE USER ROLE (Admin only)
// ===============================
const updateUserRole = catchAsync(async (req: Request, res: Response) => {
  const { role } = req.body;
  const result = await UserService.updateUserRole(req.params.id, role);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: `User role updated to ${role} successfully!`,
    data: result,
  });
});

export const UserController = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserRole,
};
