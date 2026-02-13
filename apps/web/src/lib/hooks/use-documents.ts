import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PaginatedResponse } from "./use-clients";

export interface Document {
  id: string;
  tenant_id: string;
  client_id: string;
  uploaded_by: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  s3_key: string;
  category: string | null;
  ai_confidence: number | null;
  ai_extracted_data: Record<string, unknown>;
  verification_status: string;
  tax_year: number | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface UploadResponse {
  document: Document;
  upload_url: string;
}

export interface CreateDocumentPayload {
  filename: string;
  mime_type: string;
  size_bytes: number;
  client_id: string;
  category?: string;
  tax_year?: number;
}

export function useDocuments(params?: {
  page?: number;
  per_page?: number;
  client_id?: string;
  category?: string;
  search?: string;
  sort?: string;
  order?: string;
}) {
  return useQuery({
    queryKey: ["documents", params],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Document>>(
        "/documents",
        { params }
      );
      return data;
    },
  });
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: ["documents", id],
    queryFn: async () => {
      const { data } = await api.get<Document>(`/documents/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateDocumentPayload) => {
      const { data } = await api.post<UploadResponse>("/documents", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export interface UpdateDocumentPayload {
  category?: string;
  tax_year?: number;
  verification_status?: string;
}

export function useUpdateDocument(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateDocumentPayload) => {
      const { data } = await api.patch<Document>(`/documents/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}
