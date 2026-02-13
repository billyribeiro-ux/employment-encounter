"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText,
  Calendar,
  User,
  Bookmark,
  ArrowRight,
  Briefcase,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/auth-store";
import { useApplications } from "@/lib/hooks/use-applications";
import { usePublicJobs } from "@/lib/hooks/use-public-jobs";

function stageIcon(stage: string) {
  switch (stage) {
    case "applied":
      return <FileText className="h-4 w-4 text-blue-600" />;
    case "screening":
      return <AlertCircle className="h-4 w-4 text-amber-600" />;
    case "interview":
      return <Calendar className="h-4 w-4 text-violet-600" />;
    case "offer":
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case "rejected":
      return <XCircle className="h-4 w-4 text-red-600" />;
    case "withdrawn":
      return <XCircle className="h-4 w-4 text-muted-foreground" />;
    default:
      return <FileText className="h-4 w-4 text-muted-foreground" />;
  }
}

function stageLabel(stage: string): string {
  return stage.charAt(0).toUpperCase() + stage.slice(1);
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

export default function CandidateDashboardPage() {
  const { user } = useAuthStore();
  const {
    data: applicationsData,
    isLoading: applicationsLoading,
  } = useApplications({ per_page: 100 });
  const { data: recommendedJobs, isLoading: jobsLoading } = usePublicJobs({
    per_page: 4,
  });

  const applications = applicationsData?.data ?? [];
  const activeApplications = applications.filter(
    (a) => a.status === "active" && a.stage !== "rejected" && a.stage !== "withdrawn"
  );
  const interviewsScheduled = applications.filter(
    (a) => a.stage === "interview" && a.status === "active"
  );
  const recentApplications = [...applications]
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )
    .slice(0, 5);

  // Mock profile completeness (would come from candidate profile API)
  const profileCompleteness = 65;

  const stats = [
    {
      name: "Active Applications",
      value: applicationsLoading ? null : activeApplications.length,
      icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      name: "Interviews Scheduled",
      value: applicationsLoading ? null : interviewsScheduled.length,
      icon: Calendar,
      color: "text-violet-600",
      bg: "bg-violet-50 dark:bg-violet-900/20",
    },
    {
      name: "Profile Completeness",
      value: `${profileCompleteness}%`,
      icon: User,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      isProgress: true,
    },
    {
      name: "Saved Jobs",
      value: 0,
      icon: Bookmark,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-900/20",
    },
  ];

  const jobs = recommendedJobs?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {user?.first_name || "there"}
          </h1>
          <p className="text-muted-foreground">
            Here is an overview of your job search activity
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/jobs">
            <Button>
              <Search className="mr-2 h-4 w-4" />
              Browse Jobs
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.name}
              </CardTitle>
              <div className={`rounded-lg p-2 ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {stat.value === null ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  {stat.isProgress && (
                    <Progress
                      value={profileCompleteness}
                      className="mt-2 h-1.5"
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <Link href="/candidate/applications">
              <Button variant="ghost" size="sm" className="text-xs">
                View all <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {applicationsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14" />
                ))}
              </div>
            ) : recentApplications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="mb-3 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">No applications yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Start browsing jobs and submit your first application
                </p>
                <Link href="/jobs" className="mt-3">
                  <Button variant="outline" size="sm">
                    Browse Jobs
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentApplications.map((app) => (
                  <div
                    key={app.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      {stageIcon(app.stage)}
                      <div>
                        <p className="text-sm font-medium">
                          {app.job_title || "Untitled Position"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {timeAgo(app.updated_at)}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        app.stage === "offer"
                          ? "default"
                          : app.stage === "rejected"
                            ? "destructive"
                            : "secondary"
                      }
                      className="text-xs"
                    >
                      {stageLabel(app.stage)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recommended Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recommended for You</CardTitle>
            <Link href="/jobs">
              <Button variant="ghost" size="sm" className="text-xs">
                View all <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {jobsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14" />
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Briefcase className="mb-3 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">No jobs available</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Check back soon for new opportunities
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {jobs.map((job) => (
                  <Link key={job.id} href={`/jobs/${job.id}`}>
                    <div className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/30 cursor-pointer">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {job.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {job.company_name}
                          {job.location_city && ` - ${job.location_city}`}
                        </p>
                      </div>
                      <Badge variant="outline" className="ml-2 text-xs shrink-0">
                        {job.employment_type
                          .split("_")
                          .map(
                            (w) => w.charAt(0).toUpperCase() + w.slice(1)
                          )
                          .join(" ")}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Profile Completion CTA */}
      {profileCompleteness < 100 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex items-center justify-between pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Complete Your Profile</p>
                  <p className="text-sm text-muted-foreground">
                    Profiles with more details get 3x more views from employers.
                    Your profile is {profileCompleteness}% complete.
                  </p>
                </div>
              </div>
              <Link href="/candidate/profile">
                <Button>
                  Update Profile
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
