"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  MessageSquare,
  Calendar,
  Linkedin,
  Github,
  Globe,
  Shield,
  ShieldCheck,
  Briefcase,
  FileText,
  Download,
  ExternalLink,
  Star,
  StickyNote,
  Plus,
  Edit2,
  Trash2,
  ClipboardCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import {
  useCandidate,
  useCandidateSkills,
} from "@/lib/hooks/use-candidates";
import {
  useCandidateNotes,
  useCreateCandidateNote,
  useUpdateCandidateNote,
  useDeleteCandidateNote,
} from "@/lib/hooks/use-candidate-notes";
import type { CandidateNote } from "@/lib/hooks/use-candidate-notes";
import { useIsFavorite, useAddFavorite, useRemoveFavorite } from "@/lib/hooks/use-favorites";
import { useApplications } from "@/lib/hooks/use-applications";
import { toast } from "sonner";

function formatSalary(cents: number | null): string {
  if (!cents) return "Not specified";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function availabilityVariant(status: string) {
  switch (status) {
    case "available":
    case "open":
      return "default" as const;
    case "not_looking":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
}

function proficiencyColor(level: string | null) {
  switch (level) {
    case "expert":
      return "text-emerald-700 bg-emerald-50 border-emerald-200";
    case "advanced":
      return "text-blue-700 bg-blue-50 border-blue-200";
    case "intermediate":
      return "text-amber-700 bg-amber-50 border-amber-200";
    case "beginner":
      return "text-slate-600 bg-slate-50 border-slate-200";
    default:
      return "text-muted-foreground bg-muted";
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

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: candidate, isLoading, isError } = useCandidate(id);
  const { data: skills } = useCandidateSkills(id);
  const { data: notes, isLoading: notesLoading } = useCandidateNotes(id);
  const createNote = useCreateCandidateNote(id);
  const updateNote = useUpdateCandidateNote(id);
  const deleteNote = useDeleteCandidateNote(id);
  const { data: favoriteStatus } = useIsFavorite(id);
  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();
  const { data: applicationsData } = useApplications({ candidate_id: id, per_page: 10 });

  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteType, setNewNoteType] = useState("general");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const isFavorited = favoriteStatus?.is_favorite ?? false;
  const favoriteId = favoriteStatus?.favorite_id ?? null;
  const applications = applicationsData?.data ?? [];
  const allNotes = notes ?? [];

  function handleToggleFavorite() {
    if (isFavorited && favoriteId) {
      removeFavorite.mutate(favoriteId, {
        onSuccess: () => toast.success("Removed from shortlist"),
        onError: () => toast.error("Failed to update shortlist"),
      });
    } else {
      addFavorite.mutate(
        { candidate_id: id },
        {
          onSuccess: () => toast.success("Added to shortlist"),
          onError: () => toast.error("Failed to update shortlist"),
        }
      );
    }
  }

  function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!newNoteContent.trim()) return;
    createNote.mutate(
      {
        content: newNoteContent.trim(),
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
      <div className="space-y-6">
        <Skeleton className="h-4 w-48" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-7 w-56 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (isError || !candidate) {
    return (
      <div className="space-y-4">
        <Link href="/talent">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Talent
          </Button>
        </Link>
        <div className="text-center py-12">
          <p className="text-sm text-destructive">
            Candidate not found or failed to load.
          </p>
        </div>
      </div>
    );
  }

  const location = [
    candidate.location_city,
    candidate.location_state,
    candidate.location_country,
  ]
    .filter(Boolean)
    .join(", ");

  const candidateSkills = skills ?? [];

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Talent", href: "/talent" },
          { label: candidate.headline || "Candidate Profile" },
        ]}
      />

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-bold">
          {(candidate.headline || "?").charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">
              {candidate.headline || "Candidate Profile"}
            </h1>
            <Badge variant={availabilityVariant(candidate.availability_status)}>
              {candidate.availability_status.replace(/_/g, " ")}
            </Badge>
            {candidate.reputation_score > 0 && (
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="h-4 w-4 fill-current" />
                <span className="text-sm font-semibold">
                  {candidate.reputation_score}
                </span>
              </div>
            )}
          </div>
          {location && (
            <p className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <MapPin className="h-4 w-4" />
              {location}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className={isFavorited ? "text-amber-500 border-amber-200" : ""}
            onClick={handleToggleFavorite}
            disabled={addFavorite.isPending || removeFavorite.isPending}
          >
            <Star
              className={`mr-2 h-4 w-4 ${isFavorited ? "fill-current" : ""}`}
            />
            {isFavorited ? "Shortlisted" : "Shortlist"}
          </Button>
          <Button variant="outline">
            <MessageSquare className="mr-2 h-4 w-4" />
            Message
          </Button>
          <Button>
            <Calendar className="mr-2 h-4 w-4" />
            Schedule Interview
          </Button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-muted-foreground">
                Remote Pref
              </span>
            </div>
            <p className="text-lg font-bold capitalize">
              {candidate.remote_preference || "Not set"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-medium text-muted-foreground">
                Work Auth
              </span>
            </div>
            <p className="text-lg font-bold">
              {candidate.work_authorization || "Not specified"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Star className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-medium text-muted-foreground">
                Profile Complete
              </span>
            </div>
            <p className="text-lg font-bold">
              {candidate.profile_completeness_pct}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-violet-600" />
              <span className="text-xs font-medium text-muted-foreground">
                Skills
              </span>
            </div>
            <p className="text-lg font-bold">{candidateSkills.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Applications score summary */}
      {applications.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              Applications ({applications.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-medium">
                        {app.job_title || "Unknown Position"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[10px]">
                          {app.stage.replace(/_/g, " ")}
                        </Badge>
                        <Badge
                          variant={
                            app.status === "rejected"
                              ? "destructive"
                              : app.status === "hired"
                              ? "default"
                              : "secondary"
                          }
                          className="text-[10px]"
                        >
                          {app.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {app.screening_score != null && (
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        <span className="text-xs font-semibold">
                          {app.screening_score}
                        </span>
                      </div>
                    )}
                    <Link href={`/hiring/evaluate/${app.id}`}>
                      <Button variant="outline" size="sm" className="h-7 text-xs">
                        <ClipboardCheck className="mr-1 h-3 w-3" />
                        Evaluate
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="experience">Experience</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Overview tab */}
        <TabsContent value="overview">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {candidate.summary ? (
                  <p className="text-sm leading-relaxed">{candidate.summary}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No summary provided.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Salary Expectations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Minimum</p>
                    <p className="font-medium">
                      {formatSalary(candidate.desired_salary_min_cents)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Maximum</p>
                    <p className="font-medium">
                      {formatSalary(candidate.desired_salary_max_cents)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Currency</p>
                    <p className="font-medium">
                      {candidate.desired_currency || "USD"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Visa Status</p>
                    <p className="font-medium">
                      {candidate.visa_status || "Not specified"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Links</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 flex-wrap">
                  {candidate.linkedin_url && (
                    <a
                      href={candidate.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                    >
                      <Linkedin className="h-4 w-4" />
                      LinkedIn
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {candidate.github_url && (
                    <a
                      href={candidate.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:underline"
                    >
                      <Github className="h-4 w-4" />
                      GitHub
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {candidate.portfolio_url && (
                    <a
                      href={candidate.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-emerald-600 hover:underline"
                    >
                      <Globe className="h-4 w-4" />
                      Portfolio
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {!candidate.linkedin_url &&
                    !candidate.github_url &&
                    !candidate.portfolio_url && (
                      <p className="text-sm text-muted-foreground">
                        No external links provided.
                      </p>
                    )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Skills tab */}
        <TabsContent value="skills">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Skills ({candidateSkills.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {candidateSkills.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  No skills listed yet.
                </p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {candidateSkills.map((skill) => (
                    <div
                      key={skill.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-2">
                        {skill.is_verified ? (
                          <ShieldCheck className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Shield className="h-4 w-4 text-muted-foreground/40" />
                        )}
                        <div>
                          <p className="text-sm font-medium">
                            {skill.skill_name}
                          </p>
                          {skill.years_experience && (
                            <p className="text-[10px] text-muted-foreground">
                              {skill.years_experience} yr
                              {skill.years_experience !== 1 ? "s" : ""}{" "}
                              experience
                            </p>
                          )}
                        </div>
                      </div>
                      {skill.proficiency_level && (
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${proficiencyColor(
                            skill.proficiency_level
                          )}`}
                        >
                          {skill.proficiency_level}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes tab */}
        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <StickyNote className="h-4 w-4" />
                Notes ({allNotes.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddNote} className="space-y-3 mb-4">
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

              <Separator className="my-4" />

              {notesLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : allNotes.length === 0 ? (
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
                                  {(note.author_name || "U")
                                    .charAt(0)
                                    .toUpperCase()}
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
                                <Badge
                                  variant="outline"
                                  className="text-[10px]"
                                >
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
                                    onSuccess: () =>
                                      toast.success("Note deleted"),
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Experience tab */}
        <TabsContent value="experience">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Work History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground py-6 text-center">
                Work history will be displayed here once the candidate adds
                their experience.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground py-6 text-center">
                Uploaded documents such as resumes and certifications will
                appear here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
