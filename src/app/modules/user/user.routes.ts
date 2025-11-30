import express, { NextFunction, Request, Response } from "express";
import { UserController } from "./user.controller";
import { fileUploader } from "../../helper/fileUploader";
import { UserValidation } from "./user.validation";
import auth from "../../middlewares/auth";
import { Role } from "@prisma/client";

const router = express.Router();

// ===============================
// GET ALL USERS (Admin Only)
// ===============================
router.get("/", auth(Role.ADMIN), UserController.getAllUsers);

// ===============================
// GET SINGLE USER (Admin or Self)
// ===============================
router.get("/:id", auth(), UserController.getUserById);

// ===============================
// CREATE USER (Admin Only)
// ===============================
router.post(
  "/create",
  auth(Role.ADMIN),
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    // Parse and validate user input
    const parsed = UserValidation.createUserValidationSchema.parse(
      JSON.parse(req.body.data)
    );
    req.body = parsed;
    return UserController.createUser(req, res, next);
  }
);

// ===============================
// UPDATE USER PROFILE (Self or Admin)
// ===============================
router.patch(
  "/:id",
  auth(),
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    req.body = JSON.parse(req.body.data || JSON.stringify(req.body));
    return UserController.updateUser(req, res, next);
  }
);

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
