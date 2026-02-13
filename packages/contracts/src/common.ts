import { z } from "zod";

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

export const UUID = z.string().uuid();
export type UUID = z.infer<typeof UUID>;

export const SortOrder = z.enum(["asc", "desc"]);
export type SortOrder = z.infer<typeof SortOrder>;

export const DateRange = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
});
export type DateRange = z.infer<typeof DateRange>;

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

export const PaginationMeta = z.object({
  page: z.number().int().positive(),
  per_page: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  total_pages: z.number().int().nonnegative(),
});
export type PaginationMeta = z.infer<typeof PaginationMeta>;

export const PaginatedResponse = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    meta: PaginationMeta,
  });

// Convenience type helper
export type PaginatedResponse<T> = {
  data: T[];
  meta: PaginationMeta;
};

// ---------------------------------------------------------------------------
// API Error
// ---------------------------------------------------------------------------

export const ApiError = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.unknown()).optional(),
});
export type ApiError = z.infer<typeof ApiError>;
