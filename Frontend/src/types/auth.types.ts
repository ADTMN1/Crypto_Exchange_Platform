import { z } from "zod";

// Regex for international phone numbers (E.164 format: e.g., +1234567890)

export const signUpSchema = z.object({
  firstName: z
    .string()
    .min(3, { message: "First name must be at least 3 characters" })
    .max(20, { message: "First name cannot exceed 20 characters" })
    .trim(),
  lastName: z
    .string()
    .min(3, { message: "Last name must be at least 3 characters" })
    .max(20, { message: "Last name cannot exceed 20 characters" })
    .trim(),
 email: z
  .string()
  .min(1, { message: "Email is required" })
  .email({ message: "Invalid email" })
  .trim()
,
 phone_number: z
  .string()
  .min(1, { message: "Phone is required" })
  .transform((val) => val.replace(/[\s()-]/g, ""))
  .refine((val) => /^\+[1-9]\d{1,14}$/.test(val), {
    message: "Invalid phone format",
  }),

  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, { message: "Must contain uppercase letter" })
    .regex(/[a-z]/, { message: "Must contain lowercase letter" })
    .regex(/[0-9]/, { message: "Must contain number" })
    .regex(/[^A-Za-z0-9]/, {
      message: "Must contain special character",
    }),

  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

// Type


export const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Invalid email" })
    .trim()
  ,
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
});

// Type
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
