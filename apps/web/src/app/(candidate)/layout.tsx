"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/stores/auth-store";
import { api } from "@/lib/api";
import { CandidateSidebar } from "@/components/candidate/sidebar";
import { CandidateHeader } from "@/components/candidate/header";

export default function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, setUser } = useAuthStore();

  useEffect(() => {
    // Cookie-based auth: source of truth is GET /auth/me. See the
    // dashboard layout for the design rationale.
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get("/auth/me");
        if (cancelled) return;
        setUser(data);
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
      <CandidateSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <CandidateHeader />
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
