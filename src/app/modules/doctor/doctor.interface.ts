import { Types } from "mongoose";
import {
  TDateRangeQuery,
  TPaginationQuery,
} from "../../interfaces/query.types";

export interface IDoctor {
  _id?: Types.ObjectId;
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
  profile?: string;
  patientCount?: number;
}

export interface TUpdateDoctorPayload extends Partial<IDoctor> {
  removeProfile?: "true" | "false";
}

export interface TDoctorQuery extends TPaginationQuery, TDateRangeQuery {
  search?: string;
  specialization?: string;
  hospital?: string;
  sortBy: "createdAt" | "name" | "patientCount";
}
