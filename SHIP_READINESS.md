# Ship-Readiness Scorecard

**Branch:** `claude/library-updates-svelte-audit-WE52m`
**Date:** 2026-05-26
**Verified against:** Postgres 16 + Redis 7 + release-built API + Next 16 dev

## ✅ Verified working end-to-end

### Build & lint (every workspace)
- `pnpm -w exec turbo run build` → 4/4 workspaces green (67 web routes, 23 migrations applied on boot)
- `pnpm --filter frontend exec tsc --noEmit` → 0 errors
- `pnpm --filter frontend exec eslint` → 0 errors, 0 warnings (with `no-explicit-any: error`, `no-console: error`, `eqeqeq: error`)
- `cd apps/api-rust && cargo clippy --all-targets -- -D warnings` → clean
- `cd apps/api-rust && cargo fmt --check` → clean

### Backend tests (all pass against a real Postgres+Redis)
- **Unit:** 15/15 in `cargo test --bin talent-os-api` (password hashing, JWT, role hierarchy, CSRF token gen, constant-time compare)
- **Integration:** 3/3 in `cargo test --test transactions`
  - `for_update_serializes_concurrent_status_check` — proves the FOR UPDATE pattern used by `offers::accept_offer` and `applications::advance_stage` correctly serializes concurrent winners
  - `transaction_rolls_back_on_error` — proves multi-statement tx is atomic (invoice header doesn't survive a failing line-item insert)
  - `concurrent_invoice_numbers_unique_per_tenant` — 5 parallel invoice number generators using the advisory-lock pattern → 5 distinct numbers

### Boot + endpoint smoke (live curl)
- API boots in <2s on cold start with migrations applied
- `GET /api/v1/health` → 200
- `GET /metrics` → 200, Prometheus exposition format (histograms by route/method/status)
- `POST /api/v1/auth/register` → 201 with JWT
- `GET /api/v1/auth/me` with Bearer → 200
- `GET /api/v1/auth/me` without Bearer → 401
- `POST /api/v1/auth/login` w/o Bearer or CSRF cookie → 200 (correctly skipped per pre-auth policy)
- `POST /api/v1/dashboard/stats` w/o auth → 401 protected
- 10 concurrent `POST /api/v1/invoices` → 10 distinct `INV-NNNNN` numbers, 0 collisions
- Security headers present on every response: HSTS, X-Frame-Options=DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COOP=same-origin, CORP=same-site, CSP-Report-Only
- CSRF cookie set on first GET; CORS preflight allows `x-csrf-token` + `idempotency-key`

### Frontend end-to-end (Playwright)
- **8/8 tests pass in `e2e/01-auth.spec.ts`** (Chromium), covering:
  - Register page renders (employer flow)
  - Required-field validation
  - Password-length validation
  - Login via UI → lands on `/dashboard`
  - Login page renders
  - Login w/ valid creds
  - Login w/ invalid creds → stays on /login
  - Navigate between login + register

## ⚠️ Verified building, not exercised at runtime

These compile clean and pass type/lint checks, but were not invoked by a test in this session. They have the same code paths as the verified items and use middleware/transactions that ARE verified.

- The other 25+ backend handlers (candidates, jobs, applications stage advance, offers accept/decline, workflows advance — code paths are in the same shape as the tested invoice handler, and the underlying transaction logic is covered by `tests/transactions.rs`)
- The other 60+ frontend pages (built into Next.js production output via `pnpm -w turbo run build`)
- The 13 other Playwright spec files: deeply drifted against the OLD CPA-platform UI ("CPA Platform branding" expected in nav, "13 navigation items" expected, etc.). They need page-by-page rewrites tied to the actual hiring UI. **In CI they are gated behind `if: false` already.**

## ❌ Known-open from the audit (each is multi-hour-to-multi-day)

| # | Item | Impact | Estimate |
|---|------|--------|----------|
| 1 | HttpOnly cookie auth migration (tokens currently in `localStorage`) | P0 — XSS = full account takeover | 1 day |
| 2 | Sentry integration (web + backend) | P0 — production errors invisible | 0.5 day |
| 3 | OpenAPI codegen (utoipa) + SDK consumption in web | P0 — eliminates ~50 hand-written hook types | 2-3 days |
| 4 | Rewrite remaining 13 Playwright specs to current UI | P1 — coverage of clients/jobs/offers/etc UI flows | 1-2 days |
| 5 | Decompose 1500–1800-line client pages | P1 — bundle perf, maintainability | 2-5 days |
| 6 | Migrate from JWT HS256 → RS256 + JWKS + key rotation | P1 — key compromise → mass reissue today | 1 day |
| 7 | Add OpenTelemetry tracing across both services | P1 — full distributed tracing | 1 day |
| 8 | Frontend unit tests (currently 0) | P2 — component-level coverage | open-ended |
| 9 | Strip or rename legacy CPA modules (`clients`, `invoices`, `expenses`) if not part of staffing-agency product surface | P2 | 0.5-1 day |

## Operational notes

- `APP_ENV=production` flips: (a) `Secure` flag on CSRF cookie, (b) strict rate limits on auth (5/min login), (c) JWT-secret-validation refuses known dev defaults. CI/dev should leave it unset or set to `development`.
- Pre-commit hooks run via `lefthook` (auto-installs on `pnpm install`). Skip with `--no-verify` only in emergencies.
- The Stop hook on this branch enforces "no uncommitted changes" — every commit must be pushed.

## How to reproduce the verification

```bash
# 1. infra
docker compose up -d postgres redis

# 2. apply migrations
cd apps/api-rust
DATABASE_URL=postgres://talent_os:talent_os_dev_password@localhost:5432/talent_os_dev sqlx migrate run
DATABASE_URL=postgres://talent_os:talent_os_dev_password@localhost:5432/talent_os_test sqlx migrate run

# 3. backend tests (unit + integration)
DATABASE_URL=postgres://talent_os:talent_os_dev_password@localhost:5432/talent_os_test \
  cargo test --all

# 4. boot API
DATABASE_URL=postgres://talent_os:talent_os_dev_password@localhost:5432/talent_os_dev \
REDIS_URL=redis://localhost:6379 \
JWT_SECRET="ci_test_secret_that_is_long_enough_for_hmac_256_validation" \
CORS_ORIGIN=http://localhost:3000 \
APP_ENV=development \
HOST=127.0.0.1 PORT=8080 \
  cargo run --release

# 5. e2e (separate terminal — Next dev boots itself via playwright.config webServer)
cd apps/web
NEXT_PUBLIC_API_URL=http://localhost:8080 \
  npx playwright test e2e/01-auth.spec.ts --project=chromium
```
