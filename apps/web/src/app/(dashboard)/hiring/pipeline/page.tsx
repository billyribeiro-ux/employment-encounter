"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  Users,
  Clock,
  TrendingUp,
  Filter,
  Search,
  Eye,
  Calendar,
  MessageSquarePlus,
  XCircle,
  ChevronRight,
  ChevronLeft,
  MoreHorizontal,
  Star,
  Zap,
  ArrowRight,
  BarChart3,
  UserCircle,
  GripVertical,
  Inbox,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";

// ─── Types ──────────────────────────────────────────────────────────────────

type PipelineStage =
  | "applied"
  | "screening"
  | "phone_screen"
  | "technical"
  | "onsite"
  | "offer"
  | "hired";

interface Candidate {
  id: string;
  name: string;
  email: string;
  jobTitle: string;
  stage: PipelineStage;
  daysInStage: number;
  score: number;
  source: string;
  appliedDate: string;
  avatarInitials: string;
  avatarColor: string;
  tags: string[];
}

interface StageConfig {
  key: PipelineStage;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  iconColor: string;
  maxDays: number;
}

// ─── Stage Configuration ────────────────────────────────────────────────────

const STAGES: StageConfig[] = [
  {
    key: "applied",
    label: "Applied",
    color: "text-slate-700 dark:text-slate-300",
    bgColor: "bg-slate-50 dark:bg-slate-900/50",
    borderColor: "border-slate-200 dark:border-slate-800",
    iconColor: "text-slate-500",
    maxDays: 5,
  },
  {
    key: "screening",
    label: "Screening",
    color: "text-blue-700 dark:text-blue-300",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
    borderColor: "border-blue-200 dark:border-blue-800",
    iconColor: "text-blue-500",
    maxDays: 3,
  },
  {
    key: "phone_screen",
    label: "Phone Screen",
    color: "text-indigo-700 dark:text-indigo-300",
    bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
    borderColor: "border-indigo-200 dark:border-indigo-800",
    iconColor: "text-indigo-500",
    maxDays: 5,
  },
  {
    key: "technical",
    label: "Technical",
    color: "text-violet-700 dark:text-violet-300",
    bgColor: "bg-violet-50 dark:bg-violet-900/20",
    borderColor: "border-violet-200 dark:border-violet-800",
    iconColor: "text-violet-500",
    maxDays: 7,
  },
  {
    key: "onsite",
    label: "Onsite",
    color: "text-purple-700 dark:text-purple-300",
    bgColor: "bg-purple-50 dark:bg-purple-900/20",
    borderColor: "border-purple-200 dark:border-purple-800",
    iconColor: "text-purple-500",
    maxDays: 7,
  },
  {
    key: "offer",
    label: "Offer",
    color: "text-amber-700 dark:text-amber-300",
    bgColor: "bg-amber-50 dark:bg-amber-900/20",
    borderColor: "border-amber-200 dark:border-amber-800",
    iconColor: "text-amber-500",
    maxDays: 5,
  },
  {
    key: "hired",
    label: "Hired",
    color: "text-emerald-700 dark:text-emerald-300",
    bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    iconColor: "text-emerald-500",
    maxDays: 999,
  },
];

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-orange-500",
];

// ─── Simulated Data ─────────────────────────────────────────────────────────

