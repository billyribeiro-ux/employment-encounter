"use client";

import { QueryClient, QueryClientProvider, MutationCache } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { getApiError } from "@/lib/api";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
        mutationCache: new MutationCache({
          onError: (error) => {
            const apiError = getApiError(error);
            // Don't toast on 401 — handled by interceptor
            if (apiError.status !== 401) {
              toast.error(apiError.message || "Something went wrong");
            }
          },
        }),
      })
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            duration: 4000,
            classNames: {
              toast: "backdrop-blur-sm",
            },
          }}
        />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
