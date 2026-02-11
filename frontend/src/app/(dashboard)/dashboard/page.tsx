"use client";

import {
  Users,
  FileText,
  Clock,
  Receipt,
  TrendingUp,
  DollarSign,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDashboardStats } from "@/lib/hooks/use-dashboard";

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default function DashboardPage() {
  const { data: stats, isLoading, isError } = useDashboardStats();

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your firm&apos;s performance
        </p>
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
                <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground">
                  ECharts revenue chart will render here
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Team Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground">
                  ECharts utilization chart will render here
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Deadlines</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground">
                  Compliance calendar deadlines
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>AI Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground">
                  Nightly AI-generated insights
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
