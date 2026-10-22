import { Response } from "express";
import { envVars } from "../config";

export interface AuthTokens {
  accessToken?: string;
  refreshToken?: string;
}

const cookieOptions = {
  httpOnly: true,
  secure: envVars.NODE_ENV === "production",
  sameSite: "lax" as const,
};

export const setAuthCookie = (res: Response, tokenInfo: AuthTokens) => {
  if (tokenInfo.accessToken) {
    res.cookie("accessToken", tokenInfo.accessToken, cookieOptions);
  }

  if (tokenInfo.refreshToken) {
    res.cookie("refreshToken", tokenInfo.refreshToken, cookieOptions);
  }
};

export const clearAuthCookie = (res: Response) => {
  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);
};
