import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface ActivityItem {
  id: string;
  actor_id: string;
  actor_name: string;
  actor_avatar_url: string | null;
  action: string;
  action_type: string;
  resource_type: string;
  resource_id: string;
  resource_name: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ActivityLogResponse {
  data: ActivityItem[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
  stats: {
    today: number;
    this_week: number;
    avg_per_day: number;
  };
}

export function useActivityLog(params?: {
  page?: number;
  per_page?: number;
  action_type?: string;
  actor_id?: string;
  job_id?: string;
  date_from?: string;
  date_to?: string;
}) {
  return useQuery({
    queryKey: ["activity-log", params],
    queryFn: async () => {
      const { data } = await api.get<ActivityLogResponse>("/activity-log", {
        params,
      });
      return data;
    },
  });
}

export function useActivityStats() {
  return useQuery({
    queryKey: ["activity-log", "stats"],
    queryFn: async () => {
      const { data } = await api.get<{
        today: number;
        this_week: number;
        avg_per_day: number;
      }>("/activity-log/stats");
      return data;
    },
  });
}
