//! Integration tests for the transaction-wrapping changes made to
//! invoice/offer/application/workflow mutations. These tests do NOT
//! call the handlers (the binary doesn't expose them as a library
//! target); instead they exercise the same SQL invariants the handlers
//! rely on:
//!
//!   1. SELECT ... FOR UPDATE serializes concurrent readers so that a
//!      precondition check + UPDATE pair is atomic (no TOCTOU race).
//!   2. A multi-statement transaction rolls back cleanly if any
//!      statement fails, leaving the DB unchanged.
//!   3. Per-tenant `MAX(number)+1` inside a FOR-UPDATE transaction
//!      produces unique invoice numbers under concurrency.
//!
//! Run with `cargo test --test transactions` against a running Postgres
//! that has the project's migrations applied. CI provides this via the
//! `postgres:16-alpine` service in `.github/workflows/ci.yml`.

use sqlx::{postgres::PgPoolOptions, PgPool, Row};
use std::env;
use std::sync::Arc;
use uuid::Uuid;

async fn pool() -> PgPool {
    let url = env::var("DATABASE_URL").expect("DATABASE_URL must be set for integration tests");
    PgPoolOptions::new()
        .max_connections(10)
        .connect(&url)
        .await
        .expect("connect to test DB")
}

async fn seed_tenant_and_user(pool: &PgPool) -> (Uuid, Uuid) {
    let tenant_id = Uuid::new_v4();
    let user_id = Uuid::new_v4();
    sqlx::query(
        "INSERT INTO tenants (id, name, slug, tier, kms_key_id) \
         VALUES ($1, $2, $3, 'solo', $4)",
    )
    .bind(tenant_id)
    .bind(format!("tx-test-{tenant_id}"))
    .bind(format!("tx-test-{tenant_id}"))
    .bind(format!("test-kms-{tenant_id}"))
    .execute(pool)
    .await
    .expect("insert tenant");

    sqlx::query(
        "INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role) \
         VALUES ($1, $2, $3, 'placeholder', 'Test', 'User', 'admin')",
    )
    .bind(user_id)
    .bind(tenant_id)
    .bind(format!("test-{user_id}@example.com"))
    .execute(pool)
    .await
    .expect("insert user");

    (tenant_id, user_id)
}

async fn seed_client(pool: &PgPool, tenant_id: Uuid, _user_id: Uuid) -> Uuid {
    let client_id = Uuid::new_v4();
    sqlx::query(
        "INSERT INTO clients (id, tenant_id, name, business_type, fiscal_year_end) \
         VALUES ($1, $2, $3, 'LLC', 'Calendar')",
    )
    .bind(client_id)
    .bind(tenant_id)
    .bind("Acme Corp")
    .execute(pool)
    .await
    .expect("insert client");
    client_id
}

