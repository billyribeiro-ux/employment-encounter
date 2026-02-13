import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface TalentPool {
  id: string;
  name: string;
  description: string | null;
  pool_type: string;
  member_count: number;
  created_at: string;
}

export interface PoolMember {
  id: string;
  candidate_name: string;
  candidate_email: string | null;
  source: string | null;
  engagement_score: number;
  last_contacted_at: string | null;
  notes: string | null;
  added_at: string;
}

export interface CreatePoolPayload {
  name: string;
  description?: string;
  pool_type?: string;
}

export interface AddMemberPayload {
  candidate_name: string;
  candidate_email?: string;
  source?: string;
  notes?: string;
}

export function useTalentPools() {
  return useQuery({
    queryKey: ["talent-pools"],
    queryFn: async () => {
      const { data } = await api.get<TalentPool[]>("/talent-pools");
      return data;
    },
  });
}

export function useCreateTalentPool() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreatePoolPayload) => {
      const { data } = await api.post<TalentPool>("/talent-pools", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["talent-pools"] });
    },
  });
}

export function usePoolMembers(poolId: string) {
  return useQuery({
    queryKey: ["talent-pools", poolId, "members"],
    queryFn: async () => {
      const { data } = await api.get<PoolMember[]>(
        `/talent-pools/${poolId}/members`
      );
      return data;
    },
    enabled: !!poolId,
  });
}

export function useAddPoolMember(poolId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AddMemberPayload) => {
      const { data } = await api.post<PoolMember>(
        `/talent-pools/${poolId}/members`,
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["talent-pools", poolId, "members"],
      });
      queryClient.invalidateQueries({ queryKey: ["talent-pools"] });
    },
  });
}
