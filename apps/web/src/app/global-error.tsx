"use client";

// Next App Router: `global-error.tsx` is the only error boundary that
// can catch errors thrown by the root `layout.tsx` itself. The existing
// `error.tsx` is one segment below and won't recover if `RootLayout`
// crashes (e.g. provider init, font loading, theme provider).
//
// This file MUST render its own <html> and <body> because it replaces
// the root layout when an error escalates to it.

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Talent OS] Root-level error:", error);
    // Hook a Sentry/error-tracking call in here once wired.
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
          backgroundColor: "#fafafa",
          color: "#1f2937",
        }}
      >
        <main
          style={{
            textAlign: "center",
            padding: "2rem",
            maxWidth: 480,
          }}
        >
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>
            A critical error occurred while loading the app. Please try
            reloading. If the problem persists, contact support with the
            error ID below.
          </p>
          {error.digest ? (
            <p
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: "0.75rem",
                color: "#9ca3af",
                marginBottom: "1.5rem",
              }}
            >
              ID: {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              backgroundColor: "#111827",
              color: "white",
              border: "none",
              borderRadius: 8,
              padding: "0.75rem 1.5rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
