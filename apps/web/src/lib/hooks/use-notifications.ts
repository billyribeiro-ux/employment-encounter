import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Notification {
  id: string;
  tenant_id: string;
  user_id: string;
  type: string;
  notification_type: string;
  title: string;
  body: string | null;
  resource_type: string | null;
  resource_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

interface NotificationListResponse {
  data: Notification[];
  meta: { page: number; per_page: number; total: number; total_pages: number };
}

export function useNotifications(params?: {
  page?: number;
  per_page?: number;
  unread_only?: boolean;
}) {
  return useQuery({
    queryKey: ["notifications", params],
    queryFn: async () => {
      const { data } = await api.get<NotificationListResponse>("/notifications", { params });
      return data;
    },
    refetchInterval: 30000,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const { data } = await api.get<{ unread_count: number }>("/notifications/unread-count");
      return data.unread_count;
    },
    refetchInterval: 15000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.put<Notification>(`/notifications/${id}/read`);
      return data;
    },
    // Optimistic update
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });

      const previousNotifications = queryClient.getQueriesData<NotificationListResponse>({
        queryKey: ["notifications"],
      });

      // Optimistically mark as read in all cached lists
      queryClient.setQueriesData<NotificationListResponse>(
        { queryKey: ["notifications"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((n) =>
              n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
            ),
          };
        }
      );

      // Optimistically decrement unread count
      const previousCount = queryClient.getQueryData<number>(["notifications", "unread-count"]);
      queryClient.setQueryData<number>(["notifications", "unread-count"], (old) =>
        old !== undefined ? Math.max(0, old - 1) : old
      );

      return { previousNotifications, previousCount };
    },
    onError: (_err, _id, context) => {
      // Roll back on error
      if (context?.previousNotifications) {
        for (const [key, data] of context.previousNotifications) {
          queryClient.setQueryData(key, data);
        }
      }
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData(["notifications", "unread-count"], context.previousCount);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.put<{ updated: number }>("/notifications/read-all");
      return data;
    },
    // Optimistic update: mark all as read
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });

      const previousNotifications = queryClient.getQueriesData<NotificationListResponse>({
        queryKey: ["notifications"],
      });

      queryClient.setQueriesData<NotificationListResponse>(
        { queryKey: ["notifications"] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.map((n) => ({
              ...n,
              is_read: true,
              read_at: n.read_at || new Date().toISOString(),
            })),
          };
        }
      );

      const previousCount = queryClient.getQueryData<number>(["notifications", "unread-count"]);
      queryClient.setQueryData(["notifications", "unread-count"], 0);

      return { previousNotifications, previousCount };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousNotifications) {
        for (const [key, data] of context.previousNotifications) {
          queryClient.setQueryData(key, data);
        }
      }
      if (context?.previousCount !== undefined) {
        queryClient.setQueryData(["notifications", "unread-count"], context.previousCount);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/notifications/${id}`);
    },
    // Optimistic delete
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] });

      const previousNotifications = queryClient.getQueriesData<NotificationListResponse>({
        queryKey: ["notifications"],
      });

      queryClient.setQueriesData<NotificationListResponse>(
        { queryKey: ["notifications"] },
        (old) => {
          if (!old) return old;
          const removed = old.data.find((n) => n.id === id);
          return {
            ...old,
            data: old.data.filter((n) => n.id !== id),
            meta: { ...old.meta, total: Math.max(0, old.meta.total - 1) },
          };
        }
      );

      return { previousNotifications };
    },
    onError: (_err, _id, context) => {
      if (context?.previousNotifications) {
        for (const [key, data] of context.previousNotifications) {
          queryClient.setQueryData(key, data);
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
