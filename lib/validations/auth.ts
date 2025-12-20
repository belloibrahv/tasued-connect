import * as z from "zod"

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export type LoginInput = z.infer<typeof loginSchema>

export const registerSchema = z.object({
  role: z.enum(["student", "lecturer", "admin"]),
  // Common fields
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),

  // Student specific
  matricNumber: z.string().optional(),
  department: z.string().optional(),
  level: z.string().optional(),

  // Lecturer specific
  staffId: z.string().optional(),
  title: z.string().optional(),
  officeLocation: z.string().optional(),

  // Security
  securityQuestion: z.string().min(1, "Please select a security question"),
  securityAnswer: z.string().min(1, "Please answer the security question"),

  // Terms
  terms: z.boolean().refine((val) => val === true, "You must accept the terms"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
}).superRefine((data, ctx) => {
  if (data.role === "student") {
    if (!data.matricNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Matric number is required",
        path: ["matricNumber"],
      })
    }
    if (!data.department) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Department is required",
        path: ["department"],
      })
    }
    if (!data.level) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Level is required",
        path: ["level"],
      })
    }
  }

  if (data.role === "lecturer") {
    if (!data.staffId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Staff ID is required",
        path: ["staffId"],
      })
    }
    if (!data.title) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Title is required",
        path: ["title"],
      })
    }
  }
})

export type RegisterInput = z.infer<typeof registerSchema>
