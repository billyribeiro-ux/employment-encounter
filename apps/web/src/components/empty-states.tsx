"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Users,
  FileText,
  Receipt,
  CheckSquare,
  MessageSquare,
  Clock,
  BarChart3,
  FolderOpen,
  Inbox,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// ── Animation Variants ───────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const iconFloat = {
  initial: { y: 0 },
  animate: {
    y: [-4, 4, -4],
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" as const },
  },
};

const pulseRing = {
  initial: { scale: 1, opacity: 0.3 },
  animate: {
    scale: [1, 1.5, 1],
    opacity: [0.3, 0, 0.3],
    transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" as const },
  },
};

// ── Generic Empty State Base ─────────────────────────────────────────

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: LucideIcon;
  children?: ReactNode;
  iconColor?: string;
  iconBg?: string;
}

function EmptyStateBase({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon: ActionIcon = Plus,
  children,
  iconColor = "text-primary/60",
  iconBg = "bg-primary/5",
}: EmptyStateProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Card className="border-0 shadow-sm">
        <CardContent className="py-16">
          <motion.div
            className="flex flex-col items-center justify-center text-center"
            variants={containerVariants}
          >
            {/* Animated icon with pulse ring and decorative dots */}
            <motion.div variants={itemVariants} className="relative mb-6">
              <motion.div
                className={`flex h-20 w-20 items-center justify-center rounded-2xl ${iconBg} ring-1 ring-primary/10`}
                variants={iconFloat}
                initial="initial"
                animate="animate"
              >
                <Icon className={`h-10 w-10 ${iconColor}`} strokeWidth={1.5} />
              </motion.div>
              <motion.div
                className="absolute inset-0 rounded-2xl border-2 border-primary/20"
                variants={pulseRing}
                initial="initial"
                animate="animate"
              />
              {/* Decorative floating dots */}
              <motion.div
                className="absolute -top-2 -right-2 h-3 w-3 rounded-full bg-primary/20"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.4, 0.8, 0.4],
                }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              />
              <motion.div
                className="absolute -bottom-1 -left-3 h-2 w-2 rounded-full bg-primary/15"
                animate={{
                  scale: [1, 1.4, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{ duration: 2.5, repeat: Infinity, delay: 1 }}
              />
            </motion.div>

            {/* Title */}
            <motion.h3
              variants={itemVariants}
              className="text-lg font-semibold tracking-tight mb-2"
            >
              {title}
            </motion.h3>

            {/* Description */}
            <motion.p
              variants={itemVariants}
              className="text-sm text-muted-foreground mb-6 max-w-sm leading-relaxed"
            >
              {description}
            </motion.p>

            {/* Action button */}
            {actionLabel && onAction && (
              <motion.div variants={itemVariants}>
                <Button onClick={onAction} size="sm" className="shadow-sm gap-2">
                  <ActionIcon className="h-4 w-4" />
                  {actionLabel}
                </Button>
              </motion.div>
            )}

            {/* Custom children */}
            {children && <motion.div variants={itemVariants}>{children}</motion.div>}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Pre-configured Empty States ──────────────────────────────────────

export function EmptyClients({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyStateBase
      icon={Users}
      title="No clients yet"
      description="Start building your client base. Add your first client to manage their information, documents, and billing all in one place."
      actionLabel="Add Client"
      onAction={onAction}
      iconColor="text-blue-500"
      iconBg="bg-blue-500/10"
    />
  );
}

export function EmptyInvoices({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyStateBase
      icon={Receipt}
      title="No invoices yet"
      description="Create your first invoice to start billing clients. Track payments, send reminders, and get paid faster."
      actionLabel="Create Invoice"
      onAction={onAction}
      iconColor="text-emerald-500"
      iconBg="bg-emerald-500/10"
    />
  );
}

export function EmptyDocuments({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyStateBase
      icon={FileText}
      title="No documents yet"
      description="Upload documents to securely store and organize your client files. Supports PDF, images, spreadsheets, and more."
      actionLabel="Upload Document"
      onAction={onAction}
      iconColor="text-violet-500"
      iconBg="bg-violet-500/10"
    />
  );
}

export function EmptyTasks({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyStateBase
      icon={CheckSquare}
      title="No tasks yet"
      description="Create tasks to track your team's work. Organize by priority, assign to team members, and never miss a deadline."
      actionLabel="Create Task"
      onAction={onAction}
      iconColor="text-amber-500"
      iconBg="bg-amber-500/10"
    />
  );
}

export function EmptyMessages({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyStateBase
      icon={MessageSquare}
      title="No messages yet"
      description="Start a conversation with a client or team member. Secure messaging keeps all communication in one place."
      actionLabel="New Message"
      onAction={onAction}
      iconColor="text-pink-500"
      iconBg="bg-pink-500/10"
    />
  );
}

export function EmptyTimeEntries({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyStateBase
      icon={Clock}
      title="No time entries yet"
      description="Start tracking your time to accurately bill clients. Use the timer or log entries manually."
      actionLabel="Log Time"
      onAction={onAction}
      iconColor="text-cyan-500"
      iconBg="bg-cyan-500/10"
    />
  );
}

export function EmptyExpenses({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyStateBase
      icon={Receipt}
      title="No expenses yet"
      description="Track expenses to get a complete picture of your firm's finances. Categorize, attach receipts, and generate reports."
      actionLabel="Add Expense"
      onAction={onAction}
      iconColor="text-orange-500"
      iconBg="bg-orange-500/10"
    />
  );
}

export function EmptyReports() {
  return (
    <EmptyStateBase
      icon={BarChart3}
      title="No report data available"
      description="Reports will populate once you have clients, invoices, and time entries. Start adding data to see insights."
      iconColor="text-indigo-500"
      iconBg="bg-indigo-500/10"
    />
  );
}

export function EmptyGeneric({
  title = "Nothing here yet",
  description = "This section is empty. Start adding items to see them here.",
  actionLabel,
  onAction,
}: {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <EmptyStateBase
      icon={Inbox}
      title={title}
      description={description}
      actionLabel={actionLabel}
      onAction={onAction}
    />
  );
}

// Re-export the base component for custom use cases
export { EmptyStateBase as EmptyState };
