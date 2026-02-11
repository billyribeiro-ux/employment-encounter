# Security Threat Model & Controls

> Source of Truth: MASTER_SPEC.md > Security Architecture
> Compliance: IRS Pub 4557, FTC Safeguards Rule, SOC 2 Type I readiness, GDPR

---

## 1. Data Classification

| Tier | Classification | Examples | Encryption | Access | Logging |
|---|---|---|---|---|---|
| Tier 1 | Critical PII | SSN, EIN, bank accounts, tax returns | AES-256-GCM per-tenant key (KMS envelope) | Partner/Admin only | Full audit, never in logs |
| Tier 2 | Sensitive Financial | Invoices, payments, time entries, revenue | Encrypted at rest (volume/TDE) | Role-based (Senior+) | Audit trail |
| Tier 3 | Internal Business | Client names, contacts, workflows, tasks | Encrypted at rest | All authenticated (tenant-scoped) | Access logged |
| Tier 4 | Public | Firm name, pricing tiers, landing page | Standard | Public | Aggregate only |

---

## 2. Threat Model (STRIDE)

### T1: Spoofing (Identity)

| Threat | Mitigation | Control |
|---|---|---|
| Credential stuffing | Rate limiting: 5 failed logins → 15 min lockout | FR-106 |
| Weak passwords | 12 char min + HaveIBeenPwned check | FR-107 |
| Token theft | httpOnly cookies, short-lived JWT (15 min), RS256 signing | FR-103 |
| Session hijacking | Per-device sessions, IP binding, remote logout | FR-105 |
| Privilege escalation | MFA required for Partner/Admin roles | FR-104 |

### T2: Tampering

| Threat | Mitigation | Control |
|---|---|---|
| Request body manipulation | Server-side validation (Zod-equivalent), compile-time SQL | Backend |
| JWT modification | RS256 asymmetric signing (private key never leaves server) | FR-103 |
| Webhook forgery | Signature verification (Stripe, QB) | FR-1110 |
| Database tampering | RLS policies, audit trail, no direct DB access | FR-202 |
| File upload malware | ClamAV scan on every upload | FR-503 |

### T3: Repudiation

| Threat | Mitigation | Control |
|---|---|---|
| Deny accessing data | Comprehensive audit trail (who, what, when, from where) | FR-517 |
| Deny modifying records | Immutable audit_logs table (append-only, partitioned) | Audit |
| Deny financial actions | Invoice/payment actions logged with user + timestamp | FR-910 |

### T4: Information Disclosure

| Threat | Mitigation | Control |
|---|---|---|
| Cross-tenant data leak | RLS on every table, fail-safe (zero rows without context) | FR-201-203 |
| SSN exposure in logs | Tier 1 data never logged, [REDACTED] in all outputs | Logging |
| SSN exposure in UI | Masked display (***-**-6789), field-level auth | FR-110 |
| Data in transit | TLS 1.3 everywhere, HSTS | NFR-016 |
| Backup exposure | Encrypted backups, KMS-managed keys | DR |
| API response leakage | No stack traces in production, generic error messages | Error handling |

### T5: Denial of Service

| Threat | Mitigation | Control |
|---|---|---|
| API flood | Per-tenant rate limiting (Redis sliding window) | Rate limit |
| Large file upload | 50MB limit, tus chunked upload | FR-503 |
| WebSocket flood | Connection limits per tenant tier | Rate limit |
| Query abuse | Query timeout (30s), pagination required | Backend |
| Temporal queue flood | Max concurrent per queue, backpressure | Temporal |

### T6: Elevation of Privilege

| Threat | Mitigation | Control |
|---|---|---|
| Role manipulation | Roles from JWT only, never from client payload | FR-108 |
| IDOR (accessing other clients) | RLS + application-level ownership checks | FR-202 |
| Admin API access | Route-level RBAC middleware | FR-109 |
| tenant_id spoofing | tenant_id from JWT only, SET LOCAL in middleware | FR-204 |
| Demo → production | Demo sessions isolated, no real payment/webhook processing | FR-1405 |

