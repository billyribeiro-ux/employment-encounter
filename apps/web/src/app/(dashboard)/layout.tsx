"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/stores/auth-store";
import { api } from "@/lib/api";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { CommandPalette } from "@/components/command-palette";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, setUser } = useAuthStore();

  useEffect(() => {
    // With HttpOnly cookies the access token is invisible to JS, so we
    // can't pre-check expiry locally. Source of truth is GET /auth/me:
    // the browser auto-attaches the cookie; if the server says 200, the
    // session is valid; if 401, the response interceptor in lib/api.ts
    // tries a silent refresh and either retries or boots us to /login.
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get("/auth/me");
        if (cancelled) return;
        setUser(data);
        if (data.role === "candidate") {
          router.push("/candidate");
        }
      } catch {
        if (!cancelled) router.push("/login");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, setUser]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <CommandPalette />
      <KeyboardShortcuts />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
