"use client";

import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  WifiOff,
  ShieldAlert,
  RefreshCw,
  Home,
  Bug,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// ── Error Types ──────────────────────────────────────────────────────
type ErrorType = "network" | "permission" | "notFound" | "generic";

function classifyError(error: Error): ErrorType {
  const msg = error.message.toLowerCase();
  if (
    msg.includes("network") ||
    msg.includes("fetch") ||
    msg.includes("failed to load") ||
    msg.includes("econnrefused") ||
    msg.includes("timeout")
  ) {
    return "network";
  }
  if (
    msg.includes("403") ||
    msg.includes("forbidden") ||
    msg.includes("unauthorized") ||
    msg.includes("permission")
  ) {
    return "permission";
  }
  if (msg.includes("404") || msg.includes("not found")) {
    return "notFound";
  }
  return "generic";
}

const ERROR_CONFIG: Record<
  ErrorType,
  {
    icon: typeof AlertTriangle;
    title: string;
    description: string;
    iconBg: string;
    iconColor: string;
  }
> = {
  network: {
    icon: WifiOff,
    title: "Connection Lost",
    description:
      "Unable to reach the server. Check your internet connection and try again.",
    iconBg: "bg-amber-500/10 dark:bg-amber-500/15",
    iconColor: "text-amber-500",
  },
  permission: {
    icon: ShieldAlert,
    title: "Access Denied",
    description:
      "You don't have permission to view this resource. Contact your administrator if you believe this is a mistake.",
    iconBg: "bg-orange-500/10 dark:bg-orange-500/15",
    iconColor: "text-orange-500",
  },
  notFound: {
    icon: Bug,
    title: "Page Not Found",
    description:
      "The requested resource could not be found. It may have been moved or deleted.",
    iconBg: "bg-blue-500/10 dark:bg-blue-500/15",
    iconColor: "text-blue-500",
  },
  generic: {
    icon: AlertTriangle,
    title: "Something Went Wrong",
    description:
      "An unexpected error occurred. Please try again or contact support if the problem persists.",
    iconBg: "bg-destructive/10 dark:bg-destructive/15",
    iconColor: "text-destructive",
  },
};

// ── Animation Variants ───────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0, scale: 0.92, filter: "blur(8px)" },
  visible: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1] as const,
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const iconShakeVariants = {
  initial: { rotate: 0 },
  animate: {
    rotate: [0, -12, 12, -8, 8, -4, 4, 0],
    transition: { duration: 0.6, delay: 0.4, ease: "easeInOut" as const },
  },
};

const pulseRing = {
  initial: { scale: 1, opacity: 0.4 },
  animate: {
    scale: [1, 1.4, 1],
    opacity: [0.4, 0, 0.4],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" as const },
  },
};

// ── Fallback UI ──────────────────────────────────────────────────────
function ErrorFallback({
  error,
  resetError,
}: {
  error: Error;
  resetError: () => void;
}) {
  const errorType = classifyError(error);
  const config = ERROR_CONFIG[errorType];
  const Icon = config.icon;

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <AnimatePresence mode="wait">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md"
        >
          <Card className="border-0 shadow-lg overflow-hidden">
            {/* Top accent bar */}
            <div className="h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent" />

            <CardContent className="pt-8 pb-8">
              <motion.div
                className="flex flex-col items-center text-center"
                variants={containerVariants}
              >
                {/* Animated Icon */}
                <motion.div variants={itemVariants} className="relative mb-6">
                  <motion.div
                    className={`rounded-2xl ${config.iconBg} p-5`}
                    variants={iconShakeVariants}
                    initial="initial"
                    animate="animate"
                  >
                    <Icon className={`h-8 w-8 ${config.iconColor}`} />
                  </motion.div>
                  <motion.div
                    className={`absolute inset-0 rounded-2xl border-2 ${config.iconColor} opacity-20`}
                    variants={pulseRing}
                    initial="initial"
                    animate="animate"
                  />
                </motion.div>

                {/* Title */}
                <motion.h2
                  variants={itemVariants}
                  className="text-xl font-semibold tracking-tight mb-2"
                >
                  {config.title}
                </motion.h2>

                {/* Description */}
                <motion.p
                  variants={itemVariants}
                  className="text-sm text-muted-foreground mb-4 max-w-sm leading-relaxed"
                >
                  {config.description}
                </motion.p>

                {/* Error detail (collapsed) */}
                {error.message && (
                  <motion.div
                    variants={itemVariants}
                    className="w-full mb-6 rounded-lg bg-muted/50 border border-border/50 px-4 py-3"
                  >
                    <p className="text-xs text-muted-foreground font-mono break-all leading-relaxed">
                      {error.message}
                    </p>
                  </motion.div>
                )}

                {/* Actions */}
                <motion.div
                  variants={itemVariants}
                  className="flex items-center gap-3"
                >
                  <Button
                    onClick={resetError}
                    className="shadow-sm gap-2"
                    size="default"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                  </Button>
                  <Button
                    variant="outline"
                    className="shadow-sm gap-2"
                    size="default"
                    onClick={() => (window.location.href = "/dashboard")}
                  >
                    <Home className="h-4 w-4" />
                    Dashboard
                  </Button>
                </motion.div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ── Error Boundary Class Component ───────────────────────────────────
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log errors (console for now, can be replaced with a service)
    console.error("[ErrorBoundary] Caught error:", error);
    console.error("[ErrorBoundary] Component stack:", errorInfo.componentStack);

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <ErrorFallback
          error={this.state.error}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

// ── Functional Wrapper for convenience ───────────────────────────────
export function WithErrorBoundary({
  children,
  onError,
}: {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}) {
  return <ErrorBoundary onError={onError}>{children}</ErrorBoundary>;
}
