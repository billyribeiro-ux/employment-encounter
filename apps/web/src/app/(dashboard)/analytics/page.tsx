"use client";

import dynamic from "next/dynamic";
import {
  DollarSign,
  TrendingUp,
  Users,
  Clock,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useDashboardStats } from "@/lib/hooks/use-dashboard";
import { useProfitLoss, useCashFlow } from "@/lib/hooks/use-reports";
import { Skeleton } from "@/components/ui/skeleton";

const RevenueChart = dynamic(
  () => import("@/components/charts/revenue-chart").then((m) => m.RevenueChart),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full" /> }
);
const UtilizationChart = dynamic(
  () => import("@/components/charts/utilization-chart").then((m) => m.UtilizationChart),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full" /> }
);
const ClientDistributionChart = dynamic(
  () => import("@/components/charts/client-distribution-chart").then((m) => m.ClientDistributionChart),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full" /> }
);

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

  const currentYear = new Date().getFullYear();
  const { data: pl, isLoading: plLoading } = useProfitLoss({
    start_date: `${currentYear}-01-01`,
    end_date: `${currentYear}-12-31`,
  });
  const { data: cashFlow, isLoading: cfLoading } = useCashFlow({
    start_date: `${currentYear}-01-01`,
    end_date: `${currentYear}-12-31`,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Firm performance metrics and AI-powered insights
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
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
                <div className="h-64">
                  <RevenueChart />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  Client Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ClientDistributionChart />
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
                <div className="h-64">
                  <RevenueChart />
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
                <div className="h-64">
                  <UtilizationChart />
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
                {plLoading ? (
                  <Skeleton className="h-48" />
                ) : pl && pl.revenue.items.length > 0 ? (
                  <div className="space-y-3">
                    {pl.revenue.items.slice(0, 8).map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="w-32 text-sm truncate">{item.label}</span>
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${Math.min((item.amount_cents / pl.revenue.total_cents) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-24 text-right">
                          {formatCents(item.amount_cents)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No revenue data available</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Cash Flow Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {cfLoading ? (
                  <Skeleton className="h-48" />
                ) : cashFlow && (cashFlow.inflows.length > 0 || cashFlow.outflows.length > 0) ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Net Cash Flow</span>
                      <span className={`text-lg font-bold ${cashFlow.net_cash_flow_cents >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {formatCents(cashFlow.net_cash_flow_cents)}
                      </span>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Inflows</p>
                        {cashFlow.inflows.slice(0, 6).map((entry, i) => (
                          <div key={i} className="flex justify-between text-sm py-1">
                            <span>{entry.month}</span>
                            <span className="text-green-600 font-medium">{formatCents(entry.amount_cents)}</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Outflows</p>
                        {cashFlow.outflows.slice(0, 6).map((entry, i) => (
                          <div key={i} className="flex justify-between text-sm py-1">
                            <span>{entry.month}</span>
                            <span className="text-red-600 font-medium">{formatCents(entry.amount_cents)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No cash flow data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
