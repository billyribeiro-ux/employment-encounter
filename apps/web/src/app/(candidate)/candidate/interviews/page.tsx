"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Phone,
  Users,
  Building2,
  Briefcase,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  LayoutList,
  CalendarDays,
  FileText,
  XCircle,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  useMeetings,
  useCancelMeeting,
  useRescheduleMeeting,
  type MeetingRequest,
} from "@/lib/hooks/use-meetings";
import { cn } from "@/lib/utils";

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function getDurationMinutes(start: string, end: string): number {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return Math.round(diff / 60000);
}

function interviewTypeIcon(type: string) {
  switch (type) {
    case "phone_screen":
      return <Phone className="h-4 w-4" />;
    case "technical":
      return <FileText className="h-4 w-4" />;
    case "onsite":
      return <Building2 className="h-4 w-4" />;
    case "final":
      return <Users className="h-4 w-4" />;
    default:
      return <Video className="h-4 w-4" />;
  }
}

function interviewTypeLabel(type: string): string {
  switch (type) {
    case "phone_screen":
      return "Phone Screen";
    case "technical":
      return "Technical";
    case "onsite":
      return "On-site";
    case "final":
      return "Final Round";
    case "video":
      return "Video Call";
    default:
      return type
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
  }
}

function interviewTypeBadgeVariant(type: string): "default" | "secondary" | "outline" | "destructive" {
  switch (type) {
    case "phone_screen":
      return "secondary";
    case "technical":
      return "default";
    case "onsite":
      return "outline";
    case "final":
      return "default";
    default:
      return "secondary";
  }
}

