# CPA Platform

Multi-tenant SaaS platform for CPA firms (1-50 users). Unifies client management, document AI, workflow automation, time/billing, analytics, and integrations.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui
- **Backend**: Rust, Axum 0.8, SQLx 0.8 (runtime queries)
- **Database**: PostgreSQL 16 (RLS, multi-tenant)
- **Cache**: Redis 7+
- **Search**: Typesense
- **Auth**: JWT (HS256 dev / RS256 prod), Argon2id, TOTP MFA
- **Storage**: AWS S3 (LocalStack for dev)

## Prerequisites

- Rust (latest stable via `rustup`)
- Node.js 20+ (via `nvm`)
- Docker + Docker Compose

## Quick Start

```bash
# 1. Start infrastructure
docker compose up -d

# 2. Backend
cd backend
cp .env.example .env.local
cargo run

# 3. Frontend (new terminal)
cd frontend
npm install   # already done if cloned fresh
npm run dev
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080/api/v1
- **Health check**: http://localhost:8080/api/v1/health

## Project Structure

```
├── MASTER_SPEC.md              # Source of truth
├── docker-compose.yml          # Local infrastructure
├── backend/
│   ├── Cargo.toml
│   ├── migrations/             # PostgreSQL migrations (001-007)
│   └── src/
│       ├── main.rs             # Axum server, routes, middleware
│       ├── config.rs           # Environment config
│       ├── error.rs            # Error types + response format
│       ├── auth/               # JWT, Argon2id, login/register
│       ├── middleware/         # Auth middleware, tenant context
│       ├── clients/            # Client CRUD
│       ├── time_entries/       # Time tracking
│       └── invoices/           # Invoice management
├── frontend/
│   ├── src/app/
│   │   ├── (auth)/             # Login, Register pages
│   │   └── (dashboard)/        # Dashboard, Clients, Documents, etc.
│   ├── src/components/
│   │   ├── ui/                 # shadcn/ui components
│   │   └── dashboard/          # Sidebar, Header
│   ├── src/stores/             # Zustand stores
│   └── src/lib/                # API client, utilities
└── [blueprint docs]/           # program/, product/, backend/, etc.
```

## API Endpoints

### Public
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Health check |
| POST | `/api/v1/auth/register` | Register firm + admin user |
| POST | `/api/v1/auth/login` | Login |

### Authenticated (Bearer token required)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/clients` | List clients (paginated) |
| POST | `/api/v1/clients` | Create client |
| GET | `/api/v1/clients/:id` | Get client |
| PUT | `/api/v1/clients/:id` | Update client |
| DELETE | `/api/v1/clients/:id` | Soft-delete client |
| GET | `/api/v1/time-entries` | List time entries |
| POST | `/api/v1/time-entries` | Create time entry / start timer |
| POST | `/api/v1/time-entries/:id/stop` | Stop running timer |
| DELETE | `/api/v1/time-entries/:id` | Delete time entry |
| GET | `/api/v1/invoices` | List invoices |
| POST | `/api/v1/invoices` | Create invoice with line items |
| GET | `/api/v1/invoices/:id` | Get invoice |
| PATCH | `/api/v1/invoices/:id/status` | Update invoice status |

## Database Migrations

Migrations run automatically on backend startup. Manual control:

```bash
# Requires sqlx-cli: cargo install sqlx-cli
sqlx migrate run --database-url $DATABASE_URL
sqlx migrate revert --database-url $DATABASE_URL
```

## Blueprint Documentation

Detailed execution blueprints are in the following directories:

- `program/` — WBS, dependencies, critical path, RACI, milestones, guardrails
- `product/` — PRD, user stories, acceptance criteria, change control
- `frontend_docs/` — Architecture, routes, design system, state management
- `backend/` — Service architecture, API implementation matrix
- `data/` — Schema, migrations, RLS, encryption, DR
- `workflow/` — Temporal topology
- `integrations/` — QB, Drive, Stripe contracts
- `security/` — Threat model, controls, compliance
- `qa/` — Test strategy, release gates
- `devops/` — Environments, CI/CD, infrastructure
- `demo_gtm/` — Demo mode, GTM plan
- `docs/` — Developer handbook
- `final/` — Integrated master plan
