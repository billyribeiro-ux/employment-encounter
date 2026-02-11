# Frontend Architecture

> Source of Truth: MASTER_SPEC.md > The Ultimate Tech Stack > FRONTEND
> Stack: Next.js 15 App Router, React 19, TypeScript strict, Tailwind CSS v4, shadcn/ui

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js 15 App Router                │
│  ┌───────────────────────────────────────────────────┐  │
│  │              Server Components (RSC)              │  │
│  │  - Route layouts, page shells, data fetching      │  │
│  │  - Streaming SSR for fast initial loads            │  │
│  │  - No client JS shipped for static content         │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │             Client Components ('use client')       │  │
│  │  - Interactive UI (forms, charts, modals, timers)  │  │
│  │  - TanStack Query for server state                 │  │
│  │  - Zustand for client state                        │  │
│  │  - Framer Motion for animations                    │  │
│  └───────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────┐  │
│  │              Server Actions (mutations)             │  │
│  │  - Form submissions, data mutations                │  │
│  │  - Revalidation after mutation                     │  │
│  └───────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│                     API Layer                           │
│  Rust/Axum Backend → /api/v1/*                          │
│  WebSocket → /ws                                        │
│  tus Upload → /upload                                   │
└─────────────────────────────────────────────────────────┘
```

## 2. Server vs Client Component Boundaries

| Component Type | Rendering | Use Case |
|---|---|---|
| **Server Component** (default) | Server | Page shells, layouts, static content, initial data fetch |
| **Client Component** (`'use client'`) | Client | Forms, charts, modals, drag-drop, timers, WebSocket listeners, animations |
| **Server Action** | Server | Mutations (create/update/delete), form handling |

### Boundary Rules

1. **Layouts** are always Server Components (sidebar, header, breadcrumbs)
2. **Page components** are Server Components that fetch initial data via `fetch()` or server-side calls
3. **Interactive sections** within pages are Client Components imported into Server Component pages
4. **Charts** (ECharts) are always Client Components (require DOM)
5. **Forms** (React Hook Form + Zod) are always Client Components
6. **Data tables** (TanStack Table) are Client Components
7. **Modals/dialogs** (shadcn/ui) are Client Components
8. **Framer Motion** wrappers are Client Components

## 3. Data Fetching Strategy

| Page/Feature | Strategy | Cache | Revalidation |
|---|---|---|---|
| Dashboard metrics | TanStack Query polling (5s) | Redis-backed API | SSE for real-time updates |
| Client list | TanStack Query + Typesense | 30s stale time | On mutation (optimistic) |
| Client detail | TanStack Query | 60s stale time | On mutation |
| Document list | TanStack Query | 30s stale time | On upload complete |
| Workflow status | TanStack Query polling (10s) | 15s stale time | WebSocket push |
| Messages | WebSocket (real-time) | Local cache | Instant via WS |
| Time entries | TanStack Query | 60s stale time | On entry create |
| Invoices | TanStack Query | 60s stale time | On status change |
| Charts | TanStack Query | 5min stale time | Dashboard refresh |
| Notifications | WebSocket (real-time) | Local + Zustand | Instant via WS |
| Search results | Typesense InstantSearch | No cache (instant) | On keystroke |

### Optimistic Updates

Applied to high-frequency user actions:
- **Task drag (Kanban)**: Optimistic reorder, rollback on error
- **Message send**: Optimistic append, rollback on error
- **Time entry create**: Optimistic add to list
- **Invoice status change**: Optimistic update
- **Notification dismiss**: Optimistic remove

## 4. Project Structure

```
frontend/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth group (no sidebar)
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   └── mfa/
│   ├── (dashboard)/              # Main app group (with sidebar)
│   │   ├── layout.tsx            # Sidebar + header layout (Server)
│   │   ├── page.tsx              # Firm dashboard (Server → Client charts)
│   │   ├── clients/
│   │   │   ├── page.tsx          # Client list
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # Client workspace
│   │   │       ├── documents/
│   │   │       ├── messages/
│   │   │       ├── workflows/
│   │   │       └── analytics/
│   │   ├── documents/
│   │   │   └── page.tsx          # All documents view
│   │   ├── workflows/
│   │   │   ├── page.tsx          # Workflow dashboard
│   │   │   ├── templates/
│   │   │   └── [id]/
│   │   ├── tasks/
│   │   │   └── page.tsx          # Task board (Kanban/List/Calendar)
│   │   ├── calendar/
│   │   │   └── page.tsx          # Compliance calendar
│   │   ├── time/
│   │   │   └── page.tsx          # Time tracking + timesheet
│   │   ├── invoices/
│   │   │   ├── page.tsx          # Invoice list
│   │   │   └── [id]/
│   │   ├── reports/
│   │   │   ├── page.tsx          # Report builder
│   │   │   ├── pl/
│   │   │   └── cashflow/
│   │   ├── integrations/
│   │   │   └── page.tsx          # Integration health dashboard
│   │   ├── team/
│   │   │   └── page.tsx          # Team analytics
│   │   ├── settings/
│   │   │   ├── page.tsx
│   │   │   ├── profile/
│   │   │   ├── firm/
│   │   │   ├── billing/
│   │   │   └── integrations/
│   │   └── onboarding/
│   │       └── page.tsx          # 7-step wizard
│   ├── portal/                   # Client portal (separate layout)
│   │   ├── layout.tsx            # Portal layout (no sidebar)
│   │   ├── page.tsx              # Client dashboard
│   │   ├── documents/
│   │   ├── messages/
│   │   ├── invoices/
│   │   └── questionnaire/
│   ├── demo/                     # Demo mode
│   │   └── page.tsx              # Demo entry + guided tour
│   └── api/                      # Next.js API routes (proxy/BFF if needed)
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── charts/                   # ECharts wrappers
│   │   ├── revenue-trend.tsx
│   │   ├── revenue-by-service.tsx
│   │   ├── team-utilization.tsx
│   │   ├── filing-status.tsx
│   │   ├── client-profitability.tsx
│   │   ├── cash-flow-forecast.tsx
│   │   └── echarts-theme.ts
│   ├── forms/                    # React Hook Form + Zod forms
│   ├── layout/                   # Sidebar, header, nav
│   ├── documents/                # Upload, preview, list
│   ├── messaging/                # Chat, threads, attachments
│   ├── workflows/                # Builder, tracker, steps
│   ├── tasks/                    # Kanban, list, calendar
│   ├── time/                     # Timer, timesheet, entries
│   ├── invoices/                 # Invoice list, PDF, payment
│   ├── notifications/            # Bell, dropdown, preferences
│   ├── onboarding/               # Wizard steps
│   └── shared/                   # Common components
├── hooks/                        # Custom React hooks
│   ├── use-auth.ts
│   ├── use-tenant.ts
│   ├── use-websocket.ts
│   ├── use-timer.ts
│   └── use-notifications.ts
├── lib/
│   ├── api/                      # API client (fetch wrappers)
│   ├── query/                    # TanStack Query keys + options
│   ├── stores/                   # Zustand stores
│   ├── validators/               # Zod schemas (shared with backend)
│   ├── utils/                    # Utility functions
│   └── constants/                # App constants
├── styles/
│   ├── globals.css               # Tailwind v4 imports + custom properties
│   └── echarts-theme.ts          # ECharts custom theme
├── public/
│   ├── manifest.json             # PWA manifest
│   └── sw.js                     # Service worker (offline)
├── tests/
│   ├── unit/                     # Vitest unit tests
│   ├── component/                # React Testing Library
│   ├── e2e/                      # Playwright E2E
│   └── mocks/                    # MSW handlers
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
└── playwright.config.ts
```

## 5. Middleware Chain (Next.js)

```typescript
// middleware.ts
// Runs on every request before routing

1. Check auth token (JWT in httpOnly cookie)
   → No token + protected route → redirect /login
   → Expired token → attempt refresh → redirect /login if fails

2. Extract tenant context from token claims
   → Set x-tenant-id header for API calls

3. Check role permissions for route
   → Client role accessing /dashboard → redirect /portal
   → Staff role accessing /settings/billing → redirect /dashboard

4. Demo mode check
   → Demo session expired (30 min) → redirect /demo with reset
```

## 6. Performance Architecture

- **Streaming SSR**: Page shells render immediately, data streams in
- **Code splitting**: Automatic per-route, lazy load heavy components (ECharts, React-PDF)
- **Image optimization**: Next.js Image component for all images
- **Font optimization**: next/font for self-hosted fonts
- **Bundle targets**: < 200KB initial JS, < 1.5s FCP, < 3s TTI
- **Prefetching**: Next.js Link prefetch for likely navigation targets
- **Service Worker**: Cache static assets, enable offline document viewing
