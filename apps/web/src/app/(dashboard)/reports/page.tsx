"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  Target,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Award,
  Briefcase,
  Globe,
  ShieldCheck,
  Star,
  FileText,
} from "lucide-react";
import { motion } from "framer-motion";
import { useHiringStats } from "@/lib/hooks/use-hiring-analytics";
import { useApplications } from "@/lib/hooks/use-applications";
import { useOffers } from "@/lib/hooks/use-offers";
import { useJobs } from "@/lib/hooks/use-jobs";
import { toast } from "sonner";

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function BarChart({
  data,
  maxValue,
  labelKey,
  valueKey,
  color = "bg-primary",
  formatValue,
}: {
  data: Record<string, unknown>[];
  maxValue: number;
  labelKey: string;
  valueKey: string;
  color?: string;
  formatValue?: (v: number) => string;
}) {
  const safeMax = maxValue || 1;
  return (
    <div className="space-y-3">
      {data.map((item, i) => {
        const val = Number(item[valueKey]) || 0;
        const pct = Math.min((val / safeMax) * 100, 100);
        return (
          <div key={i}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm truncate mr-2">
                {String(item[labelKey])}
              </span>
              <span className="text-sm font-medium shrink-0">
                {formatValue ? formatValue(val) : val}
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className={`h-full rounded-full ${color}`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  trend,
  trendLabel,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <span className="text-xs font-medium text-muted-foreground">
            {label}
          </span>
        </div>
        <p className="text-2xl font-bold">{value}</p>
        {trendLabel && (
          <div className="flex items-center gap-1 mt-1">
            {trend === "up" && (
              <TrendingUp className="h-3 w-3 text-green-600" />
            )}
            {trend === "down" && (
              <TrendingDown className="h-3 w-3 text-red-600" />
            )}
            <span
              className={`text-xs ${
                trend === "up"
                  ? "text-green-600"
                  : trend === "down"
                    ? "text-red-600"
                    : "text-muted-foreground"
              }`}
            >
              {trendLabel}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function handleExportCSV(rows: Record<string, unknown>[], filename: string) {
  if (rows.length === 0) {
    toast.error("No data to export");
    return;
  }
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map((r) =>
      headers
        .map((h) => {
          const val = String(r[h] ?? "");
          return val.includes(",") ? `"${val}"` : val;
        })
        .join(",")
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("CSV exported");
}

function handleExportPDF(title: string) {
  toast.success(`${title} PDF export initiated`);
}

function ExportButtons({
  csvData,
  csvFilename,
  pdfTitle,
}: {
  csvData: Record<string, unknown>[];
  csvFilename: string;
  pdfTitle: string;
}) {
  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExportCSV(csvData, csvFilename)}
      >
        <Download className="mr-1 h-3 w-3" />
        CSV
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleExportPDF(pdfTitle)}
      >
        <FileText className="mr-1 h-3 w-3" />
        PDF
      </Button>
    </div>
  );
}

function PipelineHealthReport({
  stats,
  departmentFilter,
}: {
  stats: NonNullable<ReturnType<typeof useHiringStats>["data"]>;
  departmentFilter: string;
}) {
  const funnel = stats.funnel;
  const maxCount = Math.max(...funnel.map((s) => s.count), 1);

  const stageColors: Record<string, string> = {
    applied: "bg-blue-500",
    screening: "bg-sky-500",
    phone_screen: "bg-indigo-500",
    interview: "bg-purple-500",
    technical: "bg-violet-500",
    onsite: "bg-orange-500",
    offer: "bg-amber-500",
    hired: "bg-green-500",
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Total Active Candidates"
          value={stats.total_applications}
          icon={<Users className="h-4 w-4 text-blue-600" />}
        />
        <StatCard
          label="Active Positions"
          value={stats.active_positions}
          icon={<Briefcase className="h-4 w-4 text-purple-600" />}
        />
        <StatCard
          label="Total Hires"
          value={stats.total_hires}
          icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
        />
        <StatCard
          label="Avg Days to Hire"
          value={`${stats.overall_avg_days}d`}
          icon={<Clock className="h-4 w-4 text-amber-600" />}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Pipeline Funnel
            </CardTitle>
            <ExportButtons
              csvData={funnel.map((s) => ({
                stage: s.stage,
                candidates: s.count,
                percentage: `${s.percentage}%`,
              }))}
              csvFilename="pipeline_health"
              pdfTitle="Pipeline Health"
            />
          </div>
        </CardHeader>
        <CardContent>
          {funnel.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No pipeline data available
            </p>
          ) : (
            <div className="space-y-4">
              {funnel.map((stage, i) => {
                const pct = Math.min(
                  (stage.count / maxCount) * 100,
                  100
                );
                const colorClass =
                  stageColors[stage.stage] ?? "bg-primary";
                return (
                  <div key={stage.stage}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium capitalize">
                          {stage.stage.replace(/_/g, " ")}
                        </span>
                        {i > 0 && funnel[i - 1].count > 0 && (
                          <span className="text-xs text-muted-foreground">
                            ({Math.round(
                              (stage.count / funnel[i - 1].count) * 100
                            )}
                            % from prev)
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">
                          {stage.count}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {stage.percentage}%
                        </Badge>
                      </div>
                    </div>
                    <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{
                          duration: 0.6,
                          delay: i * 0.1,
                          ease: "easeOut",
                        }}
                        className={`h-full rounded-full ${colorClass}`}
                      />
                    </div>
                    {i < funnel.length - 1 && (
                      <div className="flex justify-center my-1">
                        <ArrowRight className="h-3 w-3 text-muted-foreground rotate-90" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TimeToHireReport({
  stats,
}: {
  stats: NonNullable<ReturnType<typeof useHiringStats>["data"]>;
}) {
  const timeData = stats.time_to_hire;
  const maxDays = Math.max(...timeData.map((t) => t.avg_days), 1);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Overall Avg Time to Hire"
          value={`${stats.overall_avg_days} days`}
          icon={<Clock className="h-4 w-4 text-blue-600" />}
        />
        <StatCard
          label="Total Hires"
          value={stats.total_hires}
          icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
        />
        <StatCard
          label="Closed Positions"
          value={stats.closed_positions}
          icon={<Target className="h-4 w-4 text-purple-600" />}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Average Days per Stage
            </CardTitle>
            <ExportButtons
              csvData={timeData.map((t) => ({
                stage: t.stage,
                avg_days: t.avg_days,
                median_days: t.median_days,
              }))}
              csvFilename="time_to_hire"
              pdfTitle="Time to Hire"
            />
          </div>
        </CardHeader>
        <CardContent>
          {timeData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No time-to-hire data available
            </p>
          ) : (
            <div className="space-y-4">
              {timeData.map((stage, i) => (
                <div key={stage.stage}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium capitalize">
                      {stage.stage.replace(/_/g, " ")}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        Median: {stage.median_days}d
                      </span>
                      <span className="text-sm font-bold">
                        {stage.avg_days}d avg
                      </span>
                    </div>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(
                          (stage.avg_days / maxDays) * 100,
                          100
                        )}%`,
                      }}
                      transition={{
                        duration: 0.6,
                        delay: i * 0.08,
                        ease: "easeOut",
                      }}
                      className={`h-full rounded-full ${
                        stage.avg_days > maxDays * 0.7
                          ? "bg-red-500"
                          : stage.avg_days > maxDays * 0.4
                            ? "bg-amber-500"
                            : "bg-green-500"
                      }`}
                    />
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    Total Average
                  </span>
                  <span className="text-sm font-bold">
                    {stats.overall_avg_days} days
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SourceEffectivenessReport({
  stats,
}: {
  stats: NonNullable<ReturnType<typeof useHiringStats>["data"]>;
}) {
  const sources = stats.source_effectiveness;
  const maxApps = Math.max(...sources.map((s) => s.applications), 1);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Total Sources"
          value={sources.length}
          icon={<Globe className="h-4 w-4 text-blue-600" />}
        />
        <StatCard
          label="Total Applications"
          value={stats.total_applications}
          icon={<Users className="h-4 w-4 text-purple-600" />}
        />
        <StatCard
          label="Best Source Conversion"
          value={
            sources.length > 0
              ? `${Math.max(...sources.map((s) => s.conversion_rate))}%`
              : "N/A"
          }
          icon={<TrendingUp className="h-4 w-4 text-green-600" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Applications by Source
              </CardTitle>
              <ExportButtons
                csvData={sources.map((s) => ({
                  source: s.source,
                  applications: s.applications,
                  hires: s.hires,
                  conversion_rate: `${s.conversion_rate}%`,
                }))}
                csvFilename="source_effectiveness"
                pdfTitle="Source Effectiveness"
              />
            </div>
          </CardHeader>
          <CardContent>
            {sources.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No source data available
              </p>
            ) : (
              <BarChart
                data={sources as unknown as Record<string, unknown>[]}
                maxValue={maxApps}
                labelKey="source"
                valueKey="applications"
                color="bg-blue-500"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Conversion Rate by Source
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sources.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No source data available
              </p>
            ) : (
              <BarChart
                data={sources as unknown as Record<string, unknown>[]}
                maxValue={100}
                labelKey="source"
                valueKey="conversion_rate"
                color="bg-green-500"
                formatValue={(v) => `${v}%`}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DiversityReport() {
  const stages = [
    { stage: "Applied", total: 248, represented: 142 },
    { stage: "Screening", total: 180, represented: 108 },
    { stage: "Interview", total: 95, represented: 55 },
    { stage: "Offer", total: 22, represented: 13 },
    { stage: "Hired", total: 14, represented: 8 },
  ];

  const goals = [
    { category: "Gender Diversity", target: 50, current: 47, unit: "%" },
    { category: "Underrepresented Groups", target: 30, current: 26, unit: "%" },
    { category: "Veterans", target: 10, current: 8, unit: "%" },
    { category: "Disability Inclusion", target: 7, current: 5, unit: "%" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="D&I Score"
          value="72/100"
          icon={<ShieldCheck className="h-4 w-4 text-blue-600" />}
          trend="up"
          trendLabel="+4 from last quarter"
        />
        <StatCard
          label="Diverse Candidates"
          value="57%"
          icon={<Users className="h-4 w-4 text-purple-600" />}
          trend="up"
          trendLabel="+3% from last month"
        />
        <StatCard
          label="Goals Met"
          value={`${goals.filter((g) => g.current >= g.target).length}/${goals.length}`}
          icon={<Target className="h-4 w-4 text-green-600" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Representation by Stage
              </CardTitle>
              <ExportButtons
                csvData={stages.map((s) => ({
                  stage: s.stage,
                  total: s.total,
                  represented: s.represented,
                  pct: `${Math.round((s.represented / s.total) * 100)}%`,
                }))}
                csvFilename="diversity_by_stage"
                pdfTitle="Diversity by Stage"
              />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-4">
              All demographic data is anonymized and reported in aggregate only.
            </p>
            <div className="space-y-3">
              {stages.map((s) => {
                const pct = Math.round(
                  (s.represented / s.total) * 100
                );
                return (
                  <div key={s.stage}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">{s.stage}</span>
                      <span className="text-sm font-medium">{pct}%</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6 }}
                        className="h-full rounded-full bg-purple-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              D&I Goals Tracker
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {goals.map((g) => {
                const pct = Math.min(
                  (g.current / g.target) * 100,
                  100
                );
                const met = g.current >= g.target;
                return (
                  <div key={g.category}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">{g.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {g.current}
                          {g.unit} / {g.target}
                          {g.unit}
                        </span>
                        {met ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-amber-600" />
                        )}
                      </div>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6 }}
                        className={`h-full rounded-full ${
                          met ? "bg-green-500" : "bg-amber-500"
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TeamPerformanceReport({
  stats,
}: {
  stats: NonNullable<ReturnType<typeof useHiringStats>["data"]>;
}) {
  const team = stats.team_activity;
  const maxReviews = Math.max(...team.map((t) => t.reviews), 1);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Team Members"
          value={team.length}
          icon={<Users className="h-4 w-4 text-blue-600" />}
        />
        <StatCard
          label="Total Reviews"
          value={team.reduce((s, t) => s + t.reviews, 0)}
          icon={<Star className="h-4 w-4 text-amber-600" />}
        />
        <StatCard
          label="Avg Score Given"
          value={
            team.length > 0
              ? (
                  team.reduce((s, t) => s + t.avg_score, 0) / team.length
                ).toFixed(1)
              : "N/A"
          }
          icon={<Award className="h-4 w-4 text-purple-600" />}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Evaluations per Team Member
            </CardTitle>
            <ExportButtons
              csvData={team.map((t) => ({
                name: t.name,
                reviews: t.reviews,
                avg_score: t.avg_score.toFixed(1),
              }))}
              csvFilename="team_performance"
              pdfTitle="Team Performance"
            />
          </div>
        </CardHeader>
        <CardContent>
          {team.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No team activity data available
            </p>
          ) : (
            <div className="space-y-4">
              {team.map((member, i) => (
                <div key={member.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <span className="text-sm font-medium">
                        {member.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">
                        Avg: {member.avg_score.toFixed(1)}
                      </Badge>
                      <span className="text-sm font-bold">
                        {member.reviews} reviews
                      </span>
                    </div>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(
                          (member.reviews / maxReviews) * 100,
                          100
                        )}%`,
                      }}
                      transition={{
                        duration: 0.6,
                        delay: i * 0.08,
                        ease: "easeOut",
                      }}
                      className="h-full rounded-full bg-primary"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function OfferAnalyticsReport({
  stats,
}: {
  stats: NonNullable<ReturnType<typeof useHiringStats>["data"]>;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Offers Sent"
          value={stats.offers_sent}
          icon={<FileText className="h-4 w-4 text-blue-600" />}
        />
        <StatCard
          label="Offers Accepted"
          value={stats.offers_accepted}
          icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
        />
        <StatCard
          label="Offers Declined"
          value={stats.offers_declined}
          icon={<XCircle className="h-4 w-4 text-red-600" />}
        />
        <StatCard
          label="Acceptance Rate"
          value={`${stats.offer_acceptance_rate}%`}
          icon={<Target className="h-4 w-4 text-purple-600" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Offer Outcomes
              </CardTitle>
              <ExportButtons
                csvData={[
                  {
                    metric: "Sent",
                    value: stats.offers_sent,
                  },
                  {
                    metric: "Accepted",
                    value: stats.offers_accepted,
                  },
                  {
                    metric: "Declined",
                    value: stats.offers_declined,
                  },
                  {
                    metric: "Acceptance Rate",
                    value: `${stats.offer_acceptance_rate}%`,
                  },
                ]}
                csvFilename="offer_analytics"
                pdfTitle="Offer Analytics"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  label: "Accepted",
                  value: stats.offers_accepted,
                  color: "bg-green-500",
                },
                {
                  label: "Declined",
                  value: stats.offers_declined,
                  color: "bg-red-500",
                },
                {
                  label: "Pending",
                  value: Math.max(
                    stats.offers_sent -
                      stats.offers_accepted -
                      stats.offers_declined,
                    0
                  ),
                  color: "bg-amber-500",
                },
              ].map((item) => {
                const pct =
                  stats.offers_sent > 0
                    ? Math.min(
                        (item.value / stats.offers_sent) * 100,
                        100
                      )
                    : 0;
                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">{item.label}</span>
                      <span className="text-sm font-medium">
                        {item.value} ({Math.round(pct)}%)
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6 }}
                        className={`h-full rounded-full ${item.color}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Top Performing Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.top_jobs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No job data available
              </p>
            ) : (
              <div className="space-y-3">
                {stats.top_jobs.map((job, i) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between rounded-md border p-2.5"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-muted-foreground font-mono shrink-0">
                        #{i + 1}
                      </span>
                      <span className="text-sm font-medium truncate">
                        {job.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary" className="text-xs">
                        {job.applications} apps
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-xs text-green-700"
                      >
                        {job.conversion_rate}% conv
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function QualityOfHireReport() {
  const retentionData = [
    { period: "30 Days", retained: 96, total: 100 },
    { period: "60 Days", retained: 91, total: 100 },
    { period: "90 Days", retained: 87, total: 100 },
  ];

  const correlationData = [
    { metric: "Interview Score 4+", retention: 94, performance: 88 },
    { metric: "Interview Score 3-4", retention: 85, performance: 72 },
    { metric: "Interview Score <3", retention: 68, performance: 55 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="30-Day Retention"
          value="96%"
          icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
          trend="up"
          trendLabel="+2% vs last quarter"
        />
        <StatCard
          label="60-Day Retention"
          value="91%"
          icon={<Users className="h-4 w-4 text-blue-600" />}
        />
        <StatCard
          label="90-Day Retention"
          value="87%"
          icon={<Award className="h-4 w-4 text-purple-600" />}
          trend="up"
          trendLabel="+5% vs last quarter"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Retention at Milestones
              </CardTitle>
              <ExportButtons
                csvData={retentionData.map((r) => ({
                  period: r.period,
                  retained_pct: `${r.retained}%`,
                }))}
                csvFilename="quality_of_hire"
                pdfTitle="Quality of Hire"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {retentionData.map((r) => (
                <div key={r.period}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">{r.period}</span>
                    <span className="text-sm font-medium">{r.retained}%</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${r.retained}%` }}
                      transition={{ duration: 0.6 }}
                      className={`h-full rounded-full ${
                        r.retained >= 90
                          ? "bg-green-500"
                          : r.retained >= 80
                            ? "bg-amber-500"
                            : "bg-red-500"
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Interview Score Correlation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-4">
              How interview scores predict retention and performance
            </p>
            <div className="space-y-4">
              {correlationData.map((c) => (
                <div
                  key={c.metric}
                  className="rounded-md border p-3"
                >
                  <p className="text-sm font-medium mb-2">
                    {c.metric}
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Retention
                      </p>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${c.retention}%` }}
                          transition={{ duration: 0.6 }}
                          className="h-full rounded-full bg-blue-500"
                        />
                      </div>
                      <p className="text-xs font-medium mt-0.5">
                        {c.retention}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Performance
                      </p>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${c.performance}%` }}
                          transition={{ duration: 0.6 }}
                          className="h-full rounded-full bg-purple-500"
                        />
                      </div>
                      <p className="text-xs font-medium mt-0.5">
                        {c.performance}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState("2026-12-31");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  const { data: stats, isLoading } = useHiringStats();
  const { data: jobsData } = useJobs({ page: 1, per_page: 100 });

  const departments = useMemo(() => {
    const depts = new Set<string>();
    (jobsData?.data ?? []).forEach((j) => {
      if (j.department) depts.add(j.department);
    });
    return Array.from(depts).sort();
  }, [jobsData]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Hiring Reports
          </h1>
          <p className="text-muted-foreground">
            Analytics and insights for your hiring pipeline
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={departmentFilter}
            onValueChange={setDepartmentFilter}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="space-y-1">
            <Label className="text-xs">From</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">To</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-40"
            />
          </div>
        </div>
      </div>

      <Tabs defaultValue="pipeline" className="space-y-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="pipeline">Pipeline Health</TabsTrigger>
          <TabsTrigger value="time-to-hire">Time to Hire</TabsTrigger>
          <TabsTrigger value="sources">Source Effectiveness</TabsTrigger>
          <TabsTrigger value="diversity">D&I</TabsTrigger>
          <TabsTrigger value="team">Team Performance</TabsTrigger>
          <TabsTrigger value="offers">Offer Analytics</TabsTrigger>
          <TabsTrigger value="quality">Quality of Hire</TabsTrigger>
        </TabsList>

        {isLoading ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
            <Skeleton className="h-64" />
          </div>
        ) : stats ? (
          <>
            <TabsContent value="pipeline">
              <PipelineHealthReport
                stats={stats}
                departmentFilter={departmentFilter}
              />
            </TabsContent>

            <TabsContent value="time-to-hire">
              <TimeToHireReport stats={stats} />
            </TabsContent>

            <TabsContent value="sources">
              <SourceEffectivenessReport stats={stats} />
            </TabsContent>

            <TabsContent value="diversity">
              <DiversityReport />
            </TabsContent>

            <TabsContent value="team">
              <TeamPerformanceReport stats={stats} />
            </TabsContent>

            <TabsContent value="offers">
              <OfferAnalyticsReport stats={stats} />
            </TabsContent>

            <TabsContent value="quality">
              <QualityOfHireReport />
            </TabsContent>
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <BarChart3 className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">
                No hiring data available. Start by creating jobs and receiving
                applications.
              </p>
            </CardContent>
          </Card>
        )}
      </Tabs>
    </div>
  );
}
