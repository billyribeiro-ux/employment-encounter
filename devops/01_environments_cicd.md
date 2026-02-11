# DevOps: Environments, CI/CD & Infrastructure

> Source of Truth: MASTER_SPEC.md
> Cloud: AWS | CI/CD: GitHub Actions | IaC: Terraform

---

## 1. Environment Matrix

| Environment | Purpose | URL | Deploy Trigger | Data |
|---|---|---|---|---|
| Local | Developer workstation | localhost:3000 / :8080 | Manual | Docker Compose (seed data) |
| CI | Automated testing | — | Every PR | Ephemeral (test fixtures) |
| Staging | Pre-production validation | staging.cpaplatform.io | Merge to main | Anonymized production subset |
| Production | Live service | app.cpaplatform.io | Manual promote from staging | Real tenant data |
| Demo | Public demo instances | demo.cpaplatform.io | Deploy with production | Seeded demo data (3 firms) |

### Local Development (Docker Compose)

```yaml
services:
  postgres:
    image: postgres:16
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: cpa_dev
    volumes: ["pgdata:/var/lib/postgresql/data"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  temporal:
    image: temporalio/auto-setup:latest
    ports: ["7233:7233"]
    depends_on: [postgres]

  temporal-ui:
    image: temporalio/ui:latest
    ports: ["8233:8080"]

  typesense:
    image: typesense/typesense:27.0
    ports: ["8108:8108"]
    environment:
      TYPESENSE_API_KEY: dev_key

  localstack:
    image: localstack/localstack:latest
    ports: ["4566:4566"]
    environment:
      SERVICES: s3,kms

  clamav:
    image: clamav/clamav:latest
    ports: ["3310:3310"]

  backend:
    build: ./backend
    ports: ["8080:8080"]
    depends_on: [postgres, redis, temporal, typesense, localstack]
    env_file: .env.local

  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    depends_on: [backend]
    env_file: .env.local
```

---

## 2. CI Pipeline (GitHub Actions)

### On Pull Request

```yaml
name: CI
on: [pull_request]

jobs:
  backend-check:
    runs-on: ubuntu-latest
    services:
      postgres: { image: "postgres:16", env: { POSTGRES_DB: test } }
      redis: { image: "redis:7-alpine" }
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - run: cargo check
      - run: cargo clippy -- -D warnings
      - run: cargo test
      - run: cargo audit
      - run: sqlx prepare --check

  frontend-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npx eslint .
      - run: npx vitest run --coverage
      - run: npm audit --audit-level=critical

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: OWASP ZAP Baseline
        uses: zaproxy/action-baseline@v0.10.0
        with:
          target: "http://localhost:8080"

  integration-tests:
    runs-on: ubuntu-latest
    needs: [backend-check, frontend-check]
    services:
      postgres: { image: "postgres:16" }
      redis: { image: "redis:7-alpine" }
      typesense: { image: "typesense/typesense:27.0" }
    steps:
      - uses: actions/checkout@v4
      - run: cargo test --test integration
      - run: npx playwright test --project=chromium
```

### On Merge to Main (Deploy to Staging)

```yaml
name: Deploy Staging
on:
  push:
    branches: [main]

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build backend
        run: docker build -t cpa-backend:${{ github.sha }} ./backend
      - name: Build frontend
        run: docker build -t cpa-frontend:${{ github.sha }} ./frontend
      - name: Push to ECR
        run: |
          aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_REGISTRY
          docker push $ECR_REGISTRY/cpa-backend:${{ github.sha }}
          docker push $ECR_REGISTRY/cpa-frontend:${{ github.sha }}
      - name: Deploy to ECS Staging
        run: |
          aws ecs update-service --cluster cpa-staging --service backend --force-new-deployment
          aws ecs update-service --cluster cpa-staging --service frontend --force-new-deployment
      - name: Run smoke tests
        run: npx playwright test --project=chromium --grep @smoke
      - name: Run migrations
        run: sqlx migrate run --database-url $STAGING_DB_URL
```

---

## 3. CD Pipeline (Production)

### Manual Promotion

```yaml
name: Deploy Production
on:
  workflow_dispatch:
    inputs:
      version:
        description: "Git SHA or tag to deploy"
        required: true

jobs:
  pre-deploy-checks:
    runs-on: ubuntu-latest
    steps:
      - name: Verify staging tests passed
        run: gh run list --workflow=ci.yml --branch=main --status=success --limit=1
      - name: Verify OWASP ZAP clean
        run: echo "Check ZAP report for zero high/critical"

  deploy-production:
    needs: [pre-deploy-checks]
    runs-on: ubuntu-latest
    steps:
      - name: Run migrations (with backup)
        run: |
          aws rds create-db-snapshot --db-instance-identifier cpa-prod --db-snapshot-identifier pre-deploy-${{ github.run_id }}
          sqlx migrate run --database-url $PROD_DB_URL
      - name: Blue-green deploy
        run: |
          aws ecs update-service --cluster cpa-prod --service backend --force-new-deployment
          aws ecs update-service --cluster cpa-prod --service frontend --force-new-deployment
      - name: Health check
        run: |
          for i in {1..30}; do
            curl -sf https://app.cpaplatform.io/api/v1/health && exit 0
            sleep 10
          done
          exit 1
      - name: Smoke tests
        run: npx playwright test --project=chromium --grep @smoke --config=playwright.prod.config.ts
      - name: Notify team
        run: echo "Production deployed successfully"
```

