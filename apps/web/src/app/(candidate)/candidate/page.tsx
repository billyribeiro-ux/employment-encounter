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
  MessageSquare,
  Bell,
  Video,
  MapPin,
  Settings,
  Shield,
  Mail,
  Globe,
  Star,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/stores/auth-store";
import { useApplications } from "@/lib/hooks/use-applications";
import { usePublicJobs } from "@/lib/hooks/use-public-jobs";
import { useConversations } from "@/lib/hooks/use-conversations";
import { useMeetings } from "@/lib/hooks/use-meetings";
import { useSavedJobs } from "@/lib/hooks/use-saved-jobs";

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

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// Profile strength calculation
function calculateProfileStrength(user: { first_name: string; last_name: string; email: string } | null): {
  score: number;
  items: { label: string; completed: boolean; icon: React.ReactNode }[];
} {
  const items = [
    {
      label: "Basic information",
      completed: !!(user?.first_name && user?.last_name),
      icon: <User className="h-3.5 w-3.5" />,
    },
    {
      label: "Email verified",
      completed: !!user?.email,
      icon: <Mail className="h-3.5 w-3.5" />,
    },
    {
      label: "Profile headline",
      completed: false, // Would check candidate profile API
      icon: <Star className="h-3.5 w-3.5" />,
    },
    {
      label: "Work experience",
      completed: false, // Would check candidate profile
      icon: <Briefcase className="h-3.5 w-3.5" />,
    },
    {
      label: "Skills added",
      completed: false,
      icon: <Shield className="h-3.5 w-3.5" />,
    },
    {
      label: "Resume uploaded",
      completed: false,
      icon: <FileText className="h-3.5 w-3.5" />,
    },
    {
      label: "Location set",
      completed: false,
      icon: <Globe className="h-3.5 w-3.5" />,
    },
    {
      label: "Job preferences",
      completed: false,
      icon: <Settings className="h-3.5 w-3.5" />,
    },
  ];

  const completedCount = items.filter((i) => i.completed).length;
  const score = Math.round((completedCount / items.length) * 100);

  return { score, items };
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

  // Messaging data for unread indicator
  const { data: conversationsData } = useConversations({ per_page: 50 });
  const unreadMessages =
    conversationsData?.data?.reduce(
      (sum, c) => sum + (c.unread_count || 0),
      0
    ) ?? 0;

  // Meetings data for upcoming interviews
  const { data: meetingsData, isLoading: meetingsLoading } = useMeetings({
    per_page: 5,
    sort: "proposed_start",
    order: "asc",
  });
  const upcomingInterviews =
    meetingsData?.data?.filter((m) => {
      const start = new Date(m.confirmed_start || m.proposed_start);
      return start >= new Date() && m.status !== "cancelled";
    }) ?? [];

  // Saved jobs count
  const { data: savedJobs } = useSavedJobs();
  const savedCount = savedJobs?.length ?? 0;

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

  const profileData = calculateProfileStrength(user);
  const profileCompleteness = profileData.score;

  const stats = [
    {
      name: "Active Applications",
      value: applicationsLoading ? null : activeApplications.length,
      icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      href: "/candidate/applications",
    },
    {
      name: "Interviews Scheduled",
      value: applicationsLoading ? null : interviewsScheduled.length,
      icon: Calendar,
      color: "text-violet-600",
      bg: "bg-violet-50 dark:bg-violet-900/20",
      href: "/candidate/interviews",
    },
    {
      name: "Profile Completeness",
      value: `${profileCompleteness}%`,
      icon: User,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      isProgress: true,
      href: "/candidate/profile",
    },
    {
      name: "Saved Jobs",
      value: savedCount,
      icon: Bookmark,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-900/20",
      href: "/candidate/saved",
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
          {unreadMessages > 0 && (
            <Link href="/candidate/messages">
              <Button variant="outline" className="relative">
                <MessageSquare className="mr-2 h-4 w-4" />
                Messages
                <Badge className="ml-2 h-5 min-w-[20px] rounded-full px-1.5 text-[10px]">
                  {unreadMessages}
                </Badge>
              </Button>
            </Link>
          )}
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
          <Link key={stat.name} href={stat.href}>
            <Card className="transition-shadow hover:shadow-md cursor-pointer">
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
          </Link>
        ))}
      </div>

      {/* Upcoming Interviews Quick View */}
      {upcomingInterviews.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="border-violet-200 dark:border-violet-800/30">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4 text-violet-600" />
                Upcoming Interviews
              </CardTitle>
              <Link href="/candidate/interviews">
                <Button variant="ghost" size="sm" className="text-xs">
                  View all <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingInterviews.slice(0, 3).map((meeting) => {
                  const startTime = meeting.confirmed_start || meeting.proposed_start;
                  const isVirtual = !!meeting.meeting_link;

                  return (
                    <div
                      key={meeting.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-900/20">
                          {isVirtual ? (
                            <Video className="h-5 w-5 text-violet-600" />
                          ) : (
                            <MapPin className="h-5 w-5 text-violet-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{meeting.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(startTime)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isVirtual && meeting.meeting_link && (
                          <a
                            href={meeting.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button size="sm" variant="outline">
                              <Video className="mr-1 h-3 w-3" />
                              Join
                            </Button>
                          </a>
                        )}
                        <Link href={`/candidate/interviews/prep/${meeting.id}`}>
                          <Button size="sm" variant="ghost">
                            Prepare
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

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

      {/* Job Alerts Quick Setup / Unread Messages */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Job Alerts CTA */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
        >
          <Card className="border-amber-200 dark:border-amber-800/30 bg-amber-50/30 dark:bg-amber-900/5">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                <Bell className="h-6 w-6 text-amber-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">Set Up Job Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Configure your job preferences to get notified about matching opportunities.
                </p>
              </div>
              <Link href="/candidate/settings?tab=preferences" className="shrink-0">
                <Button variant="outline" size="sm">
                  Set Up
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        {/* Unread Messages */}
        {unreadMessages > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.15 }}
          >
            <Card className="border-blue-200 dark:border-blue-800/30 bg-blue-50/30 dark:bg-blue-900/5">
              <CardContent className="flex items-center gap-4 pt-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {unreadMessages} Unread Message{unreadMessages !== 1 ? "s" : ""}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    You have messages waiting from employers. Stay responsive for better results.
                  </p>
                </div>
                <Link href="/candidate/messages" className="shrink-0">
                  <Button size="sm">
                    Read Messages
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Profile Completion CTA with detailed breakdown */}
      {profileCompleteness < 100 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Complete Your Profile</p>
                    <p className="text-sm text-muted-foreground">
                      Profiles with more details get 3x more views from employers.
                      Your profile is {profileCompleteness}% complete.
                    </p>
                    <Progress value={profileCompleteness} className="mt-3 h-2 max-w-xs" />
                    {/* Profile items breakdown */}
                    <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
                      {profileData.items.map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center gap-2 text-xs"
                        >
                          {item.completed ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                          ) : (
                            <div className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/30" />
                          )}
                          <span
                            className={
                              item.completed
                                ? "text-muted-foreground line-through"
                                : "text-foreground"
                            }
                          >
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <Link href="/candidate/profile" className="shrink-0">
                  <Button>
                    Update Profile
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
