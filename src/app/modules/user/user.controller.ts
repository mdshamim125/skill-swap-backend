import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { UserService } from "./user.service";
import pick from "../../helper/pick";
import { userFilterableFields } from "./user.constant";
import { Role } from "@prisma/client";

// ===============================
// CREATE USER
// ===============================
const createUser = catchAsync(async (req: Request, res: Response) => {
  const role = req.body.role as Role;
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

  const user = req.user!; // Safe because auth middleware sets it

  const result = await UserService.getAllFromDB(filters, options, {
    id: user.id,
    role: user.role,
  });

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
  const user = req.user!;

  const result = await UserService.getById(req.params.id, {
    id: user.id,
    role: user.role,
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User retrieved successfully!",
    data: result,
  });
});

// ===============================
// UPDATE USER
// ===============================
const updateUser = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;

  const result = await UserService.updateUser(req.params.id, req.body, {
    id: user.id,
    role: user.role,
  });

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
  const user = req.user!;

  const result = await UserService.deleteUser(req.params.id, {
    id: user.id,
    role: user.role,
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User deleted successfully!",
    data: result,
  });
});

// ===============================
// UPDATE USER ROLE
// ===============================
const updateUserRole = catchAsync(async (req: Request, res: Response) => {
  const user = req.user!;

  const { role } = req.body;
  const result = await UserService.updateUserRole(
    req.params.id,
    role,
    user.role
  );

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
