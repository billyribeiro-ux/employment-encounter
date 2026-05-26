//! Helpers for setting and clearing the HttpOnly auth cookies that
//! carry the access + refresh tokens. We keep them HttpOnly so XSS
//! cannot exfiltrate them, SameSite=Strict so they don't ride
//! cross-site form posts, and Secure in production (the dev flag is
//! gated so localhost over http still works in browsers).
//!
//! Naming + lifetimes follow the JWTs they wrap:
//!
//! - `access_token`  — Max-Age=900 (15 minutes), scoped to /
//! - `refresh_token` — Max-Age=604800 (7 days), scoped to /api/v1/auth
//!
//! The refresh cookie is path-scoped so it only rides on the refresh
//! endpoint, reducing exposure across the request surface.

use axum::http::{header, HeaderMap, HeaderValue};

const ACCESS_COOKIE: &str = "access_token";
const REFRESH_COOKIE: &str = "refresh_token";
const ACCESS_MAX_AGE: i64 = 60 * 15; // 15 minutes
const REFRESH_MAX_AGE: i64 = 60 * 60 * 24 * 7; // 7 days
const REFRESH_PATH: &str = "/api/v1/auth";

fn is_prod() -> bool {
    matches!(
        std::env::var("APP_ENV").as_deref(),
        Ok("production") | Ok("prod")
    )
}

fn secure_attr() -> &'static str {
    if is_prod() {
        "; Secure"
    } else {
        ""
    }
}

fn build_set_cookie(name: &str, value: &str, max_age: i64, path: &str) -> String {
    format!(
        "{name}={value}; Path={path}; Max-Age={max_age}; HttpOnly; SameSite=Strict{secure}",
        secure = secure_attr()
    )
}

fn build_clear_cookie(name: &str, path: &str) -> String {
    format!(
        "{name}=; Path={path}; Max-Age=0; HttpOnly; SameSite=Strict{secure}",
        secure = secure_attr()
    )
}

/// Append `Set-Cookie` headers for both auth tokens. Use after
/// register / login / MFA verify / refresh.
pub fn set_auth_cookies(headers: &mut HeaderMap, access: &str, refresh: &str) {
    let access_cookie = build_set_cookie(ACCESS_COOKIE, access, ACCESS_MAX_AGE, "/");
    let refresh_cookie = build_set_cookie(REFRESH_COOKIE, refresh, REFRESH_MAX_AGE, REFRESH_PATH);

    if let Ok(hv) = HeaderValue::from_str(&access_cookie) {
        headers.append(header::SET_COOKIE, hv);
    }
    if let Ok(hv) = HeaderValue::from_str(&refresh_cookie) {
        headers.append(header::SET_COOKIE, hv);
    }
}

/// Append `Set-Cookie` headers that expire both auth cookies. Use on
/// logout. Must use the same Path attribute the cookie was set with;
/// otherwise the browser keeps the original.
pub fn clear_auth_cookies(headers: &mut HeaderMap) {
    let access_clear = build_clear_cookie(ACCESS_COOKIE, "/");
    let refresh_clear = build_clear_cookie(REFRESH_COOKIE, REFRESH_PATH);

    if let Ok(hv) = HeaderValue::from_str(&access_clear) {
        headers.append(header::SET_COOKIE, hv);
    }
    if let Ok(hv) = HeaderValue::from_str(&refresh_clear) {
        headers.append(header::SET_COOKIE, hv);
    }
}

/// Read the access_token cookie value from an incoming request's
/// `Cookie` header. Used by the auth middleware to honor cookie-based
/// browser sessions in addition to Bearer auth.
pub fn extract_access_cookie(headers: &HeaderMap) -> Option<String> {
    extract_cookie(headers, ACCESS_COOKIE)
}

/// Read the refresh_token cookie value. Used by the refresh endpoint
/// to support clients that haven't migrated off the JSON body yet.
pub fn extract_refresh_cookie(headers: &HeaderMap) -> Option<String> {
    extract_cookie(headers, REFRESH_COOKIE)
}

fn extract_cookie(headers: &HeaderMap, name: &str) -> Option<String> {
    headers
        .get(header::COOKIE)
        .and_then(|v| v.to_str().ok())
        .and_then(|cookies| {
            cookies.split(';').find_map(|cookie| {
                let cookie = cookie.trim();
                cookie
                    .strip_prefix(&format!("{name}="))
                    .map(|value| value.to_string())
            })
        })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn set_includes_httponly_and_samesite() {
        let mut headers = HeaderMap::new();
        set_auth_cookies(&mut headers, "atok", "rtok");
        let cookies: Vec<&str> = headers
            .get_all(header::SET_COOKIE)
            .iter()
            .filter_map(|v| v.to_str().ok())
            .collect();
        assert_eq!(cookies.len(), 2);
        for c in cookies {
            assert!(c.contains("HttpOnly"), "missing HttpOnly: {c}");
            assert!(c.contains("SameSite=Strict"), "missing SameSite: {c}");
        }
    }

    #[test]
    fn clear_sets_max_age_zero() {
        let mut headers = HeaderMap::new();
        clear_auth_cookies(&mut headers);
        let cookies: Vec<&str> = headers
            .get_all(header::SET_COOKIE)
            .iter()
            .filter_map(|v| v.to_str().ok())
            .collect();
        for c in cookies {
            assert!(c.contains("Max-Age=0"), "missing Max-Age=0: {c}");
        }
    }

    #[test]
    fn extract_parses_cookie_value() {
        let mut headers = HeaderMap::new();
        headers.insert(
            header::COOKIE,
            HeaderValue::from_static("other=junk; access_token=ABCD.EFGH; foo=bar"),
        );
        assert_eq!(extract_access_cookie(&headers), Some("ABCD.EFGH".into()));
        assert_eq!(extract_refresh_cookie(&headers), None);
    }

    #[test]
    fn refresh_cookie_scoped_path() {
        let mut headers = HeaderMap::new();
        set_auth_cookies(&mut headers, "a", "r");
        let cookies: Vec<String> = headers
            .get_all(header::SET_COOKIE)
            .iter()
            .filter_map(|v| v.to_str().ok().map(String::from))
            .collect();
        let refresh = cookies
            .iter()
            .find(|c| c.starts_with("refresh_token="))
            .expect("refresh cookie present");
        assert!(refresh.contains("Path=/api/v1/auth"), "{refresh}");
        let access = cookies
            .iter()
            .find(|c| c.starts_with("access_token="))
            .expect("access cookie present");
        assert!(access.contains("Path=/"), "{access}");
    }
}
