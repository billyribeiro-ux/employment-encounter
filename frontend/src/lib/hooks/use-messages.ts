import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Message {
  id: string;
  tenant_id: string;
  client_id: string;
  sender_id: string;
  parent_id: string | null;
  content: string;
  is_internal: boolean;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateMessagePayload {
  client_id: string;
  content: string;
  parent_id?: string;
  is_internal?: boolean;
  attachment_ids?: string[];
}

export function useMessages(clientId: string, params?: {
  page?: number;
  per_page?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: ["messages", clientId, params],
    queryFn: async () => {
      const { data } = await api.get<{
        data: Message[];
        meta: { page: number; per_page: number; total: number; total_pages: number };
      }>(`/messages/client/${clientId}`, { params });
      return data;
    },
    enabled: !!clientId,
  });
}

export function useCreateMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateMessagePayload) => {
      const { data } = await api.post<Message>("/messages", payload);
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["messages", variables.client_id] });
    },
  });
}

export function useMarkMessageRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.put<Message>(`/messages/${id}/read`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/messages/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });
}
