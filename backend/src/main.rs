mod auth;
mod clients;
mod config;
mod dashboard;
mod documents;
mod error;
mod invoices;
mod middleware;
mod time_entries;

use axum::{
    http::{header, Method},
    middleware as axum_mw,
    routing::{delete, get, patch, post, put},
    Router,
};
use sqlx::postgres::PgPoolOptions;
use tower_http::cors::{AllowOrigin, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use config::Config;

#[derive(Clone)]
pub struct AppState {
    pub db: sqlx::PgPool,
    pub config: Config,
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

    // Build application state
    let state = AppState {
        db,
        config: config.clone(),
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
        // Time entries
        .route("/time-entries", get(time_entries::handler::list_time_entries))
        .route("/time-entries", post(time_entries::handler::create_time_entry))
        .route("/time-entries/{id}/stop", post(time_entries::handler::stop_timer))
        .route("/time-entries/{id}", delete(time_entries::handler::delete_time_entry))
        // Documents
        .route("/documents", get(documents::handler::list_documents))
        .route("/documents", post(documents::handler::create_document))
        .route("/documents/{id}", get(documents::handler::get_document))
        .route("/documents/{id}", delete(documents::handler::delete_document))
        // Invoices
        .route("/invoices", get(invoices::handler::list_invoices))
        .route("/invoices", post(invoices::handler::create_invoice))
        .route("/invoices/{id}", get(invoices::handler::get_invoice))
        .route("/invoices/{id}/status", patch(invoices::handler::update_invoice_status))
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
        // Protected API routes
        .nest("/api/v1", protected_routes)
        // Layers
        .layer(TraceLayer::new_for_http())
        .layer(cors)
        .with_state(state);

    // Start server
    let addr = format!("{}:{}", config.host, config.port);
    let listener = tokio::net::TcpListener::bind(&addr).await?;
    tracing::info!("Server listening on {}", addr);

    axum::serve(listener, app).await?;

    Ok(())
}
