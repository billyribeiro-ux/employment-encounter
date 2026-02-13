"use client";

import { useState, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Phone,
  Code,
  Building2,
  CheckCircle2,
  Video,
  MapPin,
  Filter,
  X,
  RefreshCw,
  CalendarCheck,
  CalendarX,
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
import { Separator } from "@/components/ui/separator";
import { useMeetings, useCancelMeeting } from "@/lib/hooks/use-meetings";
import { useApplications } from "@/lib/hooks/use-applications";
import { useJobs } from "@/lib/hooks/use-jobs";
import { toast } from "sonner";

const INTERVIEW_TYPE_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: React.ReactNode }
> = {
  phone_screen: {
    label: "Phone Screen",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: <Phone className="h-3 w-3" />,
  },
  technical: {
    label: "Technical",
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
    icon: <Code className="h-3 w-3" />,
  },
  onsite: {
    label: "Onsite",
    color: "text-orange-700",
    bg: "bg-orange-50",
    border: "border-orange-200",
    icon: <Building2 className="h-3 w-3" />,
  },
  final: {
    label: "Final",
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-200",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
};

function getTypeConfig(meetingType: string) {
  return (
    INTERVIEW_TYPE_CONFIG[meetingType] ?? {
      label: meetingType || "Interview",
      color: "text-gray-700",
      bg: "bg-gray-50",
      border: "border-gray-200",
      icon: <Video className="h-3 w-3" />,
    }
  );
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [jobFilter, setJobFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: meetingsData, isLoading } = useMeetings({
    page: 1,
    per_page: 200,
    meeting_type: typeFilter !== "all" ? typeFilter : undefined,
    job_id: jobFilter !== "all" ? jobFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });
  const cancelMeeting = useCancelMeeting();

  const { data: jobsData } = useJobs({ page: 1, per_page: 100, status: "published" });
  const jobs = jobsData?.data ?? [];
  const meetings = meetingsData?.data ?? [];

  const meetingsByDay = useMemo(() => {
    const map: Record<string, typeof meetings> = {};
    meetings.forEach((m) => {
      const startDate = new Date(m.proposed_start);
      if (
        startDate.getFullYear() === currentYear &&
        startDate.getMonth() === currentMonth
      ) {
        const day = startDate.getDate();
        const key = String(day);
        if (!map[key]) map[key] = [];
        map[key].push(m);
      }
    });
    return map;
  }, [meetings, currentYear, currentMonth]);

  const todaysMeetings = useMemo(() => {
    const now = new Date();
    return meetings
      .filter((m) => {
        const d = new Date(m.proposed_start);
        return (
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth() &&
          d.getDate() === now.getDate()
        );
      })
      .sort(
        (a, b) =>
          new Date(a.proposed_start).getTime() -
          new Date(b.proposed_start).getTime()
      );
  }, [meetings]);

  const selectedDayMeetings = useMemo(() => {
    if (selectedDay === null) return [];
    return (meetingsByDay[String(selectedDay)] ?? []).sort(
      (a, b) =>
        new Date(a.proposed_start).getTime() -
        new Date(b.proposed_start).getTime()
    );
  }, [meetingsByDay, selectedDay]);

  const upcomingMeetings = useMemo(() => {
    const now = new Date();
    return meetings
      .filter(
        (m) =>
          new Date(m.proposed_start) >= now &&
          (m.status === "pending" || m.status === "confirmed" || m.status === "accepted")
      )
      .sort(
        (a, b) =>
          new Date(a.proposed_start).getTime() -
          new Date(b.proposed_start).getTime()
      )
      .slice(0, 8);
  }, [meetings]);

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDay(null);
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDay(null);
  }

  function goToToday() {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDay(now.getDate());
  }

  function handleCancel(id: string) {
    cancelMeeting.mutate(
      { id, reason: "Cancelled via calendar" },
      {
        onSuccess: () => toast.success("Interview cancelled"),
        onError: () => toast.error("Failed to cancel interview"),
      }
    );
  }

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const isCurrentMonth =
    currentYear === today.getFullYear() && currentMonth === today.getMonth();

  const hasActiveFilters =
    typeFilter !== "all" || jobFilter !== "all" || statusFilter !== "all";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Interview Calendar
          </h1>
          <p className="text-muted-foreground">
            Schedule and manage candidate interviews
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="gap-1.5 text-xs">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              Google Calendar
            </Badge>
            <Badge variant="outline" className="gap-1.5 text-xs">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              Outlook Sync
            </Badge>
          </div>
          <Button onClick={goToToday} variant="outline" size="sm">
            Today
          </Button>
        </div>
      </div>

      {todaysMeetings.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Today&apos;s Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
              <div className="space-y-3 pl-8">
                {todaysMeetings.map((m) => {
                  const cfg = getTypeConfig(m.meeting_type);
                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="relative"
                    >
                      <div
                        className={`absolute -left-[1.4rem] top-1.5 h-2.5 w-2.5 rounded-full ${cfg.bg} border-2 ${cfg.border}`}
                      />
                      <div
                        className={`rounded-md border ${cfg.border} ${cfg.bg} p-2.5`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium ${cfg.color}`}>
                              {formatTime(m.proposed_start)} -{" "}
                              {formatTime(m.proposed_end)}
                            </span>
                            <span className="text-sm font-medium">
                              {m.title}
                            </span>
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${cfg.color} ${cfg.bg} ${cfg.border}`}
                          >
                            {cfg.icon}
                            <span className="ml-1">{cfg.label}</span>
                          </Badge>
                        </div>
                        {m.location && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {m.location}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <Select
          value={typeFilter}
          onValueChange={setTypeFilter}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Interview Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="phone_screen">Phone Screen</SelectItem>
            <SelectItem value="technical">Technical</SelectItem>
            <SelectItem value="onsite">Onsite</SelectItem>
            <SelectItem value="final">Final</SelectItem>
          </SelectContent>
        </Select>
        <Select value={jobFilter} onValueChange={setJobFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Job" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Jobs</SelectItem>
            {jobs.map((j) => (
              <SelectItem key={j.id} value={j.id}>
                {j.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-muted-foreground"
            onClick={() => {
              setTypeFilter("all");
              setJobFilter("all");
              setStatusFilter("all");
            }}
          >
            <X className="mr-1 h-3 w-3" />
            Clear Filters
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={prevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-lg font-semibold min-w-[180px] text-center">
                  {MONTH_NAMES[currentMonth]} {currentYear}
                </h2>
                <Button variant="ghost" size="icon" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {Object.entries(INTERVIEW_TYPE_CONFIG).map(([key, cfg]) => (
                  <div key={key} className="flex items-center gap-1">
                    <div
                      className={`h-2.5 w-2.5 rounded-full ${cfg.bg} border ${cfg.border}`}
                    />
                    <span>{cfg.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-7 gap-px bg-border rounded-t-md overflow-hidden">
                  {DAY_NAMES.map((d) => (
                    <div
                      key={d}
                      className="bg-muted/50 py-2 text-center text-xs font-medium text-muted-foreground"
                    >
                      {d}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-px bg-border rounded-b-md overflow-hidden">
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="bg-background min-h-[80px]" />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dayMeetings = meetingsByDay[String(day)] ?? [];
                    const isToday =
                      isCurrentMonth && day === today.getDate();
                    const isSelected = selectedDay === day;

                    return (
                      <div
                        key={day}
                        className={`bg-background min-h-[80px] p-1 cursor-pointer transition-colors hover:bg-muted/30 ${
                          isSelected ? "ring-2 ring-primary ring-inset" : ""
                        }`}
                        onClick={() => setSelectedDay(day)}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span
                            className={`text-xs font-medium inline-flex items-center justify-center ${
                              isToday
                                ? "bg-primary text-primary-foreground rounded-full h-5 w-5"
                                : "text-muted-foreground h-5 w-5"
                            }`}
                          >
                            {day}
                          </span>
                          {dayMeetings.length > 0 && (
                            <span className="text-[10px] text-muted-foreground">
                              {dayMeetings.length}
                            </span>
                          )}
                        </div>
                        <div className="space-y-0.5">
                          {dayMeetings.slice(0, 3).map((m) => {
                            const cfg = getTypeConfig(m.meeting_type);
                            return (
                              <div
                                key={m.id}
                                className={`text-[10px] px-1 py-0.5 rounded truncate ${cfg.bg} ${cfg.color} ${cfg.border} border`}
                              >
                                {formatTime(m.proposed_start)}{" "}
                                {m.title.length > 12
                                  ? m.title.slice(0, 12) + "..."
                                  : m.title}
                              </div>
                            );
                          })}
                          {dayMeetings.length > 3 && (
                            <div className="text-[10px] text-muted-foreground text-center">
                              +{dayMeetings.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {selectedDay !== null && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  {MONTH_NAMES[currentMonth]} {selectedDay}, {currentYear}
                  <span className="ml-2 text-muted-foreground font-normal">
                    ({selectedDayMeetings.length} interview
                    {selectedDayMeetings.length !== 1 ? "s" : ""})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AnimatePresence mode="wait">
                  {selectedDayMeetings.length === 0 ? (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center py-6"
                    >
                      <CalendarIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        No interviews scheduled
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="list"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-2"
                    >
                      {selectedDayMeetings.map((m) => {
                        const cfg = getTypeConfig(m.meeting_type);
                        return (
                          <div
                            key={m.id}
                            className={`rounded-md border ${cfg.border} p-2.5`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {m.title}
                                </p>
                                <p
                                  className={`text-xs ${cfg.color} flex items-center gap-1 mt-0.5`}
                                >
                                  {cfg.icon}
                                  {cfg.label}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {formatTime(m.proposed_start)} -{" "}
                                  {formatTime(m.proposed_end)}
                                </p>
                                {m.location && (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                    <MapPin className="h-3 w-3" />
                                    {m.location}
                                  </p>
                                )}
                              </div>
                              <Badge
                                variant={
                                  m.status === "confirmed" || m.status === "accepted"
                                    ? "default"
                                    : m.status === "cancelled"
                                      ? "destructive"
                                      : "secondary"
                                }
                                className="text-[10px] shrink-0"
                              >
                                {m.status}
                              </Badge>
                            </div>
                            {m.status !== "cancelled" &&
                              m.status !== "completed" && (
                                <div className="flex gap-1 mt-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 text-[10px] px-2 text-orange-600 hover:text-orange-700"
                                  >
                                    <RefreshCw className="mr-1 h-2.5 w-2.5" />
                                    Reschedule
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 text-[10px] px-2 text-destructive hover:text-destructive"
                                    onClick={() => handleCancel(m.id)}
                                    disabled={cancelMeeting.isPending}
                                  >
                                    <CalendarX className="mr-1 h-2.5 w-2.5" />
                                    Cancel
                                  </Button>
                                </div>
                              )}
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CalendarCheck className="h-4 w-4" />
                Upcoming Interviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-14" />
                  ))}
                </div>
              ) : upcomingMeetings.length === 0 ? (
                <div className="text-center py-6">
                  <CalendarIcon className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">
                    No upcoming interviews
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingMeetings.map((m) => {
                    const cfg = getTypeConfig(m.meeting_type);
                    return (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`rounded-md border p-2 hover:bg-muted/30 transition-colors cursor-pointer`}
                        onClick={() => {
                          const d = new Date(m.proposed_start);
                          setCurrentYear(d.getFullYear());
                          setCurrentMonth(d.getMonth());
                          setSelectedDay(d.getDate());
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-2 w-2 rounded-full ${cfg.bg} border ${cfg.border} shrink-0`}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium truncate">
                              {m.title}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {formatDateShort(m.proposed_start)},{" "}
                              {formatTime(m.proposed_start)}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${cfg.color} shrink-0`}
                          >
                            {cfg.label}
                          </Badge>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Schedule Interview
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                size="sm"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Reschedule Interview
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:text-destructive"
                size="sm"
              >
                <CalendarX className="mr-2 h-4 w-4" />
                Cancel Interview
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
