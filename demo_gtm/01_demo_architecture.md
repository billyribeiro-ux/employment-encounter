# Demo Mode Architecture & GTM Plan

> Source of Truth: MASTER_SPEC.md > Demo Mode, Landing Page, Beta Program

---

## 1. Demo Mode Architecture

### 3 Seeded Demo Firms

| Firm | Type | Users | Clients | Data Volume |
|---|---|---|---|---|
| **Solo CPA** | 1-person practice | 1 CPA + 3 clients | 3 | Light: 20 docs, 50 time entries, 5 invoices |
| **Small Firm** | 5-person firm | 5 CPAs + 25 clients | 25 | Medium: 200 docs, 500 time entries, 50 invoices |
| **Medium Firm** | 15-person firm | 15 CPAs + 100 clients | 100 | Heavy: 1000 docs, 2000 time entries, 200 invoices |

### Session Management

- **Duration**: 30 minutes per session
- **No signup required**: Generate temporary demo user with demo tenant
- **Auto-reset**: Session data destroyed after 30 minutes
- **Concurrent sessions**: Max 50 demo sessions (rate limited)
- **Session storage**: Redis with TTL (key: `demo:{session_id}`)

### Data Isolation

```
Demo Tenant Architecture:
1. Each demo session creates a temporary tenant (tier: "demo")
2. Seed data cloned from template into temporary tenant
3. RLS enforces isolation (same as production tenants)
4. After 30 min: Temporal workflow triggers cleanup
   - Soft-delete tenant
   - Clear Redis keys
   - Delete S3 demo objects
5. No cross-contamination with production data
```

### Safeguards (FR-1405)

| Safeguard | Implementation |
|---|---|
| No real payments | Stripe in test mode, no real charges |
| No external webhooks | Webhook endpoints disabled for demo tenants |
| No real emails | Email service returns mock success, no actual delivery |
| No real integrations | QB/Drive OAuth disabled, mock sync data shown |
| No data persistence | All data destroyed after session |
| Rate limited | 50 req/min (vs 100+ for real tenants) |
| No file uploads to prod S3 | Demo uploads go to `/demo/` prefix, auto-cleaned |

### Guided Tour

```
Step 1: Welcome → Choose firm size (Solo / Small / Medium)
Step 2: Dashboard overview → Highlight metric cards + AI insights
Step 3: Client management → Open a client workspace
Step 4: Document upload → Demo AI categorization (pre-loaded result)
Step 5: Workflow → Show tax season workflow in progress
Step 6: Time tracking → Start/stop timer demo
Step 7: Invoice → View generated invoice + payment flow
Step 8: Analytics → Interactive charts
Step 9: Client portal → Switch to client view
Step 10: CTA → "Ready to get started? Sign up now"
```

Tour implementation: Floating tooltip overlay (Framer Motion), skip button, progress dots.

---

## 2. Landing Page

### URL: cpaplatform.io

### Sections

1. **Hero**: Headline + subheadline + CTA ("Start Free Trial" / "Try Demo")
2. **Problem**: "Your firm is drowning in spreadsheets, missed deadlines, and manual billing"
3. **Solution**: 6 feature pillars with animated icons
4. **Dashboard Preview**: Interactive screenshot/video of firm dashboard
5. **Social Proof**: Testimonials from beta CPAs (placeholder for launch)
6. **Pricing**: 3 tiers (Solo, Growing, Scale)
7. **FAQ**: Common questions
8. **Footer CTA**: "Start your 14-day free trial"

### Performance Targets

- Lighthouse Performance: ≥ 95
- FCP: < 1.0s
- LCP: < 2.0s
- CLS: < 0.1
- Static generation (Next.js SSG)

---

## 3. Pricing Page

### Tiers (from MASTER_SPEC)

| Feature | Solo ($49/mo) | Growing ($149/mo) | Scale ($349/mo) |
|---|---|---|---|
| Users | 1-3 | 4-15 | 16-50 |
| Clients | Up to 50 | Up to 200 | Unlimited |
| Storage | 10 GB | 50 GB | 250 GB |
| AI Categorization | 100/mo | 500/mo | Unlimited |
| Integrations | QB + Stripe | All Priority 1 | All + Priority 2 |
| Custom Workflows | 3 templates | 10 templates | Unlimited |
| Reports | Basic | Advanced | Custom builder |
| White-label | No | No | Yes |
| Support | Email | Email + Chat | Priority + Phone |
| API Access | No | Read-only | Full |

### Pricing Page Features

- Toggle: Monthly / Annual (20% discount)
- Feature comparison table
- "Most Popular" badge on Growing tier
- FAQ section
- Enterprise contact form

---

## 4. Beta Program

### Phase 1: Closed Beta (Weeks 14-16)

| Parameter | Value |
|---|---|
| Target | 10-20 CPA firms |
| Duration | 2-4 weeks |
| Recruitment | Direct outreach, CPA forums, LinkedIn |
| Incentive | 6 months free on Growing tier |
| Feedback | Weekly survey + 30-min interview |
| Support | Dedicated Slack channel |

### Beta Acceptance Criteria

- Firm has 1-15 active CPAs
- Currently using spreadsheets or basic tools (not Karbon/Canopy)
- Willing to import real client data (anonymized for our analysis)
- Available for weekly feedback sessions
- Agrees to NDA

### Beta Success Metrics

| Metric | Target |
|---|---|
| Onboarding completion rate | ≥ 80% |
| Daily active users (after week 1) | ≥ 60% of invited |
| Document upload adoption | ≥ 50% of firms |
| Workflow creation | ≥ 30% of firms |
| NPS score | ≥ 40 |
| Critical bugs reported | < 5 per firm |
| Data migration success rate | ≥ 90% |

### Beta Feedback Loop

1. **In-app feedback widget**: Thumbs up/down + comment on every page
2. **Weekly survey**: 5-question NPS + feature satisfaction
3. **Usage analytics**: Track feature adoption, drop-off points
4. **Interview**: 30-min call with each firm lead (biweekly)
5. **Bug reporting**: In-app bug report with screenshot capture

### Beta → Launch Transition

- Fix all P1/P2 bugs from beta feedback
- Implement top 3 feature requests (if within MVP scope)
- Migrate beta firms to production (no data loss)
- Convert beta pricing to standard pricing after 6-month free period
- Publish case studies from willing beta participants
