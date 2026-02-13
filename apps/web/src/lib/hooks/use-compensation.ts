import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface CompensationBenchmark {
  id: string;
  job_title: string;
  department: string | null;
  location: string | null;
  currency: string;
  base_p25: number;
  base_p50: number;
  base_p75: number;
  base_p90: number;
  total_comp_p50: number | null;
  equity_pct_p50: number | null;
  source: string;
  last_updated: string;
  created_at: string;
}

export function useCompensationBenchmarks(params?: {
  job_title?: string;
  location?: string;
  department?: string;
}) {
  return useQuery({
    queryKey: ["compensation-benchmarks", params],
    queryFn: async () => {
      const { data } = await api.get<CompensationBenchmark[]>(
        "/compensation-benchmarks",
        { params }
      );
      return data;
    },
  });
}
