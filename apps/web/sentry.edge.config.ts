// Sentry init for the Next.js edge runtime (Vercel Edge Functions /
// middleware). Loaded by @sentry/nextjs. No-op when SENTRY_DSN is unset.
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
