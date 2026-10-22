import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { PatientServices } from "./patient.service";
import { TPatientQuery } from "./patient.interface";
import { getFileUrl } from "../../utils/fileHelpers";

// Get All Patients
const getAllPatients = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await PatientServices.getAllPatients(
      req.query as unknown as TPatientQuery,
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Patients retrieved successfully !",
      meta: result.meta,
      data: result.data,
    });
  },
);

// Get Single Patient
const getSinglePatient = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const patient = await PatientServices.getSinglePatient(
      req.params.id as string,
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Patient retrieved successfully !",
      data: patient,
    });
  },
);

// Update Patient
const updatePatient = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const profile = req.file ? getFileUrl(req.file.filename) : undefined;
    const patient = await PatientServices.updatePatient(
      req.params.id as string,
      req.body,
      profile,
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Patient updated successfully !",
      data: patient,
    });
  },
);

// Delete Patient
const deletePatient = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await PatientServices.deletePatient(req.params.id as string);
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Patient deleted successfully !",
      data: result,
    });
  },
);

// Filter Options
const getPatientFilterOptions = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const options = await PatientServices.getPatientFilterOptions();
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Patient filter options retrieved successfully !",
      data: options,
    });
  },
);

// Create Patient for a Doctor
const createPatientForDoctor = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const profile = req.file ? getFileUrl(req.file.filename) : undefined;
    const patient = await PatientServices.createPatientForDoctor(
      req.params.id as string,
      req.body,
      profile,
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Patient added successfully !",
      data: patient,
    });
  },
);

// Get a Doctor's Patients
const getDoctorPatients = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await PatientServices.getDoctorPatients(
      req.params.id as string,
      req.query as unknown as Omit<TPatientQuery, "doctorId">,
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Doctor's patients retrieved successfully !",
      meta: result.meta,
      data: result.data,
    });
  },
);

// Remove a Patient from a Doctor
const deletePatientFromDoctor = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await PatientServices.deletePatientFromDoctor(
      req.params.id as string,
      req.params.patientId as string,
    );
    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Patient removed from doctor successfully !",
      data: result,
    });
  },
);

export const PatientControllers = {
  getAllPatients,
  getSinglePatient,
  updatePatient,
  deletePatient,
  getPatientFilterOptions,
  createPatientForDoctor,
  getDoctorPatients,
  deletePatientFromDoctor,
};
