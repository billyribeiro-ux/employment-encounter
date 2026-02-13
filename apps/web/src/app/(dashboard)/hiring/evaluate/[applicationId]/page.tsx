"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Star,
  Plus,
  Trash2,
  Edit2,
  MapPin,
  Linkedin,
  Github,
  Globe,
  ExternalLink,
  ClipboardCheck,
  StickyNote,
  Clock,
  FileText,
  ArrowRight,
  Send,
  X,
  Heart,
  ChevronRight,
  Calendar,
  Gavel,
  MessageSquare,
  CheckCircle2,
  XCircle,
  PauseCircle,
  BarChart3,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { OfferDialog } from "@/components/dashboard/offer-dialog";
import { useApplication, useAdvanceStage, useRejectApplication, useStageHistory } from "@/lib/hooks/use-applications";
import { useCandidate } from "@/lib/hooks/use-candidates";
import {
  useApplicationScorecards,
  useCreateScorecard,
  useDeleteScorecard,
  useScorecardSummary,
  useDecisionRecords,
  useCreateDecision,
} from "@/lib/hooks/use-scorecards";
import type { Scorecard } from "@/lib/hooks/use-scorecards";
import {
  useCandidateNotes,
  useCreateCandidateNote,
  useUpdateCandidateNote,
  useDeleteCandidateNote,
} from "@/lib/hooks/use-candidate-notes";
import type { CandidateNote } from "@/lib/hooks/use-candidate-notes";
import { useIsFavorite, useAddFavorite, useRemoveFavorite } from "@/lib/hooks/use-favorites";
import { toast } from "sonner";

const PIPELINE_STAGES = [
  { id: "applied", label: "Applied" },
  { id: "screening", label: "Screening" },
  { id: "phone_screen", label: "Phone Screen" },
  { id: "technical", label: "Technical" },
  { id: "onsite", label: "Onsite" },
  { id: "offer", label: "Offer" },
];

const SCORE_CATEGORIES = [
  "Technical",
  "Cultural Fit",
  "Experience",
  "Communication",
  "Leadership",
  "Problem Solving",
];

const RECOMMENDATIONS = [
  "Strong Hire",
  "Hire",
  "No Hire",
  "Strong No Hire",
];

