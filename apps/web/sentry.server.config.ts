// Sentry init for the Next.js server runtime (Node). Loaded by
// @sentry/nextjs in the server context. No-op when SENTRY_DSN is unset.
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.APP_ENV || "development",
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
  });
}
