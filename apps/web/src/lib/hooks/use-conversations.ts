import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PaginatedResponse } from "./use-clients";

export interface Conversation {
  id: string;
  tenant_id: string;
  title: string | null;
  type: string;
  application_id: string | null;
  job_id: string | null;
  created_by: string;
  is_archived: boolean;
  last_message_at: string | null;
  last_message_preview: string | null;
  participant_count: number;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string | null;
  content: string;
  message_type: string;
  is_edited: boolean;
  edited_at: string | null;
  parent_id: string | null;
  attachment_urls: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface CreateConversationPayload {
  title?: string;
  type?: string;
  application_id?: string;
  job_id?: string;
  participant_ids: string[];
  initial_message?: string;
}

export interface SendChatMessagePayload {
  content: string;
  message_type?: string;
  parent_id?: string;
  attachment_urls?: string[];
}

export function useConversations(params?: {
  page?: number;
  per_page?: number;
  type?: string;
  is_archived?: boolean;
  search?: string;
  sort?: string;
  order?: string;
}) {
  return useQuery({
    queryKey: ["conversations", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Conversation>>(
        "/conversations",
        { params }
      );
      return data;
    },
  });
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: ["conversations", id],
    queryFn: async () => {
      const { data } = await api.get<Conversation>(`/conversations/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateConversationPayload) => {
      const { data } = await api.post<Conversation>(
        "/conversations",
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useConversationMessages(
  id: string,
  params?: {
    page?: number;
    per_page?: number;
  }
) {
  return useQuery({
    queryKey: ["conversations", id, "messages", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<ChatMessage>>(
        `/conversations/${id}/messages`,
        { params }
      );
      return data;
    },
    enabled: !!id,
    refetchInterval: 10000,
  });
}

export function useSendChatMessage(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SendChatMessagePayload) => {
      const { data } = await api.post<ChatMessage>(
        `/conversations/${conversationId}/messages`,
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["conversations", conversationId, "messages"],
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useMarkConversationRead(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.put(`/conversations/${conversationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["conversations", conversationId],
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
