import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PaginatedResponse } from "./use-clients";

export interface Application {
  id: string;
  tenant_id: string;
  job_id: string;
  candidate_id: string;
  stage: string;
  status: string;
  cover_letter: string | null;
  resume_s3_key: string | null;
  source: string | null;
  referral_id: string | null;
  screening_score: number | null;
  rejection_reason: string | null;
  rejected_at: string | null;
  withdrawn_at: string | null;
  hired_at: string | null;
  job_title: string | null;
  candidate_headline: string | null;
  candidate_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApplicationStageEvent {
  id: string;
  application_id: string;
  from_stage: string | null;
  to_stage: string;
  changed_by: string;
  notes: string | null;
  created_at: string;
}

export interface CreateApplicationPayload {
  job_id: string;
  candidate_id: string;
  cover_letter?: string;
  resume_s3_key?: string;
  source?: string;
  referral_id?: string;
}

export interface AdvanceStagePayload {
  id: string;
  to_stage: string;
  notes?: string;
}

export function useApplications(params?: {
  page?: number;
  per_page?: number;
  job_id?: string;
  candidate_id?: string;
  stage?: string;
  status?: string;
  search?: string;
  sort?: string;
  order?: string;
}) {
  return useQuery({
    queryKey: ["applications", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Application>>(
        "/applications",
        { params }
      );
      return data;
    },
  });
}

export function useApplication(id: string) {
  return useQuery({
    queryKey: ["applications", id],
    queryFn: async () => {
      const { data } = await api.get<Application>(`/applications/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateApplicationPayload) => {
      const { data } = await api.post<Application>(
        "/applications",
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
}

export function useAdvanceStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: AdvanceStagePayload) => {
      const { data } = await api.post<Application>(
        `/applications/${id}/stage`,
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
}

export function useRejectApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      reason,
    }: {
      id: string;
      reason?: string;
    }) => {
      const { data } = await api.post<Application>(
        `/applications/${id}/reject`,
        { reason }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
}

export function useWithdrawApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<Application>(
        `/applications/${id}/withdraw`
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
}

export function useStageHistory(applicationId: string) {
  return useQuery({
    queryKey: ["applications", applicationId, "stage-history"],
    queryFn: async () => {
      const { data } = await api.get<ApplicationStageEvent[]>(
        `/applications/${applicationId}/stage`
      );
      return data;
    },
    enabled: !!applicationId,
  });
}
