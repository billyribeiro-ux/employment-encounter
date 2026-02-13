use sqlx::PgPool;
use uuid::Uuid;

/// Security event types for the security_events table.
#[derive(Debug, Clone, Copy)]
#[allow(dead_code)]
pub enum SecurityEventType {
    LoginSuccess,
    LoginFailed,
    LoginLocked,
    LogoutSuccess,
    MfaEnabled,
    MfaDisabled,
    MfaVerified,
    MfaFailed,
    PasswordChanged,
    RoleChanged,
    UserInvited,
    UserDeleted,
    TokenRevoked,
    RateLimited,
}

impl SecurityEventType {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::LoginSuccess => "login_success",
            Self::LoginFailed => "login_failed",
            Self::LoginLocked => "login_locked",
            Self::LogoutSuccess => "logout_success",
            Self::MfaEnabled => "mfa_enabled",
            Self::MfaDisabled => "mfa_disabled",
            Self::MfaVerified => "mfa_verified",
            Self::MfaFailed => "mfa_failed",
            Self::PasswordChanged => "password_changed",
            Self::RoleChanged => "role_changed",
            Self::UserInvited => "user_invited",
            Self::UserDeleted => "user_deleted",
            Self::TokenRevoked => "token_revoked",
            Self::RateLimited => "rate_limited",
        }
    }

    pub fn severity(&self) -> &'static str {
        match self {
            Self::LoginSuccess | Self::LogoutSuccess | Self::MfaVerified => "info",
            Self::LoginFailed | Self::MfaFailed | Self::RateLimited => "warning",
            Self::LoginLocked | Self::RoleChanged | Self::UserDeleted | Self::TokenRevoked => "critical",
            Self::MfaEnabled | Self::MfaDisabled | Self::PasswordChanged | Self::UserInvited => "info",
        }
    }
}

/// Fire-and-forget security event logging.
/// Spawns a background task so it never blocks the request.
pub fn log_security_event(
    db: PgPool,
    tenant_id: Option<Uuid>,
    user_id: Option<Uuid>,
    event_type: SecurityEventType,
    description: String,
    ip_address: Option<String>,
    user_agent: Option<String>,
    metadata: Option<serde_json::Value>,
) {
    tokio::spawn(async move {
        let meta = metadata.unwrap_or_else(|| serde_json::json!({}));

        let result = sqlx::query(
            "INSERT INTO security_events (tenant_id, user_id, event_type, severity, description, ip_address, user_agent, metadata) \
             VALUES ($1, $2, $3, $4, $5, $6::INET, $7, $8)"
        )
        .bind(tenant_id)
        .bind(user_id)
        .bind(event_type.as_str())
        .bind(event_type.severity())
        .bind(&description)
        .bind(ip_address.as_deref())
        .bind(user_agent.as_deref())
        .bind(&meta)
        .execute(&db)
        .await;

        if let Err(e) = result {
            tracing::error!("Failed to log security event: {}", e);
        }
    });
}

/// Extract IP address from request headers.
pub fn extract_ip(headers: &axum::http::HeaderMap) -> Option<String> {
    headers
        .get("x-forwarded-for")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.split(',').next().unwrap_or(s).trim().to_string())
        .or_else(|| {
            headers
                .get("x-real-ip")
                .and_then(|v| v.to_str().ok())
                .map(|s| s.to_string())
        })
}

/// Extract user agent from request headers.
pub fn extract_user_agent(headers: &axum::http::HeaderMap) -> Option<String> {
    headers
        .get("user-agent")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string())
}
