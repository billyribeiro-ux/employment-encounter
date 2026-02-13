"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useDebounce } from "./use-debounce";

export interface SearchResult {
  type: "client" | "document" | "invoice" | "task" | "workflow";
  id: string;
  title: string;
  subtitle: string;
  url: string;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
}

export function useGlobalSearch(query: string, type: string = "all") {
  const debouncedQuery = useDebounce(query, 300);

  return useQuery({
    queryKey: ["search", debouncedQuery, type],
    queryFn: async () => {
      const { data } = await api.get<SearchResponse>("/search", {
        params: { q: debouncedQuery, type },
      });
      return data;
    },
    enabled: debouncedQuery.length >= 2,
    staleTime: 10000,
  });
}
