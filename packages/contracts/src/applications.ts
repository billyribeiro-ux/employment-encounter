import { z } from "zod";
import { UUID } from "./common";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const ApplicationStage = z.enum([
  "applied",
  "screening",
  "phone_screen",
  "technical",
  "onsite",
  "offer",
  "hired",
  "rejected",
  "withdrawn",
]);
export type ApplicationStage = z.infer<typeof ApplicationStage>;

export const ApplicationStatus = z.enum([
  "active",
  "on_hold",
  "archived",
]);
export type ApplicationStatus = z.infer<typeof ApplicationStatus>;

// ---------------------------------------------------------------------------
// Application
// ---------------------------------------------------------------------------

export const ApplicationSchema = z.object({
  id: UUID,
  job_id: UUID,
  candidate_id: UUID,
  stage: ApplicationStage.default("applied"),
  status: ApplicationStatus.default("active"),
  source: z.string().optional(),
  match_score: z.number().min(0).max(100).optional(),
  match_reasons: z.array(z.string()).optional(),
  created_at: z.coerce.date(),
});
export type Application = z.infer<typeof ApplicationSchema>;

// ---------------------------------------------------------------------------
// Stage Event
// ---------------------------------------------------------------------------

export const ApplicationStageEventSchema = z.object({
  from_stage: ApplicationStage,
  to_stage: ApplicationStage,
  changed_by: UUID,
  notes: z.string().max(5000).optional(),
});
export type ApplicationStageEvent = z.infer<typeof ApplicationStageEventSchema>;

// ---------------------------------------------------------------------------
// Scorecard
// ---------------------------------------------------------------------------

export const ScorecardCriterionSchema = z.object({
  name: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  notes: z.string().optional(),
});

export const ScorecardSchema = z.object({
  id: UUID,
  application_id: UUID,
  interviewer_id: UUID,
  stage: ApplicationStage,
  overall_rating: z.number().int().min(1).max(5),
  criteria: z.array(ScorecardCriterionSchema),
  strengths: z.string().optional(),
  weaknesses: z.string().optional(),
  recommendation: z.enum(["strong_hire", "hire", "no_hire", "strong_no_hire"]),
  notes: z.string().max(10000).optional(),
  submitted_at: z.coerce.date(),
});
export type Scorecard = z.infer<typeof ScorecardSchema>;

// ---------------------------------------------------------------------------
// Decision Record
// ---------------------------------------------------------------------------

export const DecisionRecordSchema = z.object({
  id: UUID,
  application_id: UUID,
  decision: z.enum(["advance", "reject", "hold", "hire"]),
  decided_by: UUID,
  rationale: z.string().min(1).max(10000),
  dissenting_opinions: z.array(z.string()).optional(),
  created_at: z.coerce.date(),
});
export type DecisionRecord = z.infer<typeof DecisionRecordSchema>;
