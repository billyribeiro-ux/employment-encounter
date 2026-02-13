import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface DashboardStats {
  active_clients: number;
  total_documents: number;
  hours_this_week: number;
  outstanding_invoices: number;
  outstanding_amount_cents: number;
  revenue_mtd_cents: number;
  active_jobs: number;
  total_candidates: number;
  pending_reviews: number;
  interviews_this_week: number;
  active_jobs_trend: number;
  total_candidates_trend: number;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      const { data } = await api.get<DashboardStats>("/dashboard/stats");
      return data;
    },
  });
}

export interface HiringDashboardStats {
  active_jobs: number;
  active_jobs_trend: number;
  total_candidates: number;
  total_candidates_trend: number;
  pending_reviews: number;
  interviews_this_week: number;
}

export function useHiringDashboardStats() {
  return useQuery({
    queryKey: ["dashboard", "hiring-stats"],
    queryFn: async () => {
      const { data } = await api.get<HiringDashboardStats>(
        "/dashboard/hiring-stats"
      );
      return data;
    },
  });
}
