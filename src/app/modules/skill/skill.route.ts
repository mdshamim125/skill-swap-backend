// src/modules/skill/skill.route.ts
import express from "express";
import { SkillController } from "./skill.controller";
import auth from "../../middlewares/auth";
import multer from "multer";

const router = express.Router();
const upload = multer({ limits: { fileSize: 2 * 1024 * 1024 } }); // 2MB limit

// Public listing & detail
router.get("/", SkillController.getAllSkills);
router.get("/:id", SkillController.getSkillById);

// Protected routes
router.post("/", auth(), upload.single("file"), SkillController.createSkill); // any authenticated user
router.put("/:id", auth(), upload.single("file"), SkillController.updateSkill); // owner or admin checked in service
router.delete("/:id", auth(), SkillController.deleteSkill); // owner or admin checked in service

export const skillRoutes = router;