---

## 3. Authentication Controls

### Password Policy

- Minimum 12 characters
- No maximum length (up to 128)
- HaveIBeenPwned API check on registration and password change
- Argon2id hashing (memory: 64MB, iterations: 3, parallelism: 4)
- No password hints or security questions

### JWT Architecture

```
Access Token (15 min):
{
  "sub": "user_uuid",
  "tid": "tenant_uuid",
  "role": "senior_accountant",
  "permissions": ["clients.read", "clients.write", "documents.read"],
  "iat": 1234567890,
  "exp": 1234568790
}
Signed with RS256 (2048-bit RSA key pair)
Stored in httpOnly, Secure, SameSite=Strict cookie

Refresh Token (7 days):
- Opaque token stored in Redis
- Bound to device fingerprint
- Single-use (rotated on each refresh)
- Revocable via remote logout
```

### MFA (TOTP)

- Required for Partner and Admin roles
- Optional for other roles (encouraged)
- TOTP secret encrypted with tenant key before storage
- 6-digit code, 30-second window, 1 previous code accepted
- Recovery codes: 10 single-use codes generated on setup

### Session Management

- Redis-backed sessions (key: `session:{user_id}:{device_id}`)
- Per-device tracking (user agent + IP)
- Remote logout: invalidate specific device or all devices
- Automatic logout after 30 min inactivity (configurable per tenant)
- Concurrent session limit: 5 devices per user

---

## 4. Authorization (RBAC)

### Role Hierarchy

```
Partner (highest)
  └── Admin
      └── Manager
          └── Senior Accountant
              └── Staff Accountant (lowest CPA role)

Client (separate hierarchy, portal access only)
```

### Permission Matrix

| Resource | Staff | Senior | Manager | Partner | Admin | Client |
|---|---|---|---|---|---|---|
| Clients: Read | Yes | Yes | Yes | Yes | Yes | Own only |
| Clients: Create | Yes | Yes | Yes | Yes | Yes | No |
| Clients: Update | No | Yes | Yes | Yes | Yes | No |
| Clients: Delete | No | No | No | Yes | Yes | No |
| SSN/EIN: View full | No | No | No | Yes | Yes | No |
| Documents: Upload | Yes | Yes | Yes | Yes | Yes | Yes (own) |
| Documents: Delete | No | Yes | Yes | Yes | Yes | No |
| Workflows: Create | No | No | Yes | Yes | Yes | No |
| Workflows: Approve | No | No | No | Yes | Yes | No |
| Tasks: CRUD | Yes | Yes | Yes | Yes | Yes | No |
| Time: Own entries | Yes | Yes | Yes | Yes | Yes | No |
| Time: All entries | No | No | Yes | Yes | Yes | No |
| Invoices: CRUD | No | Yes | Yes | Yes | Yes | No |
| Invoices: Void | No | No | No | Yes | Yes | No |
| Reports: View | No | No | Yes | Yes | Yes | No |
| Integrations: Manage | No | No | No | No | Yes | No |
| Users: Manage | No | No | No | No | Yes | No |
| Billing: Manage | No | No | No | Yes | No | No |
| Firm Settings | No | No | No | No | Yes | No |

---

## 5. Encryption Architecture

### At Rest

| Layer | Method | Key Management |
|---|---|---|
| Tier 1 fields (SSN, EIN) | AES-256-GCM application-layer | Per-tenant DEK, wrapped by AWS KMS CMK |
| S3 documents | SSE-S3 + per-tenant prefix isolation | AWS-managed + per-tenant DEK for sensitive docs |
| Database volume | EBS encryption (AES-256) | AWS-managed |
| Redis | In-transit encryption + at-rest encryption | AWS-managed |
| Backups | Encrypted by default (RDS, S3) | AWS-managed |

### In Transit

