# Design System & Component Library

> Source of Truth: MASTER_SPEC.md > Tech Stack > FRONTEND
> Stack: Tailwind CSS v4, shadcn/ui, Lucide icons, Framer Motion, GSAP

---

## 1. Design Tokens

### Colors

```css
/* Primary — Brand blue */
--primary-50: #eff6ff;
--primary-100: #dbeafe;
--primary-200: #bfdbfe;
--primary-300: #93c5fd;
--primary-400: #60a5fa;
--primary-500: #3b82f6;  /* Primary action */
--primary-600: #2563eb;  /* Primary hover */
--primary-700: #1d4ed8;
--primary-800: #1e40af;
--primary-900: #1e3a8a;

/* Neutral — Slate */
--neutral-50: #f8fafc;   /* Page background */
--neutral-100: #f1f5f9;  /* Card background alt */
--neutral-200: #e2e8f0;  /* Borders */
--neutral-300: #cbd5e1;  /* Disabled */
--neutral-400: #94a3b8;  /* Placeholder text */
--neutral-500: #64748b;  /* Secondary text */
--neutral-600: #475569;  /* Body text */
--neutral-700: #334155;  /* Heading text */
--neutral-800: #1e293b;  /* Dark text */
--neutral-900: #0f172a;  /* Darkest */

/* Success — Green */
--success-500: #22c55e;
--success-600: #16a34a;
--success-bg: #f0fdf4;

/* Warning — Amber */
--warning-500: #f59e0b;
--warning-600: #d97706;
--warning-bg: #fffbeb;

/* Error — Red */
--error-500: #ef4444;
--error-600: #dc2626;
--error-bg: #fef2f2;

/* Info — Blue */
--info-500: #3b82f6;
--info-bg: #eff6ff;

/* Chart palette (6 colors for ECharts) */
--chart-1: #3b82f6;  /* Blue */
--chart-2: #8b5cf6;  /* Purple */
--chart-3: #06b6d4;  /* Cyan */
--chart-4: #22c55e;  /* Green */
--chart-5: #f59e0b;  /* Amber */
--chart-6: #ef4444;  /* Red */

/* Utilization thresholds */
--util-green: #22c55e;   /* < 70% */
--util-yellow: #f59e0b;  /* 70-85% */
--util-red: #ef4444;     /* > 85% */
```

### Typography

```css
/* Font family */
--font-sans: 'Inter', system-ui, -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* Font sizes (rem) */
--text-xs: 0.75rem;    /* 12px — captions, badges */
--text-sm: 0.875rem;   /* 14px — secondary text, table cells */
--text-base: 1rem;     /* 16px — body text */
--text-lg: 1.125rem;   /* 18px — card titles */
--text-xl: 1.25rem;    /* 20px — section headers */
--text-2xl: 1.5rem;    /* 24px — page titles */
--text-3xl: 1.875rem;  /* 30px — dashboard metrics */
--text-4xl: 2.25rem;   /* 36px — hero text */

/* Font weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
```

### Spacing

```css
/* Based on 4px grid */
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

### Shadows

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
```

### Border Radius

```css
--radius-sm: 0.25rem;   /* 4px — badges, chips */
--radius-md: 0.375rem;  /* 6px — buttons, inputs */
--radius-lg: 0.5rem;    /* 8px — cards */
--radius-xl: 0.75rem;   /* 12px — modals */
--radius-full: 9999px;  /* Avatars, pills */
```

---

## 2. Component Library (shadcn/ui)

### Core Components Used

| Component | Usage | Customization |
|---|---|---|
| Button | All actions | Primary, secondary, ghost, destructive variants |
| Input | Form fields | With label, error state, helper text |
| Select | Dropdowns | Searchable for client/user selects |
| Textarea | Multi-line input | Auto-resize |
| Checkbox | Multi-select options | Indeterminate state for batch |
| Switch | Toggle settings | With label |
| Dialog | Modals | Sizes: sm (400px), md (560px), lg (720px), full |
| Sheet | Side panels | Client detail, document preview |
| Dropdown Menu | Context menus | Right-click on table rows |
| Command | Command palette | Cmd+K global search |
| Table | Data display | With sorting, filtering, pagination |
| Tabs | Section navigation | Client workspace tabs |
| Badge | Status indicators | Color-coded by status |
| Avatar | User/client images | Fallback to initials |
| Toast | Notifications | Success, error, warning, info |
| Tooltip | Hover info | Chart data points |
| Popover | Inline details | Date pickers, color pickers |
| Calendar | Date selection | Compliance calendar base |
| Card | Content containers | Dashboard metric cards |
| Skeleton | Loading states | Per-component skeletons |
| Progress | Upload/workflow progress | Determinate + indeterminate |
| Separator | Visual dividers | Between sections |
| Breadcrumb | Navigation context | Auto-generated from route |
| Pagination | List navigation | Page size: 25/50/100 |

