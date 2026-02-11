"use client";

import {
  DollarSign,
  TrendingUp,
  Users,
  Clock,
  Loader2,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
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

export default function AnalyticsPage() {
  const { data: stats, isLoading } = useDashboardStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Firm performance metrics and AI-powered insights
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Revenue MTD
                  </span>
                </div>
                <p className="text-2xl font-bold">
                  {stats ? formatCents(stats.revenue_mtd_cents) : "—"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-red-600" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Outstanding
                  </span>
                </div>
                <p className="text-2xl font-bold">
                  {stats ? formatCents(stats.outstanding_amount_cents) : "—"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Active Clients
                  </span>
                </div>
                <p className="text-2xl font-bold">
                  {stats ? stats.active_clients : "—"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Hours This Week
                  </span>
                </div>
                <p className="text-2xl font-bold">
                  {stats ? `${stats.hours_this_week.toFixed(1)}h` : "—"}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Revenue by Client
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground text-sm">
                  <div className="text-center">
                    <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>ECharts bar chart</p>
                    <p className="text-xs mt-1">Install echarts + echarts-for-react</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  Revenue by Service Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground text-sm">
                  <div className="text-center">
                    <PieChart className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>ECharts donut chart</p>
                    <p className="text-xs mt-1">Tax Returns · Bookkeeping · Advisory</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-4 w-4" />
                  Monthly Revenue Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground text-sm">
                  <div className="text-center">
                    <LineChart className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>ECharts line + area chart</p>
                    <p className="text-xs mt-1">12-month trend with animated draw</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Team Utilization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground text-sm">
                  <div className="text-center">
                    <Activity className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>ECharts stacked bar chart</p>
                    <p className="text-xs mt-1">Billable vs non-billable per CPA</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Client Profitability</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground text-sm">
                  Scatter plot — quadrant analysis (revenue vs hours)
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Cash Flow Forecast</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground text-sm">
                  Area chart — 30/60/90-day projections
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
