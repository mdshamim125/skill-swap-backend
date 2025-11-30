import express from "express";
import { AuthController } from "./auth.controller";
import auth from "../../middlewares/auth";
import { Role } from "@prisma/client";

const router = express.Router();

router.get("/me", AuthController.getMe);

router.post("/login", AuthController.login);

router.post("/refresh-token", AuthController.refreshToken);

router.post("/logout", AuthController.logout); 

export const authRoutes = router;
