mod applications;
mod auth;
mod candidates;
mod clients;
mod compliance;
mod config;
mod conversations;
mod dashboard;
mod documents;
mod error;
mod errors { pub use crate::error::*; }
mod expenses;
mod flags;
mod interviews;
mod invoices;
mod jobs;
mod meetings;
mod messages;
mod middleware;
mod offers;
mod payments;
mod notifications;
mod reports;
mod scorecards;
mod settings;
mod shortcuts;
mod subscriptions;
mod tasks;
mod time_entries;
mod video_rooms;
mod workflows;
mod ws;

// Advanced hiring modules
mod activity;
mod automations;
mod career_page;
mod email_templates;
mod question_bank;
mod saved_jobs;

// Next-level hiring modules
mod approvals;
mod assessments;
mod onboarding;
mod pipeline_stages;
mod referrals;
mod talent_pools;

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
        .route("/dashboard/hiring-stats", get(dashboard::handler::get_hiring_stats))
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
        .route("/expenses/{id}", put(expenses::handler::update_expense))
        // Notifications
        .route("/notifications", get(notifications::handler::list_notifications))
        .route("/notifications", post(notifications::handler::create_notification))
        .route("/notifications/unread-count", get(notifications::handler::get_unread_count))
        .route("/notifications/read-all", put(notifications::handler::mark_all_read))
        .route("/notifications/{id}/read", put(notifications::handler::mark_read))
        .route("/notifications/{id}", delete(notifications::handler::delete_notification))
        // Candidates
        .route("/candidates", get(candidates::handler::list_candidates))
        .route("/candidates", post(candidates::handler::create_candidate))
        .route("/candidates/{id}", get(candidates::handler::get_candidate))
        .route("/candidates/{id}", patch(candidates::handler::update_candidate))
        .route("/candidates/{id}/skills", get(candidates::handler::list_candidate_skills))
        .route("/candidates/{id}/skills", post(candidates::handler::add_candidate_skill))
        .route("/candidates/{id}/skills/{skill_id}", delete(candidates::handler::delete_candidate_skill))
        .route("/candidates/{id}/documents", get(candidates::handler::list_candidate_documents))
        .route("/candidates/{id}/documents", post(candidates::handler::upload_candidate_document))
        // Candidate Notes
        .route("/candidates/{id}/notes", get(candidates::handler::list_candidate_notes))
        .route("/candidates/{id}/notes", post(candidates::handler::create_candidate_note))
        .route("/candidates/{id}/notes/{note_id}", put(candidates::handler::update_candidate_note))
        .route("/candidates/{id}/notes/{note_id}", delete(candidates::handler::delete_candidate_note))
        // Candidate Favorites
        .route("/favorites", get(candidates::handler::list_favorites))
        .route("/favorites", post(candidates::handler::add_favorite))
        .route("/favorites/{id}", delete(candidates::handler::remove_favorite))
        // Jobs
        .route("/jobs", get(jobs::handler::list_jobs))
        .route("/jobs", post(jobs::handler::create_job))
        .route("/jobs/{id}", get(jobs::handler::get_job))
        .route("/jobs/{id}", patch(jobs::handler::update_job))
        .route("/jobs/{id}", delete(jobs::handler::delete_job))
        .route("/jobs/{id}/publish", post(jobs::handler::publish_job))
        // Applications
        .route("/applications", get(applications::handler::list_applications))
        .route("/applications", post(applications::handler::create_application))
        .route("/applications/{id}", get(applications::handler::get_application))
        .route("/applications/{id}/stage", post(applications::handler::advance_stage))
        .route("/applications/{id}/history", get(applications::handler::get_stage_history))
        .route("/applications/{id}/reject", post(applications::handler::reject_application))
        .route("/applications/{id}/withdraw", post(applications::handler::withdraw_application))
        // Scorecards
        .route("/scorecards", get(scorecards::handler::list_scorecards))
        .route("/scorecards", post(scorecards::handler::create_scorecard))
        .route("/scorecards/summary/{application_id}", get(scorecards::handler::get_scorecard_summary))
        .route("/scorecards/{id}", get(scorecards::handler::get_scorecard))
        .route("/scorecards/{id}", put(scorecards::handler::update_scorecard))
        .route("/scorecards/{id}", delete(scorecards::handler::delete_scorecard))
        // Decision Records
        .route("/decision-records", get(scorecards::handler::list_decision_records))
        .route("/decision-records", post(scorecards::handler::create_decision_record))
        // Offers
        .route("/offers", get(offers::handler::list_offers))
        .route("/offers", post(offers::handler::create_offer))
        .route("/offers/{id}", get(offers::handler::get_offer))
        .route("/offers/{id}", put(offers::handler::update_offer))
        .route("/offers/{id}/send", post(offers::handler::send_offer))
        .route("/offers/{id}/accept", post(offers::handler::accept_offer))
        .route("/offers/{id}/decline", post(offers::handler::decline_offer))
        // Subscriptions
        .route("/plans", get(subscriptions::handler::list_plans))
        .route("/subscription", get(subscriptions::handler::get_current_subscription))
        .route("/subscription", post(subscriptions::handler::create_subscription))
        .route("/subscription/plan", put(subscriptions::handler::change_plan))
        .route("/subscription/cancel", post(subscriptions::handler::cancel_subscription))
        .route("/subscription/usage", get(subscriptions::handler::get_usage))
        .route("/entitlements", get(subscriptions::handler::list_entitlements))
        .route("/entitlements/{feature_key}", get(subscriptions::handler::check_entitlement))
        // Conversations (Chat)
        .route("/conversations", get(conversations::handler::list_conversations))
        .route("/conversations", post(conversations::handler::create_conversation))
        .route("/conversations/{id}", get(conversations::handler::get_conversation))
        .route("/conversations/{id}/messages", get(conversations::handler::list_conversation_messages))
        .route("/conversations/{id}/messages", post(conversations::handler::send_message))
        .route("/conversations/{id}/read", post(conversations::handler::mark_conversation_read))
        // Meetings
        .route("/meetings/request", post(meetings::handler::create_meeting))
        .route("/meetings", get(meetings::handler::list_meetings))
        .route("/meetings/{id}", get(meetings::handler::get_meeting))
        .route("/meetings/{id}/accept", post(meetings::handler::accept_meeting))
        .route("/meetings/{id}/deny", post(meetings::handler::deny_meeting))
        .route("/meetings/{id}/reschedule", post(meetings::handler::reschedule_meeting))
        .route("/meetings/{id}/cancel", post(meetings::handler::cancel_meeting))
        // Video Rooms
        .route("/video-rooms", get(video_rooms::handler::list_rooms))
        .route("/video-rooms", post(video_rooms::handler::create_room))
        .route("/video-rooms/{id}", get(video_rooms::handler::get_room))
        .route("/video-rooms/{id}/join", post(video_rooms::handler::join_room))
        .route("/video-rooms/{id}/end", post(video_rooms::handler::end_room))
        .route("/video-rooms/{id}/sessions", get(video_rooms::handler::list_sessions))
        // Interviews (spec-compliant namespace)
        .route("/interviews/rooms", post(interviews::handler::create_room))
        .route("/interviews/rooms/{id}/token", post(interviews::handler::issue_token))
        .route("/interviews/sessions/{id}/events", post(interviews::handler::record_session_event))
        .route("/interviews/sessions/{id}/feedback", post(interviews::handler::submit_feedback))
        // Shortcuts
        .route("/shortcuts", get(shortcuts::handler::get_shortcuts))
        .route("/shortcuts", patch(shortcuts::handler::update_shortcuts))
        .route("/shortcuts/usage-events", post(shortcuts::handler::record_usage_event))
        // Feature Flags
        .route("/flags", get(flags::handler::get_flags))
        // Messages
        .route("/messages", post(messages::handler::create_message))
        .route("/messages/unread-counts", get(messages::handler::get_unread_counts))
        .route("/messages/client/{client_id}", get(messages::handler::list_messages_for_client))
        .route("/messages/client/{client_id}/read-all", put(messages::handler::mark_conversation_read))
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
        // Saved Jobs (candidate)
        .route("/saved-jobs", get(saved_jobs::handler::list_saved_jobs))
        .route("/saved-jobs", post(saved_jobs::handler::save_job))
        .route("/saved-jobs/{id}", delete(saved_jobs::handler::unsave_job))
        // Email Templates
        .route("/email-templates", get(email_templates::handler::list_templates))
        .route("/email-templates", post(email_templates::handler::create_template))
        .route("/email-templates/{id}", get(email_templates::handler::get_template))
        .route("/email-templates/{id}", put(email_templates::handler::update_template))
        .route("/email-templates/{id}", delete(email_templates::handler::delete_template))
        .route("/email-templates/{id}/send", post(email_templates::handler::send_template))
        // Career Page
        .route("/career-page", get(career_page::handler::get_career_page))
        .route("/career-page", put(career_page::handler::update_career_page))
        .route("/career-page/publish", post(career_page::handler::publish_career_page))
        // Question Bank
        .route("/questions", get(question_bank::handler::list_questions))
        .route("/questions", post(question_bank::handler::create_question))
        .route("/questions/{id}", put(question_bank::handler::update_question))
        .route("/questions/{id}", delete(question_bank::handler::delete_question))
        .route("/question-sets", get(question_bank::handler::list_question_sets))
        .route("/question-sets", post(question_bank::handler::create_question_set))
        .route("/question-sets/{id}", put(question_bank::handler::update_question_set))
        .route("/question-sets/{id}", delete(question_bank::handler::delete_question_set))
        // Automation Rules
        .route("/automations", get(automations::handler::list_rules))
        .route("/automations", post(automations::handler::create_rule))
        .route("/automations/{id}", put(automations::handler::update_rule))
        .route("/automations/{id}", delete(automations::handler::delete_rule))
        .route("/automations/{id}/toggle", post(automations::handler::toggle_rule))
        .route("/automations/log", get(automations::handler::list_execution_log))
        // Activity Log
        .route("/activity", get(activity::handler::list_activity))
        .route("/activity/stats", get(activity::handler::get_activity_stats))
        // Pipeline stages
        .route("/pipeline-templates", get(pipeline_stages::handler::list_templates))
        .route("/pipeline-templates", post(pipeline_stages::handler::create_template))
        // Approvals
        .route("/approvals", get(approvals::handler::list_requests))
        .route("/approvals", post(approvals::handler::create_request))
        .route("/approvals/{id}/decide", post(approvals::handler::decide_request))
        // Referrals
        .route("/referrals", get(referrals::handler::list_referrals))
        .route("/referrals", post(referrals::handler::create_referral))
        // Talent pools
        .route("/talent-pools", get(talent_pools::handler::list_pools))
        .route("/talent-pools", post(talent_pools::handler::create_pool))
        .route("/talent-pools/{id}/members", get(talent_pools::handler::list_members))
        .route("/talent-pools/{id}/members", post(talent_pools::handler::add_member))
        // Assessments
        .route("/assessments", get(assessments::handler::list_assessments))
        .route("/assessments", post(assessments::handler::create_assessment))
        .route("/assessments/{id}/submissions", get(assessments::handler::list_submissions))
        // Onboarding
        .route("/onboarding/templates", get(onboarding::handler::list_templates))
        .route("/onboarding", get(onboarding::handler::list_instances))
        .route("/onboarding", post(onboarding::handler::create_instance))
        .route("/onboarding/{id}/progress", put(onboarding::handler::update_progress))
        // Compliance / GDPR
        .route("/compliance/consent", get(compliance::handler::list_consent_records))
        .route("/compliance/deletion-requests", get(compliance::handler::list_deletion_requests))
        .route("/compliance/deletion-requests", post(compliance::handler::create_deletion_request))
        .route("/compliance/retention-policies", get(compliance::handler::list_retention_policies))
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
        .route("/auth/change-password", post(auth::handler::change_password))
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
        .route("/api/v1/auth/register-candidate", post(auth::handler::register_candidate))
        .route("/api/v1/auth/login", post(auth::handler::login))
        .route("/api/v1/auth/refresh", post(auth::handler::refresh_token))
        // Public job listings (no auth required)
        .route("/api/v1/public/jobs", get(jobs::handler::list_public_jobs))
        .route("/api/v1/public/jobs/{id}", get(jobs::handler::get_public_job))
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
