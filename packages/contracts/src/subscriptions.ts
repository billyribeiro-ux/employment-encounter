import { z } from "zod";
import { UUID } from "./common";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const SubscriptionStatus = z.enum([
  "trialing",
  "active",
  "past_due",
  "cancelled",
]);
export type SubscriptionStatus = z.infer<typeof SubscriptionStatus>;

// ---------------------------------------------------------------------------
// Plan
// ---------------------------------------------------------------------------

export const PlanSchema = z.object({
  id: UUID,
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  price_monthly_cents: z.number().int().nonnegative(),
  price_annual_cents: z.number().int().nonnegative(),
  max_jobs: z.number().int().positive(),
  max_users: z.number().int().positive(),
  max_candidates: z.number().int().positive(),
  features: z.array(z.string()),
});
export type Plan = z.infer<typeof PlanSchema>;

// ---------------------------------------------------------------------------
// Subscription
// ---------------------------------------------------------------------------

export const SubscriptionSchema = z.object({
  id: UUID,
  tenant_id: UUID,
  plan_id: UUID,
  status: SubscriptionStatus,
  current_period_start: z.coerce.date(),
  current_period_end: z.coerce.date(),
  trial_ends_at: z.coerce.date().optional(),
  seats_used: z.number().int().nonnegative(),
  seats_limit: z.number().int().positive(),
});
export type Subscription = z.infer<typeof SubscriptionSchema>;

// ---------------------------------------------------------------------------
// Usage Meter
// ---------------------------------------------------------------------------

export const UsageMeterSchema = z.object({
  id: UUID,
  tenant_id: UUID,
  meter_name: z.string().min(1),
  current_value: z.number().nonnegative(),
  limit_value: z.number().positive(),
  period_start: z.coerce.date(),
  period_end: z.coerce.date(),
  last_updated_at: z.coerce.date(),
});
export type UsageMeter = z.infer<typeof UsageMeterSchema>;

// ---------------------------------------------------------------------------
// Entitlement
// ---------------------------------------------------------------------------

export const EntitlementSchema = z.object({
  id: UUID,
  plan_id: UUID,
  feature_key: z.string().min(1),
  feature_name: z.string().min(1),
  is_enabled: z.boolean(),
  limit_value: z.number().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type Entitlement = z.infer<typeof EntitlementSchema>;
