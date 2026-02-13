import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface ProfitLossReport {
  period_start: string;
  period_end: string;
  revenue: { total_cents: number; items: { label: string; amount_cents: number }[] };
  expenses: { total_cents: number; items: { label: string; amount_cents: number }[] };
  net_income_cents: number;
}

export interface CashFlowReport {
  period_start: string;
  period_end: string;
  inflows: { month: string; amount_cents: number }[];
  outflows: { month: string; amount_cents: number }[];
  net_cash_flow_cents: number;
}

export interface TeamUtilization {
  user_id: string;
  name: string;
  total_minutes: number;
  billable_minutes: number;
  utilization_percent: number;
}

export function useProfitLoss(params?: { start_date?: string; end_date?: string }) {
  return useQuery({
    queryKey: ["reports", "pl", params],
    queryFn: async () => {
      const { data } = await api.get<ProfitLossReport>("/reports/pl", { params });
      return data;
    },
  });
}

export function useCashFlow(params?: { start_date?: string; end_date?: string }) {
  return useQuery({
    queryKey: ["reports", "cashflow", params],
    queryFn: async () => {
      const { data } = await api.get<CashFlowReport>("/reports/cashflow", { params });
      return data;
    },
  });
}

export function useTeamUtilization() {
  return useQuery({
    queryKey: ["reports", "utilization"],
    queryFn: async () => {
      const { data } = await api.get<{ data: TeamUtilization[] }>("/team/utilization");
      return data.data;
    },
  });
}
