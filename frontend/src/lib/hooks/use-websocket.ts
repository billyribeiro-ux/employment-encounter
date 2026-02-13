"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080";

export type WsEventType =
  | "notification"
  | "message"
  | "document_processed"
  | "workflow_update"
  | "invoice_paid"
  | "ping"
  | "pong"
  | "connected";

export interface WsEvent {
  type: WsEventType;
  data?: Record<string, unknown>;
}

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    function connect() {
      const token = localStorage.getItem("access_token");
      if (!token) return;

      const ws = new WebSocket(`${WS_URL}/api/v1/ws?token=${token}`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[WS] Connected");
      };

      ws.onmessage = (event) => {
        try {
          const data: WsEvent = JSON.parse(event.data);

          switch (data.type) {
            case "notification":
              queryClient.invalidateQueries({ queryKey: ["notifications"] });
              break;
            case "message":
              queryClient.invalidateQueries({ queryKey: ["messages"] });
              queryClient.invalidateQueries({ queryKey: ["unread-counts"] });
              break;
            case "message_read":
              queryClient.invalidateQueries({ queryKey: ["messages"] });
              queryClient.invalidateQueries({ queryKey: ["unread-counts"] });
              break;
            case "document_processed":
              queryClient.invalidateQueries({ queryKey: ["documents"] });
              break;
            case "workflow_update":
              queryClient.invalidateQueries({ queryKey: ["workflows"] });
              break;
            case "invoice_paid":
              queryClient.invalidateQueries({ queryKey: ["invoices"] });
              queryClient.invalidateQueries({ queryKey: ["dashboard"] });
              break;
          }
        } catch {
          // ignore non-JSON messages
        }
      };

      ws.onclose = (event) => {
        console.log("[WS] Disconnected:", event.code);
        wsRef.current = null;
        // Reconnect after 3 seconds unless auth error
        if (event.code !== 4001) {
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    // Ping every 30s to keep connection alive
    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send("ping");
      }
    }, 30000);

    return () => {
      clearInterval(pingInterval);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
    };
  }, [queryClient]);

  return wsRef;
}
