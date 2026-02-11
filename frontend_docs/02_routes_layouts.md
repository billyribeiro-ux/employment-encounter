# Routes, Layouts & Navigation

> Source of Truth: MASTER_SPEC.md

---

## 1. Route Map

### Auth Routes (no sidebar, centered layout)

| Route | Page | Auth | Role |
|---|---|---|---|
| `/login` | Login form | Public | — |
| `/register` | Registration form | Public | — |
| `/forgot-password` | Password reset request | Public | — |
| `/reset-password/[token]` | Password reset form | Public | — |
| `/mfa` | TOTP verification | Partial | All |
| `/verify-email/[token]` | Email verification | Public | — |

### Dashboard Routes (sidebar layout)

| Route | Page | Auth | Min Role |
|---|---|---|---|
| `/` | Firm dashboard (redirect) | Yes | Staff |
| `/dashboard` | Firm dashboard | Yes | Staff |
| `/clients` | Client list | Yes | Staff |
| `/clients/new` | Create client | Yes | Staff |
| `/clients/[id]` | Client workspace | Yes | Staff |
| `/clients/[id]/documents` | Client documents | Yes | Staff |
| `/clients/[id]/messages` | Client messages | Yes | Staff |
| `/clients/[id]/workflows` | Client workflows | Yes | Staff |
| `/clients/[id]/analytics` | Client analytics | Yes | Manager |
| `/clients/[id]/edit` | Edit client | Yes | Senior |
| `/documents` | All documents | Yes | Staff |
| `/documents/upload` | Bulk upload | Yes | Staff |
| `/workflows` | Workflow dashboard | Yes | Staff |
| `/workflows/templates` | Workflow templates | Yes | Manager |
| `/workflows/templates/new` | Create template | Yes | Manager |
| `/workflows/[id]` | Workflow detail | Yes | Staff |
| `/tasks` | Task board | Yes | Staff |
| `/calendar` | Compliance calendar | Yes | Staff |
| `/time` | Time tracking | Yes | Staff |
| `/time/timesheet` | Weekly timesheet | Yes | Staff |
| `/invoices` | Invoice list | Yes | Senior |
| `/invoices/new` | Create invoice | Yes | Senior |
| `/invoices/[id]` | Invoice detail | Yes | Senior |
| `/reports` | Report builder | Yes | Manager |
| `/reports/pl` | P&L report | Yes | Manager |
| `/reports/cashflow` | Cash flow report | Yes | Manager |
| `/integrations` | Integration dashboard | Yes | Admin |
| `/integrations/quickbooks` | QB settings | Yes | Admin |
| `/integrations/google-drive` | Drive settings | Yes | Admin |
| `/integrations/stripe` | Stripe settings | Yes | Admin |
| `/team` | Team analytics | Yes | Manager |
| `/settings` | Settings overview | Yes | Staff |
| `/settings/profile` | User profile | Yes | Staff |
| `/settings/firm` | Firm settings | Yes | Admin |
| `/settings/billing` | Subscription/billing | Yes | Partner |
| `/settings/users` | User management | Yes | Admin |
| `/settings/roles` | Role management | Yes | Admin |
| `/onboarding` | 7-step wizard | Yes | Admin |

### Client Portal Routes (portal layout, no sidebar)

| Route | Page | Auth | Role |
|---|---|---|---|
| `/portal` | Client dashboard | Yes | Client |
| `/portal/documents` | My documents | Yes | Client |
| `/portal/documents/upload` | Upload documents | Yes | Client |
| `/portal/messages` | Messages with CPA | Yes | Client |
| `/portal/invoices` | Invoice history | Yes | Client |
| `/portal/invoices/[id]` | Invoice detail + pay | Yes | Client |
| `/portal/status` | Filing status tracker | Yes | Client |
| `/portal/questionnaire` | Tax questionnaire | Yes | Client |
| `/portal/settings` | Portal settings | Yes | Client |

### Demo Routes (demo layout)

| Route | Page | Auth | Role |
|---|---|---|---|
| `/demo` | Demo entry (choose firm) | Public | — |
| `/demo/[firmSlug]` | Demo dashboard | Demo session | — |
| `/demo/[firmSlug]/*` | All demo routes mirror dashboard routes | Demo session | — |

### Marketing Routes (marketing layout)

| Route | Page | Auth | Role |
|---|---|---|---|
| `/landing` | Landing page | Public | — |
| `/pricing` | Pricing page | Public | — |

---

## 2. Layout Hierarchy

