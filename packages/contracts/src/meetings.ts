import { z } from "zod";
import { UUID } from "./common";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const MeetingStatus = z.enum([
  "pending",
  "accepted",
  "denied",
  "rescheduled",
  "cancelled",
]);
export type MeetingStatus = z.infer<typeof MeetingStatus>;

export const MeetingType = z.enum(["phone", "video", "in_person"]);
export type MeetingType = z.infer<typeof MeetingType>;

// ---------------------------------------------------------------------------
// Proposed Time Slot
// ---------------------------------------------------------------------------

export const ProposedTimeSlot = z.object({
  start: z.coerce.date(),
  end: z.coerce.date(),
  timezone: z.string().min(1),
});
export type ProposedTimeSlot = z.infer<typeof ProposedTimeSlot>;

// ---------------------------------------------------------------------------
// Meeting Request
// ---------------------------------------------------------------------------

export const MeetingRequestSchema = z.object({
  id: UUID,
  title: z.string().min(1).max(255),
  description: z.string().max(5000).optional(),
  requested_by: UUID,
  requested_to: UUID,
  proposed_times: z.array(ProposedTimeSlot).min(1),
  status: MeetingStatus.default("pending"),
  meeting_type: MeetingType,
  duration_minutes: z.number().int().positive().max(480),
  location: z.string().max(500).optional(),
  meeting_url: z.string().url().optional(),
});
export type MeetingRequest = z.infer<typeof MeetingRequestSchema>;

// ---------------------------------------------------------------------------
// Availability Block
// ---------------------------------------------------------------------------

export const DayOfWeek = z.enum([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]);
export type DayOfWeek = z.infer<typeof DayOfWeek>;

export const MeetingAvailabilityBlockSchema = z.object({
  user_id: UUID,
  day_of_week: DayOfWeek,
  start_time: z.string().regex(/^\d{2}:\d{2}$/, "Must be in HH:MM format"),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, "Must be in HH:MM format"),
  timezone: z.string().min(1),
  is_recurring: z.boolean().default(true),
});
export type MeetingAvailabilityBlock = z.infer<typeof MeetingAvailabilityBlockSchema>;

// ---------------------------------------------------------------------------
// Accept / Deny / Reschedule
// ---------------------------------------------------------------------------

export const AcceptMeetingSchema = z.object({
  meeting_id: UUID,
  selected_time: ProposedTimeSlot,
  notes: z.string().max(2000).optional(),
});
export type AcceptMeetingInput = z.infer<typeof AcceptMeetingSchema>;

export const DenyMeetingSchema = z.object({
  meeting_id: UUID,
  reason: z.string().min(1).max(2000),
});
export type DenyMeetingInput = z.infer<typeof DenyMeetingSchema>;

export const RescheduleMeetingSchema = z.object({
  meeting_id: UUID,
  proposed_times: z.array(ProposedTimeSlot).min(1),
  reason: z.string().max(2000).optional(),
});
export type RescheduleMeetingInput = z.infer<typeof RescheduleMeetingSchema>;
