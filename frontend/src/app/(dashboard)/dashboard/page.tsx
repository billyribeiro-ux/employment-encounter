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
} from "lucide-react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDashboardStats } from "@/lib/hooks/use-dashboard";
import { useComplianceDeadlines } from "@/lib/hooks/use-compliance";
import { useTasks } from "@/lib/hooks/use-tasks";
import { Skeleton } from "@/components/ui/skeleton";

const RevenueChart = dynamic(
  () => import("@/components/charts/revenue-chart").then((m) => m.RevenueChart),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full rounded-lg" /> }
);
const UtilizationChart = dynamic(
  () => import("@/components/charts/utilization-chart").then((m) => m.UtilizationChart),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full rounded-lg" /> }
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

export default function DashboardPage() {
  const { data: stats, isLoading, isError } = useDashboardStats();
  const { data: deadlinesData } = useComplianceDeadlines({ per_page: 5 });
  const { data: tasksData } = useTasks({ per_page: 5, status: "todo" });

  const deadlines = deadlinesData?.data ?? [];
  const tasks = tasksData?.data ?? [];

  const metrics = [
    { name: "Active Clients", value: stats ? String(stats.active_clients) : "—", icon: Users, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10" },
    { name: "Documents", value: stats ? String(stats.total_documents) : "—", icon: FileText, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
    { name: "Hours This Week", value: stats ? `${stats.hours_this_week.toFixed(1)}h` : "—", icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" },
    { name: "Outstanding Invoices", value: stats ? String(stats.outstanding_invoices) : "—", icon: Receipt, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-500/10" },
    { name: "Outstanding Amount", value: stats ? formatCents(stats.outstanding_amount_cents) : "—", icon: DollarSign, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500/10" },
    { name: "Revenue MTD", value: stats ? formatCents(stats.revenue_mtd_cents) : "—", icon: TrendingUp, color: "text-green-600 dark:text-green-400", bg: "bg-green-500/10" },
  ];

  const quickActions = [
    { label: "New Client", href: "/clients", icon: Users },
    { label: "Log Time", href: "/time", icon: Clock },
    { label: "Create Invoice", href: "/invoices", icon: Receipt },
    { label: "Upload Document", href: "/documents", icon: FileText },
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
        <div className="flex gap-2">
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href}>
              <Button variant="outline" size="sm" className="card-hover">
                <action.icon className="mr-1.5 h-3.5 w-3.5" />
                {action.label}
              </Button>
            </Link>
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
                    <div className="text-2xl font-bold tracking-tight animate-count-up">
                      {metric.value}
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

          <div className="grid gap-6 lg:grid-cols-2">
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
