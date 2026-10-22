import bcryptjs from "bcryptjs";
import httpStatus from "http-status-codes";
import { IUser } from "../user/user.interface";
import { UserModel } from "../user/user.model";
import AppError from "../../helpers/AppError";
import { createUserTokens } from "../../utils/userToken";

const userLogin = async (payload: Partial<IUser>) => {
  const { email, password } = payload;

  const isUserExist = await UserModel.findOne({ email });

  if (!isUserExist || !isUserExist.password) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Invalid email or password !");
  }

  const isPasswordMatched = await bcryptjs.compare(
    password as string,
    isUserExist.password,
  );

  if (!isPasswordMatched) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Invalid email or password !");
  }

  const userTokens = createUserTokens(isUserExist);

  const { password: pass, ...rest } = isUserExist.toObject();

  return {
    accessToken: userTokens.accessToken,
    refreshToken: userTokens.refreshToken,
    user: rest,
  };
};

const getMe = async (userId: string) => {
  const user = await UserModel.findById(userId).select("-password");

  if (!user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "User no longer exists !");
  }

  return user;
};

export const AuthServices = {
  userLogin,
  getMe,
};
