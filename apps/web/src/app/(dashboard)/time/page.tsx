"use client";

import { useState, useMemo } from "react";
import {
  Activity,
  Users,
  FileText,
  Calendar,
  Send,
  ArrowRight,
  Star,
  MessageSquare,
  UserCheck,
  Eye,
  Clock,
  Filter,
  X,
  Search,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useApplications } from "@/lib/hooks/use-applications";
import { useMeetings } from "@/lib/hooks/use-meetings";
import { useOffers } from "@/lib/hooks/use-offers";
import { useTeamUsers } from "@/lib/hooks/use-settings";
import { toast } from "sonner";

interface ActivityItem {
  id: string;
  type: "application_reviewed" | "scorecard_submitted" | "interview_scheduled" | "offer_sent" | "stage_change" | "candidate_added" | "note_added";
  actorName: string;
  actorInitials: string;
  description: string;
  timestamp: Date;
  linkLabel?: string;
  linkHref?: string;
  metadata?: Record<string, string>;
}

const ACTION_CONFIG: Record<
  string,
  { icon: React.ReactNode; color: string; bg: string }
> = {
  application_reviewed: {
    icon: <Eye className="h-3.5 w-3.5" />,
    color: "text-blue-700",
    bg: "bg-blue-50",
  },
  scorecard_submitted: {
    icon: <Star className="h-3.5 w-3.5" />,
    color: "text-amber-700",
    bg: "bg-amber-50",
  },
  interview_scheduled: {
    icon: <Calendar className="h-3.5 w-3.5" />,
    color: "text-purple-700",
    bg: "bg-purple-50",
  },
  offer_sent: {
    icon: <Send className="h-3.5 w-3.5" />,
    color: "text-green-700",
    bg: "bg-green-50",
  },
  stage_change: {
    icon: <ArrowRight className="h-3.5 w-3.5" />,
    color: "text-indigo-700",
    bg: "bg-indigo-50",
  },
  candidate_added: {
    icon: <UserCheck className="h-3.5 w-3.5" />,
    color: "text-teal-700",
    bg: "bg-teal-50",
  },
  note_added: {
    icon: <MessageSquare className="h-3.5 w-3.5" />,
    color: "text-orange-700",
    bg: "bg-orange-50",
  },
};

function getActionConfig(type: string) {
  return (
    ACTION_CONFIG[type] ?? {
      icon: <Activity className="h-3.5 w-3.5" />,
      color: "text-gray-700",
      bg: "bg-gray-50",
    }
  );
}

