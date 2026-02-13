// Shared UI tokens and design constants for Talent OS

export const colors = {
  primary: {
    50: "#eff6ff",
    100: "#dbeafe",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    900: "#1e3a5f",
  },
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
} as const;

export const spacing = {
  xs: "0.25rem",
  sm: "0.5rem",
  md: "1rem",
  lg: "1.5rem",
  xl: "2rem",
  "2xl": "3rem",
} as const;

export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

// Shared component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Status badge mappings
export const applicationStageColors: Record<string, string> = {
  applied: "bg-blue-100 text-blue-800",
  screening: "bg-purple-100 text-purple-800",
  phone_screen: "bg-indigo-100 text-indigo-800",
  technical: "bg-amber-100 text-amber-800",
  onsite: "bg-orange-100 text-orange-800",
  offer: "bg-emerald-100 text-emerald-800",
  hired: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  withdrawn: "bg-gray-100 text-gray-800",
};

export const jobStatusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  open: "bg-green-100 text-green-800",
  paused: "bg-yellow-100 text-yellow-800",
  closed: "bg-red-100 text-red-800",
  filled: "bg-blue-100 text-blue-800",
};

export const meetingStatusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-green-100 text-green-800",
  denied: "bg-red-100 text-red-800",
  rescheduled: "bg-purple-100 text-purple-800",
  cancelled: "bg-gray-100 text-gray-800",
  completed: "bg-blue-100 text-blue-800",
};

// Format helpers
export function formatSalaryCents(cents: number | null | undefined): string {
  if (!cents) return "Undisclosed";
  return `$${(cents / 100).toLocaleString()}`;
}

export function formatSalaryRange(
  minCents: number | null | undefined,
  maxCents: number | null | undefined
): string {
  if (!minCents && !maxCents) return "Undisclosed";
  if (minCents && maxCents) return `${formatSalaryCents(minCents)} - ${formatSalaryCents(maxCents)}`;
  if (minCents) return `From ${formatSalaryCents(minCents)}`;
  return `Up to ${formatSalaryCents(maxCents)}`;
}

export function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString();
}
