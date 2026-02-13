import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PaginatedResponse } from "./use-clients";

export interface Offer {
  id: string;
  application_id: string;
  job_id: string;
  candidate_id: string;
  status: string;
  title: string;
  base_salary_cents: number | null;
  salary_currency: string;
  equity_pct: number | null;
  signing_bonus_cents: number | null;
  start_date: string | null;
  expiry_date: string | null;
  benefits_summary: string | null;
  custom_terms: string | null;
  sent_at: string | null;
  accepted_at: string | null;
  declined_at: string | null;
  decline_reason: string | null;
  created_at: string;
}

export interface CreateOfferPayload {
  application_id: string;
  job_id: string;
  candidate_id: string;
  title: string;
  base_salary_cents?: number;
  salary_currency?: string;
  equity_pct?: number;
  signing_bonus_cents?: number;
  start_date?: string;
  expiry_date?: string;
  benefits_summary?: string;
  custom_terms?: string;
}

export interface UpdateOfferPayload {
  title?: string;
  base_salary_cents?: number;
  salary_currency?: string;
  equity_pct?: number;
  signing_bonus_cents?: number;
  start_date?: string;
  expiry_date?: string;
  benefits_summary?: string;
  custom_terms?: string;
}

export function useOffers(params?: {
  page?: number;
  per_page?: number;
  status?: string;
  job_id?: string;
  candidate_id?: string;
}) {
  return useQuery({
    queryKey: ["offers", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Offer>>("/offers", {
        params,
      });
      return data;
    },
  });
}

export function useOffer(id: string) {
  return useQuery({
    queryKey: ["offers", id],
    queryFn: async () => {
      const { data } = await api.get<Offer>(`/offers/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateOfferPayload) => {
      const { data } = await api.post<Offer>("/offers", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers"] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
}

export function useUpdateOffer(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateOfferPayload) => {
      const { data } = await api.put<Offer>(`/offers/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers"] });
    },
  });
}

export function useSendOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<Offer>(`/offers/${id}/send`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers"] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
}

export function useAcceptOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<Offer>(`/offers/${id}/accept`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers"] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });
}
