"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface ShortcutAction {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  description: string;
  action: () => void;
}

/** Global keyboard shortcuts for the dashboard */
export function useKeyboardShortcuts(options?: {
  onOpenCommandPalette?: () => void;
  onToggleSidebar?: () => void;
  onShowHelp?: () => void;
}) {
  const router = useRouter();
  const pendingGoRef = useRef<string | null>(null);
  const goTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;

      // ⌘K / Ctrl+K — Command palette (works even in input)
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        options?.onOpenCommandPalette?.();
        return;
      }

      // Don't handle shortcuts when typing in inputs
      if (isInput) return;

      // ⌘B / Ctrl+B — Toggle sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        options?.onToggleSidebar?.();
        return;
      }

      // ⌘/ / Ctrl+/ — Show shortcuts help
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        options?.onShowHelp?.();
        return;
      }

      // G-key sequences: press G then another key
      if (e.key === "g" && !e.metaKey && !e.ctrlKey) {
        pendingGoRef.current = "g";
        if (goTimeoutRef.current) clearTimeout(goTimeoutRef.current);
        goTimeoutRef.current = setTimeout(() => {
          pendingGoRef.current = null;
        }, 500);
        return;
      }

      if (pendingGoRef.current === "g") {
        pendingGoRef.current = null;
        if (goTimeoutRef.current) clearTimeout(goTimeoutRef.current);

        const goRoutes: Record<string, string> = {
          d: "/dashboard",
          c: "/clients",
          i: "/invoices",
          t: "/tasks",
          w: "/workflows",
          m: "/messages",
          e: "/expenses",
          a: "/analytics",
          s: "/settings",
          h: "/time",
          r: "/reports",
          l: "/calendar",
          o: "/documents",
        };

        const route = goRoutes[e.key];
        if (route) {
          e.preventDefault();
          router.push(route);
          return;
        }
      }

      // N — New (create) shortcut
      if (e.key === "n" && !e.metaKey && !e.ctrlKey) {
        // Could open a "new" dialog — left for UI integration
      }

      // ? — Show keyboard shortcuts help
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        options?.onShowHelp?.();
      }
    },
    [router, options]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (goTimeoutRef.current) clearTimeout(goTimeoutRef.current);
    };
  }, [handleKeyDown]);
}

/** All available shortcuts for the help modal */
export const KEYBOARD_SHORTCUTS = [
  { keys: ["⌘", "K"], description: "Open command palette" },
  { keys: ["⌘", "B"], description: "Toggle sidebar" },
  { keys: ["⌘", "/"], description: "Show keyboard shortcuts" },
  { keys: ["?"], description: "Show keyboard shortcuts" },
  { keys: ["G", "D"], description: "Go to Dashboard" },
  { keys: ["G", "C"], description: "Go to Clients" },
  { keys: ["G", "I"], description: "Go to Invoices" },
  { keys: ["G", "T"], description: "Go to Tasks" },
  { keys: ["G", "W"], description: "Go to Workflows" },
  { keys: ["G", "M"], description: "Go to Messages" },
  { keys: ["G", "E"], description: "Go to Expenses" },
  { keys: ["G", "A"], description: "Go to Analytics" },
  { keys: ["G", "S"], description: "Go to Settings" },
  { keys: ["G", "H"], description: "Go to Time Tracking" },
  { keys: ["G", "R"], description: "Go to Reports" },
  { keys: ["G", "L"], description: "Go to Calendar" },
  { keys: ["G", "O"], description: "Go to Documents" },
] as const;
