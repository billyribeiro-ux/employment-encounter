import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PaginatedResponse } from "./use-clients";

export interface VideoRoom {
  id: string;
  tenant_id: string;
  meeting_id: string | null;
  name: string;
  status: string;
  max_participants: number;
  recording_enabled: boolean;
  recording_s3_key: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface VideoRoomToken {
  token_hash: string;
  room_id: string;
  user_id: string;
  expires_at: string;
}

export interface VideoSession {
  id: string;
  room_id: string;
  user_id: string;
  joined_at: string;
  left_at: string | null;
  duration_seconds: number | null;
  connection_quality: string | null;
  created_at: string;
}

export interface CreateVideoRoomPayload {
  name: string;
  meeting_id?: string;
  max_participants?: number;
  recording_enabled?: boolean;
}

export function useVideoRooms(params?: {
  page?: number;
  per_page?: number;
  status?: string;
  meeting_id?: string;
  search?: string;
  sort?: string;
  order?: string;
}) {
  return useQuery({
    queryKey: ["video-rooms", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<VideoRoom>>(
        "/video-rooms",
        { params }
      );
      return data;
    },
  });
}

export function useVideoRoom(id: string) {
  return useQuery({
    queryKey: ["video-rooms", id],
    queryFn: async () => {
      const { data } = await api.get<VideoRoom>(`/video-rooms/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateVideoRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateVideoRoomPayload) => {
      const { data } = await api.post<VideoRoom>("/video-rooms", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video-rooms"] });
    },
  });
}

export function useJoinVideoRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<VideoRoomToken>(
        `/video-rooms/${id}/join`
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video-rooms"] });
    },
  });
}

export function useEndVideoRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<VideoRoom>(`/video-rooms/${id}/end`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video-rooms"] });
    },
  });
}

export function useVideoSessions(roomId: string) {
  return useQuery({
    queryKey: ["video-rooms", roomId, "sessions"],
    queryFn: async () => {
      const { data } = await api.get<VideoSession[]>(
        `/video-rooms/${roomId}/sessions`
      );
      return data;
    },
    enabled: !!roomId,
  });
}
