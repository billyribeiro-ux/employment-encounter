import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PaginatedResponse } from "./use-clients";

export interface ComplianceDeadline {
  id: string;
  tenant_id: string;
  client_id: string;
  filing_type: string;
  description: string | null;
  due_date: string;
  extended_due_date: string | null;
  status: string;
  extension_filed: boolean;
  extension_filed_at: string | null;
  completed_at: string | null;
  assigned_to: string | null;
  notes: string | null;
  reminder_sent_30d: boolean;
  reminder_sent_14d: boolean;
  reminder_sent_7d: boolean;
  reminder_sent_1d: boolean;
  created_at: string;
  updated_at: string;
}

export function useComplianceDeadlines(params?: {
  page?: number;
  per_page?: number;
  status?: string;
  client_id?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ["compliance-deadlines", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<ComplianceDeadline>>(
        "/compliance-deadlines",
        { params }
      );
      return data;
    },
  });
}

export function useCreateDeadline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      client_id: string;
      filing_type: string;
      description?: string;
      due_date: string;
      assigned_to?: string;
      notes?: string;
    }) => {
      const { data } = await api.post<ComplianceDeadline>(
        "/compliance-deadlines",
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compliance-deadlines"] });
    },
  });
}

export function useUpdateDeadline() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: {
      id: string;
      status?: string;
      extension_filed?: boolean;
      extended_due_date?: string;
      assigned_to?: string;
      notes?: string;
    }) => {
      const { data } = await api.put<ComplianceDeadline>(
        `/compliance-deadlines/${id}`,
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["compliance-deadlines"] });
    },
  });
}