/// Invariant 1: A transaction holding `SELECT ... FOR UPDATE` on a row
/// serializes concurrent readers. The second transaction blocks until
/// the first commits, so both see the post-update state and we never
/// observe two concurrent "winners" in a precondition-check + update
/// pattern. This is what `offers::accept_offer` relies on.
#[tokio::test]
async fn for_update_serializes_concurrent_status_check() {
    let pool = pool().await;
    let (tenant_id, user_id) = seed_tenant_and_user(&pool).await;
    let client_id = seed_client(&pool, tenant_id, user_id).await;

    // Create a row that simulates an offer in "sent" status. We use the
    // `tasks` table since it exists with a tenant_id + status column;
    // the SQL behavior we're testing (FOR UPDATE serialization) is
    // generic to Postgres and applies identically to the offers table.
    let row_id = Uuid::new_v4();
    sqlx::query(
        "INSERT INTO tasks (id, tenant_id, client_id, title, status, priority, created_by) \
         VALUES ($1, $2, $3, 'tx-test', 'todo', 'medium', $4)",
    )
    .bind(row_id)
    .bind(tenant_id)
    .bind(client_id)
    .bind(user_id)
    .execute(&pool)
    .await
    .expect("insert seed task");

    let pool_arc = Arc::new(pool.clone());

    // Spawn two tasks that both try to read-FOR-UPDATE, check status,
    // and update. With proper FOR UPDATE, exactly one observes
    // status='todo' and updates; the other observes status='in_progress'
    // and bails.
    let pool_a = pool_arc.clone();
    let pool_b = pool_arc.clone();

    let a = tokio::spawn(async move {
        let mut tx = pool_a.begin().await.expect("begin tx A");
        let status: String = sqlx::query("SELECT status FROM tasks WHERE id = $1 FOR UPDATE")
            .bind(row_id)
            .fetch_one(&mut *tx)
            .await
            .expect("select FOR UPDATE A")
            .get(0);
        // Simulate some work between read and write.
        tokio::time::sleep(std::time::Duration::from_millis(50)).await;
        if status == "todo" {
            sqlx::query("UPDATE tasks SET status = 'in_progress' WHERE id = $1")
                .bind(row_id)
                .execute(&mut *tx)
                .await
                .expect("update A");
            tx.commit().await.expect("commit A");
            true
        } else {
            tx.rollback().await.expect("rollback A");
            false
        }
    });

    // Slight stagger so A acquires the lock first.
    tokio::time::sleep(std::time::Duration::from_millis(5)).await;

    let b = tokio::spawn(async move {
        let mut tx = pool_b.begin().await.expect("begin tx B");
        let status: String = sqlx::query("SELECT status FROM tasks WHERE id = $1 FOR UPDATE")
            .bind(row_id)
            .fetch_one(&mut *tx)
            .await
            .expect("select FOR UPDATE B")
            .get(0);
        if status == "todo" {
            sqlx::query("UPDATE tasks SET status = 'in_progress' WHERE id = $1")
                .bind(row_id)
                .execute(&mut *tx)
                .await
                .expect("update B");
            tx.commit().await.expect("commit B");
            true
        } else {
            tx.rollback().await.expect("rollback B");
            false
        }
    });

    let a_won = a.await.expect("A");
    let b_won = b.await.expect("B");

    assert!(
        a_won ^ b_won,
        "exactly one transaction should win the race; got a_won={a_won}, b_won={b_won}"
    );
}

/// Invariant 2: A multi-statement transaction rolls back atomically if
/// any statement fails. This is what `invoices::create_invoice` relies
/// on — if a line-item insert fails, the invoice header must not exist.
#[tokio::test]
async fn transaction_rolls_back_on_error() {
    let pool = pool().await;
    let (tenant_id, user_id) = seed_tenant_and_user(&pool).await;
    let client_id = seed_client(&pool, tenant_id, user_id).await;

    let invoice_id = Uuid::new_v4();

    // Run a tx that inserts the invoice, then attempts an invalid
    // statement (a deliberate type/constraint violation). On rollback,
    // the invoice header must not be visible afterwards.
    let result: Result<(), sqlx::Error> = async {
        let mut tx = pool.begin().await?;

        sqlx::query(
            "INSERT INTO invoices (id, tenant_id, client_id, invoice_number, status, \
             subtotal_cents, tax_cents, total_cents, due_date, created_by) \
             VALUES ($1, $2, $3, 'TX-TEST-0001', 'draft', 100, 0, 100, NOW(), $4)",
        )
        .bind(invoice_id)
        .bind(tenant_id)
        .bind(client_id)
        .bind(user_id)
        .execute(&mut *tx)
        .await?;

        // Deliberately violate a foreign key (random invoice_id) to
        // trigger a failure mid-transaction.
        sqlx::query(
            "INSERT INTO invoice_line_items (tenant_id, invoice_id, description, \
             quantity, unit_price_cents, total_cents, sort_order) \
             VALUES ($1, $2, 'bad line', 1.0, 50, 50, 0)",
        )
        .bind(tenant_id)
        .bind(Uuid::new_v4()) // unknown invoice → FK violation
        .execute(&mut *tx)
        .await?;

        tx.commit().await?;
        Ok(())
    }
    .await;

    assert!(result.is_err(), "expected FK violation to fail the tx");

    // Confirm the invoice header was rolled back.
    let count: i64 = sqlx::query("SELECT COUNT(*) FROM invoices WHERE id = $1")
        .bind(invoice_id)
        .fetch_one(&pool)
        .await
        .expect("count rolled-back invoices")
        .get(0);
    assert_eq!(count, 0, "invoice header must not exist after rollback");
}

