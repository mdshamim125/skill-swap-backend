import { Request, Response } from "express";
import { mentorDashboardService } from "./mentorDashboard.service";

class MentorDashboardController {
  async getDashboard(req: Request, res: Response) {
    const mentorId = req.user!.id; // from auth middleware

    const result = await mentorDashboardService.getMentorDashboard(mentorId);

    return res.status(200).json({
      success: true,
      data: result
    });
  }
}

export const mentorDashboardController = new MentorDashboardController();
