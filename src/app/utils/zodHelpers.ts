import z from "zod";

// Treat "" sent by forms / query strings as "not provided".
export const emptyToUndefined = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema);

export const objectIdZodSchema = z
  .string({ invalid_type_error: "Id must be string !" })
  .regex(/^[a-f\d]{24}$/i, { message: "Invalid id !" });

export const phoneZodSchema = z
  .string({ invalid_type_error: "Phone Number must be string" })
  .regex(/^(?:\+8801\d{9}|01\d{9})$/, {
    message:
      "Phone number must be valid for Bangladesh. Format: +8801XXXXXXXXX or 01XXXXXXXXX",
  });

export const paginationZodSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const dateRangeZodSchema = z.object({
  from: emptyToUndefined(z.coerce.date().optional()),
  to: emptyToUndefined(z.coerce.date().optional()),
});

export const searchZodSchema = emptyToUndefined(
  z.string().trim().max(100).optional(),
);

// multipart/form-data sends everything as text, so the flag arrives as "true" / "false".
export const removeProfileZodSchema = z.enum(["true", "false"]).optional();
