import z from "zod";
import { removeProfileZodSchema } from "../../utils/zodHelpers";

export const createUserZodSchema = z.object({
  name: z
    .string({ invalid_type_error: "Name must be string !" })
    .min(2, { message: "Name must be at least 2 characters !" })
    .max(30, { message: "Name can't be more than 30 characters !" }),
  email: z
    .string({ invalid_type_error: "Email must be string" })
    .email({ message: "Invalid email formate !" }),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/\d/, "Password must contain at least one number")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(
      /[@$!%*?&#]/,
      "Password must contain at least one special character",
    ),
  phone: z
    .string({ invalid_type_error: "Phone Number must be string" })
    .regex(/^(?:\+8801\d{9}|01\d{9})$/, {
      message:
        "Phone number must be valid for Bangladesh. Format: +8801XXXXXXXXX or 01XXXXXXXXX",
    })
    .optional(),
  address: z
    .string({ invalid_type_error: "Address must be string !" })
    .max(200, { message: "Address can't exceed 200 characters !" })
    .optional(),
});

export const updateUserZodSchema = z.object({
  name: z
    .string({ invalid_type_error: "Name must be string !" })
    .min(2, { message: "Name must be at least 2 characters !" })
    .max(30, { message: "Name can't be more than 30 characters !" })
    .optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/\d/, "Password must contain at least one number")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[@$!%*?&#]/, "Password must contain at least one special character")
    .optional(),
  phone: z
    .string({ invalid_type_error: "Phone Number must be string" })
    .regex(/^(?:\+8801\d{9}|01\d{9})$/, {
      message:
        "Phone number must be valid for Bangladesh. Format: +8801XXXXXXXXX or 01XXXXXXXXX",
    })
    .optional(),
  address: z
    .string({ invalid_type_error: "Address must be string !" })
    .max(200, { message: "Address can't exceed 200 characters !" })
    .optional(),
});

// Self-service profile edit (PATCH /user/me). Password changes are intentionally not
// allowed here: they should require the current password.
export const updateProfileZodSchema = updateUserZodSchema
  .omit({ password: true })
  .extend({ removeProfile: removeProfileZodSchema });
