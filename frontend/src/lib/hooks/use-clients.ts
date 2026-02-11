import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Client {
  id: string;
  tenant_id: string;
  name: string;
  business_type: string;
  fiscal_year_end: string;
  tax_id_last4: string | null;
  status: string;
  assigned_cpa_id: string | null;
  risk_score: number | null;
  engagement_score: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export interface CreateClientPayload {
  name: string;
  business_type: string;
  fiscal_year_end?: string;
  assigned_cpa_id?: string;
  contacts?: {
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    is_primary?: boolean;
  }[];
}

export interface UpdateClientPayload {
  name?: string;
  business_type?: string;
  fiscal_year_end?: string;
  status?: string;
  assigned_cpa_id?: string;
}

export function useClients(params?: {
  page?: number;
  per_page?: number;
  status?: string;
  search?: string;
  sort?: string;
  order?: string;
}) {
  return useQuery({
    queryKey: ["clients", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Client>>("/clients", {
        params,
      });
      return data;
    },
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: ["clients", id],
    queryFn: async () => {
      const { data } = await api.get<Client>(`/clients/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateClientPayload) => {
      const { data } = await api.post<Client>("/clients", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

export function useUpdateClient(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateClientPayload) => {
      const { data } = await api.put<Client>(`/clients/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}

// ── Client Sub-Resource Hooks ──────────────────────────────────────

export function useClientDocuments(clientId: string, params?: { page?: number; per_page?: number }) {
  return useQuery({
    queryKey: ["clients", clientId, "documents", params],
    queryFn: async () => {
      const { data } = await api.get(`/clients/${clientId}/documents`, { params });
      return data;
    },
    enabled: !!clientId,
  });
}

export function useClientTimeEntries(clientId: string, params?: { page?: number; per_page?: number }) {
  return useQuery({
    queryKey: ["clients", clientId, "time-entries", params],
    queryFn: async () => {
      const { data } = await api.get(`/clients/${clientId}/time-entries`, { params });
      return data;
    },
    enabled: !!clientId,
  });
}

export function useClientInvoices(clientId: string, params?: { page?: number; per_page?: number }) {
  return useQuery({
    queryKey: ["clients", clientId, "invoices", params],
    queryFn: async () => {
      const { data } = await api.get(`/clients/${clientId}/invoices`, { params });
      return data;
    },
    enabled: !!clientId,
  });
}

export function useClientMessages(clientId: string, params?: { page?: number; per_page?: number }) {
  return useQuery({
    queryKey: ["clients", clientId, "messages", params],
    queryFn: async () => {
      const { data } = await api.get(`/clients/${clientId}/messages`, { params });
      return data;
    },
    enabled: !!clientId,
  });
}

export function useClientDeadlines(clientId: string) {
  return useQuery({
    queryKey: ["clients", clientId, "deadlines"],
    queryFn: async () => {
      const { data } = await api.get(`/clients/${clientId}/deadlines`);
      return data;
    },
    enabled: !!clientId,
  });
}

export function useClientTimeline(clientId: string, params?: { per_page?: number }) {
  return useQuery({
    queryKey: ["clients", clientId, "timeline", params],
    queryFn: async () => {
      const { data } = await api.get(`/clients/${clientId}/timeline`, { params });
      return data;
    },
    enabled: !!clientId,
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/clients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}
