# State Management & Data Contracts

> Source of Truth: MASTER_SPEC.md
> Stack: TanStack Query v5, Zustand, Zod, WebSocket

---

## 1. State Architecture

### Server State (TanStack Query)
All data from the API is managed by TanStack Query. No server data in Zustand.

### Client State (Zustand)
UI-only state: sidebar collapsed, active timer, notification preferences, modal state, theme.

### URL State (Next.js searchParams)
Filters, pagination, sorting, active tab — all in URL for shareability.

### Form State (React Hook Form + Zod)
All forms use React Hook Form with Zod validation schemas shared with backend.

---

## 2. TanStack Query Key Convention

```typescript
// Pattern: [domain, scope, id?, params?]
const queryKeys = {
  clients: {
    all: ['clients'] as const,
    list: (params: ClientListParams) => ['clients', 'list', params] as const,
    detail: (id: string) => ['clients', 'detail', id] as const,
    search: (query: string) => ['clients', 'search', query] as const,
    analytics: (id: string) => ['clients', 'analytics', id] as const,
  },
  documents: {
    all: ['documents'] as const,
    list: (params: DocListParams) => ['documents', 'list', params] as const,
    detail: (id: string) => ['documents', 'detail', id] as const,
    byClient: (clientId: string) => ['documents', 'client', clientId] as const,
    search: (query: string) => ['documents', 'search', query] as const,
  },
  workflows: {
    all: ['workflows'] as const,
    list: (params: WorkflowListParams) => ['workflows', 'list', params] as const,
    detail: (id: string) => ['workflows', 'detail', id] as const,
    templates: ['workflows', 'templates'] as const,
  },
  tasks: {
    all: ['tasks'] as const,
    board: (params: TaskBoardParams) => ['tasks', 'board', params] as const,
    list: (params: TaskListParams) => ['tasks', 'list', params] as const,
    calendar: (range: DateRange) => ['tasks', 'calendar', range] as const,
  },
  time: {
    entries: (params: TimeEntryParams) => ['time', 'entries', params] as const,
    timesheet: (week: string) => ['time', 'timesheet', week] as const,
    activeTimer: ['time', 'active-timer'] as const,
  },
  invoices: {
    all: ['invoices'] as const,
    list: (params: InvoiceListParams) => ['invoices', 'list', params] as const,
    detail: (id: string) => ['invoices', 'detail', id] as const,
    aging: ['invoices', 'aging'] as const,
  },
  dashboard: {
    metrics: ['dashboard', 'metrics'] as const,
    insights: ['dashboard', 'insights'] as const,
    charts: (chartId: string) => ['dashboard', 'charts', chartId] as const,
  },
  integrations: {
    all: ['integrations'] as const,
    health: ['integrations', 'health'] as const,
    detail: (provider: string) => ['integrations', 'detail', provider] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    unreadCount: ['notifications', 'unread-count'] as const,
  },
  team: {
    utilization: ['team', 'utilization'] as const,
    members: ['team', 'members'] as const,
  },
  reports: {
    pl: (params: ReportParams) => ['reports', 'pl', params] as const,
    cashflow: (params: ReportParams) => ['reports', 'cashflow', params] as const,
    custom: (id: string) => ['reports', 'custom', id] as const,
  },
  compliance: {
    calendar: (params: CalendarParams) => ['compliance', 'calendar', params] as const,
    deadlines: (clientId?: string) => ['compliance', 'deadlines', clientId] as const,
  },
};
```

---

## 3. Zustand Stores

```typescript
// Auth store
interface AuthStore {
  user: User | null;
  tenant: Tenant | null;
  role: Role;
  permissions: Permission[];
  setUser: (user: User) => void;
  logout: () => void;
  hasPermission: (resource: string, action: string) => boolean;
}

// UI store
interface UIStore {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  commandPaletteOpen: boolean;
  setCommandPalette: (open: boolean) => void;
  activeModal: string | null;
  openModal: (id: string) => void;
  closeModal: () => void;
}

// Timer store
interface TimerStore {
  activeTimer: {
    clientId: string;
    clientName: string;
    startedAt: Date;
    pausedAt: Date | null;
    totalPausedMs: number;
    description: string;
  } | null;
  startTimer: (clientId: string, clientName: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => { clientId: string; durationMinutes: number; description: string };
  getElapsedMinutes: () => number;
}

// Notification store
interface NotificationStore {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  incrementUnread: () => void;
  decrementUnread: () => void;
}

// Demo store
interface DemoStore {
  isDemoMode: boolean;
  demoFirm: 'solo' | 'small' | 'medium' | null;
  sessionExpiresAt: Date | null;
  tourStep: number;
  setDemoMode: (firm: string, expiresAt: Date) => void;
  advanceTour: () => void;
}
```

