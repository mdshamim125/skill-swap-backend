import { NextFunction, Request, Response } from "express";
import { jwtHelper } from "../helper/jwtHelper";
import ApiError from "../errors/ApiError";
import httpStatus from "http-status";
import config from "../../config";
import { Secret } from "jsonwebtoken";
import { Role } from "@prisma/client";

// ===============================
// Define Type for JWT Payload
// ===============================

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}

// ===============================
// Auth Middleware with RBAC
// ===============================
const auth = (...roles: string[]) => {
  return async (
    req: Request & { user?: AuthUser },
    res: Response,
    next: NextFunction
  ) => {
    try {
      const token = req.cookies?.accessToken;

      if (!token) {
        throw new ApiError(
          httpStatus.UNAUTHORIZED,
          "Unauthorized! No token provided."
        );
      }

      // Verify user from JWT
      const decoded = jwtHelper.verifyToken(
        token,
        config.jwt.jwt_secret as Secret
      ) as AuthUser;

      if (!decoded) {
        throw new ApiError(
          httpStatus.UNAUTHORIZED,
          "Invalid or expired token!"
        );
      }

      req.user = decoded;

      // Role validation
      if (roles.length > 0 && !roles.includes(decoded.role)) {
        throw new ApiError(
          httpStatus.FORBIDDEN,
          "Forbidden! Insufficient permissions."
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default auth;
