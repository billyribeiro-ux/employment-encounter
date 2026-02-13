"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Users,
  Clock,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  ArrowRight,
  Activity,
  UserCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useHiringStats } from "@/lib/hooks/use-hiring-analytics";
import { useJobs } from "@/lib/hooks/use-jobs";
import { useApplications } from "@/lib/hooks/use-applications";

const PIPELINE_STAGES = [
  { id: "applied", label: "Applied", color: "bg-slate-500" },
  { id: "screening", label: "Screening", color: "bg-blue-500" },
  { id: "phone_screen", label: "Phone Screen", color: "bg-cyan-500" },
  { id: "technical", label: "Technical", color: "bg-amber-500" },
  { id: "onsite", label: "Onsite", color: "bg-orange-500" },
  { id: "offer", label: "Offer", color: "bg-emerald-500" },
  { id: "hired", label: "Hired", color: "bg-green-600" },
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("30d");
  const { data: stats, isLoading: statsLoading } = useHiringStats(period);
  const { data: jobsData, isLoading: jobsLoading } = useJobs({
    per_page: 200,
    status: "published",
  });
  const { data: appsData, isLoading: appsLoading } = useApplications({
    per_page: 500,
  });

  const isLoading = statsLoading || jobsLoading || appsLoading;

  const jobs = jobsData?.data ?? [];
  const applications = appsData?.data ?? [];

  // Compute metrics from existing data if API data isn't available
  const openPositions = stats?.active_positions ?? jobs.length;
  const totalApplications = stats?.total_applications ?? applications.length;
  const avgTimeToHire = stats?.overall_avg_days ?? 0;
  const offerAcceptanceRate = stats?.offer_acceptance_rate ?? 0;

  // Build funnel from stats or compute from applications
  const funnel = stats?.funnel ?? computeFunnel(applications);
  const weeklyTrends = stats?.weekly_trends ?? computeWeeklyTrends(applications);
  const sourceBreakdown = stats?.source_effectiveness ?? computeSourceBreakdown(applications);
  const topJobs = stats?.top_jobs ?? computeTopJobs(jobs, applications);
  const teamActivity = stats?.team_activity ?? [];

  // Max values for chart scaling
  const maxWeeklyCount = Math.max(
    ...weeklyTrends.map((w) => w.applications),
    1
  );
  const maxFunnelCount = Math.max(...funnel.map((f) => f.count), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Hiring Analytics
          </h1>
          <p className="text-muted-foreground">
            Track your hiring pipeline performance and metrics
          </p>
        </div>
        <Tabs value={period} onValueChange={setPeriod}>
          <TabsList>
            <TabsTrigger value="7d">7 days</TabsTrigger>
            <TabsTrigger value="30d">30 days</TabsTrigger>
            <TabsTrigger value="90d">90 days</TabsTrigger>
            <TabsTrigger value="all">All time</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        </div>
      ) : (
        <>
          {/* Row 1 - Key Metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <Briefcase className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Open Positions
                  </span>
                </div>
                <p className="text-2xl font-bold">{openPositions}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Total Applications
                  </span>
                </div>
                <p className="text-2xl font-bold">{totalApplications}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Avg Time to Hire
                  </span>
                </div>
                <p className="text-2xl font-bold">
                  {avgTimeToHire > 0 ? `${avgTimeToHire}d` : "--"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="h-4 w-4 text-violet-600" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Offer Acceptance Rate
                  </span>
                </div>
                <p className="text-2xl font-bold">
                  {offerAcceptanceRate > 0
                    ? `${offerAcceptanceRate.toFixed(0)}%`
                    : "--"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Row 2 - Hiring Funnel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Hiring Funnel
              </CardTitle>
            </CardHeader>
            <CardContent>
              {funnel.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No funnel data available yet
                </p>
              ) : (
                <div className="space-y-3">
                  {funnel.map((stage, i) => {
                    const stageInfo = PIPELINE_STAGES.find(
                      (s) => s.id === stage.stage
                    );
                    const widthPct = Math.max(
                      (stage.count / maxFunnelCount) * 100,
                      4
                    );
                    return (
                      <div key={stage.stage} className="flex items-center gap-4">
                        <div className="w-28 text-sm font-medium shrink-0">
                          {stageInfo?.label ?? stage.stage}
                        </div>
                        <div className="flex-1 flex items-center gap-3">
                          <div className="flex-1 h-8 bg-muted rounded-md overflow-hidden relative">
                            <div
                              className={`h-full rounded-md transition-all ${stageInfo?.color ?? "bg-primary"}`}
                              style={{ width: `${widthPct}%`, opacity: 0.85 }}
                            />
                            <span className="absolute inset-y-0 left-3 flex items-center text-xs font-semibold text-white mix-blend-difference">
                              {stage.count}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground w-12 text-right shrink-0">
                            {stage.percentage > 0
                              ? `${stage.percentage.toFixed(0)}%`
                              : "--"}
                          </span>
                        </div>
                        {i > 0 && funnel[i - 1].count > 0 && (
                          <span className="text-[10px] text-muted-foreground w-20 text-right shrink-0">
                            {(
                              (stage.count / funnel[i - 1].count) *
                              100
                            ).toFixed(1)}
                            % conv.
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Row 3 - Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Applications over time */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Applications Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                {weeklyTrends.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No application data yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-end gap-1 h-48">
                      {weeklyTrends.map((week) => {
                        const heightPct = Math.max(
                          (week.applications / maxWeeklyCount) * 100,
                          2
                        );
                        return (
                          <div
                            key={week.week}
                            className="flex-1 flex flex-col items-center justify-end gap-1"
                          >
                            <span className="text-[10px] font-medium text-muted-foreground">
                              {week.applications}
                            </span>
                            <div
                              className="w-full bg-primary/80 rounded-t-sm transition-all hover:bg-primary"
                              style={{ height: `${heightPct}%` }}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex gap-1">
                      {weeklyTrends.map((week) => (
                        <div
                          key={week.week}
                          className="flex-1 text-center text-[9px] text-muted-foreground truncate"
                        >
                          {formatWeekLabel(week.week)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Source Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Source Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sourceBreakdown.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No source data available yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {sourceBreakdown.map((source) => {
                      const maxApps = Math.max(
                        ...sourceBreakdown.map((s) => s.applications),
                        1
                      );
                      const widthPct = Math.max(
                        (source.applications / maxApps) * 100,
                        4
                      );
                      return (
                        <div key={source.source} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium capitalize">
                              {source.source.replace(/_/g, " ")}
                            </span>
                            <span className="text-muted-foreground">
                              {source.applications} apps
                              {source.hires > 0 &&
                                ` / ${source.hires} hire${source.hires !== 1 ? "s" : ""}`}
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary/70 transition-all"
                              style={{ width: `${widthPct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Row 4 */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Top Performing Jobs */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Top Performing Jobs</CardTitle>
                <Link href="/hiring">
                  <Button variant="ghost" size="sm" className="text-xs">
                    View all <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {topJobs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No job data available
                  </p>
                ) : (
                  <div className="rounded-md border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-3 py-2 text-left font-medium">
                            Job Title
                          </th>
                          <th className="px-3 py-2 text-right font-medium">
                            Apps
                          </th>
                          <th className="px-3 py-2 text-right font-medium">
                            Conv. Rate
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {topJobs.slice(0, 8).map((job) => (
                          <tr
                            key={job.id}
                            className="border-b last:border-0 hover:bg-muted/30"
                          >
                            <td className="px-3 py-2">
                              <Link
                                href={`/hiring/jobs/${job.id}`}
                                className="hover:underline font-medium"
                              >
                                {job.title}
                              </Link>
                            </td>
                            <td className="px-3 py-2 text-right">
                              <Badge variant="secondary" className="text-xs">
                                {job.applications}
                              </Badge>
                            </td>
                            <td className="px-3 py-2 text-right text-muted-foreground">
                              {job.conversion_rate > 0
                                ? `${job.conversion_rate.toFixed(1)}%`
                                : "--"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Team Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="h-4 w-4" />
                  Team Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {teamActivity.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No team activity data yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {teamActivity.slice(0, 8).map((member, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {member.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{member.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {member.reviews} review
                              {member.reviews !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        {member.avg_score > 0 && (
                          <Badge variant="outline" className="text-xs">
                            Avg {member.avg_score.toFixed(1)}
                          </Badge>
                        )}
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

// --- Helper functions to compute metrics from raw data ---

function computeFunnel(
  applications: { stage: string; status: string }[]
): { stage: string; count: number; percentage: number }[] {
  const stageOrder = [
    "applied",
    "screening",
    "phone_screen",
    "technical",
    "onsite",
    "offer",
    "hired",
  ];
  const stageCounts: Record<string, number> = {};
  for (const stage of stageOrder) {
    stageCounts[stage] = 0;
  }
  for (const app of applications) {
    const stage = app.stage || "applied";
    if (stageCounts[stage] !== undefined) {
      stageCounts[stage]++;
    }
    // Also count hired status
    if (app.status === "hired" && stage !== "hired") {
      stageCounts["hired"] = (stageCounts["hired"] || 0) + 1;
    }
  }

  const total = applications.length || 1;
  return stageOrder.map((stage) => ({
    stage,
    count: stageCounts[stage],
    percentage: (stageCounts[stage] / total) * 100,
  }));
}

function computeWeeklyTrends(
  applications: { created_at: string }[]
): { week: string; applications: number; hires: number }[] {
  const weeks: Record<string, number> = {};
  for (const app of applications) {
    const date = new Date(app.created_at);
    const weekStart = getWeekStart(date);
    const key = weekStart.toISOString().split("T")[0];
    weeks[key] = (weeks[key] || 0) + 1;
  }

  const sortedWeeks = Object.entries(weeks)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12);

  return sortedWeeks.map(([week, count]) => ({
    week,
    applications: count,
    hires: 0,
  }));
}

function computeSourceBreakdown(
  applications: { source: string | null }[]
): { source: string; applications: number; hires: number; conversion_rate: number }[] {
  const sources: Record<string, number> = {};
  for (const app of applications) {
    const source = app.source || "direct";
    sources[source] = (sources[source] || 0) + 1;
  }

  return Object.entries(sources)
    .sort(([, a], [, b]) => b - a)
    .map(([source, count]) => ({
      source,
      applications: count,
      hires: 0,
      conversion_rate: 0,
    }));
}

function computeTopJobs(
  jobs: { id: string; title: string; application_count: number }[],
  applications: { job_id: string; status: string }[]
): { id: string; title: string; applications: number; conversion_rate: number }[] {
  const hiredByJob: Record<string, number> = {};
  for (const app of applications) {
    if (app.status === "hired") {
      hiredByJob[app.job_id] = (hiredByJob[app.job_id] || 0) + 1;
    }
  }

  return jobs
    .slice()
    .sort((a, b) => (b.application_count || 0) - (a.application_count || 0))
    .slice(0, 10)
    .map((job) => ({
      id: job.id,
      title: job.title,
      applications: job.application_count || 0,
      conversion_rate:
        job.application_count > 0
          ? ((hiredByJob[job.id] || 0) / job.application_count) * 100
          : 0,
    }));
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
