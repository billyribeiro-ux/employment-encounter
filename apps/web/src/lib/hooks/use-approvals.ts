import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface ApprovalRequest {
  id: string;
  workflow_id: string | null;
  request_type: string;
  entity_id: string;
  entity_type: string;
  requested_by: string;
  requester_name: string;
  status: string;
  current_step: number;
  metadata: Record<string, unknown>;
  created_at: string;
  resolved_at: string | null;
}

export interface ApprovalDecision {
  id: string;
  request_id: string;
  approver_id: string;
  approver_name: string;
  decision: string;
  comments: string | null;
  step_number: number;
  decided_at: string;
}

export interface CreateApprovalPayload {
  request_type: string;
  entity_id: string;
  entity_type: string;
  workflow_id?: string;
  metadata?: Record<string, unknown>;
}

export interface DecideApprovalPayload {
  decision: string;
  comments?: string;
}

export function useApprovalRequests(params?: {
  status?: string;
  request_type?: string;
}) {
  return useQuery({
    queryKey: ["approvals", params],
    queryFn: async () => {
      const { data } = await api.get<ApprovalRequest[]>("/approvals", {
        params,
      });
      return data;
    },
  });
}

export function useCreateApproval() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateApprovalPayload) => {
      const { data } = await api.post<ApprovalRequest>("/approvals", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
    },
  });
}

export function useDecideApproval(requestId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: DecideApprovalPayload) => {
      const { data } = await api.post<ApprovalRequest>(
        `/approvals/${requestId}/decide`,
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
    },
  });
}
