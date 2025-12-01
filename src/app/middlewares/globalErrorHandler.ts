import { Prisma } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import {
  JsonWebTokenError,
  TokenExpiredError,
  NotBeforeError,
} from "jsonwebtoken";

interface CustomError extends Error {
  statusCode?: number;
  status?: number;
  message: string;
  meta?: any;
  errors?: any;
}

const globalErrorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log("🔥 Global Error Handler:", err);

  let statusCode = err.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
  let message = err.message || "Something went wrong!";
  let errorDetails: any = err;

  // ===============================
  // Prisma Errors
  // ===============================
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        statusCode = 409;
        message = "Duplicate field value violates unique constraint";
        break;

      case "P2003":
        statusCode = 400;
        message = "Foreign key constraint failed";
        break;

      case "P2025":
        statusCode = 404;
        message = "Record not found!";
        break;

      case "P1000":
        statusCode = 502;
        message = "Database authentication failed";
        break;

      default:
        message = "Database request error";
    }
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = "Prisma validation error";
  }

  // ===============================
  // JWT Errors
  // ===============================
  else if (err instanceof TokenExpiredError) {
    statusCode = 401;
    message = "Token expired";
  } else if (err instanceof JsonWebTokenError) {
    statusCode = 401;
    message = "Invalid token";
  } else if (err instanceof NotBeforeError) {
    statusCode = 401;
    message = "Token not active yet";
  }

  // ===============================
  // Socket Unauthorized
  // ===============================
  else if (
    err.message === "Unauthorized socket connection" ||
    err.message === "No token provided"
  ) {
    statusCode = 401;
  }

  // ===============================
  // JSON Syntax Error
  // ===============================
  else if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    statusCode = 400;
    message = "Invalid JSON payload";
  }

  // ===============================
  // Multer / Cloudinary Errors
  // ===============================
  else if (err.name === "MulterError") {
    statusCode = 400;
    message = "File upload error";
  }

  // ===============================
  // Zod/Yup Validation
  // ===============================
  else if (err.name === "ZodError") {
    statusCode = 400;
    message = "Validation error";
    errorDetails = err.errors;
  }

  res.status(statusCode).json({
    success: false,
    message,
    error: errorDetails,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

export default globalErrorHandler;
