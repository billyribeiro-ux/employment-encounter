# No-Drift Guardrail

> Source of Truth: MASTER_SPEC.md
> Purpose: Ensure every implementation artifact traces back to a specific requirement. Prevent scope creep and requirement drift.

---

## 1. Requirement ID Schema

All requirement IDs are derived from MASTER_SPEC.md headings and subheadings.

### ID Format: `[SECTION]-[PILLAR]-[FEATURE]-[SEQ]`

| Prefix | MASTER_SPEC Section | Example |
|---|---|---|
| EXEC | Executive Summary | EXEC-001 |
| MKT | Market Opportunity | MKT-001 |
| PROB | Core Problem & Solution | PROB-001 |
| P1-CM | Pillar 1: Client Management | P1-CM-PORTAL-001 |
| P1-CW | Pillar 1: Client Workspace | P1-CW-DASH-001 |
| P1-MSG | Pillar 1: Secure Messaging | P1-MSG-001 |
| P2-WF | Pillar 2: Tax Workflow Automation | P2-WF-TMPL-001 |
| P2-TASK | Pillar 2: Task Management | P2-TASK-001 |
| P2-DL | Pillar 2: Deadline Tracking | P2-DL-001 |
| P3-DASH | Pillar 3: Firm Dashboard | P3-DASH-001 |
| P3-CHART | Pillar 3: Charts & Visualizations | P3-CHART-001 |
| P3-CLAN | Pillar 3: Client Analytics | P3-CLAN-001 |
| P3-RPT | Pillar 3: Financial Reporting | P3-RPT-001 |
| P4-DOC | Pillar 4: Document Management | P4-DOC-UPLOAD-001 |
| P4-AI | Pillar 4: AI Categorization | P4-AI-001 |
| P4-SRCH | Pillar 4: Document Search | P4-SRCH-001 |
| P5-TIME | Pillar 5: Time Tracking | P5-TIME-001 |
| P5-INV | Pillar 5: Invoice Generation | P5-INV-001 |
| P5-PAY | Pillar 5: Payment Processing | P5-PAY-001 |
| P5-EXP | Pillar 5: Expense Tracking | P5-EXP-001 |
| P5-UTIL | Pillar 5: Utilization Analytics | P5-UTIL-001 |
| P6-QB | Pillar 6: QuickBooks Integration | P6-QB-001 |
| P6-GDRIVE | Pillar 6: Google Drive Integration | P6-GDRIVE-001 |
| P6-STRIPE | Pillar 6: Stripe Integration | P6-STRIPE-001 |
| P6-PLAID | Pillar 6: Plaid Integration | P6-PLAID-001 |
| P6-DSIGN | Pillar 6: DocuSign Integration | P6-DSIGN-001 |
| P6-EMAIL | Pillar 6: Email Integration | P6-EMAIL-001 |
| P6-CAL | Pillar 6: Calendar Integration | P6-CAL-001 |
| P6-TAX | Pillar 6: Tax Software Export | P6-TAX-001 |
| P6-PAYRL | Pillar 6: Payroll Integration | P6-PAYRL-001 |
| MT | Multi-Tenancy Architecture | MT-RLS-001 |
| SEC | Security Architecture | SEC-AUTH-001 |
| MIG | Data Migration & Onboarding | MIG-CSV-001 |
| PIPE | Processing Pipelines | PIPE-DOC-001 |
| ANLYT | Analytics & Reporting | ANLYT-DASH-001 |
| STACK | Tech Stack | STACK-FE-001 |
| DEVOPS | DevOps & Infrastructure | DEVOPS-CI-001 |

---

## 2. Traceability Template

Every agent artifact (design doc, code module, test case, deployment config) MUST include a traceability header:

```yaml
# --- TRACEABILITY ---
# artifact: [filename or module name]
# agent: [agent name]
# requirement_ids:
#   - P1-CM-PORTAL-001
#   - P1-CM-PORTAL-002
#   - SEC-AUTH-001
# master_spec_section: "Complete Feature Set > Pillar 1 > Client Portal"
# wbs_ref: WBS-2.3.2
# status: [draft | in_progress | complete | verified]
# last_verified: 2026-MM-DD
# --- END TRACEABILITY ---
```

### Rules for Traceability Headers

1. **Every source file** in `backend/src/` and `frontend/src/` that implements a feature MUST have a traceability comment at the top
2. **Every test file** MUST reference the requirement IDs it validates
3. **Every migration file** MUST reference the data model requirement IDs
4. **Every API endpoint** MUST map to one or more requirement IDs in the API implementation matrix
5. **Every Temporal workflow** MUST reference the pipeline requirement IDs

---

## 3. Drift Detection Rules

### Rule 1: No Unauthorized Features
- Any feature not traceable to a MASTER_SPEC requirement ID is **unauthorized scope**
- Must be logged in the Conflict Register with justification
- Requires explicit approval before merge

