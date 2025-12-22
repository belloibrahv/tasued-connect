import * as z from "zod";

export const profileSchema = z.object({
  first_name: z.string().min(2, "First name is required"),
  last_name: z.string().min(2, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  level: z.string().min(1, "Level is required"),
  department: z.string().min(2, "Department is required"),
  matric_number: z.string().min(5, "Matric number is required"),
  address: z.string().min(5, "Address is required"),
});

export type ProfileInput = z.infer<typeof profileSchema>;