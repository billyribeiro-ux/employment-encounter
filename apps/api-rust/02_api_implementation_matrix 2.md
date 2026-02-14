# API Implementation Matrix

> Source of Truth: MASTER_SPEC.md
> Base URL: /api/v1

---

## Authentication

| Method | Endpoint | Auth | Role | Idempotent | FR |
|---|---|---|---|---|---|
| POST | /auth/register | No | — | Yes | FR-101 |
| POST | /auth/login | No | — | No | FR-103 |
| POST | /auth/refresh | Refresh | — | No | FR-103 |
| POST | /auth/logout | Yes | * | No | FR-103 |
| POST | /auth/forgot-password | No | — | Yes | FR-107 |
| POST | /auth/reset-password | No | — | Yes | FR-107 |
| POST | /auth/mfa/setup | Yes | * | No | FR-104 |
| POST | /auth/mfa/verify | Partial | * | No | FR-104 |
| GET | /auth/me | Yes | * | — | FR-108 |

## Clients

| Method | Endpoint | Auth | Role | Idempotent | FR |
|---|---|---|---|---|---|
| GET | /clients | Yes | Staff+ | — | FR-301 |
| POST | /clients | Yes | Staff+ | Yes | FR-301 |
| GET | /clients/:id | Yes | Staff+ | — | FR-301 |
| PUT | /clients/:id | Yes | Senior+ | Yes | FR-301 |
| DELETE | /clients/:id | Yes | Partner+ | Yes | FR-301 |
| GET | /clients/search | Yes | Staff+ | — | FR-304 |
| GET | /clients/:id/contacts | Yes | Staff+ | — | FR-303 |
| POST | /clients/:id/contacts | Yes | Staff+ | Yes | FR-303 |
| GET | /clients/:id/activity | Yes | Staff+ | — | FR-307 |
| GET | /clients/:id/analytics | Yes | Manager+ | — | FR-1009 |
| GET | /clients/:id/risk | Yes | Manager+ | — | FR-308 |

## Client Portal

| Method | Endpoint | Auth | Role | Idempotent | FR |
|---|---|---|---|---|---|
| GET | /portal/dashboard | Yes | Client | — | FR-401 |
| GET | /portal/documents | Yes | Client | — | FR-402 |
| GET | /portal/invoices | Yes | Client | — | FR-405 |
| GET | /portal/invoices/:id | Yes | Client | — | FR-405 |
| POST | /portal/invoices/:id/pay | Yes | Client | Yes | FR-405 |
| GET | /portal/status | Yes | Client | — | FR-404 |
| GET | /portal/messages | Yes | Client | — | FR-403 |
| POST | /portal/messages | Yes | Client | Yes | FR-403 |
| GET | /portal/questionnaire | Yes | Client | — | FR-407 |
| POST | /portal/questionnaire | Yes | Client | Yes | FR-407 |

## Documents

| Method | Endpoint | Auth | Role | Idempotent | FR |
|---|---|---|---|---|---|
| GET | /documents | Yes | Staff+ | — | FR-501 |
| GET | /documents/:id | Yes | Staff+ | — | FR-515 |
| PUT | /documents/:id | Yes | Staff+ | Yes | FR-512 |
| DELETE | /documents/:id | Yes | Senior+ | Yes | FR-517 |
| GET | /documents/:id/versions | Yes | Staff+ | — | FR-508 |
| POST | /documents/:id/categorize | Yes | Staff+ | Yes | FR-512 |
| GET | /documents/search | Yes | Staff+ | — | FR-513 |
| POST | /documents/batch | Yes | Staff+ | Yes | FR-516 |
| GET | /documents/:id/share | Yes | Senior+ | — | FR-412 |
| POST | /documents/:id/share | Yes | Senior+ | Yes | FR-412 |

## Upload (tus protocol)

| Method | Endpoint | Auth | Role | Idempotent | FR |
|---|---|---|---|---|---|
| POST | /upload | Yes | Staff+/Client | Yes | FR-502 |
| PATCH | /upload/:id | Yes | Staff+/Client | Yes | FR-502 |
| HEAD | /upload/:id | Yes | Staff+/Client | — | FR-502 |
| DELETE | /upload/:id | Yes | Staff+/Client | Yes | FR-502 |

## Workflows

| Method | Endpoint | Auth | Role | Idempotent | FR |
|---|---|---|---|---|---|
| GET | /workflows | Yes | Staff+ | — | FR-601 |
| POST | /workflows | Yes | Manager+ | Yes | FR-601 |
| GET | /workflows/:id | Yes | Staff+ | — | FR-601 |
| PUT | /workflows/:id | Yes | Manager+ | Yes | FR-601 |
| POST | /workflows/:id/advance | Yes | Staff+ | Yes | FR-605 |
| POST | /workflows/:id/reject | Yes | Partner+ | Yes | FR-604 |
| GET | /workflows/templates | Yes | Staff+ | — | FR-602 |
| POST | /workflows/templates | Yes | Manager+ | Yes | FR-602 |
| PUT | /workflows/templates/:id | Yes | Manager+ | Yes | FR-602 |
| POST | /workflows/templates/:id/clone | Yes | Manager+ | Yes | FR-606 |

