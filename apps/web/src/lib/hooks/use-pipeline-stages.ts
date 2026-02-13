import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface PipelineTemplate {
  id: string;
  name: string;
  description: string | null;
  stages: Record<string, unknown>;
  is_default: boolean;
  created_at: string;
}

export interface CreatePipelineTemplatePayload {
  name: string;
  description?: string;
  stages: Record<string, unknown>;
  is_default?: boolean;
}

export function usePipelineTemplates() {
  return useQuery({
    queryKey: ["pipeline-templates"],
    queryFn: async () => {
      const { data } = await api.get<PipelineTemplate[]>(
        "/pipeline-templates"
      );
      return data;
    },
  });
}

export function useCreatePipelineTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreatePipelineTemplatePayload) => {
      const { data } = await api.post<PipelineTemplate>(
        "/pipeline-templates",
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline-templates"] });
    },
  });
}
