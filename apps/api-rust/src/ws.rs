use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        Query, State,
    },
    response::Response,
};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use std::sync::{Arc, RwLock};
use tokio::sync::broadcast;

use crate::auth::jwt::validate_token;
use crate::AppState;

/// Shared broadcast channel for real-time events
#[derive(Clone)]
pub struct WsBroadcast {
    pub tx: Arc<broadcast::Sender<WsEvent>>,
    rooms: Arc<RwLock<HashMap<String, HashSet<(uuid::Uuid, uuid::Uuid)>>>>,
}

impl WsBroadcast {
    pub fn new() -> Self {
        let (tx, _) = broadcast::channel(1024);
        Self {
            tx: Arc::new(tx),
            rooms: Arc::new(RwLock::new(HashMap::new())),
        }
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

    pub fn join_room(&self, room_id: &str, tenant_id: uuid::Uuid, user_id: uuid::Uuid) {
        let mut rooms = self.rooms.write().unwrap();
        rooms.entry(room_id.to_string()).or_default().insert((tenant_id, user_id));
    }

    pub fn leave_room(&self, room_id: &str, tenant_id: uuid::Uuid, user_id: uuid::Uuid) {
        let mut rooms = self.rooms.write().unwrap();
        if let Some(members) = rooms.get_mut(room_id) {
            members.remove(&(tenant_id, user_id));
            if members.is_empty() {
                rooms.remove(room_id);
            }
        }
    }

    pub fn send_to_room(&self, room_id: &str, exclude_user: uuid::Uuid, payload: WsEventPayload) {
        let rooms = self.rooms.read().unwrap();
        if let Some(members) = rooms.get(room_id) {
            for &(tenant_id, user_id) in members {
                if user_id != exclude_user {
                    self.send_to_user(tenant_id, user_id, payload.clone());
                }
            }
        }
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

    // WebRTC signaling
    #[serde(rename = "rtc_offer")]
    RtcOffer {
        room_id: String,
        sdp: String,
    },
    #[serde(rename = "rtc_answer")]
    RtcAnswer {
        room_id: String,
        sdp: String,
    },
    #[serde(rename = "rtc_ice_candidate")]
    RtcIceCandidate {
        room_id: String,
        candidate: String,
    },
    #[serde(rename = "room_join")]
    RoomJoin {
        room_id: String,
    },
    #[serde(rename = "room_leave")]
    RoomLeave {
        room_id: String,
    },

    // Messaging
    #[serde(rename = "typing")]
    Typing {
        client_id: uuid::Uuid,
        user_id: uuid::Uuid,
        user_name: String,
    },
    #[serde(rename = "stop_typing")]
    StopTyping {
        client_id: uuid::Uuid,
        user_id: uuid::Uuid,
    },
    #[serde(rename = "message_read")]
    MessageRead {
        message_id: uuid::Uuid,
        client_id: uuid::Uuid,
        reader_id: uuid::Uuid,
    },
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
            let broadcast = state.ws_broadcast.clone();
            ws.on_upgrade(move |socket| handle_socket(socket, claims.tid, claims.sub, rx, broadcast))
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
    broadcast: WsBroadcast,
) {
    // Send initial connected message
    let connected = serde_json::json!({ "type": "connected", "user_id": user_id });
    let _ = socket.send(Message::Text(connected.to_string().into())).await;

    loop {
        tokio::select! {
            // Receive events from broadcast channel
            event = rx.recv() => {
                match event {
                    Ok(ws_event) => {
                        // Filter: only send events for this tenant + this user (or tenant-wide)
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
            // Receive messages from client (ping/pong, close)
            msg = socket.recv() => {
                match msg {
                    Some(Ok(Message::Text(text))) => {
                        // Handle client ping
                        if text.as_str() == "ping" {
                            let pong = serde_json::json!({ "type": "pong" });
                            let _ = socket.send(Message::Text(pong.to_string().into())).await;
                        } else if let Ok(payload) = serde_json::from_str::<WsEventPayload>(text.as_str()) {
                            match payload {
                                WsEventPayload::RoomJoin { room_id } => {
                                    broadcast.join_room(&room_id, tenant_id, user_id);
                                    let rid = room_id.clone();
                                    broadcast.send_to_room(&rid, user_id, WsEventPayload::RoomJoin { room_id });
                                }
                                WsEventPayload::RoomLeave { room_id } => {
                                    let rid = room_id.clone();
                                    broadcast.send_to_room(&rid, user_id, WsEventPayload::RoomLeave { room_id });
                                    broadcast.leave_room(&rid, tenant_id, user_id);
                                }
                                WsEventPayload::RtcOffer { room_id, sdp } => {
                                    let rid = room_id.clone();
                                    broadcast.send_to_room(&rid, user_id, WsEventPayload::RtcOffer { room_id, sdp });
                                }
                                WsEventPayload::RtcAnswer { room_id, sdp } => {
                                    let rid = room_id.clone();
                                    broadcast.send_to_room(&rid, user_id, WsEventPayload::RtcAnswer { room_id, sdp });
                                }
                                WsEventPayload::RtcIceCandidate { room_id, candidate } => {
                                    let rid = room_id.clone();
                                    broadcast.send_to_room(&rid, user_id, WsEventPayload::RtcIceCandidate { room_id, candidate });
                                }
                                WsEventPayload::Typing { client_id, user_name, .. } => {
                                    broadcast.send_to_tenant(tenant_id, WsEventPayload::Typing { client_id, user_id, user_name });
                                }
                                WsEventPayload::StopTyping { client_id, .. } => {
                                    broadcast.send_to_tenant(tenant_id, WsEventPayload::StopTyping { client_id, user_id });
                                }
                                _ => {}
                            }
                        }
                    }
                    Some(Ok(Message::Ping(data))) => {
                        let _ = socket.send(Message::Pong(data)).await;
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
