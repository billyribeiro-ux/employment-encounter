# Talent OS

Multi-tenant SaaS hiring / ATS platform. End-to-end candidate sourcing,
applicant tracking, scorecard-based evaluation, offer management,
onboarding, and analytics — for in-house recruiting teams and staffing
agencies.

> Repo name `employment-encounter` is the legacy slug; the product is
> Talent OS. Historical CPA-platform code paths (clients/, invoices/,
> expenses/) still exist and are being migrated or removed.

## Stack

| Layer       | Tech                                                                |
| ----------- | ------------------------------------------------------------------- |
| Frontend    | Next.js 16 (App Router), React 19.2, TypeScript 6, Tailwind v4      |
| UI          | shadcn-style components on Radix primitives, lucide-react, sonner   |
| State/data  | TanStack Query 5, Zustand, react-hook-form + Zod 4                  |
| Backend     | Rust, Axum 0.8, SQLx 0.8 + Postgres 16, Redis (fred), Tower         |
| Auth        | JWT HS256 (HttpOnly cookies — migration in progress), Argon2id, TOTP |
| Storage     | S3-compatible (LocalStack in dev)                                   |
| Search      | Typesense                                                           |
| Realtime    | Native WebSocket on `/api/v1/ws`                                    |
| Tooling     | pnpm workspaces + Turborepo, Playwright e2e                         |

## Repo layout

```
.
├── apps/
│   ├── web/              # Next.js 16 frontend
│   ├── api-rust/         # Axum API + migrations
│   └── worker/           # Background job worker (skeleton)
├── packages/
│   ├── config/           # Shared tsconfig.base.json + eslint.base.js
│   ├── contracts/        # Zod schemas (shared types — wiring WIP)
│   ├── sdk/              # Typed HTTP client (axios-based — wiring WIP)
│   └── ui/               # Design tokens
├── infra/docker/         # Dockerfiles + nested compose
├── docker-compose.yml    # Root dev infra (postgres, redis, typesense, localstack, api)
├── turbo.json, pnpm-workspace.yaml
└── .github/workflows/    # CI
```

## Quick start

Prerequisites: Node 22+, pnpm 9+, Rust stable, Docker.

```bash
# 1. infra
docker compose up -d postgres redis typesense localstack

# 2. backend (migrations run on boot)
cd apps/api-rust
cp .env.example .env
cargo run

# 3. frontend (new terminal, from repo root)
pnpm install
pnpm --filter frontend dev
```

URLs:
- Web app: http://localhost:3000
- API: http://localhost:8080/api/v1
- Health: http://localhost:8080/api/v1/health

## Common commands

```bash
# Whole monorepo
pnpm install
pnpm -w exec turbo run build          # all workspaces
pnpm -w exec turbo run lint           # all workspaces

# Frontend only
pnpm --filter frontend dev
pnpm --filter frontend run typecheck
pnpm --filter frontend run lint
pnpm --filter frontend run test       # playwright e2e

# Backend
cd apps/api-rust
cargo run
cargo clippy --all-targets --all-features -- -D warnings
cargo test --all

# Shared packages
pnpm --filter "./packages/*" run build
```

## Feature surface (high-level)

The web app ships ~67 routes split across:

- **Hiring (recruiter)** under `/hiring/*`: jobs, pipeline kanban,
  activity, search, talent pools, assessments, scorecards, offers,
  negotiations, references, onboarding, compensation, compliance,
  analytics, integrations, automations, career page, approvals,
  evaluate, video interviews, resume parser, …
- **Talent (people)** under `/talent/*`: candidate directory and detail
- **Candidate portal** under `/candidate/*`: profile, applications, saved
  jobs, interviews and interview prep, messages, settings
- **Operations**: dashboard, calendar, conference (WebRTC),
  conversations, messages, notifications, billing, reports, settings,
  scheduling, time, tasks, workflows, documents
- **Public**: marketing home, jobs board

## Backend module surface

API routes are nested under `/api/v1`; module list lives in
`apps/api-rust/src/main.rs`. Major domains:

- `auth` (login, register, refresh, MFA via TOTP)
- `candidates`, `jobs`, `applications`, `offers`, `scorecards`
- `interviews`, `meetings`, `video_rooms`
- `messages`, `conversations`, `notifications`
- `assessments`, `onboarding`, `talent_pools`, `referrals`
- `automations`, `email_templates`, `pipeline_stages`, `question_bank`
- `approvals`, `career_page`, `saved_jobs`, `activity`
- `subscriptions`, `payments` (Stripe), `reports`, `dashboard`
- Legacy CPA modules (`clients`, `invoices`, `time_entries`,
  `expenses`, `compliance`, `documents`, `tasks`, `workflows`)
- Cross-cutting `middleware/` (auth, rate-limit, csrf, idempotency,
  audit, security, audit_handler)

WebSocket: `/api/v1/ws` for live notifications, messages, application
events.

## Database

23 migrations under `apps/api-rust/migrations/`. All tables enforce
**Row-Level Security** for tenant isolation. RLS context is set on every
request via the auth middleware (`SET LOCAL app.current_tenant`); wrap
multi-statement operations in a transaction to keep the context
deterministic.

```bash
cargo install sqlx-cli
sqlx migrate run --database-url $DATABASE_URL
sqlx migrate revert --database-url $DATABASE_URL
```

## Security posture

- JWT auth (HS256 dev / planned RS256 prod). Refresh tokens (7d).
- CSRF (double-submit cookie), idempotency-key, request-id, body limit,
  30s timeout, gzip — all mounted in the Axum layer stack.
- Argon2id password hashing; TOTP MFA enrollment / verification.
- Per-tenant rate limits (Redis or in-memory fallback).
- Security headers: HSTS, X-Frame-Options=DENY, COOP, CORP, Referrer-
  Policy, Permissions-Policy, CSP (report-only at the edge).
- `cargo audit` + `pnpm audit` run in CI; Dependabot weekly with grouped
  PRs.
- Boot fails fast if `JWT_SECRET` is shorter than 32 chars or matches a
  known dev default while `APP_ENV=production`.

Known open items (tracked in the audit punch list):
- Tokens still in `localStorage`; migrating to `HttpOnly; SameSite=Strict`
  cookies is in flight.
- Multi-statement handlers need transaction wrappers (in progress).
- Sentry / Prometheus / OpenTelemetry not yet wired.

## Contributing

See `docs/01_developer_handbook.md`. Pre-commit hooks run `cargo fmt`,
`clippy`, `eslint`, and `tsc --noEmit` on staged files (lefthook). CI
must be green on PRs to `main`.

## License

Proprietary — all rights reserved.
