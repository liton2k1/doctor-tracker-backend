import { QueryFilter } from "mongoose";
import httpStatus from "http-status-codes";
import AppError from "../../helpers/AppError";
import { buildMeta, getSkip } from "../../utils/pagination";
import {
  buildDateRange,
  buildSearchRegex,
  sortDirection,
} from "../../utils/queryHelpers";
import { PatientModel } from "../patient/patient.model";
import { deleteUploadedFile } from "../../utils/fileHelpers";
import {
  IDoctor,
  TDoctorQuery,
  TUpdateDoctorPayload,
} from "./doctor.interface";
import { DoctorModel } from "./doctor.model";

// Create Doctor
const createDoctor = async (payload: IDoctor) => {
  const isDoctorExist = await DoctorModel.exists({ email: payload.email });

  if (isDoctorExist) {
    throw new AppError(
      httpStatus.CONFLICT,
      "A doctor with this email already exists !",
    );
  }

  const doctor = await DoctorModel.create(payload);
  return doctor;
};

// Get All Doctors (search + filter + sort + pagination)
const getAllDoctors = async (query: TDoctorQuery) => {
  const { page, limit, sortBy, sortOrder } = query;

  const filter: QueryFilter<IDoctor> = {};

  if (query.search) {
    const regex = buildSearchRegex(query.search);
    filter.$or = [
      { name: regex },
      { email: regex },
      { phone: regex },
      { hospital: regex },
    ];
  }
  if (query.specialization) filter.specialization = query.specialization;
  if (query.hospital) filter.hospital = query.hospital;

  const createdAt = buildDateRange(query.from, query.to);
  if (createdAt) filter.createdAt = createdAt;

  const direction = sortDirection(sortOrder);

  const [data, total] = await Promise.all([
    DoctorModel.find(filter)
      .sort({ [sortBy]: direction, _id: direction })
      .skip(getSkip(page, limit))
      .limit(limit)
      .lean(),
    DoctorModel.countDocuments(filter),
  ]);

  return { meta: buildMeta(total, page, limit), data };
};

// Get Single Doctor
const getSingleDoctor = async (id: string) => {
  const doctor = await DoctorModel.findById(id).lean();

  if (!doctor) {
    throw new AppError(httpStatus.NOT_FOUND, "Doctor not found !");
  }
  return doctor;
};

// Update Doctor (fields and/or profile image)
const updateDoctor = async (
  id: string,
  payload: TUpdateDoctorPayload,
  profile?: string,
) => {
  const { removeProfile, ...fields } = payload;
  const shouldRemoveProfile = removeProfile === "true" && !profile;

  const existing = await DoctorModel.findById(id).select("profile").lean();
  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, "Doctor not found !");
  }

  if (!Object.keys(fields).length && !profile && !shouldRemoveProfile) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "At least one field is required !",
    );
  }

  if (fields.email) {
    const isEmailTaken = await DoctorModel.exists({
      email: fields.email,
      _id: { $ne: id },
    });
    if (isEmailTaken) {
      throw new AppError(
        httpStatus.CONFLICT,
        "A doctor with this email already exists !",
      );
    }
  }

  const update: Record<string, unknown> = {};
  if (Object.keys(fields).length || profile) {
    update.$set = { ...fields, ...(profile ? { profile } : {}) };
  }
  if (shouldRemoveProfile) update.$unset = { profile: "" };

  const doctor = await DoctorModel.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  }).lean();

  // The old image is only deleted once the update succeeded.
  if ((profile || shouldRemoveProfile) && existing.profile) {
    await deleteUploadedFile(existing.profile);
  }
  return doctor;
};

// Delete Doctor
const deleteDoctor = async (id: string) => {
  const doctor = await DoctorModel.findById(id).select("profile").lean();

  if (!doctor) {
    throw new AppError(httpStatus.NOT_FOUND, "Doctor not found !");
  }

  const hasPatients = await PatientModel.exists({ doctor: id });
  if (hasPatients) {
    throw new AppError(
      httpStatus.CONFLICT,
      "Cannot delete a doctor who still has patients. Remove or reassign the patients first !",
    );
  }

  await DoctorModel.deleteOne({ _id: id });
  await deleteUploadedFile(doctor.profile);
  return null;
};

// Distinct values for the filter dropdowns
const getDoctorFilterOptions = async () => {
  const [specializations, hospitals] = await Promise.all([
    DoctorModel.distinct("specialization") as Promise<string[]>,
    DoctorModel.distinct("hospital") as Promise<string[]>,
  ]);

  return {
    specializations: specializations.sort((a, b) => a.localeCompare(b)),
    hospitals: hospitals.sort((a, b) => a.localeCompare(b)),
  };
};

export const DoctorServices = {
  createDoctor,
  getAllDoctors,
  getSingleDoctor,
  updateDoctor,
  deleteDoctor,
  getDoctorFilterOptions,
};
