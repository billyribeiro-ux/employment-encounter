"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/stores/auth-store";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { ErrorBoundary } from "@/components/error-boundary";
import { CommandPalette } from "@/components/command-palette";
import { KeyboardShortcutsModal } from "@/components/keyboard-shortcuts-modal";
import { useKeyboardShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";

const pageVariants = {
  initial: {
    opacity: 0,
    y: 12,
    scale: 0.99,
    filter: "blur(4px)",
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.35,
      ease: [0.16, 1, 0.3, 1] as const,
      staggerChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.995,
    filter: "blur(2px)",
    transition: {
      duration: 0.2,
      ease: [0.4, 0, 1, 1],
    },
  },
};

function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const handleOpenCommandPalette = useCallback(() => setCommandPaletteOpen(true), []);
  const handleToggleShortcuts = useCallback(() => setShortcutsOpen((v) => !v), []);

  useKeyboardShortcuts({
    onOpenCommandPalette: handleOpenCommandPalette,
    onShowHelp: handleToggleShortcuts,
  });

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main id="main-content" className="flex-1 overflow-y-auto">
          <div className="p-6">
            <ErrorBoundary>
              <AnimatePresence mode="wait">
                <motion.div
                  key={pathname}
                  variants={pageVariants as never}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </ErrorBoundary>
          </div>
        </main>
      </div>

      {/* Global overlays */}
      <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
      <KeyboardShortcutsModal open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading, setUser } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.exp * 1000 < Date.now()) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        router.push("/login");
        return;
      }
      setUser({
        id: payload.sub,
        tenant_id: payload.tid,
        role: payload.role,
        email: "",
        first_name: "",
        last_name: "",
      });
    } catch {
      router.push("/login");
    }

    setMounted(true);
  }, [router, setUser]);

  if (isLoading || !mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="h-10 w-10 rounded-xl bg-primary animate-glow" />
            <motion.div
              className="absolute inset-0 rounded-xl border-2 border-primary/30"
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-sm text-muted-foreground"
          >
            Loading your workspace...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <DashboardShell>{children}</DashboardShell>;
}
