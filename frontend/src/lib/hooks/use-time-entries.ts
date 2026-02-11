import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PaginatedResponse } from "./use-clients";

export interface TimeEntry {
  id: string;
  tenant_id: string;
  user_id: string;
  client_id: string;
  description: string;
  duration_minutes: number;
  rate_cents: number;
  is_billable: boolean;
  is_running: boolean;
  started_at: string | null;
  stopped_at: string | null;
  date: string;
  invoice_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTimeEntryPayload {
  client_id: string;
  description?: string;
  duration_minutes?: number;
  rate_cents?: number;
  is_billable?: boolean;
  date?: string;
  start_timer?: boolean;
}

export function useTimeEntries(params?: {
  page?: number;
  per_page?: number;
  client_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ["time-entries", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<TimeEntry>>(
        "/time-entries",
        { params }
      );
      return data;
    },
  });
}

export function useCreateTimeEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateTimeEntryPayload) => {
      const { data } = await api.post<TimeEntry>("/time-entries", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
    },
  });
}

export function useStopTimer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<TimeEntry>(`/time-entries/${id}/stop`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
    },
  });
}

export function useDeleteTimeEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/time-entries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
    },
  });
}
