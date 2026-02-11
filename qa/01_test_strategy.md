# QA Test Strategy & Release Gates

> Source of Truth: MASTER_SPEC.md
> Targets: Unit 75%, Integration 20%, E2E 5%, Zero high/critical OWASP ZAP findings

---

## 1. Test Pyramid

```
         ┌─────────┐
         │  E2E    │  5% — Playwright (critical flows)
         │ (≥5%)  │
        ┌┴─────────┴┐
        │Integration │  20% — API + DB + Temporal
        │  (≥20%)   │
       ┌┴────────────┴┐
       │    Unit       │  75% — Vitest (FE) + cargo test (BE)
       │   (≥75%)     │
       └──────────────┘
```

---

## 2. Unit Testing

### Frontend (Vitest + React Testing Library)

| Area | Coverage Target | Key Tests |
|---|---|---|
| Zod schemas | 100% | All validation rules, edge cases |
| Utility functions | 100% | Date formatting, currency, masking |
| Custom hooks | 90% | useAuth, useTimer, useWebSocket |
| Zustand stores | 90% | State transitions, selectors |
| TanStack Query keys | 80% | Key generation, cache invalidation |
| Component rendering | 75% | Props, states, conditional rendering |
| Form validation | 90% | All form schemas, error messages |

### Backend (cargo test)

| Area | Coverage Target | Key Tests |
|---|---|---|
| Validation logic | 100% | All input validators |
| Business rules | 95% | Invoice generation, deadline calculation, AI confidence thresholds |
| Auth (JWT, Argon2) | 100% | Token sign/verify, password hash/verify, MFA |
| Encryption | 100% | AES-256-GCM encrypt/decrypt, KMS envelope |
| Error mapping | 90% | All error types → HTTP status codes |
| Rate limiting | 90% | Sliding window, tier limits |
| Data mapping | 90% | QB/Stripe/Drive schema mapping |
| RBAC | 100% | All role × resource × action combinations |

---

## 3. Integration Testing

### API Integration Tests

| Category | Tests | Approach |
|---|---|---|
| Auth flow | Register → login → MFA → refresh → logout | Real DB, real Redis |
| Client CRUD | Create → read → update → soft-delete | Real DB with RLS |
| RLS isolation | Tenant A cannot see Tenant B data | Two test tenants |
| Document upload | tus upload → AI categorization → search indexing | Real S3 (localstack), mock Claude |
| Workflow lifecycle | Create → advance → reject → re-advance → complete | Real Temporal (test server) |
| Invoice pipeline | Time entries → invoice → send → payment webhook | Real DB, mock Stripe |
| Integration sync | QB OAuth → initial sync → ongoing sync | Mock QB API |
| WebSocket | Connect → subscribe → receive events | Real WS server |
| Search | Index → search → typo tolerance | Real Typesense |

### Database Integration Tests

| Test | Verification |
|---|---|
| RLS fail-safe | Query without `app.current_tenant` returns 0 rows |
| RLS enforcement | Each table tested with two tenants |
| Migration rollback | Each migration can be rolled back cleanly |
| Materialized view refresh | Concurrent refresh doesn't block reads |
| Audit log partitioning | Inserts go to correct partition |
| Encryption round-trip | Encrypt → store → read → decrypt matches original |

---

## 4. End-to-End Testing (Playwright)

### Critical Flows (Must Pass for Release)

| # | Flow | Steps | Assertions |
|---|---|---|---|
| E2E-01 | CPA Login + Dashboard | Login → MFA → dashboard loads → metrics visible | All 5 metric cards render, charts animate |
| E2E-02 | Client Creation | New client → fill form → save → appears in list | Client in list, SSN masked, search works |
| E2E-03 | Document Upload + AI | Upload W-2 → AI categorizes → appears in docs | Category correct, confidence shown, searchable |
| E2E-04 | Workflow Execution | Create workflow → advance steps → partner approve | Status updates, notifications sent |
| E2E-05 | Time → Invoice → Payment | Log time → generate invoice → client pays | Invoice PDF correct, status = paid |
| E2E-06 | Client Portal | Client login → view dashboard → upload doc → message CPA | Portal renders, upload works, message delivered |
| E2E-07 | Demo Mode | Enter demo → guided tour → explore features → session expires | Demo data loads, no real payments, auto-reset |
| E2E-08 | Onboarding Wizard | Register → 7-step wizard → CSV import → first client | Wizard completes, data imported |

### Playwright Configuration

```typescript
// playwright.config.ts
{
  testDir: './tests/e2e',
  timeout: 60_000,
  retries: 2,
  workers: 4,
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'mobile', use: { ...devices['iPhone 14'] } },
  ],
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: true,
  },
}
```

---

