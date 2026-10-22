import { QueryFilter, Types } from "mongoose";
import httpStatus from "http-status-codes";
import AppError from "../../helpers/AppError";
import { buildMeta, getSkip } from "../../utils/pagination";
import {
  buildDateRange,
  buildSearchRegex,
  sortDirection,
} from "../../utils/queryHelpers";
import { deleteUploadedFile } from "../../utils/fileHelpers";
import { DoctorModel } from "../doctor/doctor.model";
import {
  IPatient,
  TPatientQuery,
  TUpdatePatientPayload,
} from "./patient.interface";
import { PatientModel } from "./patient.model";

const DOCTOR_SUMMARY_FIELDS = "name specialization hospital profile";

const assertDoctorExists = async (doctorId: string) => {
  const isDoctorExist = await DoctorModel.exists({ _id: doctorId });
  if (!isDoctorExist) {
    throw new AppError(httpStatus.NOT_FOUND, "Doctor not found !");
  }
};

const adjustPatientCount = (doctorId: string | Types.ObjectId, delta: 1 | -1) =>
  DoctorModel.updateOne({ _id: doctorId }, { $inc: { patientCount: delta } });

// Create Patient under a Doctor
const createPatientForDoctor = async (
  doctorId: string,
  payload: Omit<IPatient, "doctor">,
  profile?: string,
) => {
  await assertDoctorExists(doctorId);

  const patient = await PatientModel.create({
    ...payload,
    ...(profile ? { profile } : {}),
    doctor: doctorId,
  });
  await adjustPatientCount(doctorId, 1);

  return getSinglePatient(patient._id.toString());
};

// Get All Patients (search + filter + sort + pagination)
const getAllPatients = async (query: TPatientQuery) => {
  const { page, limit, sortBy, sortOrder } = query;

  const filter: QueryFilter<IPatient> = {};

  if (query.doctorId) filter.doctor = query.doctorId;
  if (query.condition) filter.condition = query.condition;
  if (query.gender) filter.gender = query.gender;

  if (query.search) {
    const regex = buildSearchRegex(query.search);
    filter.$or = [{ name: regex }, { phone: regex }, { condition: regex }];
  }

  const createdAt = buildDateRange(query.from, query.to);
  if (createdAt) filter.createdAt = createdAt;

  const direction = sortDirection(sortOrder);

  const [data, total] = await Promise.all([
    PatientModel.find(filter)
      .sort({ [sortBy]: direction, _id: direction })
      .skip(getSkip(page, limit))
      .limit(limit)
      .populate("doctor", DOCTOR_SUMMARY_FIELDS)
      .lean(),
    PatientModel.countDocuments(filter),
  ]);

  return { meta: buildMeta(total, page, limit), data };
};

// Get a Doctor's Patients
const getDoctorPatients = async (
  doctorId: string,
  query: Omit<TPatientQuery, "doctorId">,
) => {
  await assertDoctorExists(doctorId);
  return getAllPatients({ ...query, doctorId });
};

// Get Single Patient
const getSinglePatient = async (id: string) => {
  const patient = await PatientModel.findById(id)
    .populate("doctor", DOCTOR_SUMMARY_FIELDS)
    .lean();

  if (!patient) {
    throw new AppError(httpStatus.NOT_FOUND, "Patient not found !");
  }
  return patient;
};

// Update Patient (fields, profile image, and optionally reassign to another doctor)
const updatePatient = async (
  id: string,
  payload: TUpdatePatientPayload,
  profile?: string,
) => {
  const existing = await PatientModel.findById(id)
    .select("doctor profile")
    .lean();

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, "Patient not found !");
  }

  const { doctorId, removeProfile, ...fields } = payload;
  const shouldRemoveProfile = removeProfile === "true" && !profile;

  if (
    !Object.keys(fields).length &&
    doctorId === undefined &&
    !profile &&
    !shouldRemoveProfile
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "At least one field is required !",
    );
  }

  const isReassigned =
    doctorId !== undefined && doctorId !== existing.doctor.toString();

  if (isReassigned) {
    await assertDoctorExists(doctorId);
  }

  const set: Record<string, unknown> = { ...fields };
  if (profile) set.profile = profile;
  if (isReassigned) set.doctor = doctorId;

  const update: Record<string, unknown> = {};
  if (Object.keys(set).length) update.$set = set;
  if (shouldRemoveProfile) update.$unset = { profile: "" };

  if (Object.keys(update).length) {
    await PatientModel.updateOne({ _id: id }, update, { runValidators: true });
  }

  if (isReassigned) {
    await Promise.all([
      adjustPatientCount(existing.doctor, -1),
      adjustPatientCount(doctorId, 1),
    ]);
  }

  // The old image is only deleted once the update succeeded.
  if ((profile || shouldRemoveProfile) && existing.profile) {
    await deleteUploadedFile(existing.profile);
  }

  return getSinglePatient(id);
};

// Delete Patient
const deletePatient = async (id: string) => {
  const patient = await PatientModel.findByIdAndDelete(id)
    .select("doctor profile")
    .lean();

  if (!patient) {
    throw new AppError(httpStatus.NOT_FOUND, "Patient not found !");
  }

  await adjustPatientCount(patient.doctor, -1);
  await deleteUploadedFile(patient.profile);
  return null;
};

// Remove a Patient from a specific Doctor's list
const deletePatientFromDoctor = async (doctorId: string, patientId: string) => {
  const patient = await PatientModel.findOneAndDelete({
    _id: patientId,
    doctor: doctorId,
  })
    .select("doctor profile")
    .lean();

  if (!patient) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Patient not found for this doctor !",
    );
  }

  await adjustPatientCount(doctorId, -1);
  await deleteUploadedFile(patient.profile);
  return null;
};

// Distinct conditions for the filter dropdown
const getPatientFilterOptions = async () => {
  const conditions = (await PatientModel.distinct("condition")) as string[];
  return { conditions: conditions.sort((a, b) => a.localeCompare(b)) };
};

export const PatientServices = {
  createPatientForDoctor,
  getAllPatients,
  getDoctorPatients,
  getSinglePatient,
  updatePatient,
  deletePatient,
  deletePatientFromDoctor,
  getPatientFilterOptions,
};
