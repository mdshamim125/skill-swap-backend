import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { UserDashboardService } from "./userDashboard.service";

const getUserDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id; // ⬅ Auth middleware sets req.user

  const stats = await UserDashboardService.getUserAnalytics(userId);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "User dashboard analytics retrieved successfully",
    data: stats,
  });
});

export const UserDashboardController = {
  getUserDashboardStats,
};