## 5. Security Testing

### OWASP ZAP Automated Scan

- Run on every PR to staging
- Full scan on every release candidate
- **Gate**: Zero high/critical findings
- Medium findings: must have mitigation plan before release

### Manual Security Tests

| Test | Frequency | Owner |
|---|---|---|
| Penetration test | Before launch + quarterly | External vendor |
| RLS bypass attempts | Every milestone | Security Agent |
| JWT manipulation | Every milestone | Security Agent |
| CORS bypass attempts | Every milestone | Security Agent |
| SQL injection (SQLx prevents, but verify) | Every milestone | QA Agent |
| XSS via document names/descriptions | Every milestone | QA Agent |
| CSRF protection verification | Every milestone | Security Agent |
| Rate limit bypass attempts | Every milestone | QA Agent |

### Dependency Auditing

- `cargo audit` — run in CI on every build
- `npm audit` — run in CI on every build
- **Gate**: Zero critical vulnerabilities
- High vulnerabilities: must have mitigation within 48 hours

---

## 6. Load Testing

### Tool: k6

### Scenarios

| Scenario | VUs | Duration | Target |
|---|---|---|---|
| Normal load | 200 concurrent | 10 min | p95 < 200ms, 0 errors |
| Peak load | 500 concurrent | 5 min | p95 < 500ms, < 0.1% errors |
| Spike test | 0 → 1000 in 30s | 2 min | No crashes, graceful degradation |
| Soak test | 200 concurrent | 1 hour | No memory leaks, stable latency |
| WebSocket | 500 connections | 10 min | < 2s message delivery |

### Key Endpoints to Load Test

| Endpoint | Expected RPS | p95 Target |
|---|---|---|
| GET /api/v1/dashboard/metrics | 100 | < 50ms (Redis cached) |
| GET /api/v1/clients | 200 | < 100ms |
| GET /api/v1/clients/search | 300 | < 50ms (Typesense) |
| POST /api/v1/time-entries | 100 | < 200ms |
| POST /api/v1/documents (upload) | 50 | < 500ms (excluding S3) |
| GET /api/v1/notifications | 200 | < 100ms |
| WebSocket message delivery | 500 | < 2000ms |

---

## 7. AI Validation Testing

### Document Categorization Benchmark

| Metric | Target | Method |
|---|---|---|
| Overall accuracy | ≥ 90% | 500-document benchmark dataset |
| W-2 accuracy | ≥ 95% | 100 W-2 samples |
| 1099 accuracy | ≥ 90% | 100 1099 samples (all subtypes) |
| Receipt accuracy | ≥ 85% | 100 receipt samples |
| Confidence calibration | Within 5% of actual | Compare confidence vs actual accuracy |
| False positive rate (auto-accept) | < 5% | Documents with confidence > 95% |
| Processing time | < 5s per document | Median across benchmark |

### AI Fallback Testing

- Verify rule-based fallback activates when Claude API is unavailable
- Verify fallback insights are reasonable (not empty)
- Verify graceful degradation messaging to users

---

## 8. Release Gates

### Per-PR Gates (CI)

- [ ] `cargo check` passes
- [ ] `cargo clippy` — zero warnings
- [ ] `cargo test` — all pass
- [ ] `sqlx prepare --check` — migrations verified
- [ ] Frontend typecheck (`tsc --noEmit`)
- [ ] Frontend lint (`eslint`)
- [ ] Frontend unit tests (`vitest`)
- [ ] `cargo audit` — zero critical
- [ ] `npm audit` — zero critical

### Per-Milestone Gates

- [ ] All PR gates pass
- [ ] Integration tests pass (real DB, real services)
- [ ] E2E critical flows pass (Playwright)
- [ ] OWASP ZAP scan — zero high/critical
- [ ] RLS verification — zero rows without tenant context
- [ ] Load test — p95 < 200ms at 200 VUs
- [ ] Coverage: unit ≥ 75%, integration ≥ 20%, E2E ≥ 5%
- [ ] Security checklist (from security/01_threat_model_controls.md)
- [ ] No-drift guardrail check (from program/06_no_drift_guardrail.md)

### Pre-Launch Gates (Week 16)

- [ ] All milestone gates pass
- [ ] Penetration test completed — zero critical findings
- [ ] AI benchmark — ≥ 90% accuracy
- [ ] Load test — 500 VU peak sustained
- [ ] Soak test — 1 hour stable
- [ ] DR test — backup restore verified
- [ ] Demo mode — all 3 firms functional
- [ ] Onboarding wizard — CSV + QB import verified
- [ ] Client portal — full flow verified on mobile
- [ ] Accessibility audit — WCAG 2.1 AA
- [ ] Documentation complete (API docs, admin ops, support playbooks)
