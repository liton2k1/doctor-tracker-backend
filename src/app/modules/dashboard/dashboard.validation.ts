import z from "zod";
import { dateRangeZodSchema } from "../../utils/zodHelpers";

export const patientsPerDoctorQueryZodSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const timelineQueryZodSchema = dateRangeZodSchema
  .extend({ interval: z.enum(["day", "month"]).default("day") })
  .refine((query) => !query.from || !query.to || query.from <= query.to, {
    message: "`from` must be before `to` !",
    path: ["from"],
  });

export const distributionsQueryZodSchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).default(8),
});
