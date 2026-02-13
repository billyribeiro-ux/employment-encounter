"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video,
  Plus,
  Play,
  Pause,
  Star,
  Clock,
  Users,
  Eye,
  Search,
  Send,
  Copy,
  Link2,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Timer,
  MonitorPlay,
  ChevronRight,
  ChevronDown,
  Settings2,
  Calendar,
  FileText,
  Pencil,
  Trash2,
  Share2,
  ExternalLink,
  SkipForward,
  SkipBack,
  Volume2,
  Maximize2,
  TrendingUp,
  Percent,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VideoQuestion {
  id: string;
  text: string;
  maxRecordingTime: number; // seconds
  prepTime: number; // seconds
  required: boolean;
  order: number;
}

interface VideoTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  questions: VideoQuestion[];
  createdAt: string;
}

type SubmissionStatus = "pending" | "reviewed" | "rated";

interface QuestionResponse {
  questionId: string;
  duration: number; // seconds recorded
  rating: number; // 0 = unrated, 1-5
  notes: string;
}

interface VideoSubmission {
  id: string;
  templateId: string;
  templateName: string;
  candidateName: string;
  candidateEmail: string;
  candidateRole: string;
  submittedDate: string;
  invitedDate: string;
  status: SubmissionStatus;
  overallRating: number;
  responses: QuestionResponse[];
  completionRate: number;
  totalDuration: number;
  shareLink: string;
}

// ---------------------------------------------------------------------------
// Simulated Data
// ---------------------------------------------------------------------------

const videoTemplates: VideoTemplate[] = [
  {
    id: "vt-general",
    name: "General Screen",
    description: "Standard introductory screening for all positions",
    category: "General",
    createdAt: "2025-12-01",
    questions: [
      {
        id: "vq1",
        text: "Tell us about yourself and why you are interested in this role.",
        maxRecordingTime: 120,
        prepTime: 30,
        required: true,
        order: 1,
      },
      {
        id: "vq2",
        text: "Describe a challenging project you have worked on recently. What was your role and what was the outcome?",
        maxRecordingTime: 180,
        prepTime: 30,
        required: true,
        order: 2,
      },
      {
        id: "vq3",
        text: "What are your salary expectations and availability to start?",
        maxRecordingTime: 60,
        prepTime: 15,
        required: true,
        order: 3,
      },
      {
        id: "vq4",
        text: "Is there anything else you would like us to know about you?",
        maxRecordingTime: 90,
        prepTime: 15,
        required: false,
        order: 4,
      },
    ],
  },
  {
    id: "vt-technical",
    name: "Technical Deep Dive",
    description: "In-depth technical assessment for engineering candidates",
    category: "Technical",
    createdAt: "2025-12-15",
    questions: [
      {
        id: "vq5",
        text: "Walk us through the architecture of a system you designed or significantly contributed to.",
        maxRecordingTime: 300,
        prepTime: 30,
        required: true,
        order: 1,
      },
      {
        id: "vq6",
        text: "How do you approach debugging a complex production issue? Give us a real example.",
        maxRecordingTime: 180,
        prepTime: 30,
        required: true,
        order: 2,
      },
      {
        id: "vq7",
        text: "Explain a technical concept you are passionate about as if you were teaching it to a junior developer.",
        maxRecordingTime: 180,
        prepTime: 30,
        required: true,
        order: 3,
      },
      {
        id: "vq8",
        text: "What technologies are you most excited about right now and why?",
        maxRecordingTime: 120,
        prepTime: 15,
        required: false,
        order: 4,
      },
      {
        id: "vq9",
        text: "Describe a time you had to make a significant trade-off in a technical decision. What did you consider?",
        maxRecordingTime: 180,
        prepTime: 30,
        required: true,
        order: 5,
      },
    ],
  },
  {
    id: "vt-culture",
    name: "Culture Fit",
    description: "Assess cultural alignment and team dynamics",
    category: "Culture",
    createdAt: "2026-01-05",
    questions: [
      {
        id: "vq10",
        text: "What kind of work environment brings out your best performance?",
        maxRecordingTime: 120,
        prepTime: 15,
        required: true,
        order: 1,
      },
      {
        id: "vq11",
        text: "Tell us about a time you had a disagreement with a colleague. How did you resolve it?",
        maxRecordingTime: 180,
        prepTime: 30,
        required: true,
        order: 2,
      },
      {
        id: "vq12",
        text: "How do you handle receiving critical feedback?",
        maxRecordingTime: 120,
        prepTime: 15,
        required: true,
        order: 3,
      },
      {
        id: "vq13",
        text: "What does work-life balance mean to you and how do you maintain it?",
        maxRecordingTime: 90,
        prepTime: 15,
        required: false,
        order: 4,
      },
    ],
  },
];

