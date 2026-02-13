import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PaginatedResponse } from "./use-clients";

export interface CandidateProfile {
  id: string;
  tenant_id: string;
  user_id: string | null;
  headline: string | null;
  summary: string | null;
  location_city: string | null;
  location_state: string | null;
  location_country: string | null;
  remote_preference: string;
  availability_status: string;
  desired_salary_min_cents: number | null;
  desired_salary_max_cents: number | null;
  desired_currency: string;
  visa_status: string | null;
  work_authorization: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  github_url: string | null;
  profile_completeness_pct: number;
  is_anonymous: boolean;
  reputation_score: number;
  created_at: string;
  updated_at: string;
}

export interface CandidateSkill {
  id: string;
  candidate_id: string;
  skill_name: string;
  category: string | null;
  proficiency_level: string | null;
  years_experience: number | null;
  is_verified: boolean;
}

export interface CreateCandidatePayload {
  headline?: string;
  summary?: string;
  location_city?: string;
  location_state?: string;
  location_country?: string;
  remote_preference?: string;
  availability_status?: string;
  desired_salary_min_cents?: number;
  desired_salary_max_cents?: number;
  desired_currency?: string;
  visa_status?: string;
  work_authorization?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  github_url?: string;
  is_anonymous?: boolean;
}

export interface UpdateCandidatePayload {
  headline?: string;
  summary?: string;
  location_city?: string;
  location_state?: string;
  location_country?: string;
  remote_preference?: string;
  availability_status?: string;
  desired_salary_min_cents?: number;
  desired_salary_max_cents?: number;
  desired_currency?: string;
  visa_status?: string;
  work_authorization?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  github_url?: string;
  is_anonymous?: boolean;
}

export interface AddCandidateSkillPayload {
  skill_name: string;
  category?: string;
  proficiency_level?: string;
  years_experience?: number;
}

export function useCandidates(params?: {
  page?: number;
  per_page?: number;
  availability_status?: string;
  remote_preference?: string;
  search?: string;
  sort?: string;
  order?: string;
}) {
  return useQuery({
    queryKey: ["candidates", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<CandidateProfile>>(
        "/candidates",
        { params }
      );
      return data;
    },
  });
}

export function useCandidate(id: string) {
  return useQuery({
    queryKey: ["candidates", id],
    queryFn: async () => {
      const { data } = await api.get<CandidateProfile>(`/candidates/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateCandidate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateCandidatePayload) => {
      const { data } = await api.post<CandidateProfile>(
        "/candidates",
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
    },
  });
}

export function useUpdateCandidate(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateCandidatePayload) => {
      const { data } = await api.put<CandidateProfile>(
        `/candidates/${id}`,
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
    },
  });
}

export function useCandidateSkills(candidateId: string) {
  return useQuery({
    queryKey: ["candidates", candidateId, "skills"],
    queryFn: async () => {
      const { data } = await api.get<CandidateSkill[]>(
        `/candidates/${candidateId}/skills`
      );
      return data;
    },
    enabled: !!candidateId,
  });
}

export function useAddCandidateSkill(candidateId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AddCandidateSkillPayload) => {
      const { data } = await api.post<CandidateSkill>(
        `/candidates/${candidateId}/skills`,
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["candidates", candidateId, "skills"],
      });
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
    },
  });
}

export function useDeleteCandidateSkill(candidateId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (skillId: string) => {
      await api.delete(`/candidates/${candidateId}/skills/${skillId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["candidates", candidateId, "skills"],
      });
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
    },
  });
}
