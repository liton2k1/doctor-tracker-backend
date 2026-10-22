import AppError from "../../helpers/AppError";
import { IUser, Role } from "./user.interface";
import { UserModel } from "./user.model";
import httpStatus from "http-status-codes";
import bcrypt from "bcryptjs";
import { envVars } from "../../config";
import { deleteUploadedFile } from "../../utils/fileHelpers";

// Create User
const createUser = async (payload: Partial<IUser>, profile?: string) => {
  const { email, password, ...rest } = payload;

  const isUserExist = await UserModel.findOne({ email });

  if (isUserExist) {
    throw new AppError(httpStatus.BAD_REQUEST, "User already exist !");
  }

  const hashPassword = await bcrypt.hash(
    password as string,
    Number(envVars.BCRYPT_SALT_ROUND),
  );

  const user = await UserModel.create({
    email,
    password: hashPassword,
    ...rest,
    ...(profile ? { profile } : {}),
  });

  const { password: pass, ...safeUser } = user.toObject();
  return safeUser;
};

// Update my own profile (name, phone, address, profile image)
const updateMyProfile = async (
  userId: string,
  payload: Partial<IUser> & { removeProfile?: "true" | "false" },
  profile?: string,
) => {
  const { removeProfile, ...fields } = payload;
  const shouldRemoveProfile = removeProfile === "true" && !profile;

  const existing = await UserModel.findById(userId).select("profile");
  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found !");
  }

  if (!Object.keys(fields).length && !profile && !shouldRemoveProfile) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "At least one field is required !",
    );
  }

  const update: Record<string, unknown> = {};
  if (Object.keys(fields).length || profile) {
    update.$set = { ...fields, ...(profile ? { profile } : {}) };
  }
  if (shouldRemoveProfile) update.$unset = { profile: "" };

  const user = await UserModel.findByIdAndUpdate(userId, update, {
    new: true,
    runValidators: true,
  }).select("-password");

  // The old image is only deleted once the update succeeded.
  if ((profile || shouldRemoveProfile) && existing.profile) {
    await deleteUploadedFile(existing.profile);
  }
  return user;
};

export const UserServices = {
  createUser,
  updateMyProfile,
};
