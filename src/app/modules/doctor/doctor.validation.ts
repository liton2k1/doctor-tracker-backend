import z from "zod";
import {
  dateRangeZodSchema,
  emptyToUndefined,
  paginationZodSchema,
  phoneZodSchema,
  removeProfileZodSchema,
  searchZodSchema,
} from "../../utils/zodHelpers";

export const createDoctorZodSchema = z.object({
  name: z
    .string({ invalid_type_error: "Name must be string !" })
    .trim()
    .min(2, { message: "Name must be at least 2 characters !" })
    .max(100, { message: "Name can't be more than 100 characters !" }),
  specialization: z
    .string({ invalid_type_error: "Specialization must be string !" })
    .trim()
    .min(2, { message: "Specialization must be at least 2 characters !" })
    .max(100, { message: "Specialization can't exceed 100 characters !" }),
  hospital: z
    .string({ invalid_type_error: "Hospital must be string !" })
    .trim()
    .min(2, { message: "Hospital must be at least 2 characters !" })
    .max(150, { message: "Hospital can't exceed 150 characters !" }),
  phone: phoneZodSchema,
  email: z
    .string({ invalid_type_error: "Email must be string" })
    .trim()
    .toLowerCase()
    .email({ message: "Invalid email formate !" }),
});

export const updateDoctorZodSchema = createDoctorZodSchema
  .extend({ removeProfile: removeProfileZodSchema })
  .partial();

export const doctorQueryZodSchema = paginationZodSchema
  .merge(dateRangeZodSchema)
  .extend({
    search: searchZodSchema,
    specialization: emptyToUndefined(z.string().trim().max(100).optional()),
    hospital: emptyToUndefined(z.string().trim().max(150).optional()),
    sortBy: z.enum(["createdAt", "name", "patientCount"]).default("createdAt"),
  });
