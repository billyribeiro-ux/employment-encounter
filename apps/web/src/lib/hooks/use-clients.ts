import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

/**
 * Shared paginated response type used across all list hooks.
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

/**
 * @deprecated Legacy hook - use domain-specific hooks instead.
 * Kept for PaginatedResponse type export.
 */
export interface Client {
  id: string;
  tenant_id: string;
  name: string;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
