import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PaginatedResponse } from "./use-clients";

export interface Document {
  id: string;
  tenant_id: string;
  client_id: string | null;
  uploaded_by: string;
  name: string;
  mime_type: string;
  size_bytes: number;
  s3_key: string;
  s3_version_id: string | null;
  category: string | null;
  ai_category: string | null;
  ai_confidence: number | null;
  tax_year: number | null;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface UploadResponse {
  document: Document;
  upload_url: string;
}

export interface CreateDocumentPayload {
  name: string;
  mime_type: string;
  size_bytes: number;
  client_id?: string;
  category?: string;
  tax_year?: number;
}

export function useDocuments(params?: {
  page?: number;
  per_page?: number;
  client_id?: string;
  category?: string;
  search?: string;
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
