"use client";

import Link from "next/link";
import {
  Users,
  FileText,
  Clock,
  Receipt,
  TrendingUp,
  DollarSign,
  Plus,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  Upload,
  Activity,
  UserPlus,
  Timer,
  Send,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDashboardStats } from "@/lib/hooks/use-dashboard";
import { useComplianceDeadlines } from "@/lib/hooks/use-compliance";
import { useTasks } from "@/lib/hooks/use-tasks";
import { useNotifications } from "@/lib/hooks/use-notifications";
import { Skeleton } from "@/components/ui/skeleton";

const RevenueChart = dynamic(
  () => import("@/components/charts/revenue-chart").then((m) => m.RevenueChart),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full rounded-lg" /> }
);
const UtilizationChart = dynamic(
  () => import("@/components/charts/utilization-chart").then((m) => m.UtilizationChart),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full rounded-lg" /> }
);
const RevenueSparkline = dynamic(
  () => import("@/components/charts/revenue-sparkline").then((m) => m.RevenueSparkline),
  { ssr: false, loading: () => <Skeleton className="h-8 w-20 rounded" /> }
);

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function daysUntil(dateStr: string): number {
  const due = new Date(dateStr);
  const now = new Date();
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const activityIcons: Record<string, { icon: typeof Activity; color: string; bg: string }> = {
  invoice_created: { icon: Receipt, color: "text-blue-600", bg: "bg-blue-500/10" },
  invoice_sent: { icon: Send, color: "text-indigo-600", bg: "bg-indigo-500/10" },
  invoice_paid: { icon: DollarSign, color: "text-green-600", bg: "bg-green-500/10" },
  client_created: { icon: UserPlus, color: "text-violet-600", bg: "bg-violet-500/10" },
  document_uploaded: { icon: Upload, color: "text-amber-600", bg: "bg-amber-500/10" },
  time_logged: { icon: Timer, color: "text-cyan-600", bg: "bg-cyan-500/10" },
  document_viewed: { icon: Eye, color: "text-slate-600", bg: "bg-slate-500/10" },
  client_updated: { icon: Edit, color: "text-orange-600", bg: "bg-orange-500/10" },
  task_completed: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-500/10" },
  invoice_deleted: { icon: Trash2, color: "text-red-600", bg: "bg-red-500/10" },
  default: { icon: Activity, color: "text-muted-foreground", bg: "bg-muted" },
};

export default function DashboardPage() {
  const { data: stats, isLoading, isError } = useDashboardStats();
  const { data: deadlinesData } = useComplianceDeadlines({ per_page: 5 });
  const { data: tasksData } = useTasks({ per_page: 5, status: "todo" });
  const { data: notificationsData } = useNotifications({ per_page: 8 });

  const deadlines = deadlinesData?.data ?? [];
  const tasks = tasksData?.data ?? [];
  const recentActivity = notificationsData?.data ?? [];

  const metrics = [
    { name: "Active Clients", value: stats ? String(stats.active_clients) : "—", icon: Users, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10" },
    { name: "Documents", value: stats ? String(stats.total_documents) : "—", icon: FileText, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
    { name: "Hours This Week", value: stats ? `${stats.hours_this_week.toFixed(1)}h` : "—", icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" },
    { name: "Outstanding Invoices", value: stats ? String(stats.outstanding_invoices) : "—", icon: Receipt, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-500/10" },
    { name: "Outstanding Amount", value: stats ? formatCents(stats.outstanding_amount_cents) : "—", icon: DollarSign, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500/10" },
    { name: "Revenue MTD", value: stats ? formatCents(stats.revenue_mtd_cents) : "—", icon: TrendingUp, color: "text-green-600 dark:text-green-400", bg: "bg-green-500/10", hasSparkline: true },
  ];

  const quickActions = [
    { label: "New Client", href: "/clients", icon: UserPlus, color: "text-blue-600", bg: "hover:bg-blue-500/10 hover:border-blue-500/20" },
    { label: "New Invoice", href: "/invoices", icon: Receipt, color: "text-emerald-600", bg: "hover:bg-emerald-500/10 hover:border-emerald-500/20" },
    { label: "Log Time", href: "/time", icon: Clock, color: "text-amber-600", bg: "hover:bg-amber-500/10 hover:border-amber-500/20" },
    { label: "Upload Document", href: "/documents", icon: Upload, color: "text-violet-600", bg: "hover:bg-violet-500/10 hover:border-violet-500/20" },
  ];

  return (
    <motion.div
      className="space-y-6"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Overview of your firm&apos;s performance
          </p>
        </div>
      </motion.div>

      {/* Quick Actions Bar */}
      <motion.div variants={fadeUp}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickActions.map((action, i) => (
            <motion.div
              key={action.label}
              variants={scaleIn}
              custom={i}
            >
              <Link href={action.href}>
                <Card className={`border border-transparent shadow-sm cursor-pointer transition-all duration-300 ${action.bg} group`}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className={`rounded-xl p-2.5 bg-muted/50 transition-colors group-hover:bg-background/80`}>
                      <action.icon className={`h-5 w-5 ${action.color} transition-transform duration-300 group-hover:scale-110`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{action.label}</p>
                      <p className="text-[10px] text-muted-foreground">Quick action</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      ) : isError ? (
        <motion.div variants={fadeUp} className="text-center py-12">
          <p className="text-sm text-destructive">
            Failed to load dashboard stats. Make sure the backend is running.
          </p>
        </motion.div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {metrics.map((metric, i) => (
              <motion.div key={metric.name} variants={fadeUp} custom={i}>
                <Card className="card-hover border-0 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {metric.name}
                    </CardTitle>
                    <div className={`rounded-xl p-2.5 ${metric.bg}`}>
                      <metric.icon className={`h-4 w-4 ${metric.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end justify-between gap-2">
                      <div className="text-2xl font-bold tracking-tight animate-count-up">
                        {metric.value}
                      </div>
                      {"hasSparkline" in metric && metric.hasSparkline && (
                        <div className="h-8 w-20 opacity-70">
                          <RevenueSparkline />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <motion.div variants={fadeUp}>
              <Card className="border-0 shadow-sm overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Revenue Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <RevenueChart />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={fadeUp}>
              <Card className="border-0 shadow-sm overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Team Utilization</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <UtilizationChart />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Recent Activity + Deadlines + Tasks */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Recent Activity Timeline */}
            <motion.div variants={fadeUp}>
              <Card className="border-0 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
                  <Badge variant="outline" className="text-[10px] tabular-nums">
                    Live
                    <span className="ml-1.5 relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                    </span>
                  </Badge>
                </CardHeader>
                <CardContent>
                  {recentActivity.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="rounded-full bg-muted p-3 mb-3">
                        <Activity className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">No recent activity</p>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* Timeline line */}
                      <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />
                      <div className="space-y-1">
                        {recentActivity.slice(0, 8).map((item, idx) => {
                          const activityConfig = activityIcons[item.type] || activityIcons.default;
                          const IconComponent = activityConfig.icon;
                          return (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{
                                delay: idx * 0.05,
                                duration: 0.4,
                                ease: [0.16, 1, 0.3, 1] as const,
                              }}
                              className="relative flex items-start gap-3 py-2 pl-1 group"
                            >
                              <div className={`relative z-10 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full ${activityConfig.bg} ring-2 ring-background transition-transform duration-200 group-hover:scale-110`}>
                                <IconComponent className={`h-3.5 w-3.5 ${activityConfig.color}`} />
                              </div>
                              <div className="flex-1 min-w-0 pt-0.5">
                                <p className="text-sm font-medium leading-tight truncate">
                                  {item.title}
                                </p>
                                {item.body && (
                                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                                    {item.body}
                                  </p>
                                )}
                                <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                                  {timeAgo(item.created_at)}
                                </p>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Upcoming Deadlines */}
            <motion.div variants={fadeUp}>
              <Card className="border-0 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-semibold">Upcoming Deadlines</CardTitle>
                  <Link href="/calendar">
                    <Button variant="ghost" size="sm" className="text-xs group">
                      View all <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {deadlines.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="rounded-full bg-muted p-3 mb-3">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
                      <Link href="/calendar">
                        <Button variant="link" size="sm" className="mt-1">
                          <Plus className="mr-1 h-3 w-3" />
                          Add deadline
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2 animate-stagger">
                      {deadlines.slice(0, 5).map((dl) => {
                        const days = daysUntil(dl.due_date);
                        return (
                          <div
                            key={dl.id}
                            className="flex items-center justify-between rounded-lg border p-2.5 card-hover cursor-default"
                          >
                            <div className="flex items-center gap-2.5">
                              {dl.status === "completed" ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                              ) : days < 0 ? (
                                <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                              ) : (
                                <Calendar className="h-4 w-4 text-amber-600 shrink-0" />
                              )}
                              <div>
                                <p className="text-sm font-medium">{dl.filing_type}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  {new Date(dl.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant={days < 0 ? "destructive" : days <= 7 ? "secondary" : "outline"}
                              className="text-[10px]"
                            >
                              {dl.status === "completed" ? "Done" : days < 0 ? `${Math.abs(days)}d late` : days === 0 ? "Today" : `${days}d`}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Pending Tasks */}
            <motion.div variants={fadeUp}>
              <Card className="border-0 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-semibold">Pending Tasks</CardTitle>
                  <Link href="/tasks">
                    <Button variant="ghost" size="sm" className="text-xs group">
                      View all <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="rounded-full bg-muted p-3 mb-3">
                        <Sparkles className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">All caught up! No pending tasks.</p>
                      <Link href="/tasks">
                        <Button variant="link" size="sm" className="mt-1">
                          <Plus className="mr-1 h-3 w-3" />
                          Create task
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2 animate-stagger">
                      {tasks.slice(0, 5).map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between rounded-lg border p-2.5 card-hover cursor-default"
                        >
                          <div>
                            <p className="text-sm font-medium">{task.title}</p>
                            {task.due_date && (
                              <p className="text-[10px] text-muted-foreground">
                                Due {new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </p>
                            )}
                          </div>
                          <Badge
                            variant={task.priority === "high" || task.priority === "urgent" ? "destructive" : task.priority === "medium" ? "secondary" : "outline"}
                            className="text-[10px]"
                          >
                            {task.priority}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </>
      )}
    </motion.div>
  );
}