---

## 4. AWS Infrastructure (Terraform)

### Compute

| Service | Type | Count | Purpose |
|---|---|---|---|
| ECS Fargate (backend) | 2 vCPU, 4GB | 2-4 tasks (auto-scale) | Axum API servers |
| ECS Fargate (frontend) | 1 vCPU, 2GB | 2 tasks | Next.js servers |
| ECS Fargate (temporal-worker) | 2 vCPU, 4GB | 2-4 tasks | Temporal workflow workers |

### Data

| Service | Type | Purpose |
|---|---|---|
| RDS PostgreSQL 16 | db.r6g.large (Multi-AZ) | Primary database |
| RDS Read Replica | db.r6g.large | Read scaling |
| ElastiCache Redis 7 | cache.r6g.large (cluster) | Caching, sessions, rate limiting |
| S3 | Standard + Glacier | Document storage + archival |
| Typesense Cloud | 2 vCPU, 4GB | Search engine |

### Networking

| Component | Configuration |
|---|---|
| VPC | 3 AZs, public + private subnets |
| ALB | HTTPS termination, WAF integration |
| CloudFront | Static asset CDN, Next.js edge |
| Route 53 | DNS management |
| ACM | TLS certificates (auto-renewal) |
| WAF | OWASP Core Rule Set, rate limiting |
| Security Groups | Least-privilege, no public DB access |

### Security

| Service | Purpose |
|---|---|
| AWS KMS | Envelope encryption (per-tenant CMKs) |
| AWS Secrets Manager | API keys, DB credentials, JWT keys |
| AWS CloudTrail | AWS API audit logging |
| AWS GuardDuty | Threat detection |
| AWS Config | Compliance monitoring |

---

## 5. Monitoring & Alerting

### Observability Stack

| Tool | Purpose | Data |
|---|---|---|
| Prometheus | Metrics collection | Application + infrastructure metrics |
| Grafana | Dashboards + alerting | Visualize all metrics |
| Loki | Log aggregation | Structured logs from all services |
| Tempo | Distributed tracing | Request traces across services |
| Sentry | Error tracking | Frontend + backend exceptions |
| AWS CloudWatch | Infrastructure metrics | ECS, RDS, ElastiCache, S3 |

### Key Dashboards

1. **Service Health**: Request rate, error rate, latency p50/p95/p99
2. **Database**: Connection pool, query latency, replication lag, disk usage
3. **Redis**: Hit rate, memory usage, connection count
4. **Temporal**: Workflow throughput, failure rate, queue depth
5. **Business**: Active tenants, documents processed, invoices generated
6. **Security**: Failed logins, rate limit hits, RLS violations

### Alert Rules

| Alert | Condition | Severity | Channel |
|---|---|---|---|
| API error rate > 5% | 5 min window | Critical | PagerDuty |
| API p99 > 2s | 5 min window | High | Slack |
| DB connection pool > 80% | Instant | High | PagerDuty |
| DB replication lag > 30s | Instant | Critical | PagerDuty |
| Redis memory > 80% | Instant | High | Slack |
| Disk usage > 85% | Instant | High | Slack |
| Temporal DLQ > 10 items | Instant | High | Slack + Email |
| Failed login spike (10x normal) | 15 min window | Critical | PagerDuty |
| Certificate expiry < 14 days | Daily check | Medium | Email |
| Backup failure | Instant | Critical | PagerDuty |

---

## 6. Runbooks

### RB-01: Database Failover

1. Verify RDS Multi-AZ failover initiated (automatic)
2. Check application reconnection (SQLx pool auto-reconnects)
3. Verify read replica promotion if needed
4. Check replication lag after failover
5. Notify team of failover event

### RB-02: Service Degradation

1. Check Grafana dashboards for anomalies
2. Identify affected service (backend, frontend, temporal, redis, DB)
3. Check recent deployments (rollback if correlated)
4. Scale up ECS tasks if load-related
5. Check external dependencies (Stripe, QB, Claude API)

### RB-03: Security Incident

1. Follow incident response plan (security/01_threat_model_controls.md §7)
2. Isolate affected tenant if tenant-specific
3. Revoke compromised credentials
4. Enable enhanced logging
5. Engage security team

### RB-04: Rollback Deployment

1. Identify last known good version (git SHA)
2. Update ECS service to previous task definition
3. Rollback database migration if needed (`sqlx migrate revert`)
4. Verify health checks pass
5. Run smoke tests
6. Post-mortem within 24 hours
