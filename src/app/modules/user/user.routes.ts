import express, { NextFunction, Request, Response } from "express";
import { UserController } from "./user.controller";
import auth from "../../middlewares/auth";
import { Role } from "@prisma/client";
import { createUserSchemaValidation } from "./user.validation";

const router = express.Router();

router.get("/my-profile", auth(), UserController.getMyProfile);

// ===============================
// TOP RATED MENTORS
// Public Route
// ===============================
router.get("/top-rated-mentors", UserController.getTopRatedMentors);

// ===============================
// GET ALL USERS (Admin Only)
// ===============================
router.get(
  "/",
  auth(Role.USER, Role.MENTOR, Role.ADMIN),
  UserController.getAllUsers
);

// ===============================
// GET SINGLE USER 
// ===============================
router.get("/:id", auth(), UserController.getUserById);

// ===============================
// CREATE USER 
// ===============================
router.post(
  "/create",
  // fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    const parsed = createUserSchemaValidation.parse(req.body);
    req.body = parsed;
    return UserController.createUser(req, res, next);
  }
);

// ===============================
// UPDATE USER PROFILE
// ===============================
router.patch("/", auth(), (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.is("application/json")) {
      return UserController.updateUser(req, res, next);
    }

    if (typeof req.body.payload === "string") {
      req.body = JSON.parse(req.body.payload);
      return UserController.updateUser(req, res, next);
    }

    return res.status(400).json({
      success: false,
      message: "Invalid update payload",
    });
  } catch (err) {
    console.error("PATCH /user parse error:", err);
    return res.status(500).json({
      success: false,
      message: "Server parse error",
    });
  }
});

// ===============================
// UPDATE USER ROLE (Admin Only)
// ===============================
router.patch(
  "/:id/role",
  auth(Role.ADMIN),
  (req: Request, res: Response, next: NextFunction) => {
    const { role } = req.body;
    if (!role) {
      return res
        .status(400)
        .json({ success: false, message: "Role is required" });
    }
    return UserController.updateUserRole(req, res, next);
  }
);

// ===============================
// DELETE USER (Admin Only)
// ===============================
router.delete("/:id", auth(Role.ADMIN), UserController.deleteUser);

export const userRoutes = router;
