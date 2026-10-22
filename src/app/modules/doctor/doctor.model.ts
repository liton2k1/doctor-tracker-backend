import { model, Schema } from "mongoose";
import { IDoctor } from "./doctor.interface";

const DoctorSchema = new Schema<IDoctor>(
  {
    name: { type: String, required: true, trim: true },
    specialization: { type: String, required: true, trim: true },
    hospital: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    profile: { type: String },
    patientCount: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Default ordering + date-range filter
DoctorSchema.index({ createdAt: -1, _id: -1 });
// Equality filter + date sort (equality first, then sort keys)
DoctorSchema.index({ specialization: 1, createdAt: -1, _id: -1 });
DoctorSchema.index({ hospital: 1, createdAt: -1, _id: -1 });
// Sort by name / by patient load (also powers the "patients per doctor" chart)
DoctorSchema.index({ name: 1, _id: 1 });
DoctorSchema.index({ patientCount: -1, _id: -1 });

export const DoctorModel = model<IDoctor>("Doctor", DoctorSchema);
