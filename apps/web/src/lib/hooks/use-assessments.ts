import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Assessment {
  id: string;
  title: string;
  description: string | null;
  category: string;
  difficulty: string;
  duration_minutes: number;
  questions: Record<string, unknown>;
  passing_score: number;
  is_active: boolean;
  usage_count: number;
  avg_score: number | null;
  created_at: string;
}

export interface AssessmentSubmission {
  id: string;
  assessment_id: string;
  candidate_name: string;
  candidate_email: string | null;
  score: number | null;
  percentile: number | null;
  time_taken_seconds: number | null;
  status: string;
  anti_cheat_flags: Record<string, unknown>;
  completed_at: string | null;
  created_at: string;
}

export interface CreateAssessmentPayload {
  title: string;
  description?: string;
  category: string;
  difficulty?: string;
  duration_minutes?: number;
  questions: Record<string, unknown>;
  passing_score?: number;
}

export function useAssessments() {
  return useQuery({
    queryKey: ["assessments"],
    queryFn: async () => {
      const { data } = await api.get<Assessment[]>("/assessments");
      return data;
    },
  });
}

export function useCreateAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateAssessmentPayload) => {
      const { data } = await api.post<Assessment>("/assessments", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assessments"] });
    },
  });
}

export function useAssessmentSubmissions(assessmentId: string) {
  return useQuery({
    queryKey: ["assessments", assessmentId, "submissions"],
    queryFn: async () => {
      const { data } = await api.get<AssessmentSubmission[]>(
        `/assessments/${assessmentId}/submissions`
      );
      return data;
    },
    enabled: !!assessmentId,
  });
}
