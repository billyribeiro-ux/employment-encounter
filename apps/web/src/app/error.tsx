"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Talent OS] Unhandled error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-red-950/20 flex items-center justify-center px-4">
      {/* Subtle background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-red-100/30 dark:bg-red-900/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full">
        {/* Error icon */}
        <div className="mb-6 rounded-full bg-red-50 dark:bg-red-950/50 p-5 ring-1 ring-red-100 dark:ring-red-900/50">
          <AlertTriangle className="h-10 w-10 text-red-500 dark:text-red-400" />
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-semibold text-foreground mb-3">
          Something went wrong
        </h1>
        <p className="text-muted-foreground mb-4 leading-relaxed">
          An unexpected error occurred. We apologize for the inconvenience.
          Please try again or return to the home page.
        </p>

        {/* Error details */}
        {error.message && (
          <div className="w-full mb-6 rounded-lg border border-border bg-muted/50 px-4 py-3">
            <p className="text-xs font-mono text-muted-foreground break-all leading-relaxed">
              {error.message}
            </p>
            {error.digest && (
              <p className="mt-2 text-xs text-muted-foreground/60">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-6 py-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Home className="h-4 w-4" />
            Go home
          </a>
        </div>

        {/* Branding */}
        <p className="mt-12 text-xs text-muted-foreground">
          Talent OS &middot; Next-Gen Hiring Platform
        </p>
      </div>
    </div>
  );
}
