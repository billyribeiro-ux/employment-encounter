mod auth;
mod clients;
mod compliance;
mod config;
mod dashboard;
mod documents;
mod error;
mod expenses;
mod invoices;
mod messages;
mod middleware;
mod payments;
mod notifications;
mod reports;
mod settings;
mod tasks;
mod time_entries;
mod workflows;
mod ws;

use axum::{
    extract::Request,
    http::{header, HeaderValue, Method},
    middleware as axum_mw,
    middleware::Next,
    response::Response,
    routing::{delete, get, patch, post, put},
    Router,
};
use sqlx::postgres::PgPoolOptions;
use tower_http::cors::{AllowOrigin, CorsLayer};
use tower_http::limit::RequestBodyLimitLayer;
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use config::Config;

#[derive(Clone)]
pub struct AppState {
    pub db: sqlx::PgPool,
    pub config: Config,
    pub ws_broadcast: ws::WsBroadcast,
    pub rate_limiter: middleware::rate_limit::RateLimiter,
    pub redis: Option<std::sync::Arc<fred::clients::RedisClient>>,
}

async fn security_headers(req: Request, next: Next) -> Response {
    let mut response = next.run(req).await;
    let headers = response.headers_mut();
    headers.insert("x-content-type-options", HeaderValue::from_static("nosniff"));
    headers.insert("x-frame-options", HeaderValue::from_static("DENY"));
    headers.insert("x-xss-protection", HeaderValue::from_static("1; mode=block"));
    headers.insert("referrer-policy", HeaderValue::from_static("strict-origin-when-cross-origin"));
    headers.insert("permissions-policy", HeaderValue::from_static("camera=(), microphone=(), geolocation=()"));
    response
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Load .env file
    dotenvy::dotenv().ok();

    // Initialize tracing
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| {
            "cpa_backend=debug,tower_http=debug".into()
        }))
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Load config
    let config = Config::from_env().expect("Failed to load configuration");

    // Connect to database
    let db = PgPoolOptions::new()
        .max_connections(20)
        .connect(&config.database_url)
        .await
        .expect("Failed to connect to database");

    // Run migrations
    sqlx::migrate::Migrator::new(std::path::Path::new("./migrations"))
        .await
        .expect("Failed to load migrations")
        .run(&db)
        .await
        .expect("Failed to run migrations");

    tracing::info!("Database migrations applied successfully");

    // Connect to Redis (graceful fallback if unavailable)
    let redis_client = {
        use fred::prelude::*;
        match RedisConfig::from_url(&config.redis_url) {
            Ok(redis_config) => {
                let client = RedisClient::new(redis_config, None, None, None);
                match client.init().await {
                    Ok(_handle) => {
                        tracing::info!("Redis connected successfully");
                        Some(std::sync::Arc::new(client))
                    }
                    Err(e) => {
                        tracing::warn!("Redis connection failed (falling back to in-memory): {}", e);
                        None
                    }
                }
            }
            Err(e) => {
                tracing::warn!("Redis config error (falling back to in-memory): {}", e);
                None
            }
        }
    };

    // Build application state
    let ws_broadcast = ws::WsBroadcast::new();
    let mut rate_limiter = middleware::rate_limit::RateLimiter::new(100, 60);
    if let Some(ref redis) = redis_client {
        rate_limiter = rate_limiter.with_redis(redis.clone());
    }
    rate_limiter.spawn_cleanup_task();
    let state = AppState {
        db,
        config: config.clone(),
        ws_broadcast,
        rate_limiter,
        redis: redis_client,
    };

    // Build CORS layer
    let cors = CorsLayer::new()
        .allow_origin(AllowOrigin::exact(
            config.cors_origin.parse().expect("Invalid CORS origin"),
        ))
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::DELETE,
            Method::PATCH,
            Method::OPTIONS,
        ])
        .allow_headers([
            header::CONTENT_TYPE,
            header::AUTHORIZATION,
            header::ACCEPT,
        ])
        .allow_credentials(true);

    // Authenticated routes (require JWT)
    let protected_routes = Router::new()
        // Dashboard
        .route("/dashboard/stats", get(dashboard::handler::get_dashboard_stats))
        // Clients
        .route("/clients", get(clients::handler::list_clients))
        .route("/clients", post(clients::handler::create_client))
        .route("/clients/{id}", get(clients::handler::get_client))
        .route("/clients/{id}", put(clients::handler::update_client))
        .route("/clients/{id}", delete(clients::handler::delete_client))
        .route("/clients/{id}/documents", get(clients::handler::list_client_documents))
        .route("/clients/{id}/time-entries", get(clients::handler::list_client_time_entries))
        .route("/clients/{id}/invoices", get(clients::handler::list_client_invoices))
        .route("/clients/{id}/messages", get(clients::handler::list_client_messages))
        .route("/clients/{id}/deadlines", get(clients::handler::list_client_deadlines))
        .route("/clients/{id}/timeline", get(clients::handler::get_client_timeline))
        // Time entries
        .route("/time-entries", get(time_entries::handler::list_time_entries))
        .route("/time-entries", post(time_entries::handler::create_time_entry))
        .route("/time-entries/{id}", put(time_entries::handler::update_time_entry))
        .route("/time-entries/{id}/stop", post(time_entries::handler::stop_timer))
        .route("/time-entries/{id}", delete(time_entries::handler::delete_time_entry))
        // Documents
        .route("/documents", get(documents::handler::list_documents))
        .route("/documents", post(documents::handler::create_document))
        .route("/documents/{id}", get(documents::handler::get_document))
        .route("/documents/{id}", patch(documents::handler::update_document))
        .route("/documents/{id}", delete(documents::handler::delete_document))
        // Invoices
        .route("/invoices", get(invoices::handler::list_invoices))
        .route("/invoices", post(invoices::handler::create_invoice))
        .route("/invoices/{id}", get(invoices::handler::get_invoice))
        .route("/invoices/{id}", delete(invoices::handler::delete_invoice))
        .route("/invoices/{id}/pdf", get(invoices::handler::generate_invoice_pdf))
        .route("/invoices/{id}/status", patch(invoices::handler::update_invoice_status))
        .route("/invoices/{id}/send", post(invoices::handler::send_invoice))
        .route("/invoices/{id}/payment", post(invoices::handler::record_payment))
        // Workflows
        .route("/workflow-templates", get(workflows::handler::list_templates))
        .route("/workflow-templates", post(workflows::handler::create_template))
        .route("/workflow-templates/{id}", delete(workflows::handler::delete_template))
        .route("/workflows", get(workflows::handler::list_instances))
        .route("/workflows", post(workflows::handler::create_instance))
        .route("/workflows/{id}", get(workflows::handler::get_instance))
        .route("/workflows/{id}", delete(workflows::handler::delete_instance))
        .route("/workflows/{id}/advance", post(workflows::handler::advance_step))
        .route("/workflows/{id}/logs", get(workflows::handler::get_step_logs))
        // Tasks
        .route("/tasks", get(tasks::handler::list_tasks))
        .route("/tasks", post(tasks::handler::create_task))
        .route("/tasks/{id}", get(tasks::handler::get_task))
        .route("/tasks/{id}", put(tasks::handler::update_task))
        .route("/tasks/{id}", delete(tasks::handler::delete_task))
        // Compliance deadlines
        .route("/compliance-deadlines", get(compliance::handler::list_deadlines))
        .route("/compliance-deadlines", post(compliance::handler::create_deadline))
        .route("/compliance-deadlines/{id}", put(compliance::handler::update_deadline))
        .route("/compliance-deadlines/{id}", delete(compliance::handler::delete_deadline))
        // Expenses
        .route("/expenses", get(expenses::handler::list_expenses))
        .route("/expenses", post(expenses::handler::create_expense))
        .route("/expenses/{id}", delete(expenses::handler::delete_expense))
        // Notifications
        .route("/notifications", get(notifications::handler::list_notifications))
        .route("/notifications", post(notifications::handler::create_notification))
        .route("/notifications/unread-count", get(notifications::handler::get_unread_count))
        .route("/notifications/read-all", put(notifications::handler::mark_all_read))
        .route("/notifications/{id}/read", put(notifications::handler::mark_read))
        .route("/notifications/{id}", delete(notifications::handler::delete_notification))
        // Messages
        .route("/messages", post(messages::handler::create_message))
        .route("/messages/client/{client_id}", get(messages::handler::list_messages_for_client))
        .route("/messages/{id}/read", put(messages::handler::mark_message_read))
        .route("/messages/{id}", delete(messages::handler::delete_message))
        // Settings
        .route("/settings/firm", get(settings::handler::get_firm_settings))
        .route("/settings/firm", put(settings::handler::update_firm_settings))
        .route("/settings/profile", get(settings::handler::get_profile))
        .route("/settings/profile", put(settings::handler::update_profile))
        .route("/settings/users", get(settings::handler::list_users))
        .route("/settings/users/invite", post(settings::handler::invite_user))
        .route("/settings/users/{id}/role", put(settings::handler::update_user_role))
        .route("/settings/users/{id}", delete(settings::handler::delete_user))
        // Reports
        .route("/reports/pl", get(reports::handler::get_profit_loss))
        .route("/reports/cashflow", get(reports::handler::get_cash_flow))
        .route("/team/utilization", get(reports::handler::get_team_utilization))
        // Payments
        .route("/payments/create-intent", post(payments::handler::create_payment_intent))
        // Audit logs (admin only)
        .route("/audit-logs", get(middleware::audit_handler::list_audit_logs))
        // MFA
        .route("/auth/mfa/setup", post(auth::mfa::setup_mfa))
        .route("/auth/mfa/enable", post(auth::mfa::enable_mfa))
        .route("/auth/mfa/verify", post(auth::mfa::verify_mfa))
        .route("/auth/mfa/disable", post(auth::mfa::disable_mfa))
        // Auth (protected)
        .route("/auth/me", get(auth::handler::get_me))
        .route("/auth/logout", post(auth::handler::logout))
        // Audit log middleware (runs after auth, before handlers)
        .layer(axum_mw::from_fn_with_state(
            state.clone(),
            middleware::audit::audit_log,
        ))
        // Auth middleware
        .layer(axum_mw::from_fn_with_state(
            state.clone(),
            middleware::auth::require_auth,
        ));

    // Build router
    let app = Router::new()
        // Health
        .route("/api/v1/health", get(auth::handler::health))
        // Auth (public)
        .route("/api/v1/auth/register", post(auth::handler::register))
        .route("/api/v1/auth/login", post(auth::handler::login))
        .route("/api/v1/auth/refresh", post(auth::handler::refresh_token))
        // WebSocket
        .route("/api/v1/ws", get(ws::ws_handler))
        // Stripe webhook (public, verified by signature)
        .route("/api/v1/webhooks/stripe", post(payments::handler::stripe_webhook))
        // Protected API routes
        .nest("/api/v1", protected_routes)
        // Layers
        .layer(axum_mw::from_fn_with_state(
            state.clone(),
            middleware::rate_limit::rate_limit,
        ))
        .layer(axum_mw::from_fn(security_headers))
        .layer(RequestBodyLimitLayer::new(10 * 1024 * 1024)) // 10MB max body
        .layer(TraceLayer::new_for_http())
        .layer(cors)
        .with_state(state);

    // Start server with graceful shutdown
    let addr = format!("{}:{}", config.host, config.port);
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    tracing::info!("Server listening on {}", addr);

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await?;

    tracing::info!("Server shutdown complete");
    Ok(())
}

async fn shutdown_signal() {
    let ctrl_c = async {
        tokio::signal::ctrl_c()
            .await
            .expect("failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
            .expect("failed to install signal handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => { tracing::info!("Received Ctrl+C, starting graceful shutdown"); },
        _ = terminate => { tracing::info!("Received SIGTERM, starting graceful shutdown"); },
    }
}
