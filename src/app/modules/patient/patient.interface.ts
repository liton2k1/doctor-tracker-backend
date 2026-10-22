import { Types } from "mongoose";
import { Gender } from "../user/user.interface";
import {
  TDateRangeQuery,
  TPaginationQuery,
} from "../../interfaces/query.types";

export interface IPatient {
  _id?: Types.ObjectId;
  name: string;
  age: number;
  gender: Gender;
  phone: string;
  email?: string;
  condition: string;
  notes?: string;
  profile?: string;
  doctor: Types.ObjectId;
}

// Payload for editing a patient (doctorId reassigns the patient)
export interface TUpdatePatientPayload extends Partial<
  Omit<IPatient, "doctor">
> {
  doctorId?: string;
  removeProfile?: "true" | "false";
}

export interface TPatientQuery extends TPaginationQuery, TDateRangeQuery {
  search?: string;
  condition?: string;
  gender?: Gender;
  doctorId?: string;
  sortBy: "createdAt" | "name" | "age";
}
