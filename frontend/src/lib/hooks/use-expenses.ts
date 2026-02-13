import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PaginatedResponse } from "./use-clients";

export interface Expense {
  id: string;
  tenant_id: string;
  client_id: string | null;
  user_id: string;
  category: string;
  description: string | null;
  amount_cents: number;
  date: string;
  receipt_document_id: string | null;
  is_reimbursable: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

export function useExpenses(params?: {
  page?: number;
  per_page?: number;
  client_id?: string;
  category?: string;
  status?: string;
  search?: string;
  sort?: string;
  order?: string;
}) {
  return useQuery({
    queryKey: ["expenses", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Expense>>("/expenses", {
        params,
      });
      return data;
    },
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      category: string;
      description?: string;
      amount_cents: number;
      date: string;
      client_id?: string;
      receipt_document_id?: string;
      is_reimbursable?: boolean;
    }) => {
      const { data } = await api.post<Expense>("/expenses", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: {
      id: string;
      category?: string;
      description?: string;
      amount_cents?: number;
      date?: string;
      is_reimbursable?: boolean;
      status?: string;
    }) => {
      const { data } = await api.put<Expense>(`/expenses/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}
