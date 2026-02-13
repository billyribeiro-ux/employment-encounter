import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface ConsentRecord {
  id: string;
  candidate_email: string;
  consent_type: string;
  granted: boolean;
  ip_address: string | null;
  granted_at: string;
  revoked_at: string | null;
  created_at: string;
}

export interface DeletionRequest {
  id: string;
  candidate_email: string;
  request_type: string;
  status: string;
  reason: string | null;
  processed_at: string | null;
  created_at: string;
}

export interface RetentionPolicy {
  id: string;
  data_type: string;
  retention_days: number;
  auto_delete: boolean;
  description: string | null;
  created_at: string;
}

export function useConsentRecords() {
  return useQuery({
    queryKey: ["consent-records"],
    queryFn: async () => {
      const { data } = await api.get<ConsentRecord[]>("/compliance/consent");
      return data;
    },
  });
}

export function useDeletionRequests() {
  return useQuery({
    queryKey: ["deletion-requests"],
    queryFn: async () => {
      const { data } = await api.get<DeletionRequest[]>(
        "/compliance/deletion-requests"
      );
      return data;
    },
  });
}

export function useCreateDeletionRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      candidate_email: string;
      request_type: string;
      reason?: string;
    }) => {
      const { data } = await api.post<DeletionRequest>(
        "/compliance/deletion-requests",
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deletion-requests"] });
    },
  });
}

export function useRetentionPolicies() {
  return useQuery({
    queryKey: ["retention-policies"],
    queryFn: async () => {
      const { data } = await api.get<RetentionPolicy[]>(
        "/compliance/retention-policies"
      );
      return data;
    },
  });
}
