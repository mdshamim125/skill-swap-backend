// src/modules/skill/skill.route.ts

import express from "express";
import { SkillController } from "./skill.controller";
import auth from "../../middlewares/auth";
import multer from "multer";
import { Role } from "@prisma/client";

const router = express.Router();

// file upload config
const upload = multer({
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

// ----------------------
// Public Routes
// ----------------------
router.get("/", SkillController.getAllSkills);
router.get("/:id", SkillController.getSkillById);

// ----------------------
// Protected Routes
// ----------------------

// Create skill
// Any authenticated user can create a custom skill
// Admin can create both system skills + custom skills
router.post(
  "/",
  auth(Role.USER, Role.MENTOR, Role.ADMIN),
  upload.single("file"),
  SkillController.createSkill
);

// Update skill
router.patch("/:id", auth(Role.ADMIN), SkillController.updateSkill);

// Delete skill
router.delete(
  "/:id",
  auth(Role.ADMIN),
  SkillController.deleteSkill
);

export const skillRoutes = router;
