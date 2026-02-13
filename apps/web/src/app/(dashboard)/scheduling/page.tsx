"use client";

import { useState } from "react";
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  Phone,
  Plus,
  Check,
  X,
  RotateCcw,
  Users,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  useMeetings,
  useCreateMeeting,
  useAcceptMeeting,
  useDenyMeeting,
  useCancelMeeting,
} from "@/lib/hooks/use-meetings";
import type { MeetingRequest } from "@/lib/hooks/use-meetings";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";

function meetingStatusVariant(status: string) {
  switch (status) {
    case "confirmed":
    case "accepted":
      return "default" as const;
    case "pending":
    case "requested":
      return "secondary" as const;
    case "cancelled":
    case "denied":
      return "destructive" as const;
    case "completed":
      return "outline" as const;
    default:
      return "secondary" as const;
  }
}

function meetingTypeIcon(type: string) {
  switch (type) {
    case "video":
      return <Video className="h-4 w-4 text-blue-600" />;
    case "phone":
      return <Phone className="h-4 w-4 text-emerald-600" />;
    case "in_person":
      return <MapPin className="h-4 w-4 text-amber-600" />;
    default:
      return <Calendar className="h-4 w-4 text-muted-foreground" />;
  }
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(minutes: number | undefined): string {
  if (!minutes) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

function RequestMeetingDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [meetingType, setMeetingType] = useState("video");
  const [participantInput, setParticipantInput] = useState("");
  const [proposedDate, setProposedDate] = useState("");
  const [proposedTime, setProposedTime] = useState("");
  const [duration, setDuration] = useState("30");
  const [location, setLocation] = useState("");
  const createMeeting = useCreateMeeting();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !proposedDate || !proposedTime) return;

    const participantIds = participantInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const startDate = new Date(`${proposedDate}T${proposedTime}`);
    const endDate = new Date(
      startDate.getTime() + Number(duration) * 60 * 1000
    );

    createMeeting.mutate(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        meeting_type: meetingType,
        proposed_start: startDate.toISOString(),
        proposed_end: endDate.toISOString(),
        participant_ids: participantIds,
        location: location.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Meeting request sent");
          setOpen(false);
          setTitle("");
          setDescription("");
          setParticipantInput("");
          setProposedDate("");
          setProposedTime("");
          setDuration("30");
          setLocation("");
        },
        onError: () => toast.error("Failed to create meeting request"),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Request Meeting</DialogTitle>
            <DialogDescription>
              Propose a meeting time with participants.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="mtg-title">Title</Label>
              <Input
                id="mtg-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Technical Interview - Jane Doe"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mtg-desc">
                Description{" "}
                <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="mtg-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mtg-participants">Participant IDs</Label>
              <Input
                id="mtg-participants"
                value={participantInput}
                onChange={(e) => setParticipantInput(e.target.value)}
                placeholder="Comma-separated user IDs"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="mtg-date">Date</Label>
                <Input
                  id="mtg-date"
                  type="date"
                  value={proposedDate}
                  onChange={(e) => setProposedDate(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mtg-time">Time</Label>
                <Input
                  id="mtg-time"
                  type="time"
                  value={proposedTime}
                  onChange={(e) => setProposedTime(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="mtg-duration">Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mtg-type">Type</Label>
                <Select value={meetingType} onValueChange={setMeetingType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video Call</SelectItem>
                    <SelectItem value="phone">Phone Call</SelectItem>
                    <SelectItem value="in_person">In Person</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {meetingType === "in_person" && (
              <div className="grid gap-2">
                <Label htmlFor="mtg-location">Location</Label>
                <Input
                  id="mtg-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Office address or room"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMeeting.isPending}>
              {createMeeting.isPending ? "Sending..." : "Send Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MeetingCard({
  meeting,
  onAccept,
  onDeny,
  onCancel,
}: {
  meeting: MeetingRequest;
  onAccept: (id: string) => void;
  onDeny: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  const isPending =
    meeting.status === "pending" || meeting.status === "requested";
  const isConfirmed =
    meeting.status === "confirmed" || meeting.status === "accepted";
  const isCancelled =
    meeting.status === "cancelled" || meeting.status === "denied";

  const startTime = meeting.confirmed_start || meeting.proposed_start;
  const endTime = meeting.confirmed_end || meeting.proposed_end;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="mt-0.5">{meetingTypeIcon(meeting.meeting_type)}</div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold truncate">
                {meeting.title}
              </h3>
              {meeting.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {meeting.description}
                </p>
              )}
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDateTime(startTime)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTime(startTime)}
                  {endTime && ` - ${formatTime(endTime)}`}
                </span>
                {meeting.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {meeting.location}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Badge variant={meetingStatusVariant(meeting.status)}>
            {meeting.status}
          </Badge>
        </div>

        {/* Actions */}
        {!isCancelled && (
          <div className="flex items-center gap-2 mt-4 pt-3 border-t">
            {isPending && (
              <>
                <Button
                  variant="default"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => onAccept(meeting.id)}
                >
                  <Check className="mr-1 h-3 w-3" />
                  Accept
                </Button>
                <ConfirmDialog
                  title="Deny meeting?"
                  description={`This will decline the meeting request "${meeting.title}".`}
                  actionLabel="Deny"
                  onConfirm={() => onDeny(meeting.id)}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs text-destructive hover:text-destructive"
                  >
                    <X className="mr-1 h-3 w-3" />
                    Deny
                  </Button>
                </ConfirmDialog>
              </>
            )}
            {isConfirmed && (
              <ConfirmDialog
                title="Cancel meeting?"
                description={`This will cancel "${meeting.title}". All participants will be notified.`}
                actionLabel="Cancel Meeting"
                onConfirm={() => onCancel(meeting.id)}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs text-destructive hover:text-destructive"
                >
                  <X className="mr-1 h-3 w-3" />
                  Cancel
                </Button>
              </ConfirmDialog>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MeetingCardSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <Skeleton className="h-5 w-5 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
            <div className="flex gap-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function SchedulingPage() {
  const [activeTab, setActiveTab] = useState("upcoming");

  const statusMap: Record<string, string | undefined> = {
    upcoming: "confirmed",
    pending: "pending",
    past: "completed",
  };

  const { data, isLoading, isError } = useMeetings({
    per_page: 50,
    status: statusMap[activeTab],
  });

  const acceptMeeting = useAcceptMeeting();
  const denyMeeting = useDenyMeeting();
  const cancelMeeting = useCancelMeeting();

  const meetings = data?.data ?? [];

  function handleAccept(id: string) {
    acceptMeeting.mutate(id, {
      onSuccess: () => toast.success("Meeting accepted"),
      onError: () => toast.error("Failed to accept meeting"),
    });
  }

  function handleDeny(id: string) {
    denyMeeting.mutate(
      { id },
      {
        onSuccess: () => toast.success("Meeting denied"),
        onError: () => toast.error("Failed to deny meeting"),
      }
    );
  }

  function handleCancel(id: string) {
    cancelMeeting.mutate(
      { id },
      {
        onSuccess: () => toast.success("Meeting cancelled"),
        onError: () => toast.error("Failed to cancel meeting"),
      }
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Scheduling</h1>
          <p className="text-muted-foreground">
            Manage meeting requests and interviews
          </p>
        </div>
        <RequestMeetingDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Request Meeting
          </Button>
        </RequestMeetingDialog>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <MeetingCardSkeleton key={i} />
              ))}
            </div>
          ) : isError ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <p className="text-sm text-destructive">
                    Failed to load meetings. Make sure the backend is running.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : meetings.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <Calendar className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1">
                    {activeTab === "upcoming"
                      ? "No upcoming meetings"
                      : activeTab === "pending"
                      ? "No pending requests"
                      : "No past meetings"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                    {activeTab === "upcoming"
                      ? "Your confirmed meetings will appear here."
                      : activeTab === "pending"
                      ? "Meeting requests awaiting response will show up here."
                      : "Completed meetings will be listed here for reference."}
                  </p>
                  {activeTab !== "past" && (
                    <RequestMeetingDialog>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Request Meeting
                      </Button>
                    </RequestMeetingDialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {meetings.map((meeting) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  onAccept={handleAccept}
                  onDeny={handleDeny}
                  onCancel={handleCancel}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
