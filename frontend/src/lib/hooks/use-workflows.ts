import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PaginatedResponse } from "./use-clients";

export interface WorkflowTemplate {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  category: string | null;
  steps: { name: string; description?: string; assignee_role?: string }[];
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowInstance {
  id: string;
  tenant_id: string;
  template_id: string;
  client_id: string;
  name: string;
  status: string;
  current_step_index: number;
  started_at: string;
  completed_at: string | null;
  due_date: string | null;
  assigned_to: string | null;
  metadata: Record<string, unknown>;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowStepLog {
  id: string;
  instance_id: string;
  step_index: number;
  step_name: string;
  action: string;
  performed_by: string;
  notes: string | null;
  created_at: string;
}

export function useWorkflowTemplates() {
  return useQuery({
    queryKey: ["workflow-templates"],
    queryFn: async () => {
      const { data } = await api.get<WorkflowTemplate[]>("/workflow-templates");
      return data;
    },
  });
}

export function useCreateWorkflowTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      description?: string;
      category?: string;
      steps: { name: string; description?: string; assignee_role?: string }[];
    }) => {
      const { data } = await api.post<WorkflowTemplate>(
        "/workflow-templates",
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow-templates"] });
    },
  });
}

export function useWorkflowInstances(params?: {
  page?: number;
  per_page?: number;
  status?: string;
  client_id?: string;
}) {
  return useQuery({
    queryKey: ["workflows", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<WorkflowInstance>>(
        "/workflows",
        { params }
      );
      return data;
    },
  });
}

export function useWorkflowInstance(id: string) {
  return useQuery({
    queryKey: ["workflows", id],
    queryFn: async () => {
      const { data } = await api.get<WorkflowInstance>(`/workflows/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateWorkflowInstance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      template_id: string;
      client_id?: string;
      name: string;
      due_date?: string;
      assigned_to?: string;
    }) => {
      const { data } = await api.post<WorkflowInstance>("/workflows", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
    },
  });
}

export function useAdvanceWorkflowStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      action,
      notes,
    }: {
      id: string;
      action: string;
      notes?: string;
    }) => {
      const { data } = await api.post<WorkflowInstance>(
        `/workflows/${id}/advance`,
        { action, notes }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
    },
  });
}

export function useDeleteWorkflowInstance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/workflows/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
    },
  });
}

export function useDeleteWorkflowTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/workflow-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow-templates"] });
    },
  });
}

export function useWorkflowStepLogs(instanceId: string) {
  return useQuery({
    queryKey: ["workflows", instanceId, "logs"],
    queryFn: async () => {
      const { data } = await api.get<WorkflowStepLog[]>(
        `/workflows/${instanceId}/logs`
      );
      return data;
    },
    enabled: !!instanceId,
  });
}