const INITIAL_CANDIDATES: Candidate[] = [
  {
    id: "c1",
    name: "Sarah Chen",
    email: "sarah.chen@email.com",
    jobTitle: "Senior Frontend Engineer",
    stage: "applied",
    daysInStage: 2,
    score: 92,
    source: "LinkedIn",
    appliedDate: "2026-02-11",
    avatarInitials: "SC",
    avatarColor: AVATAR_COLORS[0],
    tags: ["referral"],
  },
  {
    id: "c2",
    name: "Marcus Johnson",
    email: "marcus.j@email.com",
    jobTitle: "Backend Engineer",
    stage: "applied",
    daysInStage: 6,
    score: 78,
    source: "Indeed",
    appliedDate: "2026-02-07",
    avatarInitials: "MJ",
    avatarColor: AVATAR_COLORS[1],
    tags: [],
  },
  {
    id: "c3",
    name: "Priya Patel",
    email: "priya.p@email.com",
    jobTitle: "Senior Frontend Engineer",
    stage: "screening",
    daysInStage: 1,
    score: 88,
    source: "Career Page",
    appliedDate: "2026-02-05",
    avatarInitials: "PP",
    avatarColor: AVATAR_COLORS[2],
    tags: ["fast-track"],
  },
  {
    id: "c4",
    name: "James Rodriguez",
    email: "james.r@email.com",
    jobTitle: "Product Manager",
    stage: "screening",
    daysInStage: 4,
    score: 71,
    source: "LinkedIn",
    appliedDate: "2026-02-03",
    avatarInitials: "JR",
    avatarColor: AVATAR_COLORS[3],
    tags: [],
  },
  {
    id: "c5",
    name: "Aisha Williams",
    email: "aisha.w@email.com",
    jobTitle: "Senior Frontend Engineer",
    stage: "phone_screen",
    daysInStage: 3,
    score: 95,
    source: "Referral",
    appliedDate: "2026-01-28",
    avatarInitials: "AW",
    avatarColor: AVATAR_COLORS[4],
    tags: ["top-candidate", "referral"],
  },
  {
    id: "c6",
    name: "David Kim",
    email: "david.k@email.com",
    jobTitle: "Backend Engineer",
    stage: "phone_screen",
    daysInStage: 7,
    score: 82,
    source: "Indeed",
    appliedDate: "2026-01-25",
    avatarInitials: "DK",
    avatarColor: AVATAR_COLORS[5],
    tags: [],
  },
  {
    id: "c7",
    name: "Elena Volkov",
    email: "elena.v@email.com",
    jobTitle: "Senior Frontend Engineer",
    stage: "technical",
    daysInStage: 2,
    score: 90,
    source: "LinkedIn",
    appliedDate: "2026-01-20",
    avatarInitials: "EV",
    avatarColor: AVATAR_COLORS[6],
    tags: ["top-candidate"],
  },
  {
    id: "c8",
    name: "Tom Anderson",
    email: "tom.a@email.com",
    jobTitle: "Product Manager",
    stage: "technical",
    daysInStage: 9,
    score: 74,
    source: "Career Page",
    appliedDate: "2026-01-15",
    avatarInitials: "TA",
    avatarColor: AVATAR_COLORS[7],
    tags: [],
  },
  {
    id: "c9",
    name: "Mei Lin",
    email: "mei.lin@email.com",
    jobTitle: "Senior Frontend Engineer",
    stage: "technical",
    daysInStage: 5,
    score: 87,
    source: "Referral",
    appliedDate: "2026-01-18",
    avatarInitials: "ML",
    avatarColor: AVATAR_COLORS[8],
    tags: ["referral"],
  },
  {
    id: "c10",
    name: "Alex Okafor",
    email: "alex.o@email.com",
    jobTitle: "DevOps Engineer",
    stage: "onsite",
    daysInStage: 1,
    score: 91,
    source: "LinkedIn",
    appliedDate: "2026-01-10",
    avatarInitials: "AO",
    avatarColor: AVATAR_COLORS[9],
    tags: ["fast-track"],
  },
  {
    id: "c11",
    name: "Rachel Green",
    email: "rachel.g@email.com",
    jobTitle: "Senior Frontend Engineer",
    stage: "onsite",
    daysInStage: 8,
    score: 85,
    source: "LinkedIn",
    appliedDate: "2026-01-05",
    avatarInitials: "RG",
    avatarColor: AVATAR_COLORS[0],
    tags: [],
  },
  {
    id: "c12",
    name: "Yuki Tanaka",
    email: "yuki.t@email.com",
    jobTitle: "Backend Engineer",
    stage: "offer",
    daysInStage: 3,
    score: 93,
    source: "Referral",
    appliedDate: "2025-12-20",
    avatarInitials: "YT",
    avatarColor: AVATAR_COLORS[1],
    tags: ["top-candidate", "referral"],
  },
  {
    id: "c13",
    name: "Carlos Mendez",
    email: "carlos.m@email.com",
    jobTitle: "Product Manager",
    stage: "offer",
    daysInStage: 6,
    score: 80,
    source: "Indeed",
    appliedDate: "2025-12-18",
    avatarInitials: "CM",
    avatarColor: AVATAR_COLORS[2],
    tags: [],
  },
  {
    id: "c14",
    name: "Sophie Laurent",
    email: "sophie.l@email.com",
    jobTitle: "Senior Frontend Engineer",
    stage: "hired",
    daysInStage: 0,
    score: 96,
    source: "LinkedIn",
    appliedDate: "2025-12-01",
    avatarInitials: "SL",
    avatarColor: AVATAR_COLORS[3],
    tags: ["top-candidate"],
  },
  {
    id: "c15",
    name: "Omar Hassan",
    email: "omar.h@email.com",
    jobTitle: "DevOps Engineer",
    stage: "hired",
    daysInStage: 0,
    score: 89,
    source: "Career Page",
    appliedDate: "2025-11-28",
    avatarInitials: "OH",
    avatarColor: AVATAR_COLORS[4],
    tags: [],
  },
  {
    id: "c16",
    name: "Nina Petrova",
    email: "nina.p@email.com",
    jobTitle: "Senior Frontend Engineer",
    stage: "applied",
    daysInStage: 1,
    score: 84,
    source: "LinkedIn",
    appliedDate: "2026-02-12",
    avatarInitials: "NP",
    avatarColor: AVATAR_COLORS[5],
    tags: [],
  },
  {
    id: "c17",
    name: "Ryan Mitchell",
    email: "ryan.m@email.com",
    jobTitle: "Backend Engineer",
    stage: "screening",
    daysInStage: 2,
    score: 76,
    source: "Indeed",
    appliedDate: "2026-02-04",
    avatarInitials: "RM",
    avatarColor: AVATAR_COLORS[6],
    tags: [],
  },
  {
    id: "c18",
    name: "Fatima Al-Rashid",
    email: "fatima.ar@email.com",
    jobTitle: "DevOps Engineer",
    stage: "phone_screen",
    daysInStage: 2,
    score: 88,
    source: "Referral",
    appliedDate: "2026-01-30",
    avatarInitials: "FA",
    avatarColor: AVATAR_COLORS[7],
    tags: ["referral"],
  },
];