### Rule 2: No Requirement Downgrades
- If MASTER_SPEC says "AES-256-GCM encryption," implementation cannot use AES-128
- If MASTER_SPEC says "Argon2id," implementation cannot use bcrypt
- If MASTER_SPEC says "RLS on every table," no table may skip RLS
- If MASTER_SPEC says "95% confidence auto-accept," threshold cannot be changed to 90%

### Rule 3: No Terminology Changes
- MASTER_SPEC uses "tenant" → code uses "tenant" (not "organization" or "account")
- MASTER_SPEC uses "Client Portal" → UI uses "Client Portal" (not "Customer Dashboard")
- MASTER_SPEC uses "Staff Accountant" → RBAC uses "Staff Accountant" (not "Junior")
- All role names, feature names, and tier names must match MASTER_SPEC exactly

### Rule 4: No Phase Violations
- Phase 1 (MVP) features only in Weeks 1-16
- Phase 2 features (Plaid, DocuSign, Email, Calendar, Tax Export) NOT in MVP
- Phase 3 features (Payroll) NOT in MVP or Phase 2
- Any attempt to pull Phase 2/3 features into MVP must go through change control

### Rule 5: No Integration Priority Changes
- Priority 1 (MVP): QuickBooks, Google Drive, Stripe
- Priority 2 (Phase 2): Plaid, DocuSign, Email, Calendar, Tax Software
- Priority 3 (Phase 3): ADP, Gusto
- Order cannot be changed without change control

---

## 4. Compliance Verification Checklist

Run this checklist at every milestone gate (M1-M7):

```markdown
## Drift Check — Milestone [M#]

### Coverage
- [ ] All WBS items for this milestone have traceability headers
- [ ] All requirement IDs for this milestone are covered by at least one artifact
- [ ] No requirement IDs are orphaned (referenced but not implemented)

### Accuracy
- [ ] All security controls match MASTER_SPEC tier levels exactly
- [ ] All RBAC permissions match the MASTER_SPEC role matrix exactly
- [ ] All integration priorities match MASTER_SPEC phase assignments
- [ ] All pipeline error handling matches MASTER_SPEC flow diagrams
- [ ] All deadline reminder cadences match MASTER_SPEC (30d, 14d, 7d, 1d, day-of, missed)
- [ ] All confidence thresholds match MASTER_SPEC (95%, 75%, <75%)

### Unauthorized Scope
- [ ] No features exist that cannot be traced to a MASTER_SPEC requirement
- [ ] No Phase 2/3 features have been implemented
- [ ] No new integrations have been added beyond MASTER_SPEC list

### Terminology
- [ ] All user-facing labels match MASTER_SPEC terminology
- [ ] All role names match MASTER_SPEC RBAC table
- [ ] All tier names match MASTER_SPEC pricing (Solo, Growing, Scale)

### Sign-off
- Program Orchestrator: _____________ Date: _______
- Security Agent: _____________ Date: _______
- QA Agent: _____________ Date: _______
```

---

## 5. Conflict Register Template

When ambiguity or conflict is found between MASTER_SPEC and implementation:

| Field | Value |
|---|---|
| **Conflict ID** | CONF-### |
| **Date Identified** | YYYY-MM-DD |
| **Identified By** | [Agent Name] |
| **MASTER_SPEC Section** | [Section reference] |
| **Requirement ID** | [REQ-ID] |
| **Description** | [What is ambiguous or conflicting] |
| **Option A** | [Interpretation A] |
| **Option B** | [Interpretation B] |
| **Recommendation** | [Agent's recommended resolution] |
| **Decision** | [Final decision] |
| **Decided By** | [Authority] |
| **Decision Date** | YYYY-MM-DD |
| **Impact** | [WBS items affected] |

---

## 6. Decision Log Template

All architectural and scope decisions must be logged:

| Field | Value |
|---|---|
| **Decision ID** | DEC-### |
| **Date** | YYYY-MM-DD |
| **Context** | [Why this decision was needed] |
| **Decision** | [What was decided] |
| **Alternatives Considered** | [What else was evaluated] |
| **Rationale** | [Why this option was chosen] |
| **MASTER_SPEC Alignment** | [Which requirement IDs this supports] |
| **Impact** | [What changes as a result] |
| **Reversibility** | [Easy / Medium / Hard to reverse] |

---

## 7. Change Control Process

Any change to MVP scope requires:

1. **Request**: Filed in `/product/04_mvp_change_control.md`
2. **Impact Analysis**: Which WBS items, dependencies, and milestones are affected
3. **MASTER_SPEC Check**: Is this change authorized by MASTER_SPEC or is it new scope?
4. **Critical Path Impact**: Does this delay launch?
5. **Approval**: Program Orchestrator + Product Agent sign-off
6. **Documentation**: Decision logged, WBS updated, traceability headers updated

### Auto-Reject Criteria
- Adds a feature not in MASTER_SPEC without business justification
- Downgrades a security control
- Removes a compliance requirement
- Changes integration priority without customer evidence
- Extends MVP timeline beyond 17 weeks
