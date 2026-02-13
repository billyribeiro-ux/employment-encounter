import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface HiringFunnelStage {
  stage: string;
  count: number;
  percentage: number;
}

export interface TimeToHireMetric {
  stage: string;
  avg_days: number;
  median_days: number;
}

export interface SourceEffectiveness {
  source: string;
  applications: number;
  hires: number;
  conversion_rate: number;
}

export interface WeeklyTrend {
  week: string;
  applications: number;
  hires: number;
}

export interface TopJob {
  id: string;
  title: string;
  applications: number;
  conversion_rate: number;
}

export interface TeamMember {
  name: string;
  reviews: number;
  avg_score: number;
}

export interface HiringStats {
  funnel: HiringFunnelStage[];
  time_to_hire: TimeToHireMetric[];
  overall_avg_days: number;
  source_effectiveness: SourceEffectiveness[];
  offer_acceptance_rate: number;
  offers_sent: number;
  offers_accepted: number;
  offers_declined: number;
  active_positions: number;
  closed_positions: number;
  total_applications: number;
  total_hires: number;
  weekly_trends: WeeklyTrend[];
  top_jobs: TopJob[];
  team_activity: TeamMember[];
}

export function useHiringStats(period?: string) {
  return useQuery({
    queryKey: ["hiring-stats", period],
    queryFn: async () => {
      const { data } = await api.get<HiringStats>("/dashboard/hiring-stats", {
        params: period ? { period } : undefined,
      });
      return data;
    },
  });
}
