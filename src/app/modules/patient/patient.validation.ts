import z from "zod";
import { Gender } from "../user/user.interface";
import {
  dateRangeZodSchema,
  emptyToUndefined,
  objectIdZodSchema,
  paginationZodSchema,
  phoneZodSchema,
  removeProfileZodSchema,
  searchZodSchema,
} from "../../utils/zodHelpers";

export const createPatientZodSchema = z.object({
  name: z
    .string({ invalid_type_error: "Name must be string !" })
    .trim()
    .min(2, { message: "Name must be at least 2 characters !" })
    .max(100, { message: "Name can't be more than 100 characters !" }),
  age: z.coerce
    .number({ invalid_type_error: "Age must be a number !" })
    .int({ message: "Age must be a whole number !" })
    .min(0, { message: "Age can't be negative !" })
    .max(150, { message: "Age can't be more than 150 !" }),
  gender: z.nativeEnum(Gender, {
    errorMap: () => ({ message: "Gender must be MALE, FEMALE or OTHER !" }),
  }),
  phone: phoneZodSchema,
  email: emptyToUndefined(
    z
      .string({ invalid_type_error: "Email must be string" })
      .trim()
      .toLowerCase()
      .email({ message: "Invalid email formate !" })
      .optional(),
  ),
  condition: z
    .string({ invalid_type_error: "Condition must be string !" })
    .trim()
    .min(2, { message: "Condition must be at least 2 characters !" })
    .max(150, { message: "Condition can't exceed 150 characters !" }),
  notes: emptyToUndefined(
    z
      .string({ invalid_type_error: "Notes must be string !" })
      .trim()
      .max(1000, { message: "Notes can't exceed 1000 characters !" })
      .optional(),
  ),
});

// "At least one change" is checked in the service, because an image upload alone is a valid edit.
export const updatePatientZodSchema = createPatientZodSchema
  .extend({
    doctorId: objectIdZodSchema,
    removeProfile: removeProfileZodSchema,
  })
  .partial();

const patientBaseQueryZodSchema = paginationZodSchema
  .merge(dateRangeZodSchema)
  .extend({
    search: searchZodSchema,
    condition: emptyToUndefined(z.string().trim().max(150).optional()),
    gender: emptyToUndefined(z.nativeEnum(Gender).optional()),
    sortBy: z.enum(["createdAt", "name", "age"]).default("createdAt"),
  });

// GET /patients
export const patientQueryZodSchema = patientBaseQueryZodSchema.extend({
  doctorId: emptyToUndefined(objectIdZodSchema.optional()),
});

// GET /doctors/:id/patients (the doctor comes from the path)
export const doctorPatientQueryZodSchema = patientBaseQueryZodSchema;