---

## 4. Zod Validation Schemas (Shared Frontend/Backend)

```typescript
// Client
const clientCreateSchema = z.object({
  name: z.string().min(1).max(255),
  business_type: z.enum(['1040', '1120', '1120-S', '1065', '990', 'Other']),
  fiscal_year_end: z.enum(['Calendar', 'January', 'February', /* ... */ 'December']),
  tax_id: z.string().regex(/^\d{3}-\d{2}-\d{4}$|^\d{2}-\d{7}$/).optional(),
  primary_contact: z.object({
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
  }),
  assigned_cpa_id: z.string().uuid().optional(),
});

// Time Entry
const timeEntrySchema = z.object({
  client_id: z.string().uuid(),
  date: z.string().date(),
  hours: z.number().min(0.25).max(24).multipleOf(0.25),
  rate: z.number().min(0),
  description: z.string().min(1).max(1000),
  billable: z.boolean().default(true),
  service_type: z.string().optional(),
});

// Invoice
const invoiceCreateSchema = z.object({
  client_id: z.string().uuid(),
  type: z.enum(['hourly', 'flat_fee', 'hybrid']),
  line_items: z.array(z.object({
    description: z.string(),
    quantity: z.number().min(0),
    rate: z.number().min(0),
    amount: z.number(),
  })).min(1),
  due_date: z.string().date(),
  notes: z.string().optional(),
});

// Task
const taskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  assignee_id: z.string().uuid().optional(),
  client_id: z.string().uuid().optional(),
  due_date: z.string().date().optional(),
  priority: z.enum(['urgent', 'high', 'normal', 'low']).default('normal'),
  status: z.enum(['todo', 'in_progress', 'review', 'done']).default('todo'),
});

// Message
const messageSchema = z.object({
  client_id: z.string().uuid(),
  content: z.string().min(1).max(10000),
  parent_id: z.string().uuid().optional(),
  attachments: z.array(z.string().uuid()).optional(),
  mentions: z.array(z.string().uuid()).optional(),
});

// Auth
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  firm_name: z.string().min(1),
});
```

---

## 5. WebSocket Event Contracts

```typescript
// Client → Server
type WSClientEvent =
  | { type: 'subscribe'; channels: string[] }
  | { type: 'unsubscribe'; channels: string[] }
  | { type: 'message.send'; payload: { client_id: string; content: string } }
  | { type: 'message.read'; payload: { message_id: string } }
  | { type: 'typing.start'; payload: { client_id: string } }
  | { type: 'typing.stop'; payload: { client_id: string } };

// Server → Client
type WSServerEvent =
  | { type: 'message.new'; payload: Message }
  | { type: 'message.read'; payload: { message_id: string; read_at: string } }
  | { type: 'typing'; payload: { user_id: string; client_id: string } }
  | { type: 'notification'; payload: Notification }
  | { type: 'workflow.step_changed'; payload: { workflow_id: string; step: number } }
  | { type: 'document.processed'; payload: { document_id: string; category: string; confidence: number } }
  | { type: 'invoice.paid'; payload: { invoice_id: string; amount: number } }
  | { type: 'timer.reminder'; payload: { duration_minutes: number } }
  | { type: 'dashboard.metric_update'; payload: { metric: string; value: number } }
  | { type: 'integration.sync_complete'; payload: { provider: string; records: number } };

// Channel naming: tenant:{tenant_id}:user:{user_id}, tenant:{tenant_id}:client:{client_id}
```

---

## 6. API Response Envelope

```typescript
// Success
interface ApiResponse<T> {
  data: T;
  meta?: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

// Error
interface ApiError {
  error: {
    code: string;          // e.g., "VALIDATION_ERROR", "NOT_FOUND", "FORBIDDEN"
    message: string;       // Human-readable
    details?: Record<string, string[]>;  // Field-level errors
    request_id: string;    // For support/debugging
  };
}
```
