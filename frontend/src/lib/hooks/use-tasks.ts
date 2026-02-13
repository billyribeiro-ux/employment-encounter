import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PaginatedResponse } from "./use-clients";

export interface Task {
  id: string;
  tenant_id: string;
  client_id: string | null;
  workflow_instance_id: string | null;
  workflow_step_index: number | null;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigned_to: string | null;
  created_by: string;
  due_date: string | null;
  completed_at: string | null;
  is_recurring: boolean;
  recurrence_rule: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  client_id?: string;
  assigned_to?: string;
  due_date?: string;
  priority?: string;
  workflow_instance_id?: string;
  workflow_step_index?: number;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  assigned_to?: string;
  due_date?: string;
  sort_order?: number;
}

export function useTasks(params?: {
  page?: number;
  per_page?: number;
  status?: string;
  priority?: string;
  assigned_to?: string;
  client_id?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ["tasks", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Task>>("/tasks", {
        params,
      });
      return data;
    },
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: ["tasks", id],
    queryFn: async () => {
      const { data } = await api.get<Task>(`/tasks/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateTaskPayload) => {
      const { data } = await api.post<Task>("/tasks", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: UpdateTaskPayload & { id: string }) => {
      const { data } = await api.put<Task>(`/tasks/${id}`, payload);
      return data;
    },
    // Optimistic update: immediately apply changes in the cache
    onMutate: async ({ id, ...payload }) => {
      // Cancel outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["tasks"] });

      // Snapshot all current task list caches for rollback
      const previousTaskLists = queryClient.getQueriesData<PaginatedResponse<Task>>({
        queryKey: ["tasks"],
      });

      // Snapshot the individual task cache
      const previousTask = queryClient.getQueryData<Task>(["tasks", id]);

      // Optimistically update all paginated task lists
      queryClient.setQueriesData<PaginatedResponse<Task>>(
        { queryKey: ["tasks"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((task) =>
              task.id === id
                ? { ...task, ...payload, updated_at: new Date().toISOString() }
                : task
            ),
          };
        }
      );

      // Optimistically update the individual task cache
      if (previousTask) {
        queryClient.setQueryData<Task>(["tasks", id], {
          ...previousTask,
          ...payload,
          updated_at: new Date().toISOString(),
        });
      }

      return { previousTaskLists, previousTask };
    },
    onError: (_err, { id }, context) => {
      // Roll back all list caches
      if (context?.previousTaskLists) {
        for (const [key, data] of context.previousTaskLists) {
          queryClient.setQueryData(key, data);
        }
      }
      // Roll back individual task cache
      if (context?.previousTask) {
        queryClient.setQueryData(["tasks", id], context.previousTask);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/tasks/${id}`);
    },
    // Optimistic delete: immediately remove from cache
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });

      // Snapshot all current task list caches for rollback
      const previousTaskLists = queryClient.getQueriesData<PaginatedResponse<Task>>({
        queryKey: ["tasks"],
      });

      // Optimistically remove the task from all paginated lists
      queryClient.setQueriesData<PaginatedResponse<Task>>(
        { queryKey: ["tasks"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.filter((task) => task.id !== id),
            meta: { ...old.meta, total: Math.max(0, old.meta.total - 1) },
          };
        }
      );

      // Remove the individual task cache entry
      queryClient.removeQueries({ queryKey: ["tasks", id] });

      return { previousTaskLists };
    },
    onError: (_err, _id, context) => {
      // Roll back all list caches
      if (context?.previousTaskLists) {
        for (const [key, data] of context.previousTaskLists) {
          queryClient.setQueryData(key, data);
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

// ── Bulk Operations ──────────────────────────────────────────────────

export function useBulkUpdateTasks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      ids: string[];
      status?: string;
      assigned_to?: string;
      priority?: string;
    }) => {
      const { data } = await api.post<{ updated: number }>("/tasks/bulk-update", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useBulkDeleteTasks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { data } = await api.post<{ deleted: number }>("/tasks/bulk-delete", { ids });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
