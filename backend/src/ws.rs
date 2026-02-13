use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        Query, State,
    },
    response::Response,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::broadcast;
use tokio::time::{interval, Duration};

use crate::auth::jwt::validate_token;
use crate::AppState;

/// Shared broadcast channel for real-time events
#[derive(Clone)]
pub struct WsBroadcast {
    pub tx: Arc<broadcast::Sender<WsEvent>>,
}

impl WsBroadcast {
    pub fn new() -> Self {
        let (tx, _) = broadcast::channel(1024);
        Self { tx: Arc::new(tx) }
    }

    pub fn send_to_user(&self, tenant_id: uuid::Uuid, user_id: uuid::Uuid, event: WsEventPayload) {
        let _ = self.tx.send(WsEvent {
            tenant_id,
            user_id,
            payload: event,
        });
    }

    pub fn send_to_tenant(&self, tenant_id: uuid::Uuid, event: WsEventPayload) {
        let _ = self.tx.send(WsEvent {
            tenant_id,
            user_id: uuid::Uuid::nil(), // nil = broadcast to all tenant users
            payload: event,
        });
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct WsEvent {
    pub tenant_id: uuid::Uuid,
    pub user_id: uuid::Uuid,
    pub payload: WsEventPayload,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum WsEventPayload {
    #[serde(rename = "notification")]
    Notification {
        id: uuid::Uuid,
        title: String,
        body: Option<String>,
    },
    #[serde(rename = "message")]
    NewMessage {
        id: uuid::Uuid,
        client_id: uuid::Uuid,
        sender_name: String,
        preview: String,
    },
    #[serde(rename = "document_processed")]
    DocumentProcessed {
        id: uuid::Uuid,
        filename: String,
        category: Option<String>,
        confidence: Option<f64>,
    },
    #[serde(rename = "workflow_update")]
    WorkflowUpdate {
        id: uuid::Uuid,
        name: String,
        step: String,
        status: String,
    },
    #[serde(rename = "invoice_paid")]
    InvoicePaid {
        id: uuid::Uuid,
        invoice_number: String,
        amount_cents: i64,
    },
    #[serde(rename = "ping")]
    Ping,
}

#[derive(Debug, Deserialize)]
pub struct WsQuery {
    pub token: String,
}

pub async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
    Query(query): Query<WsQuery>,
) -> Response {
    // Validate JWT from query param
    let token_result = validate_token(&query.token, &state.config.jwt_secret);

    match token_result {
        Ok(token_data) => {
            let claims = token_data.claims;
            let rx = state.ws_broadcast.tx.subscribe();
            ws.on_upgrade(move |socket| handle_socket(socket, claims.tid, claims.sub, rx))
        }
        Err(_) => {
            // Return upgrade but immediately close with auth error
            ws.on_upgrade(|mut socket| async move {
                let _ = socket
                    .send(Message::Close(Some(axum::extract::ws::CloseFrame {
                        code: 4001,
                        reason: "Unauthorized".into(),
                    })))
                    .await;
            })
        }
    }
}

async fn handle_socket(
    mut socket: WebSocket,
    tenant_id: uuid::Uuid,
    user_id: uuid::Uuid,
    mut rx: broadcast::Receiver<WsEvent>,
) {
    // Send initial connected message
    let connected = serde_json::json!({ "type": "connected", "user_id": user_id });
    let _ = socket.send(Message::Text(connected.to_string().into())).await;

    let mut heartbeat = interval(Duration::from_secs(30));
    let mut last_pong = tokio::time::Instant::now();

    loop {
        tokio::select! {
            _ = heartbeat.tick() => {
                // Check if client is still responsive
                if last_pong.elapsed() > Duration::from_secs(90) {
                    tracing::warn!("WebSocket heartbeat timeout for user {}", user_id);
                    break;
                }
                let ping = serde_json::json!({ "type": "ping" });
                if socket.send(Message::Text(ping.to_string().into())).await.is_err() {
                    break;
                }
            }
            event = rx.recv() => {
                match event {
                    Ok(ws_event) => {
                        if ws_event.tenant_id == tenant_id
                            && (ws_event.user_id == user_id || ws_event.user_id == uuid::Uuid::nil())
                        {
                            let json = serde_json::to_string(&ws_event.payload).unwrap_or_default();
                            if socket.send(Message::Text(json.into())).await.is_err() {
                                break;
                            }
                        }
                    }
                    Err(broadcast::error::RecvError::Lagged(n)) => {
                        tracing::warn!("WebSocket client lagged by {} messages", n);
                    }
                    Err(broadcast::error::RecvError::Closed) => {
                        break;
                    }
                }
            }
            msg = socket.recv() => {
                match msg {
                    Some(Ok(Message::Text(text))) => {
                        if text.as_str() == "ping" || text.as_str() == "pong" {
                            last_pong = tokio::time::Instant::now();
                            let pong = serde_json::json!({ "type": "pong" });
                            let _ = socket.send(Message::Text(pong.to_string().into())).await;
                        }
                    }
                    Some(Ok(Message::Ping(data))) => {
                        last_pong = tokio::time::Instant::now();
                        let _ = socket.send(Message::Pong(data)).await;
                    }
                    Some(Ok(Message::Pong(_))) => {
                        last_pong = tokio::time::Instant::now();
                    }
                    Some(Ok(Message::Close(_))) | None => {
                        break;
                    }
                    _ => {}
                }
            }
        }
    }

    tracing::debug!("WebSocket connection closed for user {}", user_id);
}