```
RootLayout (app/layout.tsx)
├── (auth)/layout.tsx          → Centered card layout, no nav
│   ├── login/
│   ├── register/
│   ├── forgot-password/
│   └── mfa/
├── (dashboard)/layout.tsx     → Sidebar + Header + Main content
│   ├── Sidebar (collapsible, 280px expanded, 64px collapsed)
│   │   ├── Logo + firm name
│   │   ├── Nav sections:
│   │   │   ├── OVERVIEW: Dashboard
│   │   │   ├── CLIENTS: Clients, Documents
│   │   │   ├── WORKFLOW: Workflows, Tasks, Calendar
│   │   │   ├── BILLING: Time, Invoices, Reports
│   │   │   ├── TEAM: Team Analytics
│   │   │   └── SETTINGS: Integrations, Settings
│   │   ├── Active nav item highlighted
│   │   └── Collapse toggle button
│   ├── Header
│   │   ├── Breadcrumbs (auto-generated from route)
│   │   ├── Global search (Cmd+K)
│   │   ├── Notification bell (unread count badge)
│   │   ├── Timer indicator (if running)
│   │   └── User avatar + dropdown (profile, settings, logout)
│   └── Main content area (scrollable)
├── portal/layout.tsx          → Portal header + main (no sidebar)
│   ├── Portal header
│   │   ├── Firm logo (white-label if Scale tier)
│   │   ├── Portal nav: Dashboard, Documents, Messages, Invoices, Status
│   │   └── User dropdown (settings, logout)
│   └── Main content area
├── demo/layout.tsx            → Dashboard layout + demo banner
│   ├── Demo banner (top): "Demo Mode — [time remaining] — Sign Up"
│   ├── Guided tour overlay (optional)
│   └── Same sidebar/header as dashboard
└── marketing/layout.tsx       → Marketing header + footer
    ├── Marketing header (logo, nav, CTA buttons)
    └── Footer (links, legal)
```

---

## 3. Navigation Structure

### Sidebar Navigation Items

```typescript
const navigation = [
  {
    section: 'OVERVIEW',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['*'] },
    ]
  },
  {
    section: 'CLIENTS',
    items: [
      { name: 'Clients', href: '/clients', icon: Users, roles: ['*'], badge: 'clientCount' },
      { name: 'Documents', href: '/documents', icon: FileText, roles: ['*'] },
    ]
  },
  {
    section: 'WORKFLOW',
    items: [
      { name: 'Workflows', href: '/workflows', icon: GitBranch, roles: ['*'], badge: 'activeWorkflows' },
      { name: 'Tasks', href: '/tasks', icon: CheckSquare, roles: ['*'], badge: 'myTasks' },
      { name: 'Calendar', href: '/calendar', icon: Calendar, roles: ['*'], badge: 'upcomingDeadlines' },
    ]
  },
  {
    section: 'BILLING',
    items: [
      { name: 'Time Tracking', href: '/time', icon: Clock, roles: ['*'] },
      { name: 'Invoices', href: '/invoices', icon: Receipt, roles: ['Senior', 'Manager', 'Partner', 'Admin'] },
      { name: 'Reports', href: '/reports', icon: BarChart3, roles: ['Manager', 'Partner', 'Admin'] },
    ]
  },
  {
    section: 'TEAM',
    items: [
      { name: 'Team', href: '/team', icon: UsersRound, roles: ['Manager', 'Partner', 'Admin'] },
    ]
  },
  {
    section: 'SETTINGS',
    items: [
      { name: 'Integrations', href: '/integrations', icon: Plug, roles: ['Admin', 'Partner'] },
      { name: 'Settings', href: '/settings', icon: Settings, roles: ['*'] },
    ]
  },
];
```

### Breadcrumb Auto-Generation

```
/clients/[id]/documents → Dashboard > Clients > {Client Name} > Documents
/workflows/[id]         → Dashboard > Workflows > {Workflow Name}
/invoices/[id]          → Dashboard > Invoices > INV-{number}
/settings/firm          → Dashboard > Settings > Firm Settings
```

---

## 4. Responsive Breakpoints

| Breakpoint | Width | Layout Change |
|---|---|---|
| `sm` | 640px | Single column, bottom nav on portal |
| `md` | 768px | Sidebar collapses to icons |
| `lg` | 1024px | Sidebar expanded, 2-column layouts |
| `xl` | 1280px | Full layout, 3-column where applicable |
| `2xl` | 1536px | Max content width, centered |

### Mobile Behavior

- **Dashboard sidebar**: Hidden, hamburger menu opens overlay
- **Portal**: Bottom tab navigation (Dashboard, Docs, Messages, Invoices, More)
- **Tables**: Horizontal scroll or card view on mobile
- **Charts**: Responsive resize, simplified tooltips on touch
- **Forms**: Full-width, stacked fields
- **Modals**: Full-screen on mobile

---

## 5. Page Transition Animations (Framer Motion)

```typescript
const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.2, ease: 'easeInOut' }
};
```

Applied via `AnimatePresence` wrapper in layout.
