"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Archive, Send, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BulkAction {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  variant?: "default" | "destructive" | "outline";
  disabled?: boolean;
}

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  actions: BulkAction[];
}

export function BulkActionsBar({
  selectedCount,
  onClearSelection,
  actions,
}: BulkActionsBarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
          className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2"
        >
          <div className="flex items-center gap-3 rounded-xl border bg-card/95 px-4 py-3 shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-2 text-sm font-medium">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                {selectedCount}
              </div>
              <span className="text-muted-foreground">selected</span>
            </div>

            <div className="h-5 w-px bg-border" />

            {actions.map((action, i) => {
              const Icon = action.icon;
              return (
                <Button
                  key={i}
                  size="sm"
                  variant={action.variant || "outline"}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className="gap-2"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {action.label}
                </Button>
              );
            })}

            <div className="h-5 w-px bg-border" />

            <Button
              size="sm"
              variant="ghost"
              onClick={onClearSelection}
              className="gap-1 text-muted-foreground"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Pre-configured bulk actions for common patterns
export const BULK_DELETE_ACTION = (onClick: () => void): BulkAction => ({
  label: "Delete",
  icon: Trash2,
  onClick,
  variant: "destructive",
});

export const BULK_ARCHIVE_ACTION = (onClick: () => void): BulkAction => ({
  label: "Archive",
  icon: Archive,
  onClick,
  variant: "outline",
});

export const BULK_SEND_ACTION = (onClick: () => void): BulkAction => ({
  label: "Send",
  icon: Send,
  onClick,
  variant: "default",
});

export const BULK_COMPLETE_ACTION = (onClick: () => void): BulkAction => ({
  label: "Complete",
  icon: CheckCircle,
  onClick,
  variant: "default",
});