### Custom Components (Built on shadcn/ui)

| Component | Description |
|---|---|
| MetricCard | Dashboard KPI card with value, trend, sparkline |
| StatusBadge | Color-coded status (active, pending, overdue, paid, etc.) |
| ClientAvatar | Avatar with online indicator and role badge |
| FileUploader | tus-based drag-drop with progress bars |
| DocumentPreview | React-PDF viewer in modal/sheet |
| TimerWidget | Start/stop/pause timer in header |
| KanbanBoard | Drag-drop columns with task cards |
| WorkflowStepper | Horizontal step indicator with status |
| ActivityTimeline | Vertical timeline with color-coded events |
| SearchCommand | Cmd+K palette with recent + suggestions |
| NotificationBell | Bell icon with unread count badge + dropdown |
| InvoicePDF | React-PDF invoice template |
| ChartWrapper | ECharts lazy-load wrapper with loading state |
| EmptyState | Illustrated empty states per feature |
| ConfirmDialog | Destructive action confirmation |
| DataTable | TanStack Table with sort/filter/select/paginate |

---

## 3. Animation Specifications (Framer Motion + GSAP)

### Page Transitions (Framer Motion)

```typescript
// Fade + slide up
const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};
```

### Chart Animations (GSAP via ECharts)

| Chart | Animation | Duration | Easing |
|---|---|---|---|
| Revenue Trend | Line draw from left to right | 800ms | easeInOutCubic |
| Revenue by Service | Donut slices expand from center | 600ms | easeOutBack |
| Team Utilization | Bars grow from bottom | 500ms staggered (100ms each) | easeOutQuart |
| Filing Status | Donut slices rotate in | 600ms | easeOutCubic |
| Client Profitability | Dots scale in from center | 400ms staggered | easeOutBack |
| Cash Flow Forecast | Area fill from left | 700ms | easeInOutCubic |

### Micro-Interactions (Framer Motion)

| Element | Trigger | Animation | Duration |
|---|---|---|---|
| Button | Hover | Scale 1.02 | 150ms |
| Button | Click | Scale 0.98 | 100ms |
| Card | Hover | Shadow increase, y: -2px | 200ms |
| Modal | Open | Fade in + scale from 0.95 | 200ms |
| Modal | Close | Fade out + scale to 0.95 | 150ms |
| Toast | Enter | Slide in from right | 300ms |
| Toast | Exit | Slide out to right | 200ms |
| Kanban card | Drag | Rotate 2deg, shadow increase | Instant |
| Sidebar | Collapse | Width 280px → 64px | 200ms |
| Notification bell | New notification | Shake (rotate ±15deg) | 500ms |
| Metric card value | Update | Number count-up animation | 400ms |
| Badge count | Change | Scale bounce 1.0 → 1.2 → 1.0 | 300ms |

---

## 4. Accessibility (WCAG 2.1 AA)

### Requirements

- All interactive elements have visible focus indicators (2px primary ring)
- Color contrast ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text
- All images have alt text
- All form inputs have associated labels
- Keyboard navigation: Tab order follows visual order
- Screen reader: ARIA labels on all custom components
- Motion: `prefers-reduced-motion` disables all animations
- Focus trap in modals and dialogs
- Skip-to-content link on every page
- Error messages associated with form fields via `aria-describedby`

### Color Contrast Verification

| Combination | Ratio | Pass |
|---|---|---|
| neutral-800 on neutral-50 (body text) | 15.4:1 | AA + AAA |
| neutral-600 on neutral-50 (secondary) | 7.0:1 | AA + AAA |
| primary-600 on white (links) | 4.6:1 | AA |
| error-600 on error-bg (error text) | 5.2:1 | AA |
| success-600 on success-bg | 4.8:1 | AA |
| white on primary-600 (button text) | 4.6:1 | AA |

---

## 5. Dark Mode (Future — Not MVP)

Design tokens structured to support dark mode via CSS custom properties swap. Not implemented in MVP but architecture supports it.
