"use client";

import { cn, getStatusColor } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const displayStatus = status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        getStatusColor(status),
        className
      )}
    >
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {displayStatus}
    </span>
  );
}
