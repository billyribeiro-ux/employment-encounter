import { z } from "zod";
import { UUID } from "./common";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const WorkMode = z.enum(["remote", "hybrid", "onsite"]);
export type WorkMode = z.infer<typeof WorkMode>;

export const EmploymentType = z.enum([
  "full_time",
  "part_time",
  "contract",
  "freelance",
  "internship",
  "temporary",
]);
export type EmploymentType = z.infer<typeof EmploymentType>;

export const SeniorityLevel = z.enum([
  "intern",
  "junior",
  "mid",
  "senior",
  "staff",
  "principal",
  "lead",
  "manager",
  "director",
  "vp",
  "c_level",
]);
export type SeniorityLevel = z.infer<typeof SeniorityLevel>;

export const JobStatus = z.enum([
  "draft",
  "open",
  "paused",
  "closed",
  "filled",
  "cancelled",
]);
export type JobStatus = z.infer<typeof JobStatus>;

export const JobVisibility = z.enum(["public", "internal", "private", "unlisted"]);
export type JobVisibility = z.infer<typeof JobVisibility>;

// ---------------------------------------------------------------------------
// Job Requirement
// ---------------------------------------------------------------------------

export const JobRequirementSchema = z.object({
  requirement_text: z.string().min(1),
  category: z.string().min(1),
  is_must_have: z.boolean().default(true),
  weight: z.number().min(0).max(100).default(50),
});
export type JobRequirement = z.infer<typeof JobRequirementSchema>;

// ---------------------------------------------------------------------------
// Job Post
// ---------------------------------------------------------------------------

export const JobPostSchema = z.object({
  id: UUID,
  tenant_id: UUID,
  title: z.string().min(1).max(255),
  department: z.string().max(255).optional(),
  description: z.string().min(1).max(50000),
  requirements: z.array(JobRequirementSchema).optional(),
  location: z.string().optional(),
  work_mode: WorkMode,
  employment_type: EmploymentType,
  seniority_level: SeniorityLevel.optional(),
  salary_min_cents: z.number().int().nonnegative().optional(),
  salary_max_cents: z.number().int().nonnegative().optional(),
  status: JobStatus.default("draft"),
  visibility: JobVisibility.default("public"),
  hiring_manager_id: UUID.optional(),
  recruiter_id: UUID.optional(),
  is_urgent: z.boolean().default(false),
  posted_at: z.coerce.date().optional(),
  closes_at: z.coerce.date().optional(),
});
export type JobPost = z.infer<typeof JobPostSchema>;

// ---------------------------------------------------------------------------
// Create / Update
// ---------------------------------------------------------------------------

export const CreateJobSchema = JobPostSchema.omit({
  id: true,
  tenant_id: true,
  posted_at: true,
});
export type CreateJobInput = z.infer<typeof CreateJobSchema>;

export const UpdateJobSchema = CreateJobSchema.partial();
export type UpdateJobInput = z.infer<typeof UpdateJobSchema>;
