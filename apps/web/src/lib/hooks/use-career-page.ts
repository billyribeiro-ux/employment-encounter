import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface CareerPageConfig {
  id: string;
  tenant_id: string;
  is_published: boolean;
  hero_headline: string;
  hero_subheadline: string;
  hero_bg_color: string;
  about_text: string;
  mission: string;
  values: string[];
  benefits: string[];
  culture_description: string;
  testimonials: { name: string; role: string; quote: string }[];
  primary_color: string;
  accent_color: string;
  logo_url: string | null;
  meta_title: string;
  meta_description: string;
  custom_css: string;
  updated_at: string;
}

export function useCareerPage() {
  return useQuery({
    queryKey: ["career-page"],
    queryFn: async () => {
      const { data } = await api.get<CareerPageConfig>("/career-page");
      return data;
    },
  });
}

export function useUpdateCareerPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (config: Partial<CareerPageConfig>) => {
      const { data } = await api.put<CareerPageConfig>("/career-page", config);
      return data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["career-page"] }),
  });
}

export function usePublishCareerPage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (publish: boolean) => {
      const { data } = await api.post<CareerPageConfig>(
        "/career-page/publish",
        { is_published: publish }
      );
      return data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["career-page"] }),
  });
}
