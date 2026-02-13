import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PaginatedResponse } from "./use-clients";

export interface CandidateFavorite {
  id: string;
  candidate_id: string;
  user_id: string;
  job_id: string | null;
  tags: string[];
  notes: string | null;
  candidate_name?: string;
  candidate_headline?: string;
  created_at: string;
}

export interface AddFavoritePayload {
  candidate_id: string;
  job_id?: string;
  tags?: string[];
  notes?: string;
}

export function useFavorites(params?: {
  page?: number;
  per_page?: number;
  job_id?: string;
  tag?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ["favorites", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<CandidateFavorite>>(
        "/favorites",
        { params }
      );
      return data;
    },
  });
}

export function useAddFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AddFavoritePayload) => {
      const { data } = await api.post<CandidateFavorite>(
        "/favorites",
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
}

export function useRemoveFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (favoriteId: string) => {
      await api.delete(`/favorites/${favoriteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });
}

export function useIsFavorite(candidateId: string) {
  return useQuery({
    queryKey: ["favorites", "check", candidateId],
    queryFn: async () => {
      const { data } = await api.get<{
        is_favorite: boolean;
        favorite_id: string | null;
      }>(`/favorites/check/${candidateId}`);
      return data;
    },
    enabled: !!candidateId,
  });
}
