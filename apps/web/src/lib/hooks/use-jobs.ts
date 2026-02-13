import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PaginatedResponse } from "./use-clients";

export interface JobPost {
  id: string;
  tenant_id: string;
  title: string;
  slug: string;
  description: string | null;
  requirements: string | null;
  responsibilities: string | null;
  benefits: string | null;
  department: string | null;
  employment_type: string;
  experience_level: string | null;
  location_city: string | null;
  location_state: string | null;
  location_country: string | null;
  remote_policy: string;
  salary_min_cents: number | null;
  salary_max_cents: number | null;
  salary_currency: string;
  show_salary: boolean;
  equity_offered: boolean;
  visibility: string;
  max_applications: number | null;
  is_urgent: boolean;
  skills_required: string[];
  skills_preferred: string[];
  status: string;
  published_at: string | null;
  closes_at: string | null;
  created_by: string;
  application_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateJobPayload {
  title: string;
  description?: string;
  requirements?: string;
  responsibilities?: string;
  benefits?: string;
  department?: string;
  employment_type?: string;
  experience_level?: string;
  location_city?: string;
  location_state?: string;
  location_country?: string;
  remote_policy?: string;
  salary_min_cents?: number;
  salary_max_cents?: number;
  salary_currency?: string;
  show_salary?: boolean;
  equity_offered?: boolean;
  visibility?: string;
  max_applications?: number;
  is_urgent?: boolean;
  skills_required?: string[];
  skills_preferred?: string[];
  closes_at?: string;
}

export interface UpdateJobPayload {
  title?: string;
  description?: string;
  requirements?: string;
  responsibilities?: string;
  benefits?: string;
  department?: string;
  employment_type?: string;
  experience_level?: string;
  location_city?: string;
  location_state?: string;
  location_country?: string;
  remote_policy?: string;
  salary_min_cents?: number;
  salary_max_cents?: number;
  salary_currency?: string;
  show_salary?: boolean;
  equity_offered?: boolean;
  visibility?: string;
  max_applications?: number;
  is_urgent?: boolean;
  skills_required?: string[];
  skills_preferred?: string[];
  closes_at?: string;
}

export function useJobs(params?: {
  page?: number;
  per_page?: number;
  status?: string;
  department?: string;
  employment_type?: string;
  remote_policy?: string;
  search?: string;
  sort?: string;
  order?: string;
}) {
  return useQuery({
    queryKey: ["jobs", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<JobPost>>("/jobs", {
        params,
      });
      return data;
    },
  });
}

export function useJob(id: string) {
  return useQuery({
    queryKey: ["jobs", id],
    queryFn: async () => {
      const { data } = await api.get<JobPost>(`/jobs/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateJobPayload) => {
      const { data } = await api.post<JobPost>("/jobs", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

export function useUpdateJob(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateJobPayload) => {
      const { data } = await api.put<JobPost>(`/jobs/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

export function useDeleteJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/jobs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}

export function usePublishJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<JobPost>(`/jobs/${id}/publish`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });
}
