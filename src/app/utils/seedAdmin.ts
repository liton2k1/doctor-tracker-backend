import { envVars } from "../config";
import { IUser, Role } from "../modules/user/user.interface";
import { UserModel } from "../modules/user/user.model";
import bcrypt from "bcryptjs";

export const adminSeed = async () => {
  try {
    const isAdminExist = await UserModel.findOne({
      email: envVars.ADMIN_EMAIL,
    });
    if (isAdminExist) {
      console.log("Admin already exist !");
      return;
    }

    console.log("Trying to create Admin...");

    const hashedPassword = await bcrypt.hash(
      envVars.ADMIN_PASSWORD,
      Number(envVars.BCRYPT_SALT_ROUND),
    );

    const payload: IUser = {
      name: "Liton Mia",
      email: envVars.ADMIN_EMAIL,
      password: hashedPassword,
      role: Role.ADMIN,
    };

    const admin = await UserModel.create(payload);
    console.log(`Admin created successfully : ${admin.email}\n`);
  } catch (error) {
    console.log(error);
  }
};
