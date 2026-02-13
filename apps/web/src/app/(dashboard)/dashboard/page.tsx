"use client";

import Link from "next/link";
import {
  Briefcase,
  Users,
  FileCheck,
  Calendar,
  Plus,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Clock,
  ClipboardCheck,
  Search,
  Eye,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/stores/auth-store";
import { useDashboardStats } from "@/lib/hooks/use-dashboard";
import { useJobs } from "@/lib/hooks/use-jobs";
import { useApplications } from "@/lib/hooks/use-applications";
import { useCandidates } from "@/lib/hooks/use-candidates";

const PIPELINE_STAGES = [
  { id: "applied", label: "Applied", color: "bg-slate-400" },
  { id: "screening", label: "Screening", color: "bg-blue-400" },
  { id: "phone_screen", label: "Phone", color: "bg-cyan-400" },
  { id: "technical", label: "Technical", color: "bg-amber-400" },
  { id: "onsite", label: "Onsite", color: "bg-orange-400" },
  { id: "offer", label: "Offer", color: "bg-emerald-400" },
];

function stageVariant(stage: string) {
  switch (stage) {
    case "applied":
      return "secondary" as const;
    case "screening":
      return "secondary" as const;
    case "phone_screen":
      return "outline" as const;
    case "technical":
      return "outline" as const;
    case "onsite":
      return "default" as const;
    case "offer":
      return "default" as const;
    default:
      return "secondary" as const;
  }
}

function formatStageLabel(stage: string): string {
  return stage
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function daysSince(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7) return `${diff}d ago`;
  if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
  return `${Math.floor(diff / 30)}mo ago`;
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: stats, isLoading: statsLoading } = useDashboardStats();

  const { data: jobsData, isLoading: jobsLoading } = useJobs({
    per_page: 200,
    status: "published",
  });

  const { data: appsData, isLoading: appsLoading } = useApplications({
    per_page: 10,
    sort: "created_at",
    order: "desc",
  });

  const { data: allAppsData } = useApplications({
    per_page: 500,
  });

  const { data: candidatesData, isLoading: candidatesLoading } = useCandidates({
    per_page: 1,
  });

  const isLoading = statsLoading || jobsLoading || appsLoading || candidatesLoading;

  const jobs = jobsData?.data ?? [];
  const recentApplications = appsData?.data ?? [];
  const allApplications = allAppsData?.data ?? [];
  const totalCandidates = candidatesData?.meta?.total ?? stats?.total_candidates ?? 0;

  // Compute stats from available data
  const activeJobs = stats?.active_jobs ?? jobs.length;
  const activeJobsTrend = stats?.active_jobs_trend ?? 0;
  const pendingReviews =
    stats?.pending_reviews ??
    allApplications.filter(
      (a) => a.stage === "applied" && a.status === "active"
    ).length;
  const interviewsThisWeek = stats?.interviews_this_week ?? 0;

  // Pipeline counts
  const stageCounts: Record<string, number> = {};
  for (const stage of PIPELINE_STAGES) {
    stageCounts[stage.id] = 0;
  }
  for (const app of allApplications) {
    if (app.stage && stageCounts[app.stage] !== undefined) {
      stageCounts[app.stage]++;
    }
  }
  const maxStageCount = Math.max(...Object.values(stageCounts), 1);

  const quickActions = [
    { label: "Create Job", href: "/hiring/jobs/new", icon: Plus },
    { label: "View Evaluations", href: "/hiring/evaluate", icon: ClipboardCheck },
    { label: "Browse Talent", href: "/candidates", icon: Search },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back{user?.first_name ? `, ${user.first_name}` : ""}
          </h1>
          <p className="text-muted-foreground">
            Here is an overview of your hiring activity
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
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-5">
            <Skeleton className="h-96 lg:col-span-3" />
            <Skeleton className="h-96 lg:col-span-2" />
          </div>
        </div>
      ) : (
        <>
          {/* Row 1 - Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-medium text-muted-foreground">
                      Active Jobs
                    </span>
                  </div>
                  {activeJobsTrend !== 0 && (
                    <span
                      className={`flex items-center text-[10px] font-medium ${
                        activeJobsTrend > 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {activeJobsTrend > 0 ? (
                        <TrendingUp className="h-3 w-3 mr-0.5" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-0.5" />
                      )}
                      {Math.abs(activeJobsTrend)}
                    </span>
                  )}
                </div>
                <p className="text-2xl font-bold">{activeJobs}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Total Candidates
                  </span>
                </div>
                <p className="text-2xl font-bold">{totalCandidates}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <FileCheck className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Pending Reviews
                  </span>
                </div>
                <p className="text-2xl font-bold">{pendingReviews}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-violet-600" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Interviews This Week
                  </span>
                </div>
                <p className="text-2xl font-bold">
                  {interviewsThisWeek > 0 ? interviewsThisWeek : "--"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Row 2 - Recent Applications + Upcoming Interviews */}
          <div className="grid gap-6 lg:grid-cols-5">
            {/* Recent Applications (60%) */}
            <Card className="lg:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">
                  Recent Applications
                </CardTitle>
                <Link href="/hiring">
                  <Button variant="ghost" size="sm" className="text-xs">
                    View all <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {recentApplications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Users className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No recent applications
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Applications will appear here as candidates apply to your
                      jobs.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-md border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-3 py-2 text-left font-medium">
                            Candidate
                          </th>
                          <th className="px-3 py-2 text-left font-medium">
                            Job
                          </th>
                          <th className="px-3 py-2 text-left font-medium">
                            Stage
                          </th>
                          <th className="px-3 py-2 text-right font-medium">
                            Applied
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentApplications.slice(0, 10).map((app) => (
                          <tr
                            key={app.id}
                            className="border-b last:border-0 hover:bg-muted/30"
                          >
                            <td className="px-3 py-2 font-medium">
                              {app.candidate_name || "Unknown"}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">
                              {app.job_title ? (
                                <Link
                                  href={`/hiring/jobs/${app.job_id}`}
                                  className="hover:underline"
                                >
                                  {app.job_title}
                                </Link>
                              ) : (
                                "--"
                              )}
                            </td>
                            <td className="px-3 py-2">
                              <Badge
                                variant={stageVariant(app.stage)}
                                className="text-[10px]"
                              >
                                {formatStageLabel(app.stage)}
                              </Badge>
                            </td>
                            <td className="px-3 py-2 text-right text-xs text-muted-foreground">
                              {daysSince(app.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Interviews (40%) */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">
                  Upcoming Interviews
                </CardTitle>
                <Link href="/calendar">
                  <Button variant="ghost" size="sm" className="text-xs">
                    View all <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {interviewsThisWeek === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No upcoming interviews
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Scheduled interviews will appear here as candidates
                      progress through your pipeline.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Display interview slots from applications in interview stages */}
                    {allApplications
                      .filter(
                        (a) =>
                          a.stage === "phone_screen" ||
                          a.stage === "technical" ||
                          a.stage === "onsite"
                      )
                      .slice(0, 5)
                      .map((app) => (
                        <div
                          key={app.id}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                              {(app.candidate_name || "?")
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {app.candidate_name || "Unknown"}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {app.job_title || "Job"} &middot;{" "}
                                {formatStageLabel(app.stage)}
                              </p>
                            </div>
                          </div>
                          <Link href={`/hiring/jobs/${app.job_id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </div>
                      ))}
                    {allApplications.filter(
                      (a) =>
                        a.stage === "phone_screen" ||
                        a.stage === "technical" ||
                        a.stage === "onsite"
                    ).length === 0 && (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          No candidates in interview stages
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Row 3 - Pipeline Overview + Quick Actions */}
          <div className="grid gap-6 lg:grid-cols-5">
            {/* Pipeline Overview */}
            <Card className="lg:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Pipeline Overview</CardTitle>
                <Link href="/analytics">
                  <Button variant="ghost" size="sm" className="text-xs">
                    Full analytics <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {PIPELINE_STAGES.map((stage) => {
                    const count = stageCounts[stage.id] || 0;
                    const widthPct = Math.max(
                      (count / maxStageCount) * 100,
                      2
                    );
                    return (
                      <div
                        key={stage.id}
                        className="flex items-center gap-3"
                      >
                        <span className="text-xs font-medium w-20 shrink-0">
                          {stage.label}
                        </span>
                        <div className="flex-1 h-6 bg-muted rounded overflow-hidden relative">
                          <div
                            className={`h-full rounded transition-all ${stage.color}`}
                            style={{
                              width: `${widthPct}%`,
                              opacity: 0.8,
                            }}
                          />
                          <span className="absolute inset-y-0 left-2 flex items-center text-[10px] font-semibold text-foreground">
                            {count}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Link href="/hiring/jobs/new" className="block">
                    <div className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                        <Plus className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Create Job</p>
                        <p className="text-xs text-muted-foreground">
                          Post a new job opening
                        </p>
                      </div>
                      <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                  <Link href="/hiring/evaluate" className="block">
                    <div className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
                        <ClipboardCheck className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          View Evaluations
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Review candidate assessments
                        </p>
                      </div>
                      <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                  <Link href="/candidates" className="block">
                    <div className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
                        <Search className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Browse Talent</p>
                        <p className="text-xs text-muted-foreground">
                          Search candidate profiles
                        </p>
                      </div>
                      <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
