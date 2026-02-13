"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  Briefcase,
  CheckCircle2,
  XCircle,
  Send,
  Target,
  ArrowRight,
  ChevronRight,
  Activity,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs";
import { useHiringStats } from "@/lib/hooks/use-hiring-analytics";

const FUNNEL_COLORS: Record<string, string> = {
  applied: "bg-slate-500",
  screening: "bg-blue-500",
  phone_screen: "bg-cyan-500",
  technical: "bg-amber-500",
  onsite: "bg-orange-500",
  offer: "bg-emerald-500",
  hired: "bg-green-600",
};

const FUNNEL_LABELS: Record<string, string> = {
  applied: "Applied",
  screening: "Screening",
  phone_screen: "Phone Screen",
  technical: "Technical",
  onsite: "Onsite",
  offer: "Offer",
  hired: "Hired",
};

function formatDays(days: number): string {
  if (days < 1) return "<1 day";
  if (days === 1) return "1 day";
  return `${Math.round(days)} days`;
}

function StatCard({
  title,
  value,
  icon: Icon,
  iconColor,
  subtitle,
  isLoading,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconColor: string;
  subtitle?: string;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-1">
          <Icon className={`h-4 w-4 ${iconColor}`} />
          <span className="text-xs font-medium text-muted-foreground">
            {title}
          </span>
        </div>
        <p className="text-2xl font-bold">
          {isLoading ? (
            <Skeleton className="h-7 w-16 inline-block" />
          ) : (
            value
          )}
        </p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function HiringAnalyticsPage() {
  const [period, setPeriod] = useState<string>("30d");
  const { data: stats, isLoading, isError } = useHiringStats(period);

  const funnel = stats?.funnel ?? [];
  const timeToHire = stats?.time_to_hire ?? [];
  const sourceEffectiveness = stats?.source_effectiveness ?? [];
  const weeklyTrends = stats?.weekly_trends ?? [];
  const topJobs = stats?.top_jobs ?? [];
  const teamActivity = stats?.team_activity ?? [];

  const maxFunnelCount = Math.max(...funnel.map((f) => f.count), 1);

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Hiring", href: "/hiring" },
          { label: "Analytics" },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Hiring Analytics
          </h1>
          <p className="text-muted-foreground">
            Track your hiring pipeline performance and metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
          <Link href="/hiring/evaluate">
            <Button variant="outline" size="sm">
              Evaluation Center
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {isError ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <p className="text-sm text-destructive">
                Failed to load analytics data. Make sure the backend is running.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Top-level stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Applications"
              value={stats?.total_applications ?? 0}
              icon={Users}
              iconColor="text-blue-600"
              isLoading={isLoading}
            />
            <StatCard
              title="Total Hires"
              value={stats?.total_hires ?? 0}
              icon={CheckCircle2}
              iconColor="text-emerald-600"
              isLoading={isLoading}
            />
            <StatCard
              title="Avg Time to Hire"
              value={
                stats?.overall_avg_days
                  ? formatDays(stats.overall_avg_days)
                  : "--"
              }
              icon={Clock}
              iconColor="text-amber-600"
              isLoading={isLoading}
            />
            <StatCard
              title="Offer Acceptance Rate"
              value={
                stats?.offer_acceptance_rate != null
                  ? `${Math.round(stats.offer_acceptance_rate * 100)}%`
                  : "--"
              }
              icon={Target}
              iconColor="text-violet-600"
              subtitle={
                stats
                  ? `${stats.offers_accepted} accepted / ${stats.offers_sent} sent`
                  : undefined
              }
              isLoading={isLoading}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Active Positions"
              value={stats?.active_positions ?? 0}
              icon={Briefcase}
              iconColor="text-blue-600"
              isLoading={isLoading}
            />
            <StatCard
              title="Closed Positions"
              value={stats?.closed_positions ?? 0}
              icon={Briefcase}
              iconColor="text-slate-500"
              isLoading={isLoading}
            />
            <StatCard
              title="Offers Sent"
              value={stats?.offers_sent ?? 0}
              icon={Send}
              iconColor="text-cyan-600"
              isLoading={isLoading}
            />
            <StatCard
              title="Offers Declined"
              value={stats?.offers_declined ?? 0}
              icon={XCircle}
              iconColor="text-red-500"
              isLoading={isLoading}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Hiring Funnel */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Hiring Funnel
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : funnel.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    No funnel data available yet. Applications will populate
                    this chart.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {funnel.map((stage, index) => {
                      const widthPct = Math.max(
                        (stage.count / maxFunnelCount) * 100,
                        4
                      );
                      const barColor =
                        FUNNEL_COLORS[stage.stage] || "bg-slate-400";
                      const label =
                        FUNNEL_LABELS[stage.stage] ||
                        stage.stage.replace(/_/g, " ");

                      return (
                        <div key={stage.stage}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <div className="flex items-center gap-2">
                              {index > 0 && (
                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                              )}
                              <span className="font-medium capitalize">
                                {label}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">
                                {stage.count}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ({Math.round(stage.percentage)}%)
                              </span>
                            </div>
                          </div>
                          <div className="h-6 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full ${barColor} transition-all duration-500`}
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

            {/* Time to Hire by Stage */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Time to Hire by Stage
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                ) : timeToHire.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    No time metrics available yet. Data will appear as
                    candidates move through stages.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {timeToHire.map((metric) => {
                      const maxDays = Math.max(
                        ...timeToHire.map((m) => m.avg_days),
                        1
                      );
                      const widthPct = Math.max(
                        (metric.avg_days / maxDays) * 100,
                        4
                      );
                      const label =
                        FUNNEL_LABELS[metric.stage] ||
                        metric.stage.replace(/_/g, " ");

                      return (
                        <div key={metric.stage}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="font-medium capitalize">
                              {label}
                            </span>
                            <div className="text-right">
                              <span className="font-semibold">
                                {formatDays(metric.avg_days)}
                              </span>
                              <span className="text-xs text-muted-foreground ml-1">
                                avg
                              </span>
                              {metric.median_days > 0 && (
                                <span className="text-xs text-muted-foreground ml-2">
                                  ({formatDays(metric.median_days)} median)
                                </span>
                              )}
                            </div>
                          </div>
                          <Progress
                            value={widthPct}
                            className="h-2"
                          />
                        </div>
                      );
                    })}

                    <Separator className="my-2" />

                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold">Overall Average</span>
                      <span className="font-bold text-lg">
                        {stats?.overall_avg_days
                          ? formatDays(stats.overall_avg_days)
                          : "--"}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Source Effectiveness */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Source Effectiveness
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : sourceEffectiveness.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    No source data available yet. Data will populate as
                    applications come in with source tracking.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {sourceEffectiveness.map((source) => (
                      <div
                        key={source.source}
                        className="flex items-center justify-between rounded-md border p-3"
                      >
                        <div>
                          <p className="text-sm font-medium capitalize">
                            {source.source || "Direct"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {source.applications} application
                            {source.applications !== 1 ? "s" : ""} &middot;{" "}
                            {source.hires} hire
                            {source.hires !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">
                            {Math.round(source.conversion_rate * 100)}%
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            conversion
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Weekly Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Weekly Application Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                ) : weeklyTrends.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    No trend data available yet. Weekly data will appear as
                    applications accumulate.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {weeklyTrends.map((week) => {
                      const maxApps = Math.max(
                        ...weeklyTrends.map((w) => w.applications),
                        1
                      );
                      const barWidth = Math.max(
                        (week.applications / maxApps) * 100,
                        2
                      );

                      return (
                        <div
                          key={week.week}
                          className="flex items-center gap-3"
                        >
                          <span className="text-xs text-muted-foreground w-20 shrink-0">
                            {new Date(week.week).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                          <div className="flex-1 h-5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-blue-500 transition-all"
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                          <div className="flex items-center gap-2 w-24 shrink-0 text-right">
                            <span className="text-xs font-medium flex-1">
                              {week.applications}
                            </span>
                            {week.hires > 0 && (
                              <Badge
                                variant="default"
                                className="text-[10px] h-4"
                              >
                                {week.hires} hired
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Performing Jobs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Top Performing Jobs
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : topJobs.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    No job performance data available yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {topJobs.map((job, index) => (
                      <div
                        key={job.id}
                        className="flex items-center justify-between rounded-md border p-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground font-mono w-5">
                            #{index + 1}
                          </span>
                          <div>
                            <Link
                              href={`/hiring/jobs/${job.id}`}
                              className="text-sm font-medium hover:underline"
                            >
                              {job.title}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              {job.applications} applications
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {Math.round(job.conversion_rate * 100)}% conversion
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Team Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Team Review Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : teamActivity.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    No team activity data available yet. Activity will appear as
                    team members submit evaluations.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {teamActivity.map((member) => (
                      <div
                        key={member.name}
                        className="flex items-center justify-between rounded-md border p-3"
                      >
                        <div>
                          <p className="text-sm font-medium">{member.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {member.reviews} review
                            {member.reviews !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">
                            {member.avg_score.toFixed(1)}/5
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            avg score
                          </p>
                        </div>
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
