import { z } from "zod";
import { GENDER_OPTIONS } from "./utils";

export const candidateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  gender: z.enum(["Male", "Female"], { errorMap: () => ({ message: "Select a gender" }) }),
  promises: z
    .array(z.string().min(3, "Promise must be at least 3 characters").max(280))
    .min(1, "Add at least one promise")
    .max(10, "Maximum 10 promises")
});

export type CandidateProfileInput = z.infer<typeof candidateProfileSchema>;

export const electionSchema = z
  .object({
    name: z.string().min(3, "Election name is required").max(120),
    description: z.string().max(600).optional().default(""),
    className: z.string().min(1, "Class is required").max(60),
    section: z.string().min(1, "Section is required").max(20),
    startDate: z.string().min(1, "Start date is required"),
    startTime: z.string().min(1, "Start time is required"),
    endDate: z.string().min(1, "End date is required"),
    endTime: z.string().min(1, "End time is required"),
    resultDate: z.string().min(1, "Result date is required"),
    resultTime: z.string().min(1, "Result time is required"),
    eligibilityMode: z.enum(["open", "restricted"]),
    studentWeight: z.number().min(0).max(100),
    authorityWeightEach: z.number().min(0).max(100)
  })
  .refine((d) => new Date(`${d.startDate}T${d.startTime}`).getTime() < new Date(`${d.endDate}T${d.endTime}`).getTime(), {
    message: "End time must be after start time",
    path: ["endTime"]
  })
  .refine((d) => new Date(`${d.endDate}T${d.endTime}`).getTime() < new Date(`${d.resultDate}T${d.resultTime}`).getTime(), {
    message: "Result time must be after voting end time",
    path: ["resultTime"]
  })
  .refine((d) => d.studentWeight + d.authorityWeightEach * 3 === 100, {
    message: "Weights must sum to 100% (student + 3 authorities)",
    path: ["studentWeight"]
  });

export type ElectionFormInput = z.infer<typeof electionSchema>;

export const authoritySchema = z.object({
  hodEmail: z.string().email("Enter a valid HOD email"),
  coordinatorEmail: z.string().email("Enter a valid Coordinator email"),
  counsellorEmail: z.string().email("Enter a valid Counsellor email")
});

export type AuthorityInput = z.infer<typeof authoritySchema>;

export const enrollCandidateSchema = z.object({
  candidateCode: z.string().length(5, "Candidate code must be 5 characters").regex(/^[A-Z0-9]+$/, "Invalid code format")
});

export type EnrollCandidateInput = z.infer<typeof enrollCandidateSchema>;

export const addTeacherSchema = z.object({
  email: z.string().email("Enter a valid email")
});

export const addStudentSchema = z.object({
  email: z.string().email("Enter a valid email")
});

export function combineDateTime(date: string, time: string): number {
  return new Date(`${date}T${time}`).getTime();
}
