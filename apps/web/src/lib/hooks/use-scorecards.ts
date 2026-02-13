import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Scorecard {
  id: string;
  tenant_id: string;
  application_id: string;
  evaluator_id: string;
  evaluator_name?: string;
  category: string;
  criteria: string;
  score: number;
  weight: number;
  notes: string | null;
  recommendation: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScorecardSummaryData {
  application_id: string;
  avg_score: number;
  total_evaluations: number;
  by_category: { category: string; avg_score: number; count: number }[];
  recommendations: { recommendation: string; count: number }[];
}

export interface CreateScorecardPayload {
  application_id: string;
  category: string;
  criteria: string;
  score: number;
  weight?: number;
  notes?: string;
  recommendation?: string;
}

export interface UpdateScorecardPayload {
  category?: string;
  criteria?: string;
  score?: number;
  weight?: number;
  notes?: string;
  recommendation?: string;
}

export interface DecisionRecord {
  id: string;
  application_id: string;
  decision: string;
  reasoning: string | null;
  decided_by: string;
  decided_by_name?: string;
  created_at: string;
}

export interface CreateDecisionPayload {
  application_id: string;
  decision: string;
  reasoning?: string;
}

export function useApplicationScorecards(applicationId: string) {
  return useQuery({
    queryKey: ["scorecards", applicationId],
    queryFn: async () => {
      const { data } = await api.get<Scorecard[]>(
        `/applications/${applicationId}/scorecards`
      );
      return data;
    },
    enabled: !!applicationId,
  });
}

export function useCreateScorecard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateScorecardPayload) => {
      const { data } = await api.post<Scorecard>(
        `/applications/${payload.application_id}/scorecards`,
        payload
      );
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["scorecards", variables.application_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["scorecard-summary", variables.application_id],
      });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
}

export function useUpdateScorecard(applicationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: UpdateScorecardPayload & { id: string }) => {
      const { data } = await api.put<Scorecard>(
        `/applications/${applicationId}/scorecards/${id}`,
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["scorecards", applicationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["scorecard-summary", applicationId],
      });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
}

export function useDeleteScorecard(applicationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (scorecardId: string) => {
      await api.delete(
        `/applications/${applicationId}/scorecards/${scorecardId}`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["scorecards", applicationId],
      });
      queryClient.invalidateQueries({
        queryKey: ["scorecard-summary", applicationId],
      });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
}

export function useScorecardSummary(applicationId: string) {
  return useQuery({
    queryKey: ["scorecard-summary", applicationId],
    queryFn: async () => {
      const { data } = await api.get<ScorecardSummaryData>(
        `/applications/${applicationId}/scorecards/summary`
      );
      return data;
    },
    enabled: !!applicationId,
  });
}

export function useDecisionRecords(applicationId: string) {
  return useQuery({
    queryKey: ["decisions", applicationId],
    queryFn: async () => {
      const { data } = await api.get<DecisionRecord[]>(
        `/applications/${applicationId}/decisions`
      );
      return data;
    },
    enabled: !!applicationId,
  });
}

export function useCreateDecision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateDecisionPayload) => {
      const { data } = await api.post<DecisionRecord>(
        `/applications/${payload.application_id}/decisions`,
        payload
      );
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["decisions", variables.application_id],
      });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
}
