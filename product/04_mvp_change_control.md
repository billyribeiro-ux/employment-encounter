# MVP Scope Baseline & Change Control Protocol

> Source of Truth: MASTER_SPEC.md
> Baseline Date: 2026-02-10
> Scope Lock: Weeks 1-16 MVP

---

## 1. MVP Scope Baseline

### Included (139 Functional Requirements + 25 Non-Functional)

| Category | FR Count | Status |
|---|---|---|
| Authentication & Authorization | 10 | Locked |
| Multi-Tenancy | 9 | Locked |
| Client Management | 9 | Locked |
| Client Portal | 13 | Locked |
| Document Management & AI | 19 | Locked |
| Tax Workflow Automation | 7 | Locked |
| Task Management | 5 | Locked |
| Deadline & Compliance | 6 | Locked |
| Time Tracking & Invoicing | 16 | Locked |
| Analytics & Dashboard | 18 | Locked |
| Integrations (Priority 1) | 11 | Locked |
| Notifications | 4 | Locked |
| Onboarding & Migration | 6 | Locked |
| Demo Mode | 5 | Locked |
| Non-Functional | 25 | Locked |

### Excluded from MVP (Explicitly Out-of-Scope)

| ID | Feature | Phase | Rationale |
|---|---|---|---|
| OOS-201 | Plaid bank sync | Phase 2 | Priority 2 per MASTER_SPEC |
| OOS-202 | DocuSign e-signature | Phase 2 | Priority 2 per MASTER_SPEC |
| OOS-203 | Email integration (Gmail/Outlook) | Phase 2 | Phase 2 per MASTER_SPEC |
| OOS-204 | Calendar integration | Phase 2 | Phase 2 per MASTER_SPEC |
| OOS-205 | Tax software export | Phase 2 | Phase 2 per MASTER_SPEC |
| OOS-206 | Competitor import (Karbon/Canopy/TaxDome) | Phase 2 | Phase 2 per MASTER_SPEC |
| OOS-207 | AI tax planning tips | Phase 2 | Nice-to-have, not core |
| OOS-208 | Monthly estimated tax liability | Phase 2 | Depends on Plaid data |
| OOS-209 | FAQ knowledge base | Phase 2 | Content-dependent |
| OOS-210 | SOC 2 Type II certification | Month 9-12 | Per MASTER_SPEC timeline |
| OOS-301 | Payroll integration (ADP/Gusto) | Phase 3 | Priority 3 per MASTER_SPEC |
| OOS-302 | Mobile camera PWA receipt capture | Phase 3 | Enhancement |
| OOS-303 | Custom email templates (white-label) | Phase 3 | Scale tier enhancement |

---

## 2. Change Control Protocol

### 2.1 Change Request Format

```markdown
## Change Request CR-###

**Date:** YYYY-MM-DD
**Requestor:** [Name / Agent]
**Type:** [ ] Add Feature  [ ] Remove Feature  [ ] Modify Feature  [ ] Scope Swap

### Description
[What is being requested]

### MASTER_SPEC Reference
[Section and requirement ID, or "NEW — not in MASTER_SPEC"]

### Justification
[Why this change is needed]

### Impact Analysis
- **WBS Items Affected:** [list]
- **Dependencies Changed:** [list]
- **Critical Path Impact:** [ ] None  [ ] Extends by ___ days  [ ] Shortens by ___ days
- **Milestone Impact:** [which milestones affected]
- **Resource Impact:** [additional effort in person-days]
- **Risk Impact:** [new risks introduced]

### Trade-off (if adding scope)
[What will be removed or deferred to accommodate this?]

### Decision
- [ ] Approved
- [ ] Rejected
- [ ] Deferred to Phase 2
- **Decided By:** _______________
- **Date:** _______________
- **Rationale:** _______________
```

### 2.2 Approval Authority

| Change Type | Approver | Turnaround |
|---|---|---|
| Bug fix (no scope change) | Any agent lead | Same day |
| Requirement clarification (no new scope) | Product Agent | 1 day |
| Minor scope adjustment (< 2 person-days) | Program Orchestrator | 2 days |
| Major scope addition (> 2 person-days) | Program Orchestrator + Product Agent | 3 days |
| Security control change | Security Agent (veto power) | 1 day |
| Integration priority change | Program Orchestrator + Product Agent | 3 days |
| Timeline extension | Program Orchestrator (final authority) | 3 days |

### 2.3 Auto-Reject Criteria

A change request is automatically rejected if it:

1. **Adds a feature not in MASTER_SPEC** without documented business justification and scope swap
2. **Downgrades any security control** (encryption algorithm, hashing, RLS policy)
3. **Removes a compliance requirement** (audit trail, data retention, GDPR)
4. **Changes integration priority** without customer evidence from beta users
5. **Extends MVP timeline beyond Week 17** without executive approval
6. **Reduces test coverage** below MASTER_SPEC thresholds (75% unit, 20% integration, 5% E2E)
7. **Weakens RLS fail-safe behavior** (must always return zero rows without tenant context)

### 2.4 Scope Swap Rules

If new scope must be added:
1. Identify equivalent effort item(s) to defer
2. Deferred items move to Phase 2 backlog
3. Both addition and deferral documented in Change Request
4. Critical path must not extend
5. No security or compliance items may be swapped out

---

## 3. Change Request Log

| CR# | Date | Description | Type | Impact | Decision | Decided By |
|---|---|---|---|---|---|---|
| — | — | No changes yet | — | — | — | — |

---

## 4. Baseline Verification Schedule

| Checkpoint | When | Verifier |
|---|---|---|
| Scope baseline review | End of Week 3 (M1) | Program Orchestrator |
| Feature completeness check | End of Week 6 (M2) | Product Agent |
| Integration scope check | End of Week 9 (M3) | Integrations Agent |
| Security controls audit | End of Week 12 (M4) | Security Agent |
| Full scope verification | End of Week 14 (M5) | Program Orchestrator + QA |
| Pre-launch scope sign-off | End of Week 16 (M6) | All agents |
| Launch readiness | Week 17 (M7) | Program Orchestrator |

---

## 5. Conflict Register

> Log ambiguities or conflicts found between MASTER_SPEC and implementation here.

| CONF# | Date | Agent | Section | Description | Resolution | Status |
|---|---|---|---|---|---|---|
| CONF-001 | 2026-02-10 | Program Orchestrator | Tech Stack > Search | MASTER_SPEC mentions both Typesense and pgvector for search. Clarification: Typesense for full-text/instant search, pgvector for semantic similarity only. | Use both as specified — Typesense primary, pgvector for "find similar" | Resolved |
| CONF-002 | 2026-02-10 | Program Orchestrator | Pipelines > Bank Sync | Pipeline 5 (Plaid) is detailed but Plaid is Phase 2. MVP should build the framework but not the Plaid-specific implementation. | Build integration framework in MVP; Plaid-specific code deferred to Phase 2 | Resolved |
| CONF-003 | 2026-02-10 | Program Orchestrator | Client Portal > Smart Features | "Tax planning tips (personalized by AI)" and "Estimated tax liability (updated monthly)" listed under Client Portal but depend on Phase 2 data (Plaid). | Defer to Phase 2 (OOS-207, OOS-208) | Resolved |
