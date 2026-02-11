# CPA Platform

Multi-tenant SaaS platform for CPA firms (1-50 users). Unifies client management, document AI, workflow automation, time/billing, analytics, and integrations.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui, TanStack Query, Zustand, React Hook Form + Zod
- **Backend**: Rust, Axum 0.8, SQLx 0.8 (runtime queries), Argon2id
- **Database**: PostgreSQL 16 (RLS, multi-tenant), 10 migrations
- **Cache**: Redis 7+
- **Search**: Typesense
- **Auth**: JWT (HS256 dev / RS256 prod), Argon2id, TOTP MFA (planned)
- **Storage**: AWS S3 (LocalStack for dev)

## Features

### Implemented

- **Authentication** — JWT login/register, Argon2id password hashing, tenant isolation
- **Client Management** — Full CRUD with delete, contacts, detail page with tabs (overview, documents, time, invoices), breadcrumb navigation
- **Document Management** — Upload dialog with AI category auto-detect, file metadata, delete with toast
- **Workflow Engine** — Template builder (multi-step), instance creation, step advancement (complete/skip/return), activity logs, breadcrumbs
- **Task Management** — Kanban board (4 columns: To Do, In Progress, Review, Done) with drag-and-drop, task detail page with status transitions, breadcrumbs
- **Time Tracking** — Manual entry + timer mode, start/stop with toast, billable/non-billable, delete with toast
- **Invoicing** — Line items, subtotal/tax/total calculation, status workflow (draft → sent → paid), detail page with delete + breadcrumbs
- **Compliance Calendar** — Deadline tracking with urgency indicators, filing type presets (1040, 1120-S, 1065, etc.), mark-complete with toast
- **Expense Tracking** — Dedicated page with data table, category-based logging, reimbursable flag, client association, delete with toast
- **Analytics** — Dashboard stats, 4 metric cards, 4 ECharts (revenue trend, client distribution donut, monthly trend, team utilization)
- **Dashboard** — Quick actions, upcoming deadlines from API, pending tasks from API, ECharts revenue + utilization charts
- **Settings** — 6-tab layout (Profile, Firm, Team, Integrations, Billing, Security) with toast on save
- **Notifications** — Bell dropdown in header (ready for WebSocket integration)
- **Dark Mode** — System/light/dark toggle via next-themes, Sun/Moon button in header
- **Global Search** — Header search bar with keyword-based page navigation, ⌘K keyboard shortcut
- **Mobile Responsive** — Sheet-based sidebar for mobile/tablet, hidden on desktop
- **Breadcrumbs** — Reusable component on all 5 detail pages (clients, invoices, workflows, workflow templates, tasks)
- **Toast Notifications** — Sonner toasts on all CRUD mutations across every page
- **Confirmation Dialogs** — AlertDialog-based confirmation on all destructive actions across list + detail pages
- **Skeleton Loading** — Animated skeleton states on all list pages, detail pages, Kanban board, calendar, and workflow cards (zero Loader2 spinners)
- **Search Filters** — Full-stack debounced search (300ms) on all 8 data pages (clients, invoices, documents, expenses, time, tasks, workflows, calendar) with backend ILIKE filtering and pagination reset
- **Responsive Tables** — Horizontal scroll with min-width constraints on all 5 data tables
- **Detail Page Actions** — Delete with ConfirmDialog + redirect on all 5 detail pages (clients, invoices, workflows, workflow templates, tasks)
- **Error Handling** — Error boundary with retry on dashboard + auth layouts, custom 404 not-found page, route-level skeleton loading

### 21 Frontend Routes (16 static + 5 dynamic)

| Route | Type | Description |
|-------|------|-------------|
| `/dashboard` | Static | Overview with metrics, charts, deadlines, tasks |
| `/clients` | Static | Client list with search, pagination, delete |
| `/clients/[id]` | Dynamic | Client detail with tabs + breadcrumbs |
| `/documents` | Static | Document list with upload + confirm delete |
| `/workflows` | Static | Workflow templates + instances |
| `/workflows/[id]` | Dynamic | Workflow detail with step progress + breadcrumbs |
| `/workflows/templates/[id]` | Dynamic | Template detail with step viewer + start instance |
| `/tasks` | Static | Kanban board with clickable titles |
| `/tasks/[id]` | Dynamic | Task detail with status transitions + breadcrumbs |
| `/time` | Static | Time entries with timer + toast |
| `/invoices` | Static | Invoice list with create dialog |
| `/invoices/[id]` | Dynamic | Invoice detail with status actions + breadcrumbs |
| `/expenses` | Static | Expense table with create + confirm delete |
| `/analytics` | Static | Metrics + 4 ECharts |
| `/calendar` | Static | Compliance deadlines with mark-complete |
| `/settings` | Static | Profile, firm, team, integrations |
| `/login` | Static | Authentication |
| `/register` | Static | Firm registration |

### 10 Dialog Components

CreateClientDialog, CreateTimeEntryDialog, CreateInvoiceDialog, CreateTaskDialog, CreateDeadlineDialog, CreateExpenseDialog, CreateWorkflowTemplateDialog, CreateWorkflowInstanceDialog, UploadDocumentDialog, ConfirmDialog

