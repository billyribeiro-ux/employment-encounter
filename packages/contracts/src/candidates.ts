import { z } from "zod";
import { UUID } from "./common";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const RemotePreference = z.enum(["remote", "hybrid", "onsite", "flexible"]);
export type RemotePreference = z.infer<typeof RemotePreference>;

export const AvailabilityStatus = z.enum([
  "actively_looking",
  "open_to_offers",
  "not_looking",
  "unavailable",
]);
export type AvailabilityStatus = z.infer<typeof AvailabilityStatus>;

export const SkillCategory = z.enum([
  "technical",
  "soft",
  "language",
  "certification",
  "tool",
  "domain",
]);
export type SkillCategory = z.infer<typeof SkillCategory>;

export const ProficiencyLevel = z.enum([
  "beginner",
  "intermediate",
  "advanced",
  "expert",
]);
export type ProficiencyLevel = z.infer<typeof ProficiencyLevel>;

// ---------------------------------------------------------------------------
// Location
// ---------------------------------------------------------------------------

export const LocationSchema = z.object({
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string(),
});
export type Location = z.infer<typeof LocationSchema>;

// ---------------------------------------------------------------------------
// Candidate Profile
// ---------------------------------------------------------------------------

export const CandidateProfileSchema = z.object({
  id: UUID,
  tenant_id: UUID,
  user_id: UUID,
  headline: z.string().max(255).optional(),
  summary: z.string().max(5000).optional(),
  location: LocationSchema.optional(),
  remote_preference: RemotePreference.optional(),
  availability_status: AvailabilityStatus,
  desired_salary_min_cents: z.number().int().nonnegative().optional(),
  desired_salary_max_cents: z.number().int().nonnegative().optional(),
  visa_status: z.string().optional(),
  work_authorization: z.string().optional(),
  linkedin_url: z.string().url().optional(),
  portfolio_url: z.string().url().optional(),
  github_url: z.string().url().optional(),
  profile_completeness_pct: z.number().min(0).max(100),
  is_anonymous: z.boolean().default(false),
  reputation_score: z.number().min(0).max(100).optional(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});
export type CandidateProfile = z.infer<typeof CandidateProfileSchema>;

// ---------------------------------------------------------------------------
// Candidate Skill
// ---------------------------------------------------------------------------

export const CandidateSkillSchema = z.object({
  id: UUID,
  candidate_id: UUID,
  skill_name: z.string().min(1).max(100),
  category: SkillCategory,
  proficiency_level: ProficiencyLevel,
  years_experience: z.number().nonnegative().optional(),
  is_verified: z.boolean().default(false),
});
export type CandidateSkill = z.infer<typeof CandidateSkillSchema>;

// ---------------------------------------------------------------------------
// Work History
// ---------------------------------------------------------------------------

export const CandidateWorkHistorySchema = z.object({
  company_name: z.string().min(1),
  title: z.string().min(1),
  location: z.string().optional(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date().optional(),
  is_current: z.boolean().default(false),
  description: z.string().max(5000).optional(),
  achievements: z.array(z.string()).optional(),
  skills_used: z.array(z.string()).optional(),
});
export type CandidateWorkHistory = z.infer<typeof CandidateWorkHistorySchema>;

// ---------------------------------------------------------------------------
// Education
// ---------------------------------------------------------------------------

export const CandidateEducationSchema = z.object({
  institution: z.string().min(1),
  degree: z.string().min(1),
  field_of_study: z.string().optional(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date().optional(),
});
export type CandidateEducation = z.infer<typeof CandidateEducationSchema>;

// ---------------------------------------------------------------------------
// Create / Update
// ---------------------------------------------------------------------------

export const CreateCandidateSchema = CandidateProfileSchema.omit({
  id: true,
  tenant_id: true,
  user_id: true,
  profile_completeness_pct: true,
  reputation_score: true,
  created_at: true,
  updated_at: true,
});
export type CreateCandidateInput = z.infer<typeof CreateCandidateSchema>;

export const UpdateCandidateSchema = CreateCandidateSchema.partial();
export type UpdateCandidateInput = z.infer<typeof UpdateCandidateSchema>;