/// Invariant 3: Concurrent `MAX(number)+1` invoice number generation
/// inside a FOR-UPDATE transaction produces unique numbers per tenant.
/// This is what `invoices::create_invoice` does after the fix.
#[tokio::test]
async fn concurrent_invoice_numbers_unique_per_tenant() {
    let pool = pool().await;
    let (tenant_id, user_id) = seed_tenant_and_user(&pool).await;
    let client_id = seed_client(&pool, tenant_id, user_id).await;

    // We rely on Postgres advisory locking via FOR UPDATE on the highest
    // existing row. With an empty set, FOR UPDATE has nothing to lock, so
    // we seed one row first so the lock has something concrete to take.
    sqlx::query(
        "INSERT INTO invoices (id, tenant_id, client_id, invoice_number, status, \
         subtotal_cents, tax_cents, total_cents, due_date, created_by) \
         VALUES ($1, $2, $3, 'INV-00000', 'draft', 0, 0, 0, NOW(), $4)",
    )
    .bind(Uuid::new_v4())
    .bind(tenant_id)
    .bind(client_id)
    .bind(user_id)
    .execute(&pool)
    .await
    .expect("seed first invoice");

    let pool_arc = Arc::new(pool.clone());
    let mut handles = Vec::new();
    let concurrency = 5;

    for _ in 0..concurrency {
        let p = pool_arc.clone();
        let tid = tenant_id;
        let cid = client_id;
        let uid = user_id;
        handles.push(tokio::spawn(async move {
            // Mirror the handler's tx body exactly.
            let mut tx = p.begin().await.expect("begin");

            sqlx::query(
                "SELECT pg_advisory_xact_lock(hashtextextended('invoice_number:' || $1::text, 0))",
            )
            .bind(tid)
            .execute(&mut *tx)
            .await
            .expect("advisory lock");

            let (next_num,): (i64,) = sqlx::query_as(
                "SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 5) AS BIGINT)), 0) + 1 \
                 FROM invoices \
                 WHERE tenant_id = $1 AND invoice_number LIKE 'INV-%'",
            )
            .bind(tid)
            .fetch_one(&mut *tx)
            .await
            .expect("select max");
            let invoice_number = format!("INV-{:05}", next_num);

            sqlx::query(
                "INSERT INTO invoices (id, tenant_id, client_id, invoice_number, status, \
                 subtotal_cents, tax_cents, total_cents, due_date, created_by) \
                 VALUES ($1, $2, $3, $4, 'draft', 0, 0, 0, NOW(), $5)",
            )
            .bind(Uuid::new_v4())
            .bind(tid)
            .bind(cid)
            .bind(&invoice_number)
            .bind(uid)
            .execute(&mut *tx)
            .await
            .expect("insert invoice");

            tx.commit().await.expect("commit");
            invoice_number
        }));
    }

    let mut numbers = Vec::new();
    for h in handles {
        numbers.push(h.await.expect("task"));
    }

    let mut unique = numbers.clone();
    unique.sort();
    unique.dedup();
    assert_eq!(
        unique.len(),
        numbers.len(),
        "concurrent invoice numbers must be unique. got: {numbers:?}"
    );
}
