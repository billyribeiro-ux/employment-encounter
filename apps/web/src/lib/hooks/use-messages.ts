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
  sender_name?: string;
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
    refetchInterval: 15000,
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
      queryClient.invalidateQueries({ queryKey: ["unread-counts"] });
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
      queryClient.invalidateQueries({ queryKey: ["unread-counts"] });
    },
  });
}

export function useMarkConversationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (clientId: string) => {
      await api.put(`/messages/client/${clientId}/read-all`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["unread-counts"] });
    },
  });
}

export function useUnreadCounts() {
  return useQuery({
    queryKey: ["unread-counts"],
    queryFn: async () => {
      const { data } = await api.get<Record<string, number>>("/messages/unread-counts");
      return data;
    },
    refetchInterval: 30000,
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
