import { model, Schema } from "mongoose";
import { Gender } from "../user/user.interface";
import { IPatient } from "./patient.interface";

const PatientSchema = new Schema<IPatient>(
  {
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 0, max: 150 },
    gender: { type: String, enum: Object.values(Gender), required: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    condition: { type: String, required: true, trim: true },
    notes: { type: String, trim: true },
    profile: { type: String },
    doctor: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

PatientSchema.index({ doctor: 1, createdAt: -1, _id: -1 });
// Global patient page: default ordering + date-range filter
PatientSchema.index({ createdAt: -1, _id: -1 });
// Equality filters + date sort (also used by the condition / gender distributions)
PatientSchema.index({ condition: 1, createdAt: -1, _id: -1 });
PatientSchema.index({ gender: 1, createdAt: -1, _id: -1 });
// Sort by name / age
PatientSchema.index({ name: 1, _id: 1 });
PatientSchema.index({ age: 1, _id: 1 });

export const PatientModel = model<IPatient>("Patient", PatientSchema);