### 3 ECharts Components

RevenueChart (line+area), UtilizationChart (stacked bar), ClientDistributionChart (donut)

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
npm install
npm run dev
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080/api/v1
- **Health check**: http://localhost:8080/api/v1/health

## Project Structure

```
├── docker-compose.yml          # Local infrastructure
├── backend/
│   ├── Cargo.toml
│   ├── migrations/             # PostgreSQL migrations (001-010)
│   └── src/
│       ├── main.rs             # Axum server, routes, middleware
│       ├── config.rs           # Environment config
│       ├── error.rs            # Error types + response format
│       ├── auth/               # JWT, Argon2id, login/register
│       ├── middleware/         # Auth middleware, tenant context
│       ├── dashboard/          # Dashboard stats
│       ├── clients/            # Client CRUD + contacts
│       ├── documents/          # Document CRUD + S3
│       ├── time_entries/       # Time tracking + timer
│       ├── invoices/           # Invoice CRUD + status + line items
│       ├── workflows/          # Workflow templates + instances + step logs
│       ├── tasks/              # Task CRUD
│       ├── compliance/         # Compliance deadlines
│       └── expenses/           # Expense tracking
├── frontend/
│   ├── src/app/
│   │   ├── (auth)/             # Login, Register pages
│   │   └── (dashboard)/        # All dashboard pages + [id] detail pages
│   ├── src/components/
│   │   ├── ui/                 # 14 shadcn/ui components
│   │   └── dashboard/          # Sidebar, Header, 9 dialog components
│   ├── src/stores/             # Zustand auth store
│   └── src/lib/
│       ├── api.ts              # Axios client with JWT interceptors
│       └── hooks/              # 10 TanStack Query hook files
└── [blueprint docs]/           # program/, product/, backend/, etc.
```

## API Endpoints (30+ routes)

### Public
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Health check |
| POST | `/api/v1/auth/register` | Register firm + admin user |
| POST | `/api/v1/auth/login` | Login |

### Authenticated (Bearer token required)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/dashboard/stats` | Dashboard metrics |
| GET | `/api/v1/clients` | List clients (paginated, filterable) |
| POST | `/api/v1/clients` | Create client with contacts |
| GET | `/api/v1/clients/:id` | Get client |
| PUT | `/api/v1/clients/:id` | Update client |
| DELETE | `/api/v1/clients/:id` | Soft-delete client |
| GET | `/api/v1/documents` | List documents |
| POST | `/api/v1/documents` | Create document record |
| GET | `/api/v1/documents/:id` | Get document |
| DELETE | `/api/v1/documents/:id` | Delete document |
| GET | `/api/v1/time-entries` | List time entries |
| POST | `/api/v1/time-entries` | Create time entry / start timer |
| POST | `/api/v1/time-entries/:id/stop` | Stop running timer |
| DELETE | `/api/v1/time-entries/:id` | Delete time entry |
| GET | `/api/v1/invoices` | List invoices |
| POST | `/api/v1/invoices` | Create invoice with line items |
| GET | `/api/v1/invoices/:id` | Get invoice |
| DELETE | `/api/v1/invoices/:id` | Delete invoice + line items |
| PATCH | `/api/v1/invoices/:id/status` | Update invoice status |
| GET | `/api/v1/workflow-templates` | List workflow templates |
| POST | `/api/v1/workflow-templates` | Create workflow template |
| GET | `/api/v1/workflows` | List workflow instances |
| POST | `/api/v1/workflows` | Create workflow instance |
| GET | `/api/v1/workflows/:id` | Get workflow instance |
| DELETE | `/api/v1/workflows/:id` | Delete workflow instance + logs |
| DELETE | `/api/v1/workflow-templates/:id` | Delete template (guards active instances) |
| POST | `/api/v1/workflows/:id/advance` | Advance workflow step |
| GET | `/api/v1/workflows/:id/logs` | Get step logs |
| GET | `/api/v1/tasks` | List tasks |
| POST | `/api/v1/tasks` | Create task |
| GET | `/api/v1/tasks/:id` | Get task |
| PUT | `/api/v1/tasks/:id` | Update task |
| DELETE | `/api/v1/tasks/:id` | Delete task |
| GET | `/api/v1/compliance-deadlines` | List compliance deadlines |
| POST | `/api/v1/compliance-deadlines` | Create deadline |
| PUT | `/api/v1/compliance-deadlines/:id` | Update deadline |
| DELETE | `/api/v1/compliance-deadlines/:id` | Delete deadline |
| GET | `/api/v1/expenses` | List expenses |
| POST | `/api/v1/expenses` | Create expense |
| DELETE | `/api/v1/expenses/:id` | Delete expense |

## Database Migrations

Migrations run automatically on backend startup. 10 migrations covering:

1. Tenants + users
2. Audit logs
3. Clients + contacts
4. Documents
5. Audit log triggers
6. Time entries
7. Invoices + line items
8. Workflow templates, instances, step logs
9. Tasks
10. Compliance deadlines + expenses

All tables have Row Level Security (RLS) policies for tenant isolation.

```bash
# Manual migration control (requires sqlx-cli)
cargo install sqlx-cli
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
