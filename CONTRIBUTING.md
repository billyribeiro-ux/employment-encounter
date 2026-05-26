# Contributing to Talent OS

## Setup

```bash
pnpm install                         # installs root + workspaces; runs `lefthook install`
cp apps/api-rust/.env.example apps/api-rust/.env
docker compose up -d postgres redis  # infra
```

If `lefthook install` failed silently, run `pnpm exec lefthook install` once.

## Daily commands

| Task                              | Command                                              |
| --------------------------------- | ---------------------------------------------------- |
| Run web app                       | `pnpm --filter frontend dev`                         |
| Run API                           | `cd apps/api-rust && cargo run`                      |
| Type-check web                    | `pnpm --filter frontend run typecheck`               |
| Lint web                          | `pnpm --filter frontend run lint`                    |
| Backend fmt + clippy              | `cd apps/api-rust && cargo fmt && cargo clippy`      |
| Backend tests                     | `cd apps/api-rust && cargo test --bin talent-os-api` |
| Full monorepo build               | `pnpm -w exec turbo run build`                       |
| Bundle analyzer (visualizes deps) | `pnpm --filter frontend run analyze`                 |

## Branch + commit conventions

- Branch from `main`. Branch names: `feat/short-thing`, `fix/short-thing`,
  `chore/short-thing`. Personal branches under your handle (e.g.
  `you/wip-thing`) are fine for in-flight work.
- Commit subject ≤72 chars (enforced by lefthook). Use imperative mood:
  "fix: prevent double-submit on offer accept".
- Body wraps at ~72 chars, explains _why_ when the diff doesn't.

## Pre-commit hooks (lefthook)

On every commit:
- ESLint with `--max-warnings 0` on staged web files
- `tsc --noEmit` for web + contracts when any `.ts`/`.tsx` is staged
- `cargo fmt --check` and `cargo clippy -D warnings` when any `.rs` is staged
- Subject line length check

On every push:
- `cargo audit` (skipped if `cargo-audit` not installed locally)

Skip in emergencies with `git commit --no-verify`. The use is audit-
logged via the security-events stream; explain it in the PR.

## Adding a backend mutation

Multi-statement operations must run in a transaction. The pattern in
`apps/api-rust/src/invoices/handler.rs::create_invoice` is the canonical
example: `let mut tx = state.db.begin().await?;` → all queries against
`&mut *tx` → `tx.commit().await?;`. This keeps RLS tenant context
(`SET LOCAL app.current_tenant`) bound to one connection and prevents
partial writes on failure.

When writing the SELECT that decides whether to proceed (e.g. status
checks), use `... FOR UPDATE` so two concurrent requests can't both
observe the same precondition.

## Adding a frontend feature

- Use server components by default; only opt into `"use client"` when
  you actually need browser APIs or interactivity.
- Use TanStack Query for data — never roll your own `useEffect(fetch)`.
- Form state lives in `react-hook-form`. Form validation lives in `zod`
  schemas — share with the backend via `@talent-os/contracts` (in
  progress).
- Icons: `lucide-react` for everything; `react-icons/fa6` for brand
  logos only (lucide dropped them in 1.x for trademark reasons).
- New pages should keep `loading.tsx` + `error.tsx` siblings where they
  do nontrivial work.

## Security checklist (before merge)

- [ ] No new `localStorage` reads/writes of tokens (cookie migration WIP).
- [ ] Any new mutation: wrapped in a transaction OR documented why not.
- [ ] Any new public route: explicitly considered for CSRF and rate-limit
      classification.
- [ ] No new `eslint-disable` lines without an inline reason.
- [ ] No new `any` (rule is `error`).

## CI

CI runs on every PR to `main`. Required green checks:
`backend-check`, `backend-test`, `frontend-check`, `frontend-build`,
`packages-build`, `security-scan`, `CodeQL`. `e2e-tests` is gated
(needs a backend-boot step).