## Tasks

| Method | Endpoint | Auth | Role | Idempotent | FR |
|---|---|---|---|---|---|
| GET | /tasks | Yes | Staff+ | — | FR-701 |
| POST | /tasks | Yes | Staff+ | Yes | FR-701 |
| GET | /tasks/:id | Yes | Staff+ | — | FR-701 |
| PUT | /tasks/:id | Yes | Staff+ | Yes | FR-701 |
| DELETE | /tasks/:id | Yes | Staff+ | Yes | FR-701 |
| PUT | /tasks/:id/status | Yes | Staff+ | Yes | FR-702 |
| PUT | /tasks/reorder | Yes | Staff+ | Yes | FR-702 |

## Compliance & Deadlines

| Method | Endpoint | Auth | Role | Idempotent | FR |
|---|---|---|---|---|---|
| GET | /compliance/calendar | Yes | Staff+ | — | FR-801 |
| GET | /compliance/deadlines | Yes | Staff+ | — | FR-801 |
| POST | /compliance/deadlines | Yes | Manager+ | Yes | FR-801 |
| PUT | /compliance/deadlines/:id | Yes | Manager+ | Yes | FR-805 |
| POST | /compliance/deadlines/:id/extend | Yes | Manager+ | Yes | FR-805 |
| GET | /compliance/report | Yes | Manager+ | — | FR-806 |

## Time Entries

| Method | Endpoint | Auth | Role | Idempotent | FR |
|---|---|---|---|---|---|
| GET | /time-entries | Yes | Staff+ | — | FR-901 |
| POST | /time-entries | Yes | Staff+ | Yes | FR-901 |
| PUT | /time-entries/:id | Yes | Staff+ | Yes | FR-901 |
| DELETE | /time-entries/:id | Yes | Staff+ | Yes | FR-901 |
| POST | /time-entries/timer/start | Yes | Staff+ | Yes | FR-902 |
| POST | /time-entries/timer/pause | Yes | Staff+ | Yes | FR-902 |
| POST | /time-entries/timer/resume | Yes | Staff+ | Yes | FR-902 |
| POST | /time-entries/timer/stop | Yes | Staff+ | Yes | FR-902 |
| GET | /time-entries/timesheet | Yes | Staff+ | — | FR-904 |
| POST | /time-entries/batch | Yes | Staff+ | Yes | FR-904 |

## Invoices

| Method | Endpoint | Auth | Role | Idempotent | FR |
|---|---|---|---|---|---|
| GET | /invoices | Yes | Senior+ | — | FR-905 |
| POST | /invoices | Yes | Senior+ | Yes | FR-905 |
| GET | /invoices/:id | Yes | Senior+ | — | FR-905 |
| PUT | /invoices/:id | Yes | Senior+ | Yes | FR-905 |
| POST | /invoices/:id/send | Yes | Senior+ | Yes | FR-909 |
| POST | /invoices/:id/void | Yes | Partner+ | Yes | FR-910 |
| GET | /invoices/:id/pdf | Yes | Senior+ | — | FR-908 |
| GET | /invoices/aging | Yes | Manager+ | — | FR-913 |

## Payments

| Method | Endpoint | Auth | Role | Idempotent | FR |
|---|---|---|---|---|---|
| POST | /payments/intent | Yes | Senior+ | Yes | FR-911 |
| POST | /payments/refund | Yes | Partner+ | Yes | FR-1107 |
| GET | /payments/:id | Yes | Senior+ | — | FR-911 |

## Expenses

| Method | Endpoint | Auth | Role | Idempotent | FR |
|---|---|---|---|---|---|
| GET | /expenses | Yes | Staff+ | — | FR-915 |
| POST | /expenses | Yes | Staff+ | Yes | FR-915 |
| PUT | /expenses/:id | Yes | Staff+ | Yes | FR-915 |
| DELETE | /expenses/:id | Yes | Staff+ | Yes | FR-915 |

## Messages

| Method | Endpoint | Auth | Role | Idempotent | FR |
|---|---|---|---|---|---|
| GET | /messages/:clientId | Yes | Staff+ | — | FR-403 |
| POST | /messages | Yes | Staff+/Client | Yes | FR-403 |
| PUT | /messages/:id/read | Yes | Staff+/Client | Yes | FR-403 |
| GET | /messages/search | Yes | Staff+ | — | FR-403 |
| GET | /messages/templates | Yes | Staff+ | — | FR-403 |
| POST | /messages/templates | Yes | Manager+ | Yes | FR-403 |

