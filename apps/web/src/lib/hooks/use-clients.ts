import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

/**
 * Shared paginated response type used across all list hooks.
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export interface Client {
  id: string;
  tenant_id: string;
  name: string;
  status: string;
  business_type?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface UseClientsParams {
  page?: number;
  per_page?: number;
  search?: string;
  status?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export function useClients(params: UseClientsParams = {}) {
  return useQuery<PaginatedResponse<Client>>({
    queryKey: ["clients", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.set("page", String(params.page));
      if (params.per_page) searchParams.set("per_page", String(params.per_page));
      if (params.search) searchParams.set("search", params.search);
      if (params.status) searchParams.set("status", params.status);
      if (params.sort_by) searchParams.set("sort_by", params.sort_by);
      if (params.sort_order) searchParams.set("sort_order", params.sort_order);
      const { data } = await api.get(`/clients?${searchParams.toString()}`);
      return data;
    },
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.post("/clients", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}
