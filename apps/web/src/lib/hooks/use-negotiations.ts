import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface OfferNegotiation {
  id: string;
  offer_id: string;
  candidate_name: string;
  job_title: string;
  round_number: number;
  initiated_by: string;
  proposed_base_salary_cents: number | null;
  proposed_equity_pct: number | null;
  proposed_bonus_cents: number | null;
  proposed_benefits: string | null;
  candidate_response: string | null;
  employer_response: string | null;
  status: string;
  resolved_at: string | null;
  created_at: string;
}

export interface CreateNegotiationPayload {
  offer_id: string;
  proposed_base_salary_cents?: number;
  proposed_equity_pct?: number;
  proposed_bonus_cents?: number;
  proposed_benefits?: string;
}

export function useNegotiations(params?: { status?: string }) {
  return useQuery({
    queryKey: ["negotiations", params],
    queryFn: async () => {
      const { data } = await api.get<OfferNegotiation[]>(
        "/offer-negotiations",
        { params }
      );
      return data;
    },
  });
}

export function useCreateNegotiation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateNegotiationPayload) => {
      const { data } = await api.post<OfferNegotiation>(
        "/offer-negotiations",
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["negotiations"] });
      queryClient.invalidateQueries({ queryKey: ["offers"] });
    },
  });
}
