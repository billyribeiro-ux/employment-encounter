use sqlx::postgres::PgPoolOptions;
use std::time::Duration;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();

    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "talent_os_worker=info".into()),
        )
        .init();

    let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");

    let db = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Failed to connect to database");

    tracing::info!("Talent OS Worker started");

    // Run workers concurrently
    tokio::select! {
        _ = reminder_worker(&db) => {},
        _ = notification_worker(&db) => {},
        _ = usage_meter_worker(&db) => {},
        _ = tokio::signal::ctrl_c() => {
            tracing::info!("Shutting down worker");
        }
    }

    Ok(())
}

/// Fires pending reminders that are past their fire_at time
async fn reminder_worker(db: &sqlx::PgPool) {
    let mut interval = tokio::time::interval(Duration::from_secs(30));
    loop {
        interval.tick().await;

        match sqlx::query_as::<_, (uuid::Uuid, uuid::Uuid, String, Option<String>, Option<String>)>(
            "UPDATE reminder_jobs SET fired = TRUE, fired_at = NOW() \
             WHERE fired = FALSE AND fire_at <= NOW() \
             RETURNING id, user_id, reminder_type, title, body"
        )
        .fetch_all(db)
        .await
        {
            Ok(reminders) => {
                for (id, user_id, reminder_type, title, body) in &reminders {
                    tracing::info!(
                        reminder_id = %id,
                        user_id = %user_id,
                        reminder_type = %reminder_type,
                        "Fired reminder: {}",
                        title.as_deref().unwrap_or("(no title)")
                    );
                    // In production: dispatch to notification channel (email, push, in-app)
                }
                if !reminders.is_empty() {
                    tracing::info!("Processed {} reminders", reminders.len());
                }
            }
            Err(e) => {
                tracing::error!("Reminder worker error: {}", e);
            }
        }
    }
}

/// Processes queued notification events
async fn notification_worker(db: &sqlx::PgPool) {
    let mut interval = tokio::time::interval(Duration::from_secs(15));
    loop {
        interval.tick().await;

        match sqlx::query_scalar::<_, i64>(
            "UPDATE notification_events SET status = 'sent', sent_at = NOW() \
             WHERE status = 'pending' AND created_at <= NOW() \
             RETURNING (SELECT COUNT(*) FROM notification_events WHERE status = 'pending')"
        )
        .fetch_optional(db)
        .await
        {
            Ok(Some(remaining)) => {
                if remaining > 0 {
                    tracing::info!("{} notification events remaining", remaining);
                }
            }
            Ok(None) => {}
            Err(e) => {
                tracing::error!("Notification worker error: {}", e);
            }
        }
    }
}

/// Periodically syncs usage meter values
async fn usage_meter_worker(db: &sqlx::PgPool) {
    let mut interval = tokio::time::interval(Duration::from_secs(300)); // Every 5 minutes
    loop {
        interval.tick().await;

        // Update job_posts usage meter
        let _ = sqlx::query(
            "UPDATE usage_meters SET current_value = (\
                SELECT COUNT(*) FROM job_posts jp \
                WHERE jp.tenant_id = usage_meters.tenant_id AND jp.status IN ('draft','open','paused')\
             ), updated_at = NOW() \
             WHERE meter_type = 'job_posts'"
        )
        .execute(db)
        .await;

        // Update active_users usage meter
        let _ = sqlx::query(
            "UPDATE usage_meters SET current_value = (\
                SELECT COUNT(*) FROM users u \
                WHERE u.tenant_id = usage_meters.tenant_id AND u.status = 'active'\
             ), updated_at = NOW() \
             WHERE meter_type = 'active_users'"
        )
        .execute(db)
        .await;

        // Clean expired idempotency keys
        let _ = sqlx::query("DELETE FROM idempotency_keys WHERE expires_at < NOW()")
            .execute(db)
            .await;

        tracing::debug!("Usage meters synced");
    }
}
