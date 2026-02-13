import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface VideoInterviewTemplate {
  id: string;
  title: string;
  description: string | null;
  questions: Record<string, unknown>;
  time_limit_per_question: number;
  max_retakes: number;
  is_active: boolean;
  created_at: string;
}

export interface VideoInterviewSubmission {
  id: string;
  template_id: string;
  candidate_name: string;
  candidate_email: string;
  status: string;
  recording_urls: Record<string, unknown>;
  ai_analysis: Record<string, unknown> | null;
  reviewer_notes: string | null;
  rating: number | null;
  completed_at: string | null;
  created_at: string;
}

export function useVideoInterviewTemplates() {
  return useQuery({
    queryKey: ["video-interview-templates"],
    queryFn: async () => {
      const { data } = await api.get<VideoInterviewTemplate[]>(
        "/video-interviews/templates"
      );
      return data;
    },
  });
}

export function useVideoInterviewSubmissions(templateId?: string) {
  return useQuery({
    queryKey: ["video-interview-submissions", templateId],
    queryFn: async () => {
      const params = templateId ? { template_id: templateId } : {};
      const { data } = await api.get<VideoInterviewSubmission[]>(
        "/video-interviews/submissions",
        { params }
      );
      return data;
    },
  });
}

export function useCreateVideoInterview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      template_id: string;
      candidate_name: string;
      candidate_email: string;
    }) => {
      const { data } = await api.post<VideoInterviewSubmission>(
        "/video-interviews/submissions",
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["video-interview-submissions"],
      });
    },
  });
}
