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
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),

  // Student specific
  matricNumber: z.string().optional(),
  department: z.string().optional(),
  level: z.string().optional(),

  // Lecturer specific
  staffId: z.string().optional(),
  title: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
}).superRefine((data, ctx) => {
  if (data.role === "student") {
    if (!data.matricNumber || data.matricNumber.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Matric Number is required",
        path: ["matricNumber"],
      })
    }
    if (!data.department || data.department === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Department is required",
        path: ["department"],
      })
    }
    if (!data.level || data.level === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Level is required",
        path: ["level"],
      })
    }
  }

  if (data.role === "lecturer") {
    if (!data.staffId || data.staffId.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Staff ID is required",
        path: ["staffId"],
      })
    }
    if (!data.title || data.title === "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Title is required",
        path: ["title"],
      })
    }
  }
})

export type RegisterInput = z.infer<typeof registerSchema>
