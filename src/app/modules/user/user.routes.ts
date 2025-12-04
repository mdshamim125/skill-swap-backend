import express, { NextFunction, Request, Response } from "express";
import { UserController } from "./user.controller";
import { fileUploader } from "../../helper/fileUploader";
import auth from "../../middlewares/auth";
import { Role } from "@prisma/client";
import { createUserSchemaValidation } from "./user.validation";

const router = express.Router();

router.get("/my-profile", auth(), UserController.getMyProfile);

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
  // fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    // Parse and validate user input
    const parsed = createUserSchemaValidation.parse(req.body);
    req.body = parsed;
    return UserController.createUser(req, res, next);
  }
);

// ===============================
// UPDATE USER PROFILE
// ===============================
// router.patch(
//   "/",
//   auth(),
//   // fileUploader.upload.single("file"),
//   (req: Request, res: Response, next: NextFunction) => {
//     req.body = JSON.parse(req.body.payload || "{}");
//     return UserController.updateUser(req, res, next);
//   }
// );

router.patch("/", auth(), (req: Request, res: Response, next: NextFunction) => {
  try {
    // If frontend sent JSON normally
    if (req.is("application/json")) {
      return UserController.updateUser(req, res, next);
    }

    // If frontend sent FormData (multipart)
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