const videoSubmissions: VideoSubmission[] = [
  {
    id: "vs-1",
    templateId: "vt-general",
    templateName: "General Screen",
    candidateName: "Emily Zhang",
    candidateEmail: "emily.zhang@email.com",
    candidateRole: "Product Manager",
    submittedDate: "2026-02-12",
    invitedDate: "2026-02-08",
    status: "rated",
    overallRating: 4.5,
    responses: [
      { questionId: "vq1", duration: 95, rating: 5, notes: "Excellent introduction, very articulate" },
      { questionId: "vq2", duration: 150, rating: 4, notes: "Good project walkthrough" },
      { questionId: "vq3", duration: 45, rating: 4, notes: "Reasonable expectations" },
      { questionId: "vq4", duration: 60, rating: 5, notes: "Showed genuine enthusiasm" },
    ],
    completionRate: 100,
    totalDuration: 350,
    shareLink: "https://interviews.example.com/share/abc123",
  },
  {
    id: "vs-2",
    templateId: "vt-technical",
    templateName: "Technical Deep Dive",
    candidateName: "James Wilson",
    candidateEmail: "james.w@email.com",
    candidateRole: "Senior Backend Engineer",
    submittedDate: "2026-02-11",
    invitedDate: "2026-02-07",
    status: "rated",
    overallRating: 3.8,
    responses: [
      { questionId: "vq5", duration: 270, rating: 4, notes: "Solid architecture understanding" },
      { questionId: "vq6", duration: 160, rating: 4, notes: "Good debugging methodology" },
      { questionId: "vq7", duration: 140, rating: 3, notes: "Could explain more clearly" },
      { questionId: "vq8", duration: 80, rating: 4, notes: "Up to date with tech trends" },
      { questionId: "vq9", duration: 155, rating: 4, notes: "Thoughtful trade-off analysis" },
    ],
    completionRate: 100,
    totalDuration: 805,
    shareLink: "https://interviews.example.com/share/def456",
  },
  {
    id: "vs-3",
    templateId: "vt-general",
    templateName: "General Screen",
    candidateName: "Priya Sharma",
    candidateEmail: "priya.s@email.com",
    candidateRole: "UX Designer",
    submittedDate: "2026-02-11",
    invitedDate: "2026-02-06",
    status: "reviewed",
    overallRating: 0,
    responses: [
      { questionId: "vq1", duration: 110, rating: 0, notes: "" },
      { questionId: "vq2", duration: 165, rating: 0, notes: "" },
      { questionId: "vq3", duration: 50, rating: 0, notes: "" },
      { questionId: "vq4", duration: 0, rating: 0, notes: "" },
    ],
    completionRate: 75,
    totalDuration: 325,
    shareLink: "https://interviews.example.com/share/ghi789",
  },
  {
    id: "vs-4",
    templateId: "vt-culture",
    templateName: "Culture Fit",
    candidateName: "David Kim",
    candidateEmail: "david.kim@email.com",
    candidateRole: "Engineering Manager",
    submittedDate: "2026-02-10",
    invitedDate: "2026-02-05",
    status: "rated",
    overallRating: 4.7,
    responses: [
      { questionId: "vq10", duration: 100, rating: 5, notes: "Great self-awareness" },
      { questionId: "vq11", duration: 170, rating: 4, notes: "Mature conflict resolution" },
      { questionId: "vq12", duration: 95, rating: 5, notes: "Highly receptive to feedback" },
      { questionId: "vq13", duration: 80, rating: 5, notes: "Thoughtful perspective" },
    ],
    completionRate: 100,
    totalDuration: 445,
    shareLink: "https://interviews.example.com/share/jkl012",
  },
  {
    id: "vs-5",
    templateId: "vt-technical",
    templateName: "Technical Deep Dive",
    candidateName: "Ana Martinez",
    candidateEmail: "ana.m@email.com",
    candidateRole: "Frontend Engineer",
    submittedDate: "",
    invitedDate: "2026-02-10",
    status: "pending",
    overallRating: 0,
    responses: [],
    completionRate: 0,
    totalDuration: 0,
    shareLink: "https://interviews.example.com/share/mno345",
  },
  {
    id: "vs-6",
    templateId: "vt-general",
    templateName: "General Screen",
    candidateName: "Tomoki Nakamura",
    candidateEmail: "tomoki.n@email.com",
    candidateRole: "Data Analyst",
    submittedDate: "2026-02-09",
    invitedDate: "2026-02-04",
    status: "reviewed",
    overallRating: 0,
    responses: [
      { questionId: "vq1", duration: 88, rating: 0, notes: "" },
      { questionId: "vq2", duration: 145, rating: 0, notes: "" },
      { questionId: "vq3", duration: 55, rating: 0, notes: "" },
      { questionId: "vq4", duration: 70, rating: 0, notes: "" },
    ],
    completionRate: 100,
    totalDuration: 358,
    shareLink: "https://interviews.example.com/share/pqr678",
  },
  {
    id: "vs-7",
    templateId: "vt-culture",
    templateName: "Culture Fit",
    candidateName: "Sophie Leclerc",
    candidateEmail: "sophie.l@email.com",
    candidateRole: "Marketing Manager",
    submittedDate: "",
    invitedDate: "2026-02-11",
    status: "pending",
    overallRating: 0,
    responses: [],
    completionRate: 0,
    totalDuration: 0,
    shareLink: "https://interviews.example.com/share/stu901",
  },
  {
    id: "vs-8",
    templateId: "vt-general",
    templateName: "General Screen",
    candidateName: "Raj Patel",
    candidateEmail: "raj.p@email.com",
    candidateRole: "DevOps Engineer",
    submittedDate: "2026-02-12",
    invitedDate: "2026-02-09",
    status: "rated",
    overallRating: 3.2,
    responses: [
      { questionId: "vq1", duration: 75, rating: 3, notes: "Decent but brief" },
      { questionId: "vq2", duration: 130, rating: 3, notes: "Needs more depth" },
      { questionId: "vq3", duration: 40, rating: 4, notes: "Clear and direct" },
      { questionId: "vq4", duration: 55, rating: 3, notes: "Adequate response" },
    ],
    completionRate: 100,
    totalDuration: 300,
    shareLink: "https://interviews.example.com/share/vwx234",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

function formatRecordingLimit(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = seconds / 60;
  return `${mins}min`;
}

function statusVariant(status: SubmissionStatus) {
  switch (status) {
    case "pending":
      return "outline" as const;
    case "reviewed":
      return "secondary" as const;
    case "rated":
      return "default" as const;
  }
}

function statusLabel(status: SubmissionStatus): string {
  switch (status) {
    case "pending":
      return "Pending";
    case "reviewed":
      return "Reviewed";
    case "rated":
      return "Rated";
  }
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "--";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ratingColor(rating: number): string {
  if (rating >= 4.5) return "text-emerald-600";
  if (rating >= 3.5) return "text-blue-600";
  if (rating >= 2.5) return "text-amber-600";
  if (rating > 0) return "text-red-600";
  return "text-muted-foreground";
}

// ---------------------------------------------------------------------------
// Star Rating Component
// ---------------------------------------------------------------------------

function StarRating({
  rating,
  onChange,
  readonly = false,
  size = "sm",
}: {
  rating: number;
  onChange?: (val: number) => void;
  readonly?: boolean;
  size?: "sm" | "md";
}) {
  const iconSize = size === "md" ? "h-5 w-5" : "h-3.5 w-3.5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((val) => (
        <button
          key={val}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(val)}
          className={`transition-all ${
            readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
          }`}
        >
          <Star
            className={`${iconSize} ${
              val <= rating
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stats Overview
// ---------------------------------------------------------------------------

function StatsOverview() {
  const total = videoSubmissions.length;
  const completed = videoSubmissions.filter((s) => s.completionRate === 100).length;
  const rated = videoSubmissions.filter((s) => s.status === "rated").length;
  const ratedSubmissions = videoSubmissions.filter((s) => s.overallRating > 0);
  const avgRating =
    ratedSubmissions.length > 0
      ? ratedSubmissions.reduce((sum, s) => sum + s.overallRating, 0) /
        ratedSubmissions.length
      : 0;
  const completionRate = total > 0 ? (completed / total) * 100 : 0;
  const avgResponseDays =
    videoSubmissions
      .filter((s) => s.submittedDate && s.invitedDate)
      .map((s) => {
        const diff =
          new Date(s.submittedDate).getTime() -
          new Date(s.invitedDate).getTime();
        return diff / (1000 * 60 * 60 * 24);
      })
      .reduce((sum, d, _, arr) => sum + d / arr.length, 0) || 0;

  const stats = [
    {
      label: "Total Submissions",
      value: total,
      icon: Video,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Completion Rate",
      value: `${completionRate.toFixed(0)}%`,
      icon: Percent,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "Avg Rating",
      value: avgRating > 0 ? avgRating.toFixed(1) : "--",
      icon: Star,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      label: "Avg Response Time",
      value: `${avgResponseDays.toFixed(1)}d`,
      icon: Timer,
      color: "text-violet-500",
      bgColor: "bg-violet-500/10",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.4 }}
        >
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`rounded-lg p-2.5 ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Templates Tab
// ---------------------------------------------------------------------------

function TemplatesTab() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");

  function handleCreate() {
    if (!newName || !newCategory) {
      toast.error("Please fill in all fields");
      return;
    }
    toast.success(`Template "${newName}" created`);
    setCreateOpen(false);
    setNewName("");
    setNewCategory("");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {videoTemplates.length} interview templates
        </p>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1.5 h-4 w-4" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Video Interview Template</DialogTitle>
              <DialogDescription>
                Define questions with timing controls for candidates to record responses.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Template Name</label>
                <Input
                  placeholder="e.g., Senior Engineer Screen"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Technical">Technical</SelectItem>
                    <SelectItem value="Culture">Culture</SelectItem>
                    <SelectItem value="Leadership">Leadership</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Create Template</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {videoTemplates.map((template, idx) => {
          const isExpanded = expandedId === template.id;
          const reqCount = template.questions.filter((q) => q.required).length;
          const totalTime = template.questions.reduce(
            (sum, q) => sum + q.maxRecordingTime,
            0
          );

          return (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08, duration: 0.35 }}
            >
              <Card className="overflow-hidden h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <MonitorPlay className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-sm">{template.name}</CardTitle>
                        <Badge variant="secondary" className="text-[10px] mt-1">
                          {template.category}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        toast.success("Template duplicated");
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {template.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {template.questions.length} questions
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {reqCount} required
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatDuration(totalTime)} max
                    </span>
                  </div>

                  <Separator />

                  <button
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : template.id)
                    }
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                    {isExpanded ? "Hide questions" : "View questions"}
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-2 pt-1">
                          {template.questions.map((q, qi) => (
                            <div
                              key={q.id}
                              className="p-2.5 rounded-md bg-muted/50 space-y-1"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm leading-snug">
                                  <span className="font-medium text-muted-foreground mr-1">
                                    Q{qi + 1}.
                                  </span>
                                  {q.text}
                                </p>
                                {q.required ? (
                                  <Badge
                                    variant="default"
                                    className="text-[9px] shrink-0"
                                  >
                                    Required
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="text-[9px] shrink-0"
                                  >
                                    Optional
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Timer className="h-3 w-3" />
                                  Max: {formatRecordingLimit(q.maxRecordingTime)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Prep: {q.prepTime}s
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() => {
                        toast.success("Invite link copied to clipboard");
                      }}
                    >
                      <Send className="mr-1 h-3.5 w-3.5" />
                      Send Invite
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => {
                        toast.info("Edit mode coming soon");
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Review Interface (Dialog)
// ---------------------------------------------------------------------------

function ReviewDialog({
  submission,
  open,
  onOpenChange,
}: {
  submission: VideoSubmission;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [ratings, setRatings] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    submission.responses.forEach((r) => {
      map[r.questionId] = r.rating;
    });
    return map;
  });
  const [notes, setNotes] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    submission.responses.forEach((r) => {
      map[r.questionId] = r.notes;
    });
    return map;
  });

  const template = videoTemplates.find((t) => t.id === submission.templateId);
  const questions = template?.questions ?? [];
  const currentQuestion = questions[currentQuestionIdx];
  const currentResponse = submission.responses.find(
    (r) => r.questionId === currentQuestion?.id
  );

  function handleSaveRatings() {
    toast.success("Ratings saved successfully");
    onOpenChange(false);
  }

  if (!template || !currentQuestion) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Review: {submission.candidateName}
          </DialogTitle>
          <DialogDescription>
            {submission.templateName} &middot; Submitted{" "}
            {formatDate(submission.submittedDate)}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Video Area (left/top) */}
          <div className="lg:col-span-3 space-y-3">
            {/* Simulated video player */}
            <div className="relative bg-slate-900 rounded-lg aspect-video flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
              <div className="relative z-10 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm mx-auto mb-3">
                  <Play className="h-8 w-8 text-white ml-1" />
                </div>
                <p className="text-white/80 text-sm font-medium">
                  {submission.candidateName}&apos;s Response
                </p>
                <p className="text-white/50 text-xs mt-1">
                  Question {currentQuestionIdx + 1} of {questions.length}
                </p>
                {currentResponse && (
                  <p className="text-white/40 text-xs mt-0.5">
                    Duration: {formatDuration(currentResponse.duration)}
                  </p>
                )}
              </div>

              {/* Player controls bar */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                <div className="h-1 bg-white/20 rounded-full mb-2 overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: "35%" }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button className="text-white/80 hover:text-white">
                      <SkipBack className="h-4 w-4" />
                    </button>
                    <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30">
                      <Play className="h-4 w-4 ml-0.5" />
                    </button>
                    <button className="text-white/80 hover:text-white">
                      <SkipForward className="h-4 w-4" />
                    </button>
                    <span className="text-white/60 text-xs ml-2">
                      0:00 /{" "}
                      {currentResponse
                        ? formatDuration(currentResponse.duration)
                        : "--:--"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="text-white/80 hover:text-white">
                      <Volume2 className="h-4 w-4" />
                    </button>
                    <button className="text-white/80 hover:text-white">
                      <Maximize2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Question navigation */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {questions.map((q, qi) => {
                const resp = submission.responses.find(
                  (r) => r.questionId === q.id
                );
                const isActive = qi === currentQuestionIdx;
                const hasResponse = resp && resp.duration > 0;
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIdx(qi)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : hasResponse
                          ? "bg-muted hover:bg-muted/80"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    Q{qi + 1}
                    {hasResponse && !isActive && (
                      <CheckCircle2 className="h-3 w-3" />
                    )}
                    {!hasResponse && !isActive && (
                      <AlertCircle className="h-3 w-3 text-muted-foreground/50" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Question text */}
            <div className="p-3 rounded-lg bg-muted/50 border">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Question {currentQuestionIdx + 1}
                    {currentQuestion.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </p>
                  <p className="text-sm">{currentQuestion.text}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                  <span className="flex items-center gap-0.5">
                    <Timer className="h-3 w-3" />
                    {formatRecordingLimit(currentQuestion.maxRecordingTime)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Rating Panel (right/bottom) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="p-4 rounded-lg border space-y-4">
              <h4 className="text-sm font-semibold">Rate This Response</h4>
              <div className="flex items-center gap-3">
                <StarRating
                  rating={ratings[currentQuestion.id] ?? 0}
                  onChange={(val) =>
                    setRatings({ ...ratings, [currentQuestion.id]: val })
                  }
                  size="md"
                />
                <span className="text-sm text-muted-foreground">
                  {ratings[currentQuestion.id]
                    ? `${ratings[currentQuestion.id]} / 5`
                    : "Not rated"}
                </span>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Notes
                </label>
                <Textarea
                  placeholder="Add evaluation notes..."
                  value={notes[currentQuestion.id] ?? ""}
                  onChange={(e) =>
                    setNotes({ ...notes, [currentQuestion.id]: e.target.value })
                  }
                  rows={3}
                  className="text-sm"
                />
              </div>
            </div>

            {/* All ratings summary */}
            <div className="p-4 rounded-lg border space-y-3">
              <h4 className="text-sm font-semibold">All Ratings</h4>
              <div className="space-y-2">
                {questions.map((q, qi) => {
                  const r = ratings[q.id] ?? 0;
                  return (
                    <div
                      key={q.id}
                      className="flex items-center justify-between py-1"
                    >
                      <span className="text-xs text-muted-foreground">
                        Q{qi + 1}
                      </span>
                      <StarRating rating={r} readonly />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  navigator.clipboard?.writeText(submission.shareLink);
                  toast.success("Share link copied");
                }}
              >
                <Share2 className="mr-1 h-3.5 w-3.5" />
                Share
              </Button>
              <Button size="sm" className="flex-1" onClick={handleSaveRatings}>
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                Save Ratings
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Submissions Tab
// ---------------------------------------------------------------------------

function SubmissionsTab() {
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterTemplate, setFilterTemplate] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [reviewSubmission, setReviewSubmission] =
    useState<VideoSubmission | null>(null);

  const filtered = useMemo(() => {
    return videoSubmissions.filter((s) => {
      if (filterStatus !== "all" && s.status !== filterStatus) return false;
      if (filterTemplate !== "all" && s.templateId !== filterTemplate) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          s.candidateName.toLowerCase().includes(q) ||
          s.candidateEmail.toLowerCase().includes(q) ||
          s.candidateRole.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [filterStatus, filterTemplate, searchQuery]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search candidates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="rated">Rated</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterTemplate} onValueChange={setFilterTemplate}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Template" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Templates</SelectItem>
            {videoTemplates.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map((submission, idx) => (
          <motion.div
            key={submission.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.3 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm shrink-0">
                    {submission.candidateName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold truncate">
                        {submission.candidateName}
                      </p>
                      <Badge
                        variant={statusVariant(submission.status)}
                        className="text-[10px]"
                      >
                        {statusLabel(submission.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span>{submission.candidateRole}</span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {submission.templateName}
                      </span>
                      {submission.submittedDate ? (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Submitted {formatDate(submission.submittedDate)}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Invited {formatDate(submission.invitedDate)}
                        </span>
                      )}
                    </div>

                    {/* Progress bar for completion */}
                    <div className="flex items-center gap-2 mt-2">
                      <Progress
                        value={submission.completionRate}
                        className="h-1.5 flex-1 max-w-[200px]"
                      />
                      <span className="text-[11px] text-muted-foreground">
                        {submission.completionRate}% complete
                      </span>
                    </div>
                  </div>

                  {/* Rating + Actions */}
                  <div className="flex items-center gap-4 shrink-0">
                    {submission.overallRating > 0 && (
                      <div className="text-center">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          <span
                            className={`text-lg font-bold ${ratingColor(
                              submission.overallRating
                            )}`}
                          >
                            {submission.overallRating.toFixed(1)}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          Rating
                        </p>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      {submission.status !== "pending" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setReviewSubmission(submission)}
                        >
                          <Eye className="mr-1 h-3.5 w-3.5" />
                          Review
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          navigator.clipboard?.writeText(submission.shareLink);
                          toast.success("Link copied to clipboard");
                        }}
                      >
                        <Link2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {filtered.length === 0 && (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Video className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-1">
                  No submissions found
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  No video interview submissions match your current filters.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Review Dialog */}
      {reviewSubmission && (
        <ReviewDialog
          submission={reviewSubmission}
          open={!!reviewSubmission}
          onOpenChange={(open) => !open && setReviewSubmission(null)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Analytics Tab
// ---------------------------------------------------------------------------

function AnalyticsTab() {
  const ratedSubmissions = videoSubmissions.filter((s) => s.overallRating > 0);
  const templateStats = videoTemplates.map((t) => {
    const subs = videoSubmissions.filter((s) => s.templateId === t.id);
    const rated = subs.filter((s) => s.overallRating > 0);
    const avgRating =
      rated.length > 0
        ? rated.reduce((sum, s) => sum + s.overallRating, 0) / rated.length
        : 0;
    const completionRate =
      subs.length > 0
        ? (subs.filter((s) => s.completionRate === 100).length / subs.length) *
          100
        : 0;
    return {
      ...t,
      totalSubmissions: subs.length,
      avgRating,
      completionRate,
    };
  });

  const ratingDistribution = [1, 2, 3, 4, 5].map((rating) => {
    const count = ratedSubmissions.filter(
      (s) => Math.round(s.overallRating) === rating
    ).length;
    return { rating, count };
  });

  const maxCount = Math.max(...ratingDistribution.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Template Performance */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Template Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {templateStats.map((ts) => (
                <div
                  key={ts.id}
                  className="p-3 rounded-lg bg-muted/30 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{ts.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {ts.totalSubmissions} submissions
                      </p>
                    </div>
                    {ts.avgRating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-semibold">
                          {ts.avgRating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Completion Rate</span>
                      <span>{ts.completionRate.toFixed(0)}%</span>
                    </div>
                    <Progress value={ts.completionRate} className="h-1.5" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Rating Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Rating Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ratingDistribution.reverse().map((d) => (
                  <div key={d.rating} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-16">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-medium">{d.rating}</span>
                    </div>
                    <div className="flex-1 h-6 bg-muted/50 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(d.count / maxCount) * 100}%`,
                        }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="h-full bg-amber-400/60 rounded-full flex items-center justify-end pr-2"
                      >
                        {d.count > 0 && (
                          <span className="text-[10px] font-medium">
                            {d.count}
                          </span>
                        )}
                      </motion.div>
                    </div>
                    <span className="text-xs text-muted-foreground w-6 text-right">
                      {d.count}
                    </span>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <p className="text-2xl font-bold">
                    {ratedSubmissions.length > 0
                      ? (
                          ratedSubmissions.reduce(
                            (s, sub) => s + sub.overallRating,
                            0
                          ) / ratedSubmissions.length
                        ).toFixed(1)
                      : "--"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Avg Overall Rating
                  </p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <p className="text-2xl font-bold">
                    {videoSubmissions.length > 0
                      ? formatDuration(
                          Math.round(
                            videoSubmissions
                              .filter((s) => s.totalDuration > 0)
                              .reduce((s, sub) => s + sub.totalDuration, 0) /
                              videoSubmissions.filter(
                                (s) => s.totalDuration > 0
                              ).length
                          )
                        )
                      : "--"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Avg Response Time
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function VideoInterviewsPage() {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Video Interviews
            </h1>
            <p className="text-muted-foreground">
              Create async video interviews, review candidate responses, and
              collaborate with your team
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Settings2 className="mr-1.5 h-4 w-4" />
              Settings
            </Button>
            <Button size="sm">
              <Plus className="mr-1.5 h-4 w-4" />
              New Interview
            </Button>
          </div>
        </div>
      </motion.div>

      <StatsOverview />

      <Tabs defaultValue="submissions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="submissions" className="gap-1.5">
            <Users className="h-4 w-4" />
            Submissions
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5">
            <MonitorPlay className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-1.5">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="submissions">
          <SubmissionsTab />
        </TabsContent>

        <TabsContent value="templates">
          <TemplatesTab />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
