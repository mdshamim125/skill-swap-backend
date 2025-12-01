import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { DashboardService } from "./dashboard.service";

const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await DashboardService.getStats();

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Dashboard analytics retrieved successfully",
    data: stats,
  });
});

export const DashboardController = {
  getDashboardStats,
};
