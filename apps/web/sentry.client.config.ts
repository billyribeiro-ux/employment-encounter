// Sentry init for the browser side. Loaded by @sentry/nextjs at app
// bootstrap. When NEXT_PUBLIC_SENTRY_DSN is unset, init is a no-op so
// dev + CI cost nothing.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_APP_ENV || "development",
    // Conservative sample rates; tune once we see real volume.
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.0,
    replaysOnErrorSampleRate: 1.0,
    // Don't ship PII in events by default.
    sendDefaultPii: false,
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
  });
}
