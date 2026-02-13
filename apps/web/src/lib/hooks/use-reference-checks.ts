import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface ReferenceRequest {
  id: string;
  application_id: string;
  candidate_name: string;
  referee_name: string;
  referee_email: string;
  referee_phone: string | null;
  relationship: string;
  status: string;
  questions: Record<string, unknown>;
  responses: Record<string, unknown> | null;
  overall_rating: number | null;
  completed_at: string | null;
  created_at: string;
}

export interface CreateReferencePayload {
  application_id: string;
  referee_name: string;
  referee_email: string;
  referee_phone?: string;
  relationship: string;
  questions?: Record<string, unknown>;
}

export function useReferenceRequests(applicationId?: string) {
  return useQuery({
    queryKey: ["reference-requests", applicationId],
    queryFn: async () => {
      const params = applicationId ? { application_id: applicationId } : {};
      const { data } = await api.get<ReferenceRequest[]>(
        "/reference-requests",
        { params }
      );
      return data;
    },
  });
}

export function useCreateReferenceRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateReferencePayload) => {
      const { data } = await api.post<ReferenceRequest>(
        "/reference-requests",
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reference-requests"] });
    },
  });
}
