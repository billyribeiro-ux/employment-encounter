"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Keyboard } from "lucide-react";
import { KEYBOARD_SHORTCUTS } from "@/lib/hooks/use-keyboard-shortcuts";

interface KeyboardShortcutsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsModal({ open, onOpenChange }: KeyboardShortcutsModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2"
            role="dialog"
            aria-label="Keyboard shortcuts"
            aria-modal="true"
          >
            <div className="overflow-hidden rounded-xl border bg-card shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b px-5 py-4">
                <div className="flex items-center gap-2">
                  <Keyboard className="h-5 w-5 text-primary" />
                  <h2 className="text-sm font-semibold">Keyboard Shortcuts</h2>
                </div>
                <button
                  onClick={() => onOpenChange(false)}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-muted transition-colors"
                  aria-label="Close keyboard shortcuts dialog"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              {/* Shortcuts List */}
              <div className="max-h-96 overflow-y-auto p-4">
                <div className="space-y-1">
                  {KEYBOARD_SHORTCUTS.map((shortcut, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-muted/50"
                    >
                      <span className="text-muted-foreground">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, j) => (
                          <span key={j} className="flex items-center">
                            {j > 0 && (
                              <span className="mx-1 text-xs text-muted-foreground/50">then</span>
                            )}
                            <kbd className="inline-flex h-6 min-w-[24px] items-center justify-center rounded border bg-muted px-1.5 font-mono text-[11px] font-medium text-foreground">
                              {key}
                            </kbd>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t px-5 py-3 text-center text-[11px] text-muted-foreground">
                Press <kbd className="rounded border bg-muted px-1 font-mono">?</kbd> anywhere to toggle this dialog
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
