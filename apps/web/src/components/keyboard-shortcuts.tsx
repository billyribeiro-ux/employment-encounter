"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const SHORTCUTS: Record<string, string> = {
  "g+d": "/dashboard",
  "g+t": "/talent",
  "g+j": "/hiring",
  "g+c": "/conversations",
  "g+s": "/scheduling",
  "g+v": "/conference",
  "g+b": "/billing",
  "g+a": "/analytics",
};

export function KeyboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    let lastKey = "";
    let lastKeyTime = 0;

    function handleKeyDown(e: KeyboardEvent) {
      // Skip if user is typing in an input
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      // Check for reduced motion preference
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const now = Date.now();
      const key = e.key.toLowerCase();

      // Two-key sequence (e.g., g then d)
      if (now - lastKeyTime < 500) {
        const combo = `${lastKey}+${key}`;
        const path = SHORTCUTS[combo];
        if (path) {
          e.preventDefault();
          router.push(path);
          lastKey = "";
          lastKeyTime = 0;
          return;
        }
      }

      // Cmd/Ctrl shortcuts
      if (e.metaKey || e.ctrlKey) {
        // Cmd+K is handled by CommandPalette
        return;
      }

      // ? to show help
      if (key === "?" && !e.shiftKey) {
        // Could open shortcut reference panel
      }

      lastKey = key;
      lastKeyTime = now;
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return null;
}
