import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { DoctorServices } from "./doctor.service";
import { TDoctorQuery } from "./doctor.interface";
import { getFileUrl } from "../../utils/fileHelpers";

// Create Doctor
const createDoctor = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const profile = req.file ? getFileUrl(req.file.filename) : undefined;
    const doctor = await DoctorServices.createDoctor({
      ...req.body,
      ...(profile ? { profile } : {}),
    });
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Doctor created successfully !",
      data: doctor,
    });
  },
);

// Get All Doctors
const getAllDoctors = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await DoctorServices.getAllDoctors(
      req.query as unknown as TDoctorQuery,
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Doctors retrieved successfully !",
      meta: result.meta,
      data: result.data,
    });
  },
);

// Get Single Doctor
const getSingleDoctor = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const doctor = await DoctorServices.getSingleDoctor(
      req.params.id as string,
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Doctor retrieved successfully !",
      data: doctor,
    });
  },
);

// Update Doctor
const updateDoctor = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const profile = req.file ? getFileUrl(req.file.filename) : undefined;
    const doctor = await DoctorServices.updateDoctor(
      req.params.id as string,
      req.body,
      profile,
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Doctor updated successfully !",
      data: doctor,
    });
  },
);

// Delete Doctor
const deleteDoctor = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await DoctorServices.deleteDoctor(req.params.id as string);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Doctor deleted successfully !",
      data: result,
    });
  },
);

// Filter Options
const getDoctorFilterOptions = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const options = await DoctorServices.getDoctorFilterOptions();
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Doctor filter options retrieved successfully !",
      data: options,
    });
  },
);

export const DoctorControllers = {
  createDoctor,
  getAllDoctors,
  getSingleDoctor,
  updateDoctor,
  deleteDoctor,
  getDoctorFilterOptions,
};
