import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ─────────────────────────────────────────────
   Currency & Number Formatting
   ───────────────────────────────────────────── */

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** Format cents to dollars string — e.g. 15099 → "$150.99" */
export function formatCurrency(cents: number): string {
  return currencyFormatter.format(cents / 100);
}

/** Format large numbers compactly — e.g. 1500 → "1.5K" */
export function formatCompact(value: number): string {
  return compactFormatter.format(value);
}

/** Format a number with commas — e.g. 12345 → "12,345" */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

/** Format percentage — e.g. 0.735 → "73.5%" */
export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/* ─────────────────────────────────────────────
   Date & Time Formatting
   ───────────────────────────────────────────── */

/** Format ISO date string to readable format — e.g. "Jan 15, 2026" */
export function formatDate(
  date: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...options,
  });
}

/** Format ISO date to relative time — e.g. "2 hours ago" */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(d);
}

/** Format duration in seconds to readable — e.g. 3661 → "1h 1m" */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/* ─────────────────────────────────────────────
   String Utilities
   ───────────────────────────────────────────── */

/** Truncate a string — e.g. "Hello World" → "Hello Wo..." */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

/** Get initials from a name — e.g. "John Doe" → "JD" */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Slugify a string — e.g. "Hello World" → "hello-world" */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/* ─────────────────────────────────────────────
   Validation Helpers
   ───────────────────────────────────────────── */

/** Validate email format */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Validate phone number (US format) */
export function isValidPhone(phone: string): boolean {
  return /^\+?1?\d{10,11}$/.test(phone.replace(/[\s()-]/g, ""));
}

/* ─────────────────────────────────────────────
   Color & Status Utilities
   ───────────────────────────────────────────── */

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  completed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  paid: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  draft: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
  sent: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  in_progress: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  overdue: "bg-red-500/10 text-red-600 dark:text-red-400",
  cancelled: "bg-red-500/10 text-red-600 dark:text-red-400",
  archived: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
  inactive: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
};

/** Get Tailwind classes for a status badge */
export function getStatusColor(status: string): string {
  return STATUS_COLORS[status.toLowerCase()] || STATUS_COLORS.draft;
}

/* ─────────────────────────────────────────────
   Download / Export Helpers
   ───────────────────────────────────────────── */

/** Trigger a browser download of a Blob */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Convert array of objects to CSV string */
export function toCSV<T extends Record<string, unknown>>(
  data: T[],
  columns?: { key: keyof T; label: string }[]
): string {
  if (data.length === 0) return "";
  const cols = columns || Object.keys(data[0]).map((k) => ({ key: k as keyof T, label: String(k) }));
  const header = cols.map((c) => `"${String(c.label)}"`).join(",");
  const rows = data.map((row) =>
    cols.map((c) => `"${String(row[c.key] ?? "")}"`).join(",")
  );
  return [header, ...rows].join("\n");
}
