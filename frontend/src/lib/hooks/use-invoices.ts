import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PaginatedResponse } from "./use-clients";

export interface Invoice {
  id: string;
  tenant_id: string;
  client_id: string;
  invoice_number: string;
  status: string;
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
  amount_paid_cents: number;
  currency: string;
  due_date: string | null;
  issued_date: string | null;
  paid_date: string | null;
  notes: string | null;
  stripe_payment_intent_id: string | null;
  stripe_invoice_id: string | null;
  pdf_s3_key: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateInvoicePayload {
  client_id: string;
  due_date?: string;
  notes?: string;
  line_items: {
    description: string;
    quantity: number;
    unit_price_cents: number;
    time_entry_id?: string;
  }[];
}

export function useInvoices(params?: {
  page?: number;
  per_page?: number;
  status?: string;
  client_id?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ["invoices", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Invoice>>("/invoices", {
        params,
      });
      return data;
    },
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ["invoices", id],
    queryFn: async () => {
      const { data } = await api.get<Invoice>(`/invoices/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateInvoicePayload) => {
      const { data } = await api.post<Invoice>("/invoices", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/invoices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export function useUpdateInvoiceStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: string;
    }) => {
      const { data } = await api.patch<Invoice>(`/invoices/${id}/status`, {
        status,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}
