import { NextFunction, Request, Response } from "express";
import { UserServices } from "./user.service";
import httpStatus from "http-status-codes";
import { sendResponse } from "../../utils/sendResponse";
import { catchAsync } from "../../utils/catchAsync";
import { getFileUrl } from "../../utils/fileHelpers";

// Create User
const createUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const profile = req.file ? getFileUrl(req.file.filename) : undefined;
    const user = await UserServices.createUser(req.body, profile);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "User created successfully !",
      data: user,
    });
  },
);

// Update my profile
const updateMyProfile = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const profile = req.file ? getFileUrl(req.file.filename) : undefined;
    const user = await UserServices.updateMyProfile(
      req.user.userId,
      req.body,
      profile,
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Profile updated successfully !",
      data: user,
    });
  },
);

export const UserControllers = {
  createUser,
  updateMyProfile,
};