| Connection | Protocol | Certificate |
|---|---|---|
| Client → Load Balancer | TLS 1.3 | ACM-managed |
| Load Balancer → Axum | TLS 1.2+ (internal) | Self-signed or ACM |
| Axum → PostgreSQL | TLS 1.2+ | RDS CA |
| Axum → Redis | TLS 1.2+ | ElastiCache CA |
| Axum → S3 | HTTPS (TLS 1.2+) | AWS CA |
| Axum → External APIs | HTTPS (TLS 1.2+) | Public CA |

### Envelope Encryption Flow

```
1. AWS KMS CMK (Customer Master Key) — never leaves KMS
2. Per-tenant DEK (Data Encryption Key) generated via KMS GenerateDataKey
3. DEK encrypted by CMK, stored in tenant_settings
4. On encrypt: decrypt DEK via KMS → encrypt field with DEK (AES-256-GCM) → store ciphertext + nonce
5. On decrypt: decrypt DEK via KMS → decrypt field with DEK
6. DEK rotation: generate new DEK, re-encrypt all Tier 1 fields (background job)
```

---

## 6. Compliance Mapping

### IRS Publication 4557 (Safeguarding Taxpayer Data)

| Requirement | Implementation | Status |
|---|---|---|
| Written information security plan | This document + security policies | MVP |
| Employee background checks | HR process (out of scope for platform) | N/A |
| Data encryption | AES-256-GCM (Tier 1), TLS 1.3 (transit) | MVP |
| Access controls | RBAC + RLS + MFA | MVP |
| Audit trail | Immutable audit_logs, partitioned | MVP |
| Incident response plan | Section 7 below | MVP |
| Annual security review | Scheduled post-launch | Post-MVP |

### FTC Safeguards Rule

| Requirement | Implementation | Status |
|---|---|---|
| Designate qualified individual | Security Agent role | MVP |
| Risk assessment | This threat model | MVP |
| Safeguards implementation | All controls in this document | MVP |
| Regular testing | OWASP ZAP + pen test | MVP |
| Service provider oversight | Vendor security review | MVP |
| Incident response | Section 7 below | MVP |

### SOC 2 Type I Readiness

| Trust Principle | Controls | Timeline |
|---|---|---|
| Security | Auth, encryption, RBAC, RLS, audit | MVP |
| Availability | HA architecture, DR plan, monitoring | MVP |
| Processing Integrity | Input validation, idempotency, audit trail | MVP |
| Confidentiality | Encryption, access controls, data classification | MVP |
| Privacy | GDPR compliance, data retention, right to deletion | MVP |

---

## 7. Incident Response Plan

### Severity Levels

| Level | Description | Response Time | Escalation |
|---|---|---|---|
| P1 Critical | Data breach, RLS bypass, auth bypass | 15 min | Immediate: all hands |
| P2 High | Vulnerability exploited, service down | 1 hour | Security Agent + DevOps |
| P3 Medium | Vulnerability found (not exploited) | 4 hours | Security Agent |
| P4 Low | Security improvement opportunity | Next sprint | Backlog |

### Response Steps

1. **Detect**: Monitoring alerts, user reports, security scans
2. **Contain**: Isolate affected systems, revoke compromised credentials
3. **Assess**: Determine scope, affected tenants, data exposed
4. **Notify**: Affected tenants within 72 hours (GDPR), regulators if required
5. **Remediate**: Fix vulnerability, deploy patch, verify fix
6. **Review**: Post-incident review, update threat model, improve controls

---

## 8. Security Release Gates

Every release must pass:

- [ ] OWASP ZAP scan: zero high/critical findings
- [ ] Dependency audit: `cargo audit` + `npm audit` — zero critical vulnerabilities
- [ ] RLS verification: automated test confirms zero rows without tenant context
- [ ] Tier 1 data check: grep codebase for SSN/EIN patterns in logs/responses
- [ ] Auth test: verify all protected endpoints return 401/403 without valid token
- [ ] Rate limit test: verify lockout after 5 failed logins
- [ ] Encryption test: verify Tier 1 fields are ciphertext in database
- [ ] CORS test: verify only whitelisted origins accepted
- [ ] Security headers: verify HSTS, CSP, X-Frame-Options, X-Content-Type-Options
