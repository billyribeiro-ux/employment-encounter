use serde::Deserialize;

#[derive(Debug, Deserialize, Clone)]
pub struct Config {
    #[serde(default = "default_host")]
    pub host: String,
    #[serde(default = "default_port")]
    pub port: u16,
    pub database_url: String,
    pub redis_url: String,
    pub jwt_secret: String,
    #[serde(default = "default_cors_origin")]
    pub cors_origin: String,
    #[serde(default = "default_s3_endpoint")]
    pub s3_endpoint: String,
    #[serde(default = "default_s3_bucket")]
    pub s3_bucket: String,
    #[serde(default = "default_s3_region")]
    pub s3_region: String,
    #[serde(default)]
    pub typesense_url: Option<String>,
    #[serde(default)]
    pub typesense_api_key: Option<String>,
    #[serde(default)]
    pub stripe_secret_key: Option<String>,
    #[serde(default)]
    pub stripe_webhook_secret: Option<String>,
}

fn default_host() -> String {
    "0.0.0.0".to_string()
}

fn default_port() -> u16 {
    8080
}

fn default_cors_origin() -> String {
    "http://localhost:3000".to_string()
}

fn default_s3_endpoint() -> String {
    "http://localhost:4566".to_string()
}

fn default_s3_bucket() -> String {
    "talent-os-documents".to_string()
}

fn default_s3_region() -> String {
    "us-east-1".to_string()
}

/// JWT secret values that exist in repo-tracked .env.example /
/// docker-compose.yml. Production must never use these.
const KNOWN_DEV_JWT_SECRETS: &[&str] = &[
    "dev-secret-change-in-production-must-be-32-chars",
    "change-me-in-production",
    "secret",
];

impl Config {
    pub fn from_env() -> Result<Self, envy::Error> {
        let cfg = envy::from_env::<Config>()?;
        cfg.validate();
        Ok(cfg)
    }

    /// Fail-fast checks for production-hostile defaults. Panics with a
    /// readable message so the operator sees it on boot, not after a
    /// security incident.
    fn validate(&self) {
        if self.jwt_secret.len() < 32 {
            panic!(
                "JWT_SECRET must be at least 32 characters (got {}). \
                 Generate one with `openssl rand -hex 32`.",
                self.jwt_secret.len()
            );
        }

        let app_env = std::env::var("APP_ENV").unwrap_or_else(|_| "development".to_string());
        let is_prod = matches!(app_env.as_str(), "production" | "prod");
        if is_prod && KNOWN_DEV_JWT_SECRETS.contains(&self.jwt_secret.as_str()) {
            panic!(
                "JWT_SECRET is set to a known development default in production. \
                 Set a real secret via `openssl rand -hex 32` before deploying."
            );
        }
    }
}
