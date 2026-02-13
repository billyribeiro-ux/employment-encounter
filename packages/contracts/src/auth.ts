import { z } from "zod";
import { UUID } from "./common";

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  org_name: z.string().optional(),
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof LoginSchema>;

// ---------------------------------------------------------------------------
// Token Response
// ---------------------------------------------------------------------------

export const TokenResponse = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_in: z.number().int().positive(),
});
export type TokenResponse = z.infer<typeof TokenResponse>;

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

export const UserRole = z.enum([
  "super_admin",
  "org_admin",
  "recruiter",
  "hiring_manager",
  "interviewer",
  "candidate",
]);
export type UserRole = z.infer<typeof UserRole>;

export const UserSchema = z.object({
  id: UUID,
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  role: UserRole,
  tenant_id: UUID,
  mfa_enabled: z.boolean(),
  created_at: z.coerce.date(),
});
export type User = z.infer<typeof UserSchema>;