const JOB_OPTIONS = [
  "All Jobs",
  "Senior Frontend Engineer",
  "Backend Engineer",
  "Product Manager",
  "DevOps Engineer",
];
const SOURCE_OPTIONS = [
  "All Sources",
  "LinkedIn",
  "Indeed",
  "Referral",
  "Career Page",
];

// ─── Helper Functions ───────────────────────────────────────────────────────

function getUrgencyBorder(daysInStage: number, maxDays: number): string {
  if (daysInStage >= maxDays * 1.5) return "border-l-4 border-l-red-500";
  if (daysInStage >= maxDays) return "border-l-4 border-l-amber-500";
  return "border-l-4 border-l-transparent";
}

function getScoreBadge(score: number) {
  if (score >= 90)
    return { variant: "default" as const, className: "bg-emerald-600 hover:bg-emerald-700" };
  if (score >= 80)
    return { variant: "default" as const, className: "bg-blue-600 hover:bg-blue-700" };
  if (score >= 70)
    return { variant: "secondary" as const, className: "" };
  return { variant: "outline" as const, className: "" };
}

function getStageIndex(stage: PipelineStage): number {
  return STAGES.findIndex((s) => s.key === stage);
}

// ─── Candidate Card Component ───────────────────────────────────────────────

function CandidateCard({
  candidate,
  stageConfig,
  onMoveForward,
  onMoveBack,
  onViewProfile,
  onSchedule,
  onAddNote,
  onReject,
}: {
  candidate: Candidate;
  stageConfig: StageConfig;
  onMoveForward: () => void;
  onMoveBack: () => void;
  onViewProfile: () => void;
  onSchedule: () => void;
  onAddNote: () => void;
  onReject: () => void;
}) {
  const urgencyBorder = getUrgencyBorder(
    candidate.daysInStage,
    stageConfig.maxDays
  );
  const scoreBadge = getScoreBadge(candidate.score);
  const stageIdx = getStageIndex(candidate.stage);
  const isFirst = stageIdx === 0;
  const isLast = stageIdx === STAGES.length - 1;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`group relative rounded-lg border bg-card shadow-sm hover:shadow-md transition-shadow ${urgencyBorder}`}
    >
      <div className="p-3 space-y-2.5">
        {/* Header with avatar, name, score */}
        <div className="flex items-start gap-2.5">
          <div
            className={`flex-shrink-0 h-9 w-9 rounded-full ${candidate.avatarColor} flex items-center justify-center text-white text-xs font-semibold`}
          >
            {candidate.avatarInitials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="text-sm font-semibold truncate">
                {candidate.name}
              </h4>
              <Badge
                variant={scoreBadge.variant}
                className={`text-[10px] px-1.5 py-0 h-4 ${scoreBadge.className}`}
              >
                {candidate.score}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {candidate.jobTitle}
            </p>
          </div>
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {candidate.daysInStage}d in stage
          </span>
          <span className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            {candidate.source}
          </span>
        </div>

        {/* Tags */}
        {candidate.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {candidate.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-4"
              >
                {tag === "top-candidate" && (
                  <Star className="h-2.5 w-2.5 mr-0.5 text-amber-500" />
                )}
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Quick Actions - visible on hover */}
        <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity pt-1 border-t">
          <div className="flex gap-0.5">
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={onViewProfile}
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>View Profile</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={onSchedule}
                  >
                    <Calendar className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Schedule Interview</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={onAddNote}
                  >
                    <MessageSquarePlus className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Add Note</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={onReject}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>Reject</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Move between stages */}
          <div className="flex gap-0.5">
            {!isFirst && (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={onMoveBack}
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>
                      Move to {STAGES[stageIdx - 1]?.label}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {!isLast && (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={onMoveForward}
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>
                      Move to {STAGES[stageIdx + 1]?.label}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Pipeline Column Component ──────────────────────────────────────────────

function PipelineColumn({
  stage,
  candidates,
  onMoveCandidate,
  onAction,
}: {
  stage: StageConfig;
  candidates: Candidate[];
  onMoveCandidate: (candidateId: string, direction: "forward" | "back") => void;
  onAction: (candidateId: string, action: string) => void;
}) {
  return (
    <div className="flex flex-col h-full min-w-[280px] w-[280px]">
      {/* Column Header */}
      <div
        className={`rounded-t-lg px-3 py-2.5 ${stage.bgColor} border ${stage.borderColor} border-b-0`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`h-2.5 w-2.5 rounded-full ${stage.bgColor.replace("50", "500").replace("/20", "").replace("/50", "")}`}
              style={{
                backgroundColor:
                  stage.key === "applied"
                    ? "#64748b"
                    : stage.key === "screening"
                    ? "#3b82f6"
                    : stage.key === "phone_screen"
                    ? "#6366f1"
                    : stage.key === "technical"
                    ? "#8b5cf6"
                    : stage.key === "onsite"
                    ? "#a855f7"
                    : stage.key === "offer"
                    ? "#f59e0b"
                    : "#10b981",
              }}
            />
            <h3 className={`text-sm font-semibold ${stage.color}`}>
              {stage.label}
            </h3>
          </div>
          <Badge variant="secondary" className="text-xs h-5 px-1.5">
            {candidates.length}
          </Badge>
        </div>
      </div>

      {/* Column Body */}
      <div
        className={`flex-1 border ${stage.borderColor} border-t-0 rounded-b-lg overflow-hidden`}
      >
        <ScrollArea className="h-full max-h-[calc(100vh-320px)]">
          <div className="p-2 space-y-2">
            <AnimatePresence mode="popLayout">
              {candidates.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-8 px-4 text-center"
                >
                  <div className="rounded-full bg-muted p-3 mb-3">
                    <Inbox className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    No candidates in this stage
                  </p>
                </motion.div>
              ) : (
                candidates.map((candidate) => (
                  <CandidateCard
                    key={candidate.id}
                    candidate={candidate}
                    stageConfig={stage}
                    onMoveForward={() =>
                      onMoveCandidate(candidate.id, "forward")
                    }
                    onMoveBack={() => onMoveCandidate(candidate.id, "back")}
                    onViewProfile={() => onAction(candidate.id, "view")}
                    onSchedule={() => onAction(candidate.id, "schedule")}
                    onAddNote={() => onAction(candidate.id, "note")}
                    onReject={() => onAction(candidate.id, "reject")}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

// ─── Add Note Dialog ────────────────────────────────────────────────────────

function AddNoteDialog({
  candidate,
  open,
  onOpenChange,
}: {
  candidate: Candidate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [note, setNote] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Note</DialogTitle>
          <DialogDescription>
            {candidate
              ? `Add a note for ${candidate.name}`
              : "Add a note for this candidate"}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="note">Note</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Write your note here..."
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              toast.success(`Note added for ${candidate?.name}`);
              setNote("");
              onOpenChange(false);
            }}
          >
            Save Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Pipeline Page ─────────────────────────────────────────────────────

export default function PipelinePage() {
  const [candidates, setCandidates] = useState<Candidate[]>(INITIAL_CANDIDATES);
  const [searchQuery, setSearchQuery] = useState("");
  const [jobFilter, setJobFilter] = useState("All Jobs");
  const [sourceFilter, setSourceFilter] = useState("All Sources");
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null
  );

  // ── Filter candidates ──
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      if (
        searchQuery &&
        !c.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !c.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      if (jobFilter !== "All Jobs" && c.jobTitle !== jobFilter) return false;
      if (sourceFilter !== "All Sources" && c.source !== sourceFilter)
        return false;
      return true;
    });
  }, [candidates, searchQuery, jobFilter, sourceFilter]);

  // ── Group by stage ──
  const candidatesByStage = useMemo(() => {
    const grouped: Record<PipelineStage, Candidate[]> = {
      applied: [],
      screening: [],
      phone_screen: [],
      technical: [],
      onsite: [],
      offer: [],
      hired: [],
    };
    filteredCandidates.forEach((c) => {
      grouped[c.stage].push(c);
    });
    return grouped;
  }, [filteredCandidates]);

  // ── Stats ──
  const stats = useMemo(() => {
    const total = candidates.length;
    const avgDays =
      candidates.length > 0
        ? Math.round(
            candidates.reduce((sum, c) => sum + c.daysInStage, 0) / total
          )
        : 0;
    const hiredCount = candidates.filter((c) => c.stage === "hired").length;
    const conversionRate =
      total > 0 ? Math.round((hiredCount / total) * 100) : 0;
    const avgScore =
      total > 0
        ? Math.round(candidates.reduce((sum, c) => sum + c.score, 0) / total)
        : 0;
    return { total, avgDays, hiredCount, conversionRate, avgScore };
  }, [candidates]);

  // ── Move candidate ──
  const moveCandidate = useCallback(
    (candidateId: string, direction: "forward" | "back") => {
      setCandidates((prev) =>
        prev.map((c) => {
          if (c.id !== candidateId) return c;
          const currentIdx = getStageIndex(c.stage);
          const newIdx =
            direction === "forward"
              ? Math.min(currentIdx + 1, STAGES.length - 1)
              : Math.max(currentIdx - 1, 0);
          const newStage = STAGES[newIdx].key;
          toast.success(
            `${c.name} moved to ${STAGES[newIdx].label}`
          );
          return { ...c, stage: newStage, daysInStage: 0 };
        })
      );
    },
    []
  );

  // ── Handle card actions ──
  const handleAction = useCallback(
    (candidateId: string, action: string) => {
      const candidate = candidates.find((c) => c.id === candidateId);
      if (!candidate) return;

      switch (action) {
        case "view":
          toast.info(`Viewing profile for ${candidate.name}`);
          break;
        case "schedule":
          toast.success(
            `Interview scheduling opened for ${candidate.name}`
          );
          break;
        case "note":
          setSelectedCandidate(candidate);
          setNoteDialogOpen(true);
          break;
        case "reject":
          setCandidates((prev) => prev.filter((c) => c.id !== candidateId));
          toast(`${candidate.name} has been rejected`, {
            description: `Removed from ${STAGES[getStageIndex(candidate.stage)].label} stage`,
            action: {
              label: "Undo",
              onClick: () => {
                setCandidates((prev) => [...prev, candidate]);
                toast.success(`${candidate.name} restored`);
              },
            },
          });
          break;
      }
    },
    [candidates]
  );

  const hasActiveFilters =
    searchQuery || jobFilter !== "All Jobs" || sourceFilter !== "All Sources";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Hiring Pipeline
          </h1>
          <p className="text-muted-foreground">
            Visual overview of your candidate pipeline across all stages
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <BarChart3 className="mr-2 h-4 w-4" />
            Analytics
          </Button>
          <Button size="sm">
            <Users className="mr-2 h-4 w-4" />
            Add Candidate
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium text-muted-foreground">
                  Total Candidates
                </span>
              </div>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-amber-600" />
                <span className="text-xs font-medium text-muted-foreground">
                  Avg Days in Stage
                </span>
              </div>
              <p className="text-2xl font-bold">{stats.avgDays}d</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-medium text-muted-foreground">
                  Conversion Rate
                </span>
              </div>
              <p className="text-2xl font-bold">{stats.conversionRate}%</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <Star className="h-4 w-4 text-violet-600" />
                <span className="text-xs font-medium text-muted-foreground">
                  Avg Score
                </span>
              </div>
              <p className="text-2xl font-bold">{stats.avgScore}</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <UserCircle className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-medium text-muted-foreground">
                  Hired
                </span>
              </div>
              <p className="text-2xl font-bold">{stats.hiredCount}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardContent className="py-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" />
                Filters
              </div>
              <Separator orientation="vertical" className="h-6" />
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search candidates..."
                  className="h-8 w-[200px] pl-8 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={jobFilter} onValueChange={setJobFilter}>
                <SelectTrigger className="h-8 w-[200px] text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JOB_OPTIONS.map((job) => (
                    <SelectItem key={job} value={job}>
                      {job}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="h-8 w-[160px] text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_OPTIONS.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-muted-foreground"
                  onClick={() => {
                    setSearchQuery("");
                    setJobFilter("All Jobs");
                    setSourceFilter("All Sources");
                  }}
                >
                  <RotateCcw className="mr-1 h-3 w-3" />
                  Reset
                </Button>
              )}
              <div className="ml-auto text-xs text-muted-foreground">
                {filteredCandidates.length} of {candidates.length} candidates
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Pipeline conversion flow indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="hidden lg:flex items-center justify-between px-4"
      >
        {STAGES.map((stage, i) => {
          const count = candidatesByStage[stage.key].length;
          return (
            <div key={stage.key} className="flex items-center">
              <div className="flex flex-col items-center">
                <span className="text-xs font-medium text-muted-foreground">
                  {count}
                </span>
              </div>
              {i < STAGES.length - 1 && (
                <ArrowRight className="h-3 w-3 text-muted-foreground/40 mx-2" />
              )}
            </div>
          );
        })}
      </motion.div>

      {/* Kanban Board */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="overflow-x-auto pb-4"
      >
        <div className="flex gap-3 min-w-max">
          {STAGES.map((stage) => (
            <PipelineColumn
              key={stage.key}
              stage={stage}
              candidates={candidatesByStage[stage.key]}
              onMoveCandidate={moveCandidate}
              onAction={handleAction}
            />
          ))}
        </div>
      </motion.div>

      {/* Note Dialog */}
      <AddNoteDialog
        candidate={selectedCandidate}
        open={noteDialogOpen}
        onOpenChange={setNoteDialogOpen}
      />
    </div>
  );
}
