import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface InterviewQuestion {
  id: string;
  tenant_id: string;
  question: string;
  category: string;
  difficulty: string;
  suggested_followups: string[];
  scoring_rubric: string | null;
  is_starred: boolean;
  usage_count: number;
  avg_score: number | null;
  tags: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface QuestionSet {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  interview_type: string | null;
  question_ids: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export function useQuestions(params?: {
  category?: string;
  difficulty?: string;
  search?: string;
  is_starred?: boolean;
}) {
  return useQuery({
    queryKey: ["questions", params],
    queryFn: async () => {
      const { data } = await api.get<InterviewQuestion[]>("/questions", { params });
      return data;
    },
  });
}

export function useCreateQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      question: string;
      category?: string;
      difficulty?: string;
      suggested_followups?: string[];
      scoring_rubric?: string;
      tags?: string[];
    }) => {
      const { data } = await api.post<InterviewQuestion>("/questions", payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["questions"] }),
  });
}

export function useUpdateQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: {
      id: string;
      question?: string;
      category?: string;
      difficulty?: string;
      suggested_followups?: string[];
      scoring_rubric?: string;
      is_starred?: boolean;
      tags?: string[];
    }) => {
      const { data } = await api.put<InterviewQuestion>(`/questions/${id}`, payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["questions"] }),
  });
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/questions/${id}`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["questions"] }),
  });
}

export function useQuestionSets() {
  return useQuery({
    queryKey: ["question-sets"],
    queryFn: async () => {
      const { data } = await api.get<QuestionSet[]>("/question-sets");
      return data;
    },
  });
}

export function useCreateQuestionSet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      description?: string;
      interview_type?: string;
      question_ids: string[];
    }) => {
      const { data } = await api.post<QuestionSet>("/question-sets", payload);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["question-sets"] }),
  });
}
