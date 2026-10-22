import { model, Schema } from "mongoose";
import { Gender, IUser, Role } from "./user.interface";

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    phone: { type: String },
    address: { type: String, trim: true },
    profile: { type: String },
    gender: {
      type: String,
      enum: Object.values(Gender),
    },
    role: {
      type: String,
      enum: Object.values(Role),
      default: Role.USER,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const UserModel = model<IUser>("User", UserSchema);
