import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface DashboardStats {
  active_clients: number;
  total_documents: number;
  hours_this_week: number;
  outstanding_invoices: number;
  outstanding_amount_cents: number;
  revenue_mtd_cents: number;
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
