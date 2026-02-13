import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface OnboardingTemplate {
  id: string;
  name: string;
  description: string | null;
  department: string | null;
  tasks: Record<string, unknown>;
  duration_days: number;
  is_active: boolean;
  created_at: string;
}

export interface OnboardingInstance {
  id: string;
  template_id: string;
  template_name: string;
  employee_name: string;
  employee_email: string;
  start_date: string;
  status: string;
  progress: number;
  assigned_buddy: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface CreateOnboardingPayload {
  template_id: string;
  employee_name: string;
  employee_email: string;
  start_date: string;
  assigned_buddy?: string;
}

export function useOnboardingTemplates() {
  return useQuery({
    queryKey: ["onboarding-templates"],
    queryFn: async () => {
      const { data } = await api.get<OnboardingTemplate[]>(
        "/onboarding/templates"
      );
      return data;
    },
  });
}

export function useOnboardingInstances() {
  return useQuery({
    queryKey: ["onboarding-instances"],
    queryFn: async () => {
      const { data } = await api.get<OnboardingInstance[]>("/onboarding");
      return data;
    },
  });
}

export function useCreateOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateOnboardingPayload) => {
      const { data } = await api.post<OnboardingInstance>(
        "/onboarding",
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-instances"] });
    },
  });
}

export function useUpdateOnboardingProgress(instanceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (progress: number) => {
      const { data } = await api.put<OnboardingInstance>(
        `/onboarding/${instanceId}/progress`,
        { progress }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onboarding-instances"] });
    },
  });
}
