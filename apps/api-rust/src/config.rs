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
    "cpa-documents".to_string()
}

fn default_s3_region() -> String {
    "us-east-1".to_string()
}

impl Config {
    pub fn from_env() -> Result<Self, envy::Error> {
        envy::from_env::<Config>()
    }
}
