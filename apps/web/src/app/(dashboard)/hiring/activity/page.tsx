"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs";
import {
  useActivityLog,
  type ActivityItem,
} from "@/lib/hooks/use-activity-log";
import { toast } from "sonner";
import {
  Activity,
  Download,
  Filter,
  Clock,
  TrendingUp,
  Calendar,
  Briefcase,
  Users,
  FileText,
  Mail,
  Star,
  CheckCircle,
  XCircle,
  ArrowRight,
  Send,
  UserPlus,
  MessageSquare,
  Eye,
  ClipboardCheck,
  Zap,
  BarChart3,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ACTION_TYPES = [
  { value: "all", label: "All Actions" },
  { value: "job_created", label: "Job Created" },
  { value: "job_published", label: "Job Published" },
  { value: "application_received", label: "Application Received" },
  { value: "candidate_advanced", label: "Candidate Advanced" },
  { value: "candidate_rejected", label: "Candidate Rejected" },
  { value: "scorecard_submitted", label: "Scorecard Submitted" },
  { value: "interview_scheduled", label: "Interview Scheduled" },
  { value: "offer_sent", label: "Offer Sent" },
  { value: "offer_accepted", label: "Offer Accepted" },
  { value: "offer_declined", label: "Offer Declined" },
  { value: "email_sent", label: "Email Sent" },
  { value: "note_added", label: "Note Added" },
  { value: "team_invited", label: "Team Invited" },
  { value: "system", label: "System" },
];

const ACTION_ICONS: Record<string, React.ElementType> = {
  job_created: Briefcase,
  job_published: Eye,
  application_received: UserPlus,
  candidate_advanced: ArrowRight,
  candidate_rejected: XCircle,
  scorecard_submitted: ClipboardCheck,
  interview_scheduled: Calendar,
  offer_sent: Send,
  offer_accepted: CheckCircle,
  offer_declined: XCircle,
  email_sent: Mail,
  note_added: MessageSquare,
  team_invited: Users,
  system: Zap,
};

const ACTION_COLORS: Record<string, string> = {
  job_created: "bg-blue-100 text-blue-600",
  job_published: "bg-emerald-100 text-emerald-600",
  application_received: "bg-violet-100 text-violet-600",
  candidate_advanced: "bg-green-100 text-green-600",
  candidate_rejected: "bg-red-100 text-red-600",
  scorecard_submitted: "bg-amber-100 text-amber-600",
  interview_scheduled: "bg-indigo-100 text-indigo-600",
  offer_sent: "bg-purple-100 text-purple-600",
  offer_accepted: "bg-emerald-100 text-emerald-600",
  offer_declined: "bg-rose-100 text-rose-600",
  email_sent: "bg-sky-100 text-sky-600",
  note_added: "bg-gray-100 text-gray-600",
  team_invited: "bg-teal-100 text-teal-600",
  system: "bg-orange-100 text-orange-600",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function getDateGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  const itemDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  if (itemDate.getTime() === today.getTime()) return "Today";
  if (itemDate.getTime() === yesterday.getTime()) return "Yesterday";
  if (itemDate.getTime() >= weekAgo.getTime()) return "This Week";
  return "Earlier";
}

function getResourceLink(item: ActivityItem): string | null {
  switch (item.resource_type) {
    case "job":
      return `/hiring/jobs/${item.resource_id}`;
    case "application":
      return `/hiring/evaluate`;
    case "candidate":
      return `/hiring/evaluate`;
    case "offer":
      return `/hiring/offers`;
    default:
      return null;
  }
}

function getInitials(name: string): string {
  const parts = name.split(" ");
  return parts
    .slice(0, 2)
    .map((p) => p[0] || "")
    .join("")
    .toUpperCase();
}

function exportActivityCSV(items: ActivityItem[]) {
  const rows = items.map((item) => ({
    timestamp: new Date(item.created_at).toISOString(),
    actor: item.actor_name,
    action: item.action,
    action_type: item.action_type,
    resource: item.resource_name,
    resource_type: item.resource_type,
  }));

  const headers = Object.keys(rows[0] || {});
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => `"${String((row as Record<string, string>)[h] || "").replace(/"/g, '""')}"`)
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `activity-log-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Activity Item Component
// ---------------------------------------------------------------------------

function ActivityItemCard({ item }: { item: ActivityItem }) {
  const IconComponent = ACTION_ICONS[item.action_type] || Activity;
  const colorClass = ACTION_COLORS[item.action_type] || "bg-gray-100 text-gray-600";
  const link = getResourceLink(item);

  return (
    <div className="flex gap-3 py-3 group">
      <div className="flex flex-col items-center">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colorClass}`}
        >
          <IconComponent className="h-3.5 w-3.5" />
        </div>
        <div className="w-px flex-1 bg-border mt-1" />
      </div>
      <div className="flex-1 min-w-0 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-5 w-5">
              <AvatarImage src={item.actor_avatar_url ?? undefined} />
              <AvatarFallback className="text-[8px]">
                {getInitials(item.actor_name)}
              </AvatarFallback>
            </Avatar>
            <p className="text-sm">
              <span className="font-medium">{item.actor_name}</span>{" "}
              <span className="text-muted-foreground">{item.action}</span>
            </p>
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
            {formatTimestamp(item.created_at)}
          </span>
        </div>
        {item.resource_name && (
          <div className="mt-1 flex items-center gap-2">
            {link ? (
              <Link
                href={link}
                className="text-xs text-primary hover:underline font-medium"
              >
                {item.resource_name}
              </Link>
            ) : (
              <span className="text-xs text-muted-foreground">
                {item.resource_name}
              </span>
            )}
            <Badge variant="outline" className="text-[10px]">
              {item.resource_type}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function ActivitySkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ActivityLogPage() {
  const [page, setPage] = useState(1);
  const [actionTypeFilter, setActionTypeFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data, isLoading } = useActivityLog({
    page,
    per_page: 50,
    action_type: actionTypeFilter !== "all" ? actionTypeFilter : undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  });

  const activities = data?.data ?? [];
  const meta = data?.meta;
  const stats = data?.stats ?? { today: 0, this_week: 0, avg_per_day: 0 };

  // Group activities by date
  const groupedActivities = useMemo(() => {
    const groups: Record<string, ActivityItem[]> = {};
    const groupOrder = ["Today", "Yesterday", "This Week", "Earlier"];

    for (const item of activities) {
      const group = getDateGroup(item.created_at);
      if (!groups[group]) groups[group] = [];
      groups[group].push(item);
    }

    return groupOrder
      .filter((g) => groups[g]?.length)
      .map((label) => ({ label, items: groups[label] }));
  }, [activities]);

  function handleExport() {
    if (activities.length === 0) {
      toast.error("No activities to export");
      return;
    }
    exportActivityCSV(activities);
    toast.success("Activity log exported successfully");
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Hiring", href: "/hiring" },
          { label: "Activity Log" },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activity Log</h1>
          <p className="text-muted-foreground">
            Track all hiring actions and events across your organization
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-muted-foreground">
                Actions Today
              </span>
            </div>
            <p className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-7 w-10 inline-block" />
              ) : (
                stats.today
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-medium text-muted-foreground">
                This Week
              </span>
            </div>
            <p className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-7 w-10 inline-block" />
              ) : (
                stats.this_week
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="h-4 w-4 text-violet-600" />
              <span className="text-xs font-medium text-muted-foreground">
                Avg. Per Day
              </span>
            </div>
            <p className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-7 w-10 inline-block" />
              ) : (
                stats.avg_per_day.toFixed(1)
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters</span>
            </div>
            <Select
              value={actionTypeFilter}
              onValueChange={(v) => {
                setActionTypeFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Action Type" />
              </SelectTrigger>
              <SelectContent>
                {ACTION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground shrink-0">
                From
              </Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="w-[150px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground shrink-0">
                To
              </Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className="w-[150px]"
              />
            </div>
            {(actionTypeFilter !== "all" || dateFrom || dateTo) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setActionTypeFilter("all");
                  setDateFrom("");
                  setDateTo("");
                  setPage(1);
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Activity Stream */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Activity Stream
            {meta && (
              <span className="text-sm font-normal text-muted-foreground">
                ({meta.total} events)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <ActivitySkeleton />
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Activity className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No activity yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {actionTypeFilter !== "all" || dateFrom || dateTo
                  ? "No activities match your current filters. Try adjusting your selection."
                  : "Activity from your hiring team will appear here as actions are taken."}
              </p>
            </div>
          ) : (
            <div>
              {groupedActivities.map((group) => (
                <div key={group.label}>
                  <div className="sticky top-0 bg-card z-10 py-2">
                    <Badge variant="outline" className="text-xs font-medium">
                      {group.label}
                    </Badge>
                  </div>
                  <div className="ml-1">
                    {group.items.map((item) => (
                      <ActivityItemCard key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {meta && meta.total_pages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {meta.page} of {meta.total_pages} ({meta.total} events)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= meta.total_pages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
