import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const publicApi = axios.create({ baseURL: `${API_URL}/api/v1/public` });

export interface PublicJob {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  requirements: string | null;
  responsibilities: string | null;
  benefits: string | null;
  department: string | null;
  employment_type: string;
  experience_level: string | null;
  location_city: string | null;
  location_state: string | null;
  location_country: string | null;
  remote_policy: string;
  salary_min_cents: number | null;
  salary_max_cents: number | null;
  salary_currency: string;
  show_salary: boolean;
  company_name: string | null;
  published_at: string | null;
  closes_at: string | null;
  application_count: number;
  view_count: number;
  created_at: string;
}

export interface PublicJobsResponse {
  data: PublicJob[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export function usePublicJobs(params?: {
  search?: string;
  work_mode?: string;
  employment_type?: string;
  experience_level?: string;
  location?: string;
  page?: number;
  per_page?: number;
}) {
  return useQuery({
    queryKey: ["public-jobs", params],
    queryFn: async () => {
      const { data } = await publicApi.get<PublicJobsResponse>("/jobs", {
        params,
      });
      return data;
    },
  });
}

export function usePublicJob(id: string) {
  return useQuery({
    queryKey: ["public-jobs", id],
    queryFn: async () => {
      const { data } = await publicApi.get<PublicJob>(`/jobs/${id}`);
      return data;
    },
    enabled: !!id,
  });
}