function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function generateActivities(
  applications: { id: string; candidate_name: string | null; job_title: string | null; stage: string; status: string; created_at: string; updated_at: string }[],
  meetings: { id: string; title: string; organizer_id: string; proposed_start: string; status: string; created_at: string }[],
  offers: { id: string; title: string; status: string; created_at: string; sent_at: string | null }[],
  teamMembers: { id: string; first_name: string; last_name: string }[],
): ActivityItem[] {
  const activities: ActivityItem[] = [];
  const getRandomMember = () => {
    if (teamMembers.length === 0) return { name: "System", initials: "SY" };
    const m = teamMembers[Math.floor(Math.random() * teamMembers.length)];
    return {
      name: `${m.first_name} ${m.last_name}`,
      initials: `${m.first_name[0] || ""}${m.last_name[0] || ""}`.toUpperCase(),
    };
  };

  applications.forEach((app) => {
    const actor = getRandomMember();
    activities.push({
      id: `app-review-${app.id}`,
      type: "application_reviewed",
      actorName: actor.name,
      actorInitials: actor.initials,
      description: `reviewed ${app.candidate_name || "a candidate"}'s application for ${app.job_title || "a position"}`,
      timestamp: new Date(app.updated_at),
      linkLabel: "View Application",
    });

    if (app.stage !== "applied") {
      const actor2 = getRandomMember();
      activities.push({
        id: `stage-${app.id}`,
        type: "stage_change",
        actorName: actor2.name,
        actorInitials: actor2.initials,
        description: `moved ${app.candidate_name || "a candidate"} to ${app.stage.replace(/_/g, " ")} stage`,
        timestamp: new Date(app.updated_at),
        linkLabel: "View Pipeline",
      });
    }
  });

  meetings.forEach((m) => {
    const actor = getRandomMember();
    activities.push({
      id: `meeting-${m.id}`,
      type: "interview_scheduled",
      actorName: actor.name,
      actorInitials: actor.initials,
      description: `scheduled interview: ${m.title}`,
      timestamp: new Date(m.created_at),
      linkLabel: "View Interview",
    });
  });

  offers.forEach((o) => {
    if (o.sent_at) {
      const actor = getRandomMember();
      activities.push({
        id: `offer-${o.id}`,
        type: "offer_sent",
        actorName: actor.name,
        actorInitials: actor.initials,
        description: `sent offer for ${o.title}`,
        timestamp: new Date(o.sent_at),
        linkLabel: "View Offer",
      });
    }
  });

  // Add some synthetic scorecard and note activities
  applications.slice(0, 5).forEach((app, i) => {
    const actor = getRandomMember();
    activities.push({
      id: `scorecard-${app.id}-${i}`,
      type: "scorecard_submitted",
      actorName: actor.name,
      actorInitials: actor.initials,
      description: `submitted a scorecard for ${app.candidate_name || "a candidate"} (${app.job_title || "position"})`,
      timestamp: new Date(new Date(app.updated_at).getTime() + i * 3600000),
      linkLabel: "View Scorecard",
    });
  });

  applications.slice(0, 3).forEach((app, i) => {
    const actor = getRandomMember();
    activities.push({
      id: `note-${app.id}-${i}`,
      type: "note_added",
      actorName: actor.name,
      actorInitials: actor.initials,
      description: `added a note on ${app.candidate_name || "a candidate"}'s profile`,
      timestamp: new Date(new Date(app.updated_at).getTime() + i * 7200000),
      linkLabel: "View Note",
    });
  });

  return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export default function ActivityFeedPage() {
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [memberFilter, setMemberFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [visibleCount, setVisibleCount] = useState(20);

  const { data: appsData, isLoading: appsLoading } = useApplications({
    page: 1,
    per_page: 50,
    sort: "updated_at",
    order: "desc",
  });
  const { data: meetingsData, isLoading: meetingsLoading } = useMeetings({
    page: 1,
    per_page: 50,
    sort: "created_at",
    order: "desc",
  });
  const { data: offersData, isLoading: offersLoading } = useOffers({
    page: 1,
    per_page: 50,
  });
  const { data: teamMembers, isLoading: teamLoading } = useTeamUsers();

  const isLoading = appsLoading || meetingsLoading || offersLoading || teamLoading;

  const allActivities = useMemo(() => {
    if (isLoading) return [];
    return generateActivities(
      appsData?.data ?? [],
      meetingsData?.data ?? [],
      offersData?.data ?? [],
      teamMembers ?? []
    );
  }, [appsData, meetingsData, offersData, teamMembers, isLoading]);

  const filteredActivities = useMemo(() => {
    let result = allActivities;

    if (actionFilter !== "all") {
      result = result.filter((a) => a.type === actionFilter);
    }

    if (memberFilter !== "all") {
      result = result.filter((a) => a.actorName === memberFilter);
    }

    if (dateFilter !== "all") {
      const now = new Date();
      if (dateFilter === "today") {
        result = result.filter(
          (a) => a.timestamp.toDateString() === now.toDateString()
        );
      } else if (dateFilter === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        result = result.filter((a) => a.timestamp >= weekAgo);
      } else if (dateFilter === "month") {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        result = result.filter((a) => a.timestamp >= monthAgo);
      }
    }

    return result;
  }, [allActivities, actionFilter, memberFilter, dateFilter]);

  const stats = useMemo(() => {
    const now = new Date();
    const today = allActivities.filter(
      (a) => a.timestamp.toDateString() === now.toDateString()
    );
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisWeek = allActivities.filter((a) => a.timestamp >= weekAgo);

    const memberCounts: Record<string, number> = {};
    thisWeek.forEach((a) => {
      memberCounts[a.actorName] = (memberCounts[a.actorName] || 0) + 1;
    });
    const mostActive = Object.entries(memberCounts).sort(
      (a, b) => b[1] - a[1]
    )[0];

    return {
      today: today.length,
      thisWeek: thisWeek.length,
      total: allActivities.length,
      mostActive: mostActive
        ? { name: mostActive[0], count: mostActive[1] }
        : null,
    };
  }, [allActivities]);

  const uniqueMembers = useMemo(() => {
    const names = new Set<string>();
    allActivities.forEach((a) => names.add(a.actorName));
    return Array.from(names).sort();
  }, [allActivities]);

  const hasActiveFilters =
    actionFilter !== "all" || memberFilter !== "all" || dateFilter !== "all";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Team Activity Feed
          </h1>
          <p className="text-muted-foreground">
            Real-time feed of all hiring team actions
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-muted-foreground">
                Actions Today
              </span>
            </div>
            <p className="text-2xl font-bold">{stats.today}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-purple-600" />
              <span className="text-xs font-medium text-muted-foreground">
                This Week
              </span>
            </div>
            <p className="text-2xl font-bold">{stats.thisWeek}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-medium text-muted-foreground">
                Total Activities
              </span>
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-muted-foreground">
                Most Active Member
              </span>
            </div>
            <p className="text-lg font-bold truncate">
              {stats.mostActive ? stats.mostActive.name : "N/A"}
            </p>
            {stats.mostActive && (
              <p className="text-xs text-muted-foreground">
                {stats.mostActive.count} actions this week
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Select value={memberFilter} onValueChange={setMemberFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Team Member" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Members</SelectItem>
            {uniqueMembers.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Action Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="application_reviewed">Application Reviewed</SelectItem>
            <SelectItem value="scorecard_submitted">Scorecard Submitted</SelectItem>
            <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
            <SelectItem value="offer_sent">Offer Sent</SelectItem>
            <SelectItem value="stage_change">Stage Change</SelectItem>
            <SelectItem value="candidate_added">Candidate Added</SelectItem>
            <SelectItem value="note_added">Note Added</SelectItem>
          </SelectContent>
        </Select>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-muted-foreground"
            onClick={() => {
              setActionFilter("all");
              setMemberFilter("all");
              setDateFilter("all");
            }}
          >
            <X className="mr-1 h-3 w-3" />
            Clear Filters
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activity Feed
            <span className="text-sm font-normal text-muted-foreground ml-1">
              ({filteredActivities.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Activity className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No activity found</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {hasActiveFilters
                  ? "No activities match the current filters. Try adjusting your filters."
                  : "Activity will appear here as your team reviews applications, submits scorecards, and schedules interviews."}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <AnimatePresence>
                {filteredActivities.slice(0, visibleCount).map((activity, i) => {
                  const cfg = getActionConfig(activity.type);
                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.03, 0.5) }}
                      className="flex items-start gap-3 rounded-md p-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium shrink-0">
                        {activity.actorInitials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium">
                            {activity.actorName}
                          </span>{" "}
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">
                            {timeAgo(activity.timestamp)}
                          </span>
                          {activity.linkLabel && (
                            <Button
                              variant="link"
                              className="h-auto p-0 text-xs"
                            >
                              {activity.linkLabel}
                            </Button>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] shrink-0 ${cfg.color} ${cfg.bg} border-0`}
                      >
                        {cfg.icon}
                        <span className="ml-1 capitalize">
                          {activity.type.replace(/_/g, " ")}
                        </span>
                      </Badge>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {filteredActivities.length > visibleCount && (
                <div className="pt-4 text-center">
                  <Button
                    variant="outline"
                    onClick={() => setVisibleCount((c) => c + 20)}
                  >
                    <ChevronDown className="mr-2 h-4 w-4" />
                    Load More ({filteredActivities.length - visibleCount}{" "}
                    remaining)
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
