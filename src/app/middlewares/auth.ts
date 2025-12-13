import { NextFunction, Request, Response } from "express";
import { jwtHelper } from "../helper/jwtHelper";
import ApiError from "../errors/ApiError";
import httpStatus from "http-status";
import config from "../../config";
import { Secret } from "jsonwebtoken";
import { Role } from "@prisma/client";

const auth = (...roles: Role[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.cookies?.accessToken;

      if (!token) {
        throw new ApiError(
          httpStatus.UNAUTHORIZED,
          "Unauthorized! No token provided."
        );
      }

      const decoded = jwtHelper.verifyToken(
        token,
        config.jwt.jwt_secret as Secret
      ) as Express.UserPayload;

      if (!decoded) {
        throw new ApiError(
          httpStatus.UNAUTHORIZED,
          "Invalid or expired token!"
        );
      }

      req.user = decoded;

      // Role validation
      if (roles.length > 0 && !roles.includes(decoded.role as Role)) {
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