function statusBadge(status: string) {
  switch (status) {
    case "confirmed":
    case "accepted":
      return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Confirmed
        </Badge>
      );
    case "pending":
    case "proposed":
      return (
        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
          <Clock className="mr-1 h-3 w-3" />
          Scheduled
        </Badge>
      );
    case "completed":
      return (
        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Completed
        </Badge>
      );
    case "cancelled":
      return (
        <Badge variant="destructive">
          <XCircle className="mr-1 h-3 w-3" />
          Cancelled
        </Badge>
      );
    case "rescheduled":
      return (
        <Badge className="bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400">
          <RefreshCw className="mr-1 h-3 w-3" />
          Rescheduled
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function preparationTips(type: string): string[] {
  switch (type) {
    case "phone_screen":
      return [
        "Research the company and role thoroughly",
        "Prepare your elevator pitch (30-60 seconds)",
        "Have your resume in front of you",
        "Find a quiet place with good reception",
        "Prepare 2-3 thoughtful questions to ask",
      ];
    case "technical":
      return [
        "Review the job requirements and tech stack",
        "Practice coding problems on a whiteboard or editor",
        "Brush up on system design concepts",
        "Be ready to talk through your thought process aloud",
        "Prepare examples of past technical challenges",
      ];
    case "onsite":
      return [
        "Plan your route and aim to arrive 10 minutes early",
        "Dress appropriately for the company culture",
        "Bring copies of your resume and a notepad",
        "Prepare for both technical and behavioral questions",
        "Research everyone on your interview schedule",
      ];
    case "final":
      return [
        "Review all previous interview feedback",
        "Prepare for senior leadership questions",
        "Have your compensation expectations ready",
        "Prepare questions about team culture and growth",
        "Be ready to discuss long-term career goals",
      ];
    default:
      return [
        "Test your video and audio setup beforehand",
        "Choose a professional, well-lit background",
        "Have your resume and notes accessible",
        "Prepare for both technical and behavioral questions",
        "Keep a glass of water nearby",
      ];
  }
}

function InterviewCard({
  meeting,
  onCancel,
  onReschedule,
  isPast,
}: {
  meeting: MeetingRequest;
  onCancel: (id: string) => void;
  onReschedule: (id: string) => void;
  isPast: boolean;
}) {
  const startTime = meeting.confirmed_start || meeting.proposed_start;
  const endTime = meeting.confirmed_end || meeting.proposed_end;
  const duration = getDurationMinutes(startTime, endTime);
  const isVirtual = !!meeting.meeting_link || !!meeting.video_room_id;
  const isCancelled = meeting.status === "cancelled";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={cn(isCancelled && "opacity-60")}>
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1 space-y-3">
              {/* Title & Company */}
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold">{meeting.title}</h3>
                  <Badge variant={interviewTypeBadgeVariant(meeting.meeting_type)}>
                    {interviewTypeIcon(meeting.meeting_type)}
                    <span className="ml-1">{interviewTypeLabel(meeting.meeting_type)}</span>
                  </Badge>
                </div>
                {meeting.description && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {meeting.description}
                  </p>
                )}
              </div>

              {/* Details */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatDate(startTime)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    {formatTime(startTime)} - {formatTime(endTime)} ({duration} min)
                  </span>
                </div>
                {meeting.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{meeting.location}</span>
                  </div>
                )}
                {isVirtual && !meeting.location && (
                  <div className="flex items-center gap-1.5">
                    <Video className="h-3.5 w-3.5" />
                    <span>Virtual Meeting</span>
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                {statusBadge(meeting.status)}
                {meeting.timezone && (
                  <span className="text-xs text-muted-foreground">
                    {meeting.timezone}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col">
              {isVirtual && meeting.meeting_link && !isPast && !isCancelled && (
                <a href={meeting.meeting_link} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" className="w-full">
                    <Video className="mr-1.5 h-3.5 w-3.5" />
                    Join Call
                  </Button>
                </a>
              )}
              {!isPast && !isCancelled && (
                <Link href={`/candidate/interviews/prep/${meeting.id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    <FileText className="mr-1.5 h-3.5 w-3.5" />
                    Prepare
                  </Button>
                </Link>
              )}
              {!isPast && !isCancelled && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onReschedule(meeting.id)}
                  >
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                    Reschedule
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => onCancel(meeting.id)}
                  >
                    <XCircle className="mr-1.5 h-3.5 w-3.5" />
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function WeekCalendarView({ meetings }: { meetings: MeetingRequest[] }) {
  const [weekOffset, setWeekOffset] = useState(0);

  const weekStart = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(now.setDate(diff));
    start.setDate(start.getDate() + weekOffset * 7);
    start.setHours(0, 0, 0, 0);
    return start;
  }, [weekOffset]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + i);
      return day;
    });
  }, [weekStart]);

  const meetingsByDay = useMemo(() => {
    const map = new Map<string, MeetingRequest[]>();
    weekDays.forEach((day) => {
      const key = day.toISOString().split("T")[0];
      map.set(key, []);
    });
    meetings.forEach((m) => {
      const start = m.confirmed_start || m.proposed_start;
      const key = new Date(start).toISOString().split("T")[0];
      if (map.has(key)) {
        map.get(key)!.push(m);
      }
    });
    return map;
  }, [meetings, weekDays]);

  const weekLabel = `${weekDays[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${weekDays[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Week View</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setWeekOffset((o) => o - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[160px] text-center text-sm font-medium">
            {weekLabel}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setWeekOffset((o) => o + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          {weekOffset !== 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => setWeekOffset(0)}
            >
              Today
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day) => {
            const key = day.toISOString().split("T")[0];
            const dayMeetings = meetingsByDay.get(key) || [];
            const isToday = new Date().toDateString() === day.toDateString();

            return (
              <div
                key={key}
                className={cn(
                  "min-h-[100px] rounded-lg border p-2",
                  isToday && "border-primary bg-primary/5"
                )}
              >
                <div className="mb-1 text-center">
                  <p className="text-[10px] font-medium uppercase text-muted-foreground">
                    {day.toLocaleDateString("en-US", { weekday: "short" })}
                  </p>
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      isToday && "text-primary"
                    )}
                  >
                    {day.getDate()}
                  </p>
                </div>
                <div className="space-y-1">
                  {dayMeetings.map((m) => (
                    <Link
                      key={m.id}
                      href={`/candidate/interviews/prep/${m.id}`}
                    >
                      <div
                        className={cn(
                          "cursor-pointer rounded px-1.5 py-1 text-[10px] font-medium transition-colors",
                          m.status === "cancelled"
                            ? "bg-red-100 text-red-700 line-through dark:bg-red-900/20 dark:text-red-400"
                            : "bg-primary/10 text-primary hover:bg-primary/20"
                        )}
                      >
                        <p className="truncate">{m.title}</p>
                        <p className="text-muted-foreground">
                          {formatTime(m.confirmed_start || m.proposed_start)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default function CandidateInterviewsPage() {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [cancelDialogId, setCancelDialogId] = useState<string | null>(null);
  const [rescheduleDialogId, setRescheduleDialogId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");

  const { data: meetingsData, isLoading } = useMeetings({
    per_page: 100,
    sort: "proposed_start",
    order: "asc",
  });
  const cancelMeeting = useCancelMeeting();
  const rescheduleMeeting = useRescheduleMeeting();

  const meetings = meetingsData?.data ?? [];
  const now = new Date();

  const upcomingMeetings = meetings.filter((m) => {
    const start = new Date(m.confirmed_start || m.proposed_start);
    return start >= now && m.status !== "cancelled";
  });

  const pastMeetings = meetings.filter((m) => {
    const start = new Date(m.confirmed_start || m.proposed_start);
    return start < now || m.status === "cancelled";
  });

  function handleCancelConfirm() {
    if (!cancelDialogId) return;
    cancelMeeting.mutate(
      { id: cancelDialogId, reason: cancelReason || undefined },
      {
        onSuccess: () => {
          toast.success("Interview cancelled successfully");
          setCancelDialogId(null);
          setCancelReason("");
        },
        onError: () => {
          toast.error("Failed to cancel interview");
        },
      }
    );
  }

  function handleRescheduleConfirm() {
    if (!rescheduleDialogId) return;
    const meeting = meetings.find((m) => m.id === rescheduleDialogId);
    if (!meeting) return;

    // Request reschedule with the same times (employer will provide new times)
    rescheduleMeeting.mutate(
      {
        id: rescheduleDialogId,
        proposed_start: meeting.proposed_start,
        proposed_end: meeting.proposed_end,
        reason: rescheduleReason || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Reschedule request sent to the employer");
          setRescheduleDialogId(null);
          setRescheduleReason("");
        },
        onError: () => {
          toast.error("Failed to send reschedule request");
        },
      }
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Interviews</h1>
          <p className="text-sm text-muted-foreground">
            View and manage your upcoming and past interviews
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={view === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("list")}
          >
            <LayoutList className="mr-1.5 h-4 w-4" />
            List
          </Button>
          <Button
            variant={view === "calendar" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("calendar")}
          >
            <CalendarDays className="mr-1.5 h-4 w-4" />
            Calendar
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : meetings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Calendar className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-medium">No interviews scheduled</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              When employers schedule interviews for your applications, they will appear
              here. Keep applying to get more interview opportunities.
            </p>
            <Link href="/jobs" className="mt-4">
              <Button variant="outline">Browse Jobs</Button>
            </Link>
          </CardContent>
        </Card>
      ) : view === "calendar" ? (
        <WeekCalendarView meetings={meetings} />
      ) : (
        <div className="space-y-8">
          {/* Upcoming Interviews */}
          {upcomingMeetings.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Upcoming Interviews</h2>
                <Badge variant="secondary">{upcomingMeetings.length}</Badge>
              </div>
              <div className="space-y-3">
                {upcomingMeetings.map((meeting) => (
                  <InterviewCard
                    key={meeting.id}
                    meeting={meeting}
                    isPast={false}
                    onCancel={setCancelDialogId}
                    onReschedule={setRescheduleDialogId}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Preparation Tips */}
          {upcomingMeetings.length > 0 && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  Quick Preparation Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {upcomingMeetings.slice(0, 2).map((meeting) => (
                    <div key={meeting.id} className="space-y-2">
                      <p className="text-sm font-medium">
                        {interviewTypeLabel(meeting.meeting_type)}: {meeting.title}
                      </p>
                      <ul className="space-y-1">
                        {preparationTips(meeting.meeting_type)
                          .slice(0, 3)
                          .map((tip, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-xs text-muted-foreground"
                            >
                              <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                              {tip}
                            </li>
                          ))}
                      </ul>
                      <Link href={`/candidate/interviews/prep/${meeting.id}`}>
                        <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                          View full preparation guide
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Past Interviews */}
          {pastMeetings.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-muted-foreground">
                  Past Interviews
                </h2>
                <Badge variant="outline">{pastMeetings.length}</Badge>
              </div>
              <div className="space-y-3">
                {pastMeetings.map((meeting) => (
                  <InterviewCard
                    key={meeting.id}
                    meeting={meeting}
                    isPast={true}
                    onCancel={setCancelDialogId}
                    onReschedule={setRescheduleDialogId}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cancel Dialog */}
      <Dialog
        open={!!cancelDialogId}
        onOpenChange={(open) => {
          if (!open) {
            setCancelDialogId(null);
            setCancelReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Interview</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to cancel this interview? The employer will be notified.
          </p>
          <Textarea
            placeholder="Reason for cancellation (optional)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCancelDialogId(null);
                setCancelReason("");
              }}
            >
              Keep Interview
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelConfirm}
              disabled={cancelMeeting.isPending}
            >
              {cancelMeeting.isPending ? "Cancelling..." : "Cancel Interview"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog
        open={!!rescheduleDialogId}
        onOpenChange={(open) => {
          if (!open) {
            setRescheduleDialogId(null);
            setRescheduleReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Reschedule</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Send a reschedule request to the employer. They will propose new available
            times.
          </p>
          <Textarea
            placeholder="Reason for rescheduling (optional but recommended)"
            value={rescheduleReason}
            onChange={(e) => setRescheduleReason(e.target.value)}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRescheduleDialogId(null);
                setRescheduleReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRescheduleConfirm}
              disabled={rescheduleMeeting.isPending}
            >
              {rescheduleMeeting.isPending ? "Sending..." : "Send Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
