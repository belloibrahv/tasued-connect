import * as z from "zod"

export const studentOnboardingSchema = z.object({
  emergencyContact: z.string().min(10, "Valid phone number required"),
  emergencyContactName: z.string().min(2, "Contact name required"),
  preferredLanguage: z.enum(["en", "yo"]).default("en"),
  notificationsEnabled: z.boolean().default(true),
})

export type StudentOnboardingInput = z.infer<typeof studentOnboardingSchema>

export const lecturerOnboardingSchema = z.object({
  officeLocation: z.string().min(2, "Office location required"),
  officeHours: z.object({
    day: z.enum(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]),
    startTime: z.string(),
    endTime: z.string(),
  }).optional(),
  researchInterests: z.string().optional(),
  notificationsEnabled: z.boolean().default(true),
})

export type LecturerOnboardingInput = z.infer<typeof lecturerOnboardingSchema>
