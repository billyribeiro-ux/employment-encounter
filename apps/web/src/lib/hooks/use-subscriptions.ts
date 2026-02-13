import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Subscription {
  id: string;
  tenant_id: string;
  plan_id: string;
  plan_name: string;
  price_cents: number;
  billing_cycle: string;
  status: string;
  seats_used: number;
  seats_limit: number;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface Plan {
  id: string;
  name: string;
  price_cents: number;
  billing_cycle: string;
  features: string[];
  limits: {
    jobs: number;
    users: number;
    candidates: number;
  };
  is_popular: boolean;
}

export interface Usage {
  jobs_used: number;
  jobs_limit: number;
  users_used: number;
  users_limit: number;
  candidates_used: number;
  candidates_limit: number;
}

export function useCurrentSubscription() {
  return useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const { data } = await api.get<Subscription>("/subscription");
      return data;
    },
  });
}

export function usePlans() {
  return useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data } = await api.get<Plan[]>("/plans");
      return data;
    },
  });
}

export function useUsage() {
  return useQuery({
    queryKey: ["usage"],
    queryFn: async () => {
      const { data } = await api.get<Usage>("/subscription/usage");
      return data;
    },
  });
}

export function useChangePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (planId: string) => {
      const { data } = await api.put<Subscription>("/subscription/plan", {
        plan_id: planId,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      queryClient.invalidateQueries({ queryKey: ["usage"] });
    },
  });
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (planId: string) => {
      const { data } = await api.post<Subscription>("/subscription", {
        plan_id: planId,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      queryClient.invalidateQueries({ queryKey: ["usage"] });
      queryClient.invalidateQueries({ queryKey: ["plans"] });
    },
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<Subscription>("/subscription/cancel");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
  });
}
