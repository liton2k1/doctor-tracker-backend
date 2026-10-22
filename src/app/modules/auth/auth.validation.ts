import z from "zod";

export const loginZodSchema = z.object({
  email: z
    .string({ invalid_type_error: "Email must be string" })
    .email({ message: "Invalid email formate !" }),
  password: z
    .string({ required_error: "Password is required !" })
    .min(1, "Password is required !"),
});
