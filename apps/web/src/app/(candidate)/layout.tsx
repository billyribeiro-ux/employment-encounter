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
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    // Check token expiry first
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.exp * 1000 < Date.now()) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        router.push("/login");
        return;
      }
    } catch {
      router.push("/login");
      return;
    }

    // Hydrate user from API for complete profile data
    const hydrateUser = async () => {
      try {
        const { data } = await api.get("/auth/me");
        setUser(data);
      } catch {
        // Token might be invalid, redirect to login
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        router.push("/login");
      }
    };

    hydrateUser();
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