## Notifications

| Method | Endpoint | Auth | Role | Idempotent | FR |
|---|---|---|---|---|---|
| GET | /notifications | Yes | * | — | FR-1201 |
| PUT | /notifications/:id/read | Yes | * | Yes | FR-1201 |
| PUT | /notifications/read-all | Yes | * | Yes | FR-1201 |
| GET | /notifications/preferences | Yes | * | — | FR-1203 |
| PUT | /notifications/preferences | Yes | * | Yes | FR-1203 |

## Dashboard & Analytics

| Method | Endpoint | Auth | Role | Idempotent | FR |
|---|---|---|---|---|---|
| GET | /dashboard/metrics | Yes | Staff+ | — | FR-1001 |
| GET | /dashboard/insights | Yes | Staff+ | — | FR-1002 |
| PUT | /dashboard/insights/:id | Yes | Staff+ | Yes | FR-1018 |
| GET | /dashboard/charts/:chartId | Yes | Staff+ | — | FR-1003-1008 |
| GET | /team/utilization | Yes | Manager+ | — | FR-1011 |
| GET | /team/workload | Yes | Manager+ | — | FR-1011 |

## Reports

| Method | Endpoint | Auth | Role | Idempotent | FR |
|---|---|---|---|---|---|
| GET | /reports/pl | Yes | Manager+ | — | FR-1012 |
| GET | /reports/cashflow | Yes | Manager+ | — | FR-1013 |
| POST | /reports/custom | Yes | Manager+ | Yes | FR-1014 |
| GET | /reports/custom/:id | Yes | Manager+ | — | FR-1014 |
| GET | /reports/:id/export | Yes | Manager+ | — | FR-1016 |
| POST | /reports/:id/schedule | Yes | Manager+ | Yes | FR-1015 |

## Integrations

| Method | Endpoint | Auth | Role | Idempotent | FR |
|---|---|---|---|---|---|
| GET | /integrations | Yes | Admin+ | — | FR-1108 |
| GET | /integrations/health | Yes | Admin+ | — | FR-1108 |
| POST | /integrations/:provider/connect | Yes | Admin+ | Yes | FR-1109 |
| DELETE | /integrations/:provider/disconnect | Yes | Admin+ | Yes | FR-1109 |
| POST | /integrations/:provider/sync | Yes | Admin+ | Yes | FR-1102 |
| GET | /integrations/:provider/status | Yes | Admin+ | — | FR-1108 |

## Webhooks (External → Platform)

| Method | Endpoint | Auth | Role | Idempotent | FR |
|---|---|---|---|---|---|
| POST | /webhooks/stripe | Signature | — | Yes | FR-1106 |
| POST | /webhooks/quickbooks | Signature | — | Yes | FR-1110 |

## Onboarding

| Method | Endpoint | Auth | Role | Idempotent | FR |
|---|---|---|---|---|---|
| GET | /onboarding/status | Yes | Admin | — | FR-1301 |
| PUT | /onboarding/step/:step | Yes | Admin | Yes | FR-1301 |
| POST | /onboarding/import/csv | Yes | Admin | Yes | FR-1302 |
| POST | /onboarding/import/quickbooks | Yes | Admin | Yes | FR-1303 |
| POST | /onboarding/import/documents | Yes | Admin | Yes | FR-1304 |
| POST | /onboarding/import/undo | Yes | Admin | Yes | FR-1305 |
| GET | /onboarding/templates | Yes | Admin | — | FR-1306 |

## Settings

| Method | Endpoint | Auth | Role | Idempotent | FR |
|---|---|---|---|---|---|
| GET | /settings/firm | Yes | Admin+ | — | — |
| PUT | /settings/firm | Yes | Admin+ | Yes | — |
| GET | /settings/users | Yes | Admin+ | — | — |
| POST | /settings/users/invite | Yes | Admin+ | Yes | — |
| PUT | /settings/users/:id/role | Yes | Admin+ | Yes | — |
| DELETE | /settings/users/:id | Yes | Partner+ | Yes | — |
| GET | /settings/billing | Yes | Partner+ | — | — |
| PUT | /settings/profile | Yes | * | Yes | — |

## Health

| Method | Endpoint | Auth | Role | Idempotent | FR |
|---|---|---|---|---|---|
| GET | /health | No | — | — | — |
| GET | /health/ready | No | — | — | — |
| GET | /health/live | No | — | — | — |

---

## Summary

- **Total Endpoints**: ~120
- **All mutations accept Idempotency-Key header**
- **All responses use standard envelope** (`{ data, meta }` or `{ error }`)
- **All list endpoints support**: `?page=1&per_page=25&sort=name&order=asc&filter[status]=active`
- **All tenant-scoped endpoints enforce RLS** (tenant_id from JWT, never from request body)
