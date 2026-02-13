import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Referral {
  id: string;
  referrer_id: string;
  referrer_name: string;
  referrer_email: string;
  candidate_name: string;
  candidate_email: string;
  job_id: string | null;
  job_title: string | null;
  status: string;
  bonus_amount_cents: number | null;
  bonus_paid_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface CreateReferralPayload {
  candidate_name: string;
  candidate_email: string;
  job_id?: string;
  notes?: string;
}

export function useReferrals(params?: { status?: string }) {
  return useQuery({
    queryKey: ["referrals", params],
    queryFn: async () => {
      const { data } = await api.get<Referral[]>("/referrals", { params });
      return data;
    },
  });
}

export function useCreateReferral() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateReferralPayload) => {
      const { data } = await api.post<Referral>("/referrals", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referrals"] });
    },
  });
}
