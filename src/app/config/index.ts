import dotenv from "dotenv";

dotenv.config();

export const envVars = {
  PORT: process.env.PORT as string,
  DB_URL: process.env.DB_URL as string,
  NODE_ENV: process.env.NODE_ENV as string,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET as string,
  JWT_ACCESS_EXPIRE: process.env.JWT_ACCESS_EXPIRE as string,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET as string,
  JWT_REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRE as string,
  BCRYPT_SALT_ROUND: process.env.BCRYPT_SALT_ROUND as string,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL as string,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD as string,
  FRONTEND_URL: process.env.FRONTEND_URL as string,
  BACKEND_URL: process.env.BACKEND_URL as string,
};
