"use client";

import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8080";

const MAX_RECONNECT_DELAY = 30000; // 30s cap
const INITIAL_RECONNECT_DELAY = 1000; // 1s start
const PING_INTERVAL = 30000;

export type WsEventType =
  | "notification"
  | "message"
  | "document_processed"
  | "workflow_update"
  | "invoice_paid"
  | "task_update"
  | "client_update"
  | "expense_update"
  | "time_entry_update"
  | "ping"
  | "pong"
  | "connected"
  | "error";

export interface WsEvent {
  type: WsEventType;
  data?: Record<string, unknown>;
}

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY);
  const isUnmountedRef = useRef(false);

  const handleEvent = useCallback(
    (event: WsEvent) => {
      switch (event.type) {
        case "notification":
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
          // Show toast for new notifications
          if (event.data?.title) {
            toast.info(String(event.data.title), {
              description: event.data.body ? String(event.data.body) : undefined,
              duration: 5000,
            });
          }
          break;
        case "message":
          queryClient.invalidateQueries({ queryKey: ["messages"] });
          break;
        case "document_processed":
          queryClient.invalidateQueries({ queryKey: ["documents"] });
          if (event.data?.name) {
            toast.success(`Document "${event.data.name}" processed`);
          }
          break;
        case "workflow_update":
          queryClient.invalidateQueries({ queryKey: ["workflows"] });
          break;
        case "invoice_paid":
          queryClient.invalidateQueries({ queryKey: ["invoices"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard"] });
          if (event.data?.amount) {
            toast.success("Payment received!", {
              description: `Invoice payment of $${(Number(event.data.amount) / 100).toFixed(2)} confirmed`,
            });
          }
          break;
        case "task_update":
          queryClient.invalidateQueries({ queryKey: ["tasks"] });
          break;
        case "client_update":
          queryClient.invalidateQueries({ queryKey: ["clients"] });
          break;
        case "expense_update":
          queryClient.invalidateQueries({ queryKey: ["expenses"] });
          break;
        case "time_entry_update":
          queryClient.invalidateQueries({ queryKey: ["time-entries"] });
          break;
        case "connected":
          // Reset reconnect delay on successful connection
          reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;
          break;
      }
    },
    [queryClient]
  );

  useEffect(() => {
    isUnmountedRef.current = false;

    function connect() {
      if (isUnmountedRef.current) return;

      const token = localStorage.getItem("access_token");
      if (!token) return;

      try {
        const ws = new WebSocket(`${WS_URL}/api/v1/ws?token=${token}`);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("[WS] Connected");
          reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;
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
              case "application_update":
                queryClient.invalidateQueries({ queryKey: ["applications"] });
                queryClient.invalidateQueries({ queryKey: ["dashboard"] });
                break;
            }
          } catch {
            // ignore non-JSON messages (pong, etc.)
          }
        };

        ws.onclose = (event) => {
          console.log("[WS] Disconnected:", event.code);
          wsRef.current = null;

          // Don't reconnect on auth errors or intentional close
          if (event.code === 4001 || isUnmountedRef.current) return;

          // Exponential backoff reconnect
          const delay = reconnectDelayRef.current;
          reconnectDelayRef.current = Math.min(delay * 2, MAX_RECONNECT_DELAY);
          console.log(`[WS] Reconnecting in ${delay}ms...`);
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch {
        // Connection failed, schedule retry
        const delay = reconnectDelayRef.current;
        reconnectDelayRef.current = Math.min(delay * 2, MAX_RECONNECT_DELAY);
        reconnectTimeoutRef.current = setTimeout(connect, delay);
      }
    }

    connect();

    // Ping every 30s to keep connection alive
    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send("ping");
      }
    }, PING_INTERVAL);

    return () => {
      isUnmountedRef.current = true;
      clearInterval(pingInterval);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
    };
  }, [handleEvent]);

  return wsRef;
}
