import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { DashboardServices } from "./dashboard.service";
import { TLimitQuery, TTimelineQuery } from "./dashboard.interface";

const getOverview = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await DashboardServices.getOverview();
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Dashboard overview retrieved successfully !",
      data,
    });
  },
);

const getPatientsPerDoctor = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await DashboardServices.getPatientsPerDoctor(
      req.query as unknown as TLimitQuery,
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Patients per doctor retrieved successfully !",
      data,
    });
  },
);

const getTimeline = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await DashboardServices.getTimeline(
      req.query as unknown as TTimelineQuery,
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Timeline retrieved successfully !",
      data,
    });
  },
);

const getDistributions = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const data = await DashboardServices.getDistributions(
      req.query as unknown as TLimitQuery,
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Distributions retrieved successfully !",
      data,
    });
  },
);

export const DashboardControllers = {
  getOverview,
  getPatientsPerDoctor,
  getTimeline,
  getDistributions,
};
