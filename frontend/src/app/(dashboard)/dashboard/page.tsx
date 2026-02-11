"use client";

import Link from "next/link";
import {
  Users,
  FileText,
  Clock,
  Receipt,
  TrendingUp,
  DollarSign,
  Loader2,
  Plus,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDashboardStats } from "@/lib/hooks/use-dashboard";
import { useComplianceDeadlines } from "@/lib/hooks/use-compliance";
import { useTasks } from "@/lib/hooks/use-tasks";

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

export default function DashboardPage() {
  const { data: stats, isLoading, isError } = useDashboardStats();
  const { data: deadlinesData } = useComplianceDeadlines({ per_page: 5 });
  const { data: tasksData } = useTasks({ per_page: 5, status: "todo" });

  const deadlines = deadlinesData?.data ?? [];
  const tasks = tasksData?.data ?? [];

  const metrics = [
    {
      name: "Active Clients",
      value: stats ? String(stats.active_clients) : "—",
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      name: "Documents",
      value: stats ? String(stats.total_documents) : "—",
      icon: FileText,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      name: "Hours This Week",
      value: stats ? `${stats.hours_this_week.toFixed(1)}h` : "—",
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      name: "Outstanding Invoices",
      value: stats ? String(stats.outstanding_invoices) : "—",
      icon: Receipt,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      name: "Outstanding Amount",
      value: stats ? formatCents(stats.outstanding_amount_cents) : "—",
      icon: DollarSign,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    {
      name: "Revenue MTD",
      value: stats ? formatCents(stats.revenue_mtd_cents) : "—",
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-50",
    },
  ];

  const quickActions = [
    { label: "New Client", href: "/clients", icon: Users },
    { label: "Log Time", href: "/time", icon: Clock },
    { label: "Create Invoice", href: "/invoices", icon: Receipt },
    { label: "Upload Document", href: "/documents", icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your firm&apos;s performance
          </p>
        </div>
        <div className="flex gap-2">
          {quickActions.map((action) => (
            <Link key={action.label} href={action.href}>
              <Button variant="outline" size="sm">
                <action.icon className="mr-1.5 h-3.5 w-3.5" />
                {action.label}
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="text-center py-12">
          <p className="text-sm text-destructive">
            Failed to load dashboard stats. Make sure the backend is running.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {metrics.map((metric) => (
              <Card key={metric.name}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {metric.name}
                  </CardTitle>
                  <div className={`rounded-lg p-2 ${metric.bg}`}>
                    <metric.icon className={`h-4 w-4 ${metric.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metric.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground text-sm">
                  <div className="text-center">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p>ECharts revenue chart</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Team Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground text-sm">
                  <div className="text-center">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p>ECharts utilization chart</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Upcoming Deadlines</CardTitle>
                <Link href="/calendar">
                  <Button variant="ghost" size="sm" className="text-xs">
                    View all <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {deadlines.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <Calendar className="h-6 w-6 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No upcoming deadlines
                    </p>
                    <Link href="/calendar">
                      <Button variant="link" size="sm" className="mt-1">
                        <Plus className="mr-1 h-3 w-3" />
                        Add deadline
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {deadlines.slice(0, 5).map((dl) => {
                      const days = daysUntil(dl.due_date);
                      return (
                        <div
                          key={dl.id}
                          className="flex items-center justify-between rounded-lg border p-2.5"
                        >
                          <div className="flex items-center gap-2">
                            {dl.status === "completed" ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                            ) : days < 0 ? (
                              <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                            ) : (
                              <Calendar className="h-4 w-4 text-amber-600 shrink-0" />
                            )}
                            <div>
                              <p className="text-sm font-medium">
                                {dl.filing_type}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {new Date(dl.due_date).toLocaleDateString(
                                  "en-US",
                                  { month: "short", day: "numeric" }
                                )}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={
                              days < 0
                                ? "destructive"
                                : days <= 7
                                  ? "secondary"
                                  : "outline"
                            }
                            className="text-[10px]"
                          >
                            {dl.status === "completed"
                              ? "Done"
                              : days < 0
                                ? `${Math.abs(days)}d late`
                                : days === 0
                                  ? "Today"
                                  : `${days}d`}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Pending Tasks</CardTitle>
                <Link href="/tasks">
                  <Button variant="ghost" size="sm" className="text-xs">
                    View all <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {tasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <Sparkles className="h-6 w-6 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      All caught up! No pending tasks.
                    </p>
                    <Link href="/tasks">
                      <Button variant="link" size="sm" className="mt-1">
                        <Plus className="mr-1 h-3 w-3" />
                        Create task
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tasks.slice(0, 5).map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between rounded-lg border p-2.5"
                      >
                        <div>
                          <p className="text-sm font-medium">{task.title}</p>
                          {task.due_date && (
                            <p className="text-[10px] text-muted-foreground">
                              Due{" "}
                              {new Date(task.due_date).toLocaleDateString(
                                "en-US",
                                { month: "short", day: "numeric" }
                              )}
                            </p>
                          )}
                        </div>
                        <Badge
                          variant={
                            task.priority === "high"
                              ? "destructive"
                              : task.priority === "medium"
                                ? "secondary"
                                : "outline"
                          }
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
          </div>
        </>
      )}
    </div>
  );
}
