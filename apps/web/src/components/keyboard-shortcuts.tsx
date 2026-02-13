"use client";

import { useState, useEffect } from "react";
import { Keyboard, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Shortcut {
  keys: string[];
  description: string;
}

interface ShortcutGroup {
  title: string;
  shortcuts: Shortcut[];
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: "Navigation",
    shortcuts: [
      { keys: ["⌘", "K"], description: "Open command palette" },
      { keys: ["G", "D"], description: "Go to Dashboard" },
      { keys: ["G", "J"], description: "Go to Jobs & Pipeline" },
      { keys: ["G", "P"], description: "Go to Pipeline Board" },
      { keys: ["G", "E"], description: "Go to Evaluation Center" },
      { keys: ["G", "T"], description: "Go to Talent Discovery" },
      { keys: ["G", "O"], description: "Go to Offers" },
      { keys: ["G", "C"], description: "Go to Conversations" },
      { keys: ["G", "S"], description: "Go to Scheduling" },
      { keys: ["G", "V"], description: "Go to Conference" },
      { keys: ["G", "N"], description: "Go to Notifications" },
      { keys: ["G", "B"], description: "Go to Billing" },
    ],
  },
  {
    title: "Actions",
    shortcuts: [
      { keys: ["N"], description: "Create new job" },
      { keys: ["Esc"], description: "Close dialog/overlay" },
      { keys: ["?"], description: "Show keyboard shortcuts" },
    ],
  },
  {
    title: "Table Navigation",
    shortcuts: [
      { keys: ["↑", "↓"], description: "Navigate rows" },
      { keys: ["Enter"], description: "Open selected item" },
      { keys: ["Space"], description: "Toggle selection" },
      { keys: ["/"], description: "Focus search" },
    ],
  },
];

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground shadow-sm">
      {children}
    </kbd>
  );
}

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "?" ) {
        e.preventDefault();
        setOpen((prev) => !prev);
        return;
      }

      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
          />
          <motion.div
            className="relative z-10 w-full max-w-2xl mx-4 rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <Keyboard className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <h2 className="text-base font-semibold leading-tight">
                    Keyboard Shortcuts
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Press <Kbd>?</Kbd> at any time to see this help
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Close keyboard shortcuts"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Shortcut Groups */}
            <div className="max-h-[60vh] overflow-y-auto p-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {shortcutGroups.map((group) => (
                  <div key={group.title}>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {group.title}
                    </h3>
                    <div className="space-y-2">
                      {group.shortcuts.map((shortcut) => (
                        <div
                          key={shortcut.description}
                          className="flex items-center justify-between gap-4 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/50"
                        >
                          <span className="text-foreground">
                            {shortcut.description}
                          </span>
                          <div className="flex shrink-0 items-center gap-1">
                            {shortcut.keys.map((key, idx) => (
                              <span key={idx} className="flex items-center gap-1">
                                {idx > 0 && (
                                  <span className="text-[10px] text-muted-foreground">
                                    +
                                  </span>
                                )}
                                <Kbd>{key}</Kbd>
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-border px-6 py-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Tip: Sequences like{" "}
                <Kbd>G</Kbd>{" "}
                <span className="mx-0.5">then</span>{" "}
                <Kbd>D</Kbd>{" "}
                must be pressed within 500ms
              </span>
              <span className="flex items-center gap-1.5">
                Close with{" "}
                <Kbd>Esc</Kbd>
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
