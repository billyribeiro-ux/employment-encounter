import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type TemplateCategory =
  | "application_received"
  | "interview_invitation"
  | "rejection"
  | "offer"
  | "follow_up"
  | "custom";

export interface EmailTemplate {
  id: string;
  tenant_id: string;
  name: string;
  category: TemplateCategory;
  subject: string;
  body: string;
  is_active: boolean;
  is_default: boolean;
  usage_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEmailTemplatePayload {
  name: string;
  category: TemplateCategory;
  subject: string;
  body: string;
  is_active?: boolean;
}

export interface UpdateEmailTemplatePayload {
  name?: string;
  category?: TemplateCategory;
  subject?: string;
  body?: string;
  is_active?: boolean;
}

export interface BulkSendPayload {
  template_id: string;
  candidate_ids: string[];
  variables?: Record<string, string>;
}

export function useEmailTemplates(params?: {
  category?: TemplateCategory;
  is_active?: boolean;
  search?: string;
}) {
  return useQuery({
    queryKey: ["email-templates", params],
    queryFn: async () => {
      const { data } = await api.get<EmailTemplate[]>("/email-templates", {
        params,
      });
      return data;
    },
  });
}

export function useEmailTemplate(id: string) {
  return useQuery({
    queryKey: ["email-templates", id],
    queryFn: async () => {
      const { data } = await api.get<EmailTemplate>(`/email-templates/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateEmailTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateEmailTemplatePayload) => {
      const { data } = await api.post<EmailTemplate>(
        "/email-templates",
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
    },
  });
}

export function useUpdateEmailTemplate(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateEmailTemplatePayload) => {
      const { data } = await api.put<EmailTemplate>(
        `/email-templates/${id}`,
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
    },
  });
}

export function useDeleteEmailTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/email-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
    },
  });
}

export function useBulkSendTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: BulkSendPayload) => {
      const { data } = await api.post("/email-templates/bulk-send", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
    },
  });
}
