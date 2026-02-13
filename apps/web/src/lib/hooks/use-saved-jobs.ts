import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface SavedJob {
  id: string;
  job_id: string;
  user_id: string;
  job_title?: string;
  company_name?: string;
  location?: string;
  salary_min_cents?: number;
  salary_max_cents?: number;
  employment_type?: string;
  job_status?: string;
  created_at: string;
}

export function useSavedJobs() {
  return useQuery({
    queryKey: ["saved-jobs"],
    queryFn: async () => {
      const { data } = await api.get<SavedJob[]>("/saved-jobs");
      return data;
    },
  });
}

export function useSaveJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (jobId: string) => {
      const { data } = await api.post<SavedJob>("/saved-jobs", { job_id: jobId });
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saved-jobs"] }),
  });
}

export function useUnsaveJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/saved-jobs/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saved-jobs"] }),
  });
}

export function useIsJobSaved(jobId: string) {
  const { data: savedJobs } = useSavedJobs();
  return savedJobs?.some((s) => s.job_id === jobId) ?? false;
}
