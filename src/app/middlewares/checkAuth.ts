import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import AppError from "../helpers/AppError";
import { verifyToken } from "../utils/jwt";
import { envVars } from "../config";

const extractToken = (req: Request) => {
  const cookieToken = req.cookies?.accessToken as string | undefined;
  if (cookieToken) return cookieToken;

  const header = req.headers.authorization;
  if (!header) return undefined;
  return header.startsWith("Bearer ") ? header.slice(7).trim() : header;
};

export const checkAuth =
  (...authRoles: string[]) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accessToken = extractToken(req);
      if (!accessToken) {
        throw new AppError(httpStatus.UNAUTHORIZED, "No token received !");
      }

      let verifiedToken: JwtPayload;
      try {
        verifiedToken = verifyToken(
          accessToken,
          envVars.JWT_ACCESS_SECRET,
        ) as JwtPayload;
      } catch {
        throw new AppError(
          httpStatus.UNAUTHORIZED,
          "Invalid or expired token !",
        );
      }

      if (!authRoles.includes(verifiedToken.role)) {
        throw new AppError(httpStatus.FORBIDDEN, "You are not authorized !");
      }
      req.user = verifiedToken;
      next();
    } catch (error) {
      next(error);
    }
  };