const WEIGHT_OPTIONS = [
  { value: 1, label: "Low" },
  { value: 2, label: "Medium" },
  { value: 3, label: "High" },
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function recommendationVariant(rec: string | null) {
  switch (rec) {
    case "Strong Hire":
      return "default" as const;
    case "Hire":
      return "default" as const;
    case "No Hire":
      return "destructive" as const;
    case "Strong No Hire":
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
}

function noteTypeBadge(noteType: string) {
  switch (noteType) {
    case "interview":
      return "default" as const;
    case "feedback":
      return "secondary" as const;
    case "general":
      return "outline" as const;
    default:
      return "outline" as const;
  }
}

// --- Star Rating Component ---

function StarRating({
  value,
  onChange,
  readonly = false,
}: {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
}) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          className={`${
            readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
          } transition-transform`}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          onClick={() => onChange?.(star)}
        >
          <Star
            className={`h-5 w-5 ${
              star <= (hovered || value)
                ? "text-amber-500 fill-amber-500"
                : "text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// --- Add Evaluation Dialog ---

function AddEvaluationDialog({
  applicationId,
  children,
}: {
  applicationId: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState(SCORE_CATEGORIES[0]);
  const [criteria, setCriteria] = useState("");
  const [score, setScore] = useState(0);
  const [weight, setWeight] = useState(2);
  const [notes, setNotes] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const createScorecard = useCreateScorecard();

  function resetForm() {
    setCategory(SCORE_CATEGORIES[0]);
    setCriteria("");
    setScore(0);
    setWeight(2);
    setNotes("");
    setRecommendation("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!criteria.trim() || score === 0) {
      toast.error("Please fill in criteria and select a score");
      return;
    }
    createScorecard.mutate(
      {
        application_id: applicationId,
        category,
        criteria: criteria.trim(),
        score,
        weight,
        notes: notes.trim() || undefined,
        recommendation: recommendation || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Evaluation added");
          setOpen(false);
          resetForm();
        },
        onError: () => toast.error("Failed to add evaluation"),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Evaluation</DialogTitle>
            <DialogDescription>
              Score this candidate on specific criteria.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCORE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="eval-criteria">Criteria</Label>
              <Input
                id="eval-criteria"
                value={criteria}
                onChange={(e) => setCriteria(e.target.value)}
                placeholder="e.g. React proficiency, System design"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label>Score (1-5)</Label>
              <StarRating value={score} onChange={setScore} />
            </div>

            <div className="grid gap-2">
              <Label>Weight</Label>
              <Select
                value={String(weight)}
                onValueChange={(v) => setWeight(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEIGHT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label} ({opt.value})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="eval-notes">Notes</Label>
              <Textarea
                id="eval-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional observations..."
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label>Recommendation</Label>
              <Select value={recommendation} onValueChange={setRecommendation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select recommendation" />
                </SelectTrigger>
                <SelectContent>
                  {RECOMMENDATIONS.map((rec) => (
                    <SelectItem key={rec} value={rec}>
                      {rec}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createScorecard.isPending}>
              {createScorecard.isPending ? "Saving..." : "Add Evaluation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- Scorecards Tab Content ---

function ScorecardsTabContent({ applicationId }: { applicationId: string }) {
  const { data: scorecards, isLoading } =
    useApplicationScorecards(applicationId);
  const deleteScorecard = useDeleteScorecard(applicationId);

  const allScorecards = scorecards ?? [];

  const grouped = allScorecards.reduce<Record<string, Scorecard[]>>(
    (acc, sc) => {
      if (!acc[sc.category]) acc[sc.category] = [];
      acc[sc.category].push(sc);
      return acc;
    },
    {}
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          Evaluations ({allScorecards.length})
        </h3>
        <AddEvaluationDialog applicationId={applicationId}>
          <Button size="sm">
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add Evaluation
          </Button>
        </AddEvaluationDialog>
      </div>

      {allScorecards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <ClipboardCheck className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            No evaluations yet. Add the first scorecard for this candidate.
          </p>
        </div>
      ) : (
        Object.entries(grouped).map(([category, items]) => (
          <Card key={category}>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm">{category}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0">
              <div className="space-y-3">
                {items.map((sc) => (
                  <div
                    key={sc.id}
                    className="flex items-start justify-between rounded-md border p-3 group"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{sc.criteria}</p>
                        {sc.recommendation && (
                          <Badge
                            variant={recommendationVariant(sc.recommendation)}
                            className="text-[10px]"
                          >
                            {sc.recommendation}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <StarRating value={sc.score} readonly />
                        <span className="text-[10px] text-muted-foreground">
                          Weight:{" "}
                          {
                            WEIGHT_OPTIONS.find((w) => w.value === sc.weight)
                              ?.label ?? sc.weight
                          }
                        </span>
                      </div>
                      {sc.notes && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {sc.notes}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {sc.evaluator_name || "Evaluator"} &middot;{" "}
                        {formatDate(sc.created_at)}
                      </p>
                    </div>
                    <ConfirmDialog
                      title="Delete evaluation?"
                      description="This will permanently delete this scorecard entry."
                      actionLabel="Delete"
                      onConfirm={() =>
                        deleteScorecard.mutate(sc.id, {
                          onSuccess: () => toast.success("Evaluation deleted"),
                          onError: () =>
                            toast.error("Failed to delete evaluation"),
                        })
                      }
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                        disabled={deleteScorecard.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </ConfirmDialog>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

// --- Notes Tab Content ---

function NotesTabContent({
  candidateId,
  applicationId,
}: {
  candidateId: string;
  applicationId: string;
}) {
  const { data: notes, isLoading } = useCandidateNotes(candidateId);
  const createNote = useCreateCandidateNote(candidateId);
  const updateNote = useUpdateCandidateNote(candidateId);
  const deleteNote = useDeleteCandidateNote(candidateId);

  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteType, setNewNoteType] = useState("general");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const allNotes = notes ?? [];

  function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!newNoteContent.trim()) return;
    createNote.mutate(
      {
        content: newNoteContent.trim(),
        application_id: applicationId,
        note_type: newNoteType,
      },
      {
        onSuccess: () => {
          toast.success("Note added");
          setNewNoteContent("");
          setNewNoteType("general");
        },
        onError: () => toast.error("Failed to add note"),
      }
    );
  }

  function handleUpdateNote(noteId: string) {
    if (!editContent.trim()) return;
    updateNote.mutate(
      { id: noteId, content: editContent.trim() },
      {
        onSuccess: () => {
          toast.success("Note updated");
          setEditingId(null);
          setEditContent("");
        },
        onError: () => toast.error("Failed to update note"),
      }
    );
  }

  function startEditing(note: CandidateNote) {
    setEditingId(note.id);
    setEditContent(note.content);
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleAddNote} className="space-y-3">
        <div className="flex items-center gap-2">
          <Select value={newNoteType} onValueChange={setNewNoteType}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="interview">Interview</SelectItem>
              <SelectItem value="feedback">Feedback</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">Type</span>
        </div>
        <Textarea
          value={newNoteContent}
          onChange={(e) => setNewNoteContent(e.target.value)}
          placeholder="Add a note about this candidate..."
          rows={3}
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            size="sm"
            disabled={!newNoteContent.trim() || createNote.isPending}
          >
            {createNote.isPending ? "Adding..." : "Add Note"}
          </Button>
        </div>
      </form>

      <Separator />

      {allNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <StickyNote className="h-8 w-8 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            No notes yet. Add the first note above.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {allNotes.map((note) => (
            <div
              key={note.id}
              className="rounded-md border p-3 group hover:bg-muted/30"
            >
              {editingId === note.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleUpdateNote(note.id)}
                      disabled={updateNote.isPending}
                    >
                      {updateNote.isPending ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px]">
                          {(note.author_name || "U").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium">
                        {note.author_name || "Unknown"}
                      </span>
                      <Badge
                        variant={noteTypeBadge(note.note_type)}
                        className="text-[10px]"
                      >
                        {note.note_type}
                      </Badge>
                      {note.is_private && (
                        <Badge variant="outline" className="text-[10px]">
                          Private
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground"
                        onClick={() => startEditing(note)}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <ConfirmDialog
                        title="Delete note?"
                        description="This will permanently delete this note."
                        actionLabel="Delete"
                        onConfirm={() =>
                          deleteNote.mutate(note.id, {
                            onSuccess: () => toast.success("Note deleted"),
                            onError: () =>
                              toast.error("Failed to delete note"),
                          })
                        }
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          disabled={deleteNote.isPending}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </ConfirmDialog>
                    </div>
                  </div>
                  <p className="text-sm mt-2 whitespace-pre-wrap">
                    {note.content}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-2">
                    {formatDateTime(note.created_at)}
                    {note.updated_at !== note.created_at && " (edited)"}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Timeline Tab Content ---

function TimelineTabContent({ applicationId }: { applicationId: string }) {
  const { data: history, isLoading } = useStageHistory(applicationId);
  const { data: scorecards } = useApplicationScorecards(applicationId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  const stageEvents = (history ?? []).map((event) => ({
    type: "stage" as const,
    date: event.created_at,
    data: event,
  }));

  const scorecardEvents = (scorecards ?? []).map((sc) => ({
    type: "scorecard" as const,
    date: sc.created_at,
    data: sc,
  }));

  const allEvents = [...stageEvents, ...scorecardEvents].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  if (allEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Clock className="h-8 w-8 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">
          No timeline events yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {allEvents.map((event, index) => (
        <div key={`${event.type}-${index}`} className="flex gap-3 pb-4">
          <div className="flex flex-col items-center">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                event.type === "stage"
                  ? "bg-blue-100 text-blue-600"
                  : "bg-amber-100 text-amber-600"
              }`}
            >
              {event.type === "stage" ? (
                <ArrowRight className="h-4 w-4" />
              ) : (
                <Star className="h-4 w-4" />
              )}
            </div>
            {index < allEvents.length - 1 && (
              <div className="w-px flex-1 bg-border mt-1" />
            )}
          </div>
          <div className="flex-1 pb-2">
            {event.type === "stage" ? (
              <>
                <p className="text-sm font-medium">
                  {event.data.from_stage
                    ? `Moved from ${event.data.from_stage.replace(/_/g, " ")} to ${event.data.to_stage.replace(/_/g, " ")}`
                    : `Application submitted (${event.data.to_stage.replace(/_/g, " ")})`}
                </p>
                {event.data.notes && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {event.data.notes}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-sm font-medium">
                  Evaluation added: {event.data.category} - {event.data.criteria}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <StarRating value={event.data.score} readonly />
                  {event.data.recommendation && (
                    <Badge
                      variant={recommendationVariant(event.data.recommendation)}
                      className="text-[10px]"
                    >
                      {event.data.recommendation}
                    </Badge>
                  )}
                </div>
              </>
            )}
            <p className="text-[10px] text-muted-foreground mt-1">
              {formatDateTime(event.date)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Documents Tab Content ---

function DocumentsTabContent({ application }: { application: { cover_letter: string | null; resume_s3_key: string | null } }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Resume
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          {application.resume_s3_key ? (
            <div className="flex items-center justify-between rounded-md border p-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">resume.pdf</span>
              </div>
              <Button variant="outline" size="sm">
                <ExternalLink className="mr-1 h-3 w-3" />
                View
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-3 text-center">
              No resume uploaded.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Cover Letter
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          {application.cover_letter ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {application.cover_letter}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground py-3 text-center">
              No cover letter provided.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// --- Score Summary Card ---

function ScoreSummaryCard({ applicationId }: { applicationId: string }) {
  const { data: summary, isLoading } = useScorecardSummary(applicationId);
  const { data: scorecards } = useApplicationScorecards(applicationId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-16 w-full mb-4" />
          <Skeleton className="h-8 w-full mb-2" />
          <Skeleton className="h-8 w-full mb-2" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    );
  }

  const allScorecards = scorecards ?? [];
  const avgScore = summary?.avg_score ?? 0;
  const totalEvals = summary?.total_evaluations ?? allScorecards.length;
  const categories = summary?.by_category ?? [];
  const recommendations = summary?.recommendations ?? [];

  // Fallback calculation if summary endpoint is not available
  const computedAvg =
    allScorecards.length > 0
      ? allScorecards.reduce((sum, sc) => sum + sc.score, 0) /
        allScorecards.length
      : 0;
  const displayAvg = avgScore || computedAvg;

  // Compute category averages from scorecards as fallback
  const categoryMap = allScorecards.reduce<
    Record<string, { total: number; count: number }>
  >((acc, sc) => {
    if (!acc[sc.category]) acc[sc.category] = { total: 0, count: 0 };
    acc[sc.category].total += sc.score;
    acc[sc.category].count += 1;
    return acc;
  }, {});

  const displayCategories =
    categories.length > 0
      ? categories
      : Object.entries(categoryMap).map(([category, { total, count }]) => ({
          category,
          avg_score: total / count,
          count,
        }));

  // Compute recommendation tally from scorecards as fallback
  const recMap = allScorecards.reduce<Record<string, number>>((acc, sc) => {
    if (sc.recommendation) {
      acc[sc.recommendation] = (acc[sc.recommendation] || 0) + 1;
    }
    return acc;
  }, {});

  const displayRecommendations =
    recommendations.length > 0
      ? recommendations
      : Object.entries(recMap).map(([recommendation, count]) => ({
          recommendation,
          count,
        }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Score Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-4">
          <div className="text-4xl font-bold text-amber-500">
            {displayAvg > 0 ? displayAvg.toFixed(1) : "--"}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Average Score &middot; {totalEvals || allScorecards.length}{" "}
            evaluation{(totalEvals || allScorecards.length) !== 1 ? "s" : ""}
          </p>
        </div>

        {displayCategories.length > 0 && (
          <div className="space-y-2 mb-4">
            <p className="text-xs font-medium text-muted-foreground">
              By Category
            </p>
            {displayCategories.map((cat) => (
              <div key={cat.category} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span>{cat.category}</span>
                  <span className="font-medium">
                    {cat.avg_score.toFixed(1)}/5
                  </span>
                </div>
                <Progress
                  value={(cat.avg_score / 5) * 100}
                  className="h-1.5"
                />
              </div>
            ))}
          </div>
        )}

        {displayRecommendations.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Recommendations
            </p>
            <div className="flex flex-wrap gap-1">
              {displayRecommendations.map((rec) => (
                <Badge
                  key={rec.recommendation}
                  variant={recommendationVariant(rec.recommendation)}
                  className="text-[10px]"
                >
                  {rec.recommendation} ({rec.count})
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- Decision Card ---

function DecisionCard({ applicationId }: { applicationId: string }) {
  const { data: decisions, isLoading } = useDecisionRecords(applicationId);
  const createDecision = useCreateDecision();
  const [showForm, setShowForm] = useState(false);
  const [decision, setDecision] = useState("");
  const [reasoning, setReasoning] = useState("");

  const allDecisions = decisions ?? [];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!decision) {
      toast.error("Please select a decision");
      return;
    }
    createDecision.mutate(
      {
        application_id: applicationId,
        decision,
        reasoning: reasoning.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success("Decision recorded");
          setShowForm(false);
          setDecision("");
          setReasoning("");
        },
        onError: () => toast.error("Failed to record decision"),
      }
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Gavel className="h-4 w-4" />
          Hiring Decision
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!showForm ? (
          <Button
            className="w-full"
            onClick={() => setShowForm(true)}
          >
            <Gavel className="mr-2 h-4 w-4" />
            Make Hiring Decision
          </Button>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid gap-2">
              <Label className="text-xs">Decision</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={decision === "hire" ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setDecision("hire")}
                >
                  <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                  Hire
                </Button>
                <Button
                  type="button"
                  variant={decision === "hold" ? "secondary" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setDecision("hold")}
                >
                  <PauseCircle className="mr-1 h-3.5 w-3.5" />
                  Hold
                </Button>
                <Button
                  type="button"
                  variant={decision === "reject" ? "destructive" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => setDecision("reject")}
                >
                  <XCircle className="mr-1 h-3.5 w-3.5" />
                  Reject
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="decision-reasoning" className="text-xs">
                Reasoning
              </Label>
              <Textarea
                id="decision-reasoning"
                value={reasoning}
                onChange={(e) => setReasoning(e.target.value)}
                placeholder="Why this decision?"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  setShowForm(false);
                  setDecision("");
                  setReasoning("");
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="flex-1"
                disabled={createDecision.isPending || !decision}
              >
                {createDecision.isPending ? "Recording..." : "Record Decision"}
              </Button>
            </div>
          </form>
        )}

        {allDecisions.length > 0 && (
          <div className="mt-4 space-y-2">
            <Separator />
            <p className="text-xs font-medium text-muted-foreground pt-1">
              Previous Decisions
            </p>
            {allDecisions.map((d) => (
              <div key={d.id} className="rounded-md border p-2">
                <div className="flex items-center justify-between">
                  <Badge
                    variant={
                      d.decision === "hire"
                        ? "default"
                        : d.decision === "reject"
                        ? "destructive"
                        : "secondary"
                    }
                    className="text-[10px]"
                  >
                    {d.decision}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDate(d.created_at)}
                  </span>
                </div>
                {d.reasoning && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {d.reasoning}
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground mt-1">
                  By {d.decided_by_name || "Unknown"}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- Main Page ---

export default function EvaluationDetailPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = use(params);
  const {
    data: application,
    isLoading: appLoading,
    isError: appError,
  } = useApplication(applicationId);

  const candidateId = application?.candidate_id ?? "";
  const { data: candidate } = useCandidate(candidateId);

  const { data: favoriteStatus } = useIsFavorite(candidateId);
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();
  const advanceStage = useAdvanceStage();
  const rejectApplication = useRejectApplication();

  const isFavorited = favoriteStatus?.is_favorite ?? false;
  const favoriteId = favoriteStatus?.favorite_id ?? null;

  function handleToggleFavorite() {
    if (isFavorited && favoriteId) {
      removeFavorite.mutate(favoriteId, {
        onSuccess: () => toast.success("Removed from shortlist"),
        onError: () => toast.error("Failed to update shortlist"),
      });
    } else {
      addFavorite.mutate(
        { candidate_id: candidateId },
        {
          onSuccess: () => toast.success("Added to shortlist"),
          onError: () => toast.error("Failed to update shortlist"),
        }
      );
    }
  }

  function getNextStage() {
    if (!application) return null;
    const currentIndex = PIPELINE_STAGES.findIndex(
      (s) => s.id === application.stage
    );
    if (currentIndex < 0 || currentIndex >= PIPELINE_STAGES.length - 1)
      return null;
    return PIPELINE_STAGES[currentIndex + 1];
  }

  function handleAdvance() {
    const nextStage = getNextStage();
    if (!nextStage || !application) return;
    advanceStage.mutate(
      { id: application.id, to_stage: nextStage.id },
      {
        onSuccess: () => toast.success(`Advanced to ${nextStage.label}`),
        onError: () => toast.error("Failed to advance candidate"),
      }
    );
  }

  function handleReject() {
    if (!application) return;
    rejectApplication.mutate(
      { id: application.id },
      {
        onSuccess: () => toast.success("Candidate rejected"),
        onError: () => toast.error("Failed to reject candidate"),
      }
    );
  }

  if (appLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-48" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-7 w-56 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <Skeleton className="h-96" />
          </div>
          <div className="lg:col-span-2">
            <Skeleton className="h-64 mb-4" />
            <Skeleton className="h-48 mb-4" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  if (appError || !application) {
    return (
      <div className="space-y-4">
        <Link href="/hiring/evaluate">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Evaluation Center
          </Button>
        </Link>
        <div className="text-center py-12">
          <p className="text-sm text-destructive">
            Application not found or failed to load.
          </p>
        </div>
      </div>
    );
  }

  const nextStage = getNextStage();
  const location = candidate
    ? [candidate.location_city, candidate.location_state, candidate.location_country]
        .filter(Boolean)
        .join(", ")
    : null;

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Hiring", href: "/hiring" },
          { label: "Evaluate", href: "/hiring/evaluate" },
          { label: application.candidate_name || "Candidate" },
        ]}
      />

      {/* Candidate Profile Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-lg font-bold">
          {(application.candidate_name || "?").charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">
              {application.candidate_name || "Unknown Candidate"}
            </h1>
            <Badge variant="outline">
              {application.stage.replace(/_/g, " ")}
            </Badge>
            {application.status === "rejected" && (
              <Badge variant="destructive">Rejected</Badge>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
            {application.candidate_headline && (
              <span>{application.candidate_headline}</span>
            )}
            {location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {location}
              </span>
            )}
            {application.job_title && (
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                Applied for: {application.job_title}
              </span>
            )}
          </div>
          {candidate && (
            <div className="flex items-center gap-3 mt-2">
              {candidate.linkedin_url && (
                <a
                  href={candidate.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
              )}
              {candidate.github_url && (
                <a
                  href={candidate.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Github className="h-4 w-4" />
                </a>
              )}
              {candidate.portfolio_url && (
                <a
                  href={candidate.portfolio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:underline"
                >
                  <Globe className="h-4 w-4" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left Column - 60% */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="scorecards" className="space-y-4">
            <TabsList>
              <TabsTrigger value="scorecards" className="gap-1.5">
                <ClipboardCheck className="h-3.5 w-3.5" />
                Scorecards
              </TabsTrigger>
              <TabsTrigger value="notes" className="gap-1.5">
                <StickyNote className="h-3.5 w-3.5" />
                Notes
              </TabsTrigger>
              <TabsTrigger value="timeline" className="gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="documents" className="gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                Documents
              </TabsTrigger>
            </TabsList>

            <TabsContent value="scorecards">
              <ScorecardsTabContent applicationId={applicationId} />
            </TabsContent>

            <TabsContent value="notes">
              <NotesTabContent
                candidateId={candidateId}
                applicationId={applicationId}
              />
            </TabsContent>

            <TabsContent value="timeline">
              <TimelineTabContent applicationId={applicationId} />
            </TabsContent>

            <TabsContent value="documents">
              <DocumentsTabContent application={application} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - 40% */}
        <div className="lg:col-span-2 space-y-4">
          {/* Score Summary */}
          <ScoreSummaryCard applicationId={applicationId} />

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {nextStage && application.status !== "rejected" && (
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={handleAdvance}
                  disabled={advanceStage.isPending}
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  {advanceStage.isPending
                    ? "Advancing..."
                    : `Advance to ${nextStage.label}`}
                </Button>
              )}

              <Button
                className="w-full justify-start"
                variant="outline"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Interview
              </Button>

              <OfferDialog
                applicationId={applicationId}
                jobId={application.job_id}
                candidateId={candidateId}
                jobTitle={application.job_title || "Position"}
                candidateName={application.candidate_name || "Candidate"}
              >
                <Button className="w-full justify-start" variant="outline">
                  <Send className="mr-2 h-4 w-4" />
                  Make Offer
                </Button>
              </OfferDialog>

              {application.status !== "rejected" && (
                <ConfirmDialog
                  title="Reject candidate?"
                  description={`This will reject ${application.candidate_name || "this candidate"} from the pipeline.`}
                  actionLabel="Reject"
                  onConfirm={handleReject}
                >
                  <Button
                    className="w-full justify-start text-destructive hover:text-destructive"
                    variant="outline"
                    disabled={rejectApplication.isPending}
                  >
                    <X className="mr-2 h-4 w-4" />
                    {rejectApplication.isPending ? "Rejecting..." : "Reject Candidate"}
                  </Button>
                </ConfirmDialog>
              )}

              <Separator />

              <Button
                className={`w-full justify-start ${
                  isFavorited ? "text-amber-500" : ""
                }`}
                variant="outline"
                onClick={handleToggleFavorite}
                disabled={addFavorite.isPending || removeFavorite.isPending}
              >
                <Star
                  className={`mr-2 h-4 w-4 ${
                    isFavorited ? "fill-current" : ""
                  }`}
                />
                {isFavorited ? "Remove from Shortlist" : "Add to Shortlist"}
              </Button>
            </CardContent>
          </Card>

          {/* Decision Card */}
          <DecisionCard applicationId={applicationId} />
        </div>
      </div>
    </div>
  );
}
