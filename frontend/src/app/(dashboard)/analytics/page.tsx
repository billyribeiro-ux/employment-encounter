"use client";

import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  DollarSign,
  TrendingUp,
  Users,
  Clock,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useDashboardStats } from "@/lib/hooks/use-dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const RevenueChart = dynamic(
  () => import("@/components/charts/revenue-chart").then((m) => m.RevenueChart),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full rounded-lg" /> }
);
const UtilizationChart = dynamic(
  () => import("@/components/charts/utilization-chart").then((m) => m.UtilizationChart),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full rounded-lg" /> }
);
const ClientDistributionChart = dynamic(
  () => import("@/components/charts/client-distribution-chart").then((m) => m.ClientDistributionChart),
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

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

export default function AnalyticsPage() {
  const { data: stats, isLoading } = useDashboardStats();

  const kpis = stats ? [
    {
      label: "Revenue MTD",
      value: formatCents(stats.revenue_mtd_cents),
      icon: DollarSign,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-500/10",
      trend: "+12.5%",
      trendUp: true,
    },
    {
      label: "Outstanding",
      value: formatCents(stats.outstanding_amount_cents),
      icon: TrendingUp,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-500/10",
      trend: "-3.2%",
      trendUp: false,
    },
    {
      label: "Active Clients",
      value: String(stats.active_clients),
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10",
      trend: "+2",
      trendUp: true,
    },
    {
      label: "Hours This Week",
      value: `${stats.hours_this_week.toFixed(1)}h`,
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10",
      trend: "+8.3%",
      trendUp: true,
    },
  ] : [];

  // Simulated profitability data
  const profitabilityData = [
    { name: "Acme Corp", revenue: 45000, hours: 120, profitable: true },
    { name: "Beta LLC", revenue: 32000, hours: 85, profitable: true },
    { name: "Delta Inc", revenue: 28000, hours: 110, profitable: false },
    { name: "Gamma Ltd", revenue: 19000, hours: 45, profitable: true },
    { name: "Omega Co", revenue: 15000, hours: 70, profitable: false },
  ];

  // Simulated cash flow data
  const cashFlowData = [
    { period: "Current", amount: stats?.revenue_mtd_cents || 0 },
    { period: "30 days", amount: Math.round((stats?.revenue_mtd_cents || 0) * 1.15) },
    { period: "60 days", amount: Math.round((stats?.revenue_mtd_cents || 0) * 1.28) },
    { period: "90 days", amount: Math.round((stats?.revenue_mtd_cents || 0) * 1.35) },
  ];

  return (
    <motion.div
      className="space-y-6"
      variants={stagger}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Firm performance metrics and insights
        </p>
      </motion.div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-80 rounded-xl" />)}
          </div>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {kpis.map((kpi, i) => (
              <motion.div key={kpi.label} variants={fadeUp} custom={i}>
                <Card className="border-0 shadow-sm card-hover">
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                          {kpi.label}
                        </p>
                        <p className="text-2xl font-bold tracking-tight animate-count-up">
                          {kpi.value}
                        </p>
                      </div>
                      <div className={`rounded-xl p-2.5 ${kpi.bg}`}>
                        <kpi.icon className={`h-4.5 w-4.5 ${kpi.color}`} />
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-1">
                      {kpi.trendUp ? (
                        <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <ArrowDownRight className="h-3.5 w-3.5 text-rose-600" />
                      )}
                      <span className={`text-xs font-medium ${kpi.trendUp ? "text-emerald-600" : "text-rose-600"}`}>
                        {kpi.trend}
                      </span>
                      <span className="text-xs text-muted-foreground">vs last month</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Main Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <motion.div variants={fadeUp}>
              <Card className="border-0 shadow-sm overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    Revenue by Client
                  </CardTitle>
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
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <PieChart className="h-4 w-4 text-muted-foreground" />
                    Client Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ClientDistributionChart />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div variants={fadeUp}>
              <Card className="border-0 shadow-sm overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <LineChart className="h-4 w-4 text-muted-foreground" />
                    Monthly Revenue Trend
                  </CardTitle>
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
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    Team Utilization
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <UtilizationChart />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Client Profitability + Cash Flow Forecast */}
          <div className="grid gap-6 lg:grid-cols-2">
            <motion.div variants={fadeUp}>
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    Client Profitability
                  </CardTitle>
                  <CardDescription>Revenue vs hours invested per client</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {profitabilityData.map((client, i) => {
                      const rate = client.hours > 0 ? Math.round(client.revenue / client.hours) : 0;
                      const barWidth = Math.round((client.revenue / 50000) * 100);
                      return (
                        <motion.div
                          key={client.name}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
                          className="space-y-1"
                        >
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{client.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground text-xs">{client.hours}h</span>
                              <Badge
                                variant="outline"
                                className={client.profitable
                                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-[10px]"
                                  : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20 text-[10px]"
                                }
                              >
                                ${rate}/h
                              </Badge>
                            </div>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${client.profitable ? "bg-emerald-500" : "bg-rose-500"}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${barWidth}%` }}
                              transition={{ delay: 0.3 + i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={fadeUp}>
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    Cash Flow Forecast
                  </CardTitle>
                  <CardDescription>Projected revenue over next 90 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {cashFlowData.map((item, i) => {
                      const maxAmount = cashFlowData[cashFlowData.length - 1].amount;
                      const barWidth = maxAmount > 0 ? Math.round((item.amount / maxAmount) * 100) : 0;
                      const isProjected = i > 0;
                      return (
                        <motion.div
                          key={item.period}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
                          className="space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{item.period}</span>
                              {isProjected && (
                                <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20">
                                  Projected
                                </Badge>
                              )}
                            </div>
                            <span className="font-semibold tabular-nums">
                              {formatCents(item.amount)}
                            </span>
                          </div>
                          <div className="h-3 rounded-full bg-muted overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${isProjected ? "bg-blue-500/60" : "bg-primary"}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${barWidth}%` }}
                              transition={{ delay: 0.4 + i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </>
      )}
    </motion.div>
  );
}
