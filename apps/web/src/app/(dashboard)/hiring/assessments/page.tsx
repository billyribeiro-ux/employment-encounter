"use client";

import { useState, useMemo } from "react";
import {
  ClipboardCheck,
  Plus,
  Search,
  Clock,
  Users,
  BarChart3,
  TrendingUp,
  Send,
  Eye,
  Code2,
  FileText,
  Brain,
  Puzzle,
  MessageSquare,
  Globe,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronDown,
  Copy,
  Monitor,
  Timer,
  Upload,
  Video,
  Filter,
  Download,
  Star,
  Zap,
  ArrowUpDown,
  MoreHorizontal,
  Trash2,
  Pencil,
  Mail,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ─── Types ─────────────────────────────────────────────────────────

type Category =
  | "Technical"
  | "Cognitive"
  | "Personality"
  | "Coding Challenge"
  | "Case Study"
  | "Language";

type Difficulty = "Easy" | "Medium" | "Hard" | "Expert";

type QuestionType =
  | "Multiple Choice"
  | "Code Editor"
  | "Short Answer"
  | "File Upload"
  | "Video Response";

interface Assessment {
  id: string;
  title: string;
  description: string;
  category: Category;
  duration: number; // minutes
  difficulty: Difficulty;
  questionsCount: number;
  completionRate: number;
  avgScore: number;
  passRate: number;
  createdAt: string;
  isTemplate: boolean;
  status: "active" | "draft" | "archived";
}

interface CandidateResult {
  id: string;
  candidateName: string;
  candidateEmail: string;
  assessmentId: string;
  assessmentTitle: string;
  score: number;
  percentile: number;
  timeTaken: number; // minutes
  completedAt: string;
  status: "passed" | "failed" | "in_progress" | "expired";
  tabSwitches: number;
  copyPasteDetected: boolean;
  timeAnomalies: boolean;
  questionBreakdown: {
    questionNumber: number;
    type: QuestionType;
    score: number;
    maxScore: number;
    timeSpent: number;
  }[];
}

// ─── Simulated Data ─────────────────────────────────────────────

const CATEGORIES: Category[] = [
  "Technical",
  "Cognitive",
  "Personality",
  "Coding Challenge",
  "Case Study",
  "Language",
];

const CATEGORY_ICONS: Record<Category, React.ElementType> = {
  Technical: Code2,
  Cognitive: Brain,
  Personality: Puzzle,
  "Coding Challenge": Monitor,
  "Case Study": FileText,
  Language: Globe,
};

const CATEGORY_COLORS: Record<Category, string> = {
  Technical: "bg-blue-500/10 text-blue-700 border-blue-200",
  Cognitive: "bg-purple-500/10 text-purple-700 border-purple-200",
  Personality: "bg-pink-500/10 text-pink-700 border-pink-200",
  "Coding Challenge": "bg-amber-500/10 text-amber-700 border-amber-200",
  "Case Study": "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  Language: "bg-cyan-500/10 text-cyan-700 border-cyan-200",
};

const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  Easy: "bg-green-100 text-green-700",
  Medium: "bg-yellow-100 text-yellow-700",
  Hard: "bg-orange-100 text-orange-700",
  Expert: "bg-red-100 text-red-700",
};

const ASSESSMENTS: Assessment[] = [
  {
    id: "a1",
    title: "JavaScript Fundamentals",
    description:
      "Core JavaScript concepts including closures, prototypes, async/await, and ES6+ features.",
    category: "Technical",
    duration: 45,
    difficulty: "Medium",
    questionsCount: 25,
    completionRate: 87,
    avgScore: 72,
    passRate: 68,
    createdAt: "2025-12-15",
    isTemplate: false,
    status: "active",
  },
  {
    id: "a2",
    title: "React & TypeScript Assessment",
    description:
      "Advanced React patterns, hooks, TypeScript generics, and state management evaluation.",
    category: "Technical",
    duration: 60,
    difficulty: "Hard",
    questionsCount: 30,
    completionRate: 79,
    avgScore: 65,
    passRate: 55,
    createdAt: "2025-11-20",
    isTemplate: false,
    status: "active",
  },
  {
    id: "a3",
    title: "Algorithm & Data Structures",
    description:
      "Live coding challenges covering sorting, trees, graphs, dynamic programming, and Big-O analysis.",
    category: "Coding Challenge",
    duration: 90,
    difficulty: "Expert",
    questionsCount: 8,
    completionRate: 64,
    avgScore: 58,
    passRate: 42,
    createdAt: "2025-10-05",
    isTemplate: false,
    status: "active",
  },
  {
    id: "a4",
    title: "Logical Reasoning",
    description:
      "Pattern recognition, deductive reasoning, numerical sequences, and verbal reasoning tasks.",
    category: "Cognitive",
    duration: 30,
    difficulty: "Medium",
    questionsCount: 40,
    completionRate: 92,
    avgScore: 74,
    passRate: 71,
    createdAt: "2025-09-18",
    isTemplate: false,
    status: "active",
  },
  {
    id: "a5",
    title: "Culture Fit & Work Style",
    description:
      "Personality trait analysis aligned to team dynamics, conflict resolution, and leadership potential.",
    category: "Personality",
    duration: 20,
    difficulty: "Easy",
    questionsCount: 50,
    completionRate: 95,
    avgScore: 0,
    passRate: 0,
    createdAt: "2025-08-22",
    isTemplate: false,
    status: "active",
  },
  {
    id: "a6",
    title: "Product Strategy Case Study",
    description:
      "Evaluate product thinking through a real-world market entry scenario with data-driven decision making.",
    category: "Case Study",
    duration: 75,
    difficulty: "Hard",
    questionsCount: 5,
    completionRate: 71,
    avgScore: 68,
    passRate: 52,
    createdAt: "2025-07-30",
    isTemplate: false,
    status: "active",
  },
  {
    id: "a7",
    title: "SQL & Data Modeling",
    description:
      "Write complex queries, optimize database schemas, and solve data pipeline challenges.",
    category: "Coding Challenge",
    duration: 50,
    difficulty: "Medium",
    questionsCount: 15,
    completionRate: 82,
    avgScore: 70,
    passRate: 63,
    createdAt: "2025-11-12",
    isTemplate: false,
    status: "active",
  },
  {
    id: "a8",
    title: "Business English Proficiency",
    description:
      "Reading comprehension, professional writing, and verbal communication in a business context.",
    category: "Language",
    duration: 35,
    difficulty: "Easy",
    questionsCount: 30,
    completionRate: 91,
    avgScore: 81,
    passRate: 85,
    createdAt: "2025-06-14",
    isTemplate: false,
    status: "active",
  },
];

const TEMPLATES = [
  {
    id: "t1",
    name: "Frontend Developer",
    description:
      "Comprehensive evaluation covering HTML/CSS, JavaScript, React, and UI/UX sensibility.",
    assessments: ["JavaScript Fundamentals", "React & TypeScript Assessment", "Culture Fit & Work Style"],
    totalDuration: 125,
    difficulty: "Hard" as Difficulty,
  },
  {
    id: "t2",
    name: "Data Engineer",
    description:
      "SQL proficiency, data modeling, algorithm skills, and logical reasoning combined.",
    assessments: ["SQL & Data Modeling", "Algorithm & Data Structures", "Logical Reasoning"],
    totalDuration: 170,
    difficulty: "Expert" as Difficulty,
  },
  {
    id: "t3",
    name: "Product Manager",
    description:
      "Product strategy, analytical thinking, communication skills, and culture alignment.",
    assessments: ["Product Strategy Case Study", "Logical Reasoning", "Culture Fit & Work Style"],
    totalDuration: 125,
    difficulty: "Medium" as Difficulty,
  },
  {
    id: "t4",
    name: "Customer Support",
    description:
      "Language proficiency, personality fit, and case-based problem resolution.",
    assessments: ["Business English Proficiency", "Culture Fit & Work Style", "Product Strategy Case Study"],
    totalDuration: 130,
    difficulty: "Easy" as Difficulty,
  },
];

const CANDIDATE_RESULTS: CandidateResult[] = [
  {
    id: "r1",
    candidateName: "Sarah Chen",
    candidateEmail: "sarah.chen@email.com",
    assessmentId: "a1",
    assessmentTitle: "JavaScript Fundamentals",
    score: 88,
    percentile: 92,
    timeTaken: 38,
    completedAt: "2026-01-15T14:30:00Z",
    status: "passed",
    tabSwitches: 1,
    copyPasteDetected: false,
    timeAnomalies: false,
    questionBreakdown: [
      { questionNumber: 1, type: "Multiple Choice", score: 4, maxScore: 4, timeSpent: 2 },
      { questionNumber: 2, type: "Code Editor", score: 8, maxScore: 10, timeSpent: 6 },
      { questionNumber: 3, type: "Multiple Choice", score: 4, maxScore: 4, timeSpent: 1 },
      { questionNumber: 4, type: "Short Answer", score: 7, maxScore: 8, timeSpent: 4 },
      { questionNumber: 5, type: "Code Editor", score: 9, maxScore: 10, timeSpent: 8 },
    ],
  },
  {
    id: "r2",
    candidateName: "Marcus Johnson",
    candidateEmail: "marcus.j@email.com",
    assessmentId: "a1",
    assessmentTitle: "JavaScript Fundamentals",
    score: 72,
    percentile: 65,
    timeTaken: 44,
    completedAt: "2026-01-14T10:15:00Z",
    status: "passed",
    tabSwitches: 3,
    copyPasteDetected: true,
    timeAnomalies: false,
    questionBreakdown: [
      { questionNumber: 1, type: "Multiple Choice", score: 3, maxScore: 4, timeSpent: 3 },
      { questionNumber: 2, type: "Code Editor", score: 6, maxScore: 10, timeSpent: 9 },
      { questionNumber: 3, type: "Multiple Choice", score: 4, maxScore: 4, timeSpent: 2 },
      { questionNumber: 4, type: "Short Answer", score: 5, maxScore: 8, timeSpent: 5 },
      { questionNumber: 5, type: "Code Editor", score: 7, maxScore: 10, timeSpent: 10 },
    ],
  },
  {
    id: "r3",
    candidateName: "Emily Rodriguez",
    candidateEmail: "emily.r@email.com",
    assessmentId: "a2",
    assessmentTitle: "React & TypeScript Assessment",
    score: 91,
    percentile: 96,
    timeTaken: 52,
    completedAt: "2026-01-13T16:45:00Z",
    status: "passed",
    tabSwitches: 0,
    copyPasteDetected: false,
    timeAnomalies: false,
    questionBreakdown: [
      { questionNumber: 1, type: "Multiple Choice", score: 4, maxScore: 4, timeSpent: 1 },
      { questionNumber: 2, type: "Code Editor", score: 10, maxScore: 10, timeSpent: 7 },
      { questionNumber: 3, type: "Code Editor", score: 9, maxScore: 10, timeSpent: 8 },
      { questionNumber: 4, type: "Short Answer", score: 8, maxScore: 8, timeSpent: 3 },
      { questionNumber: 5, type: "Multiple Choice", score: 4, maxScore: 4, timeSpent: 1 },
    ],
  },
  {
    id: "r4",
    candidateName: "David Kim",
    candidateEmail: "david.kim@email.com",
    assessmentId: "a3",
    assessmentTitle: "Algorithm & Data Structures",
    score: 45,
    percentile: 28,
    timeTaken: 89,
    completedAt: "2026-01-12T11:00:00Z",
    status: "failed",
    tabSwitches: 7,
    copyPasteDetected: true,
    timeAnomalies: true,
    questionBreakdown: [
      { questionNumber: 1, type: "Code Editor", score: 5, maxScore: 15, timeSpent: 18 },
      { questionNumber: 2, type: "Code Editor", score: 8, maxScore: 15, timeSpent: 15 },
      { questionNumber: 3, type: "Code Editor", score: 3, maxScore: 15, timeSpent: 20 },
      { questionNumber: 4, type: "Short Answer", score: 6, maxScore: 10, timeSpent: 5 },
    ],
  },
  {
    id: "r5",
    candidateName: "Aisha Patel",
    candidateEmail: "aisha.p@email.com",
    assessmentId: "a4",
    assessmentTitle: "Logical Reasoning",
    score: 82,
    percentile: 78,
    timeTaken: 26,
    completedAt: "2026-01-11T09:30:00Z",
    status: "passed",
    tabSwitches: 0,
    copyPasteDetected: false,
    timeAnomalies: false,
    questionBreakdown: [
      { questionNumber: 1, type: "Multiple Choice", score: 3, maxScore: 3, timeSpent: 1 },
      { questionNumber: 2, type: "Multiple Choice", score: 3, maxScore: 3, timeSpent: 2 },
      { questionNumber: 3, type: "Multiple Choice", score: 2, maxScore: 3, timeSpent: 2 },
      { questionNumber: 4, type: "Short Answer", score: 5, maxScore: 6, timeSpent: 4 },
    ],
  },
  {
    id: "r6",
    candidateName: "James Thompson",
    candidateEmail: "james.t@email.com",
    assessmentId: "a6",
    assessmentTitle: "Product Strategy Case Study",
    score: 76,
    percentile: 70,
    timeTaken: 68,
    completedAt: "2026-01-10T13:20:00Z",
    status: "passed",
    tabSwitches: 2,
    copyPasteDetected: false,
    timeAnomalies: false,
    questionBreakdown: [
      { questionNumber: 1, type: "Short Answer", score: 14, maxScore: 20, timeSpent: 15 },
      { questionNumber: 2, type: "File Upload", score: 18, maxScore: 20, timeSpent: 12 },
      { questionNumber: 3, type: "Video Response", score: 16, maxScore: 20, timeSpent: 10 },
    ],
  },
  {
    id: "r7",
    candidateName: "Lisa Wang",
    candidateEmail: "lisa.wang@email.com",
    assessmentId: "a7",
    assessmentTitle: "SQL & Data Modeling",
    score: 85,
    percentile: 88,
    timeTaken: 42,
    completedAt: "2026-01-09T15:00:00Z",
    status: "passed",
    tabSwitches: 1,
    copyPasteDetected: false,
    timeAnomalies: false,
    questionBreakdown: [
      { questionNumber: 1, type: "Code Editor", score: 9, maxScore: 10, timeSpent: 5 },
      { questionNumber: 2, type: "Code Editor", score: 8, maxScore: 10, timeSpent: 7 },
      { questionNumber: 3, type: "Multiple Choice", score: 4, maxScore: 4, timeSpent: 2 },
      { questionNumber: 4, type: "Short Answer", score: 7, maxScore: 8, timeSpent: 4 },
    ],
  },
  {
    id: "r8",
    candidateName: "Robert Garcia",
    candidateEmail: "robert.g@email.com",
    assessmentId: "a1",
    assessmentTitle: "JavaScript Fundamentals",
    score: 55,
    percentile: 35,
    timeTaken: 44,
    completedAt: "2026-01-08T10:45:00Z",
    status: "failed",
    tabSwitches: 5,
    copyPasteDetected: true,
    timeAnomalies: true,
    questionBreakdown: [
      { questionNumber: 1, type: "Multiple Choice", score: 2, maxScore: 4, timeSpent: 3 },
      { questionNumber: 2, type: "Code Editor", score: 4, maxScore: 10, timeSpent: 10 },
      { questionNumber: 3, type: "Multiple Choice", score: 3, maxScore: 4, timeSpent: 2 },
      { questionNumber: 4, type: "Short Answer", score: 3, maxScore: 8, timeSpent: 6 },
      { questionNumber: 5, type: "Code Editor", score: 5, maxScore: 10, timeSpent: 9 },
    ],
  },
  {
    id: "r9",
    candidateName: "Nina Petrova",
    candidateEmail: "nina.p@email.com",
    assessmentId: "a2",
    assessmentTitle: "React & TypeScript Assessment",
    score: 68,
    percentile: 55,
    timeTaken: 58,
    completedAt: "2026-01-07T14:10:00Z",
    status: "passed",
    tabSwitches: 2,
    copyPasteDetected: false,
    timeAnomalies: false,
    questionBreakdown: [
      { questionNumber: 1, type: "Multiple Choice", score: 3, maxScore: 4, timeSpent: 2 },
      { questionNumber: 2, type: "Code Editor", score: 7, maxScore: 10, timeSpent: 9 },
      { questionNumber: 3, type: "Code Editor", score: 6, maxScore: 10, timeSpent: 10 },
      { questionNumber: 4, type: "Short Answer", score: 6, maxScore: 8, timeSpent: 4 },
      { questionNumber: 5, type: "Multiple Choice", score: 4, maxScore: 4, timeSpent: 1 },
    ],
  },
  {
    id: "r10",
    candidateName: "Alex Turner",
    candidateEmail: "alex.t@email.com",
    assessmentId: "a3",
    assessmentTitle: "Algorithm & Data Structures",
    score: 78,
    percentile: 75,
    timeTaken: 82,
    completedAt: "2026-01-06T09:00:00Z",
    status: "passed",
    tabSwitches: 0,
    copyPasteDetected: false,
    timeAnomalies: false,
    questionBreakdown: [
      { questionNumber: 1, type: "Code Editor", score: 12, maxScore: 15, timeSpent: 14 },
      { questionNumber: 2, type: "Code Editor", score: 11, maxScore: 15, timeSpent: 16 },
      { questionNumber: 3, type: "Code Editor", score: 10, maxScore: 15, timeSpent: 18 },
      { questionNumber: 4, type: "Short Answer", score: 8, maxScore: 10, timeSpent: 6 },
    ],
  },
  {
    id: "r11",
    candidateName: "Priya Sharma",
    candidateEmail: "priya.s@email.com",
    assessmentId: "a8",
    assessmentTitle: "Business English Proficiency",
    score: 94,
    percentile: 98,
    timeTaken: 28,
    completedAt: "2026-01-05T11:30:00Z",
    status: "passed",
    tabSwitches: 0,
    copyPasteDetected: false,
    timeAnomalies: false,
    questionBreakdown: [
      { questionNumber: 1, type: "Multiple Choice", score: 5, maxScore: 5, timeSpent: 2 },
      { questionNumber: 2, type: "Short Answer", score: 9, maxScore: 10, timeSpent: 5 },
      { questionNumber: 3, type: "Multiple Choice", score: 5, maxScore: 5, timeSpent: 1 },
      { questionNumber: 4, type: "Video Response", score: 9, maxScore: 10, timeSpent: 8 },
    ],
  },
  {
    id: "r12",
    candidateName: "Michael Brooks",
    candidateEmail: "michael.b@email.com",
    assessmentId: "a4",
    assessmentTitle: "Logical Reasoning",
    score: 61,
    percentile: 42,
    timeTaken: 29,
    completedAt: "2026-01-04T08:15:00Z",
    status: "failed",
    tabSwitches: 4,
    copyPasteDetected: false,
    timeAnomalies: true,
    questionBreakdown: [
      { questionNumber: 1, type: "Multiple Choice", score: 2, maxScore: 3, timeSpent: 2 },
      { questionNumber: 2, type: "Multiple Choice", score: 1, maxScore: 3, timeSpent: 3 },
      { questionNumber: 3, type: "Multiple Choice", score: 2, maxScore: 3, timeSpent: 2 },
      { questionNumber: 4, type: "Short Answer", score: 3, maxScore: 6, timeSpent: 5 },
    ],
  },
];

const QUESTION_TYPE_ICONS: Record<QuestionType, React.ElementType> = {
  "Multiple Choice": ClipboardCheck,
  "Code Editor": Code2,
  "Short Answer": FileText,
  "File Upload": Upload,
  "Video Response": Video,
};

// ─── Utility Helpers ──────────────────────────────────────────

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-600";
}

function scoreBarColor(score: number) {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-red-500";
}

// ─── Components ──────────────────────────────────────────────

function StatsBar() {
  const totalAssessments = ASSESSMENTS.length;
  const avgCompletionRate =
    Math.round(
      ASSESSMENTS.reduce((s, a) => s + a.completionRate, 0) / totalAssessments
    );
  const avgScore = Math.round(
    ASSESSMENTS.filter((a) => a.avgScore > 0).reduce(
      (s, a, _, arr) => s + a.avgScore / arr.length,
      0
    )
  );
  const avgPassRate = Math.round(
    ASSESSMENTS.filter((a) => a.passRate > 0).reduce(
      (s, a, _, arr) => s + a.passRate / arr.length,
      0
    )
  );

  const stats = [
    {
      label: "Total Assessments",
      value: totalAssessments,
      icon: ClipboardCheck,
      color: "text-blue-600",
    },
    {
      label: "Avg Score",
      value: `${avgScore}%`,
      icon: BarChart3,
      color: "text-emerald-600",
    },
    {
      label: "Completion Rate",
      value: `${avgCompletionRate}%`,
      icon: TrendingUp,
      color: "text-violet-600",
    },
    {
      label: "Pass Rate",
      value: `${avgPassRate}%`,
      icon: CheckCircle2,
      color: "text-amber-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.08 }}
        >
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-xs font-medium text-muted-foreground">
                  {stat.label}
                </span>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

function AssessmentCard({
  assessment,
  index,
  onViewResults,
  onSendInvite,
}: {
  assessment: Assessment;
  index: number;
  onViewResults: (id: string) => void;
  onSendInvite: (id: string) => void;
}) {
  const Icon = CATEGORY_ICONS[assessment.category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
    >
      <Card className="hover:shadow-md transition-shadow group">
        <CardContent className="pt-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div
                className={`p-2 rounded-lg border ${CATEGORY_COLORS[assessment.category]}`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm truncate">
                  {assessment.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {assessment.description}
                </p>
              </div>
            </div>
            <Badge className={DIFFICULTY_COLORS[assessment.difficulty]} variant="outline">
              {assessment.difficulty}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{assessment.duration}m</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <FileText className="h-3 w-3" />
              <span>{assessment.questionsCount} questions</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{assessment.completionRate}% done</span>
            </div>
          </div>

          {assessment.avgScore > 0 && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Avg Score</span>
                <span className={`font-semibold ${scoreColor(assessment.avgScore)}`}>
                  {assessment.avgScore}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${scoreBarColor(assessment.avgScore)}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${assessment.avgScore}%` }}
                  transition={{ duration: 0.8, delay: index * 0.06 + 0.3 }}
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">
              {assessment.category}
            </Badge>
            <div className="flex-1" />
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onViewResults(assessment.id)}
            >
              <Eye className="h-3 w-3 mr-1" />
              Results
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onSendInvite(assessment.id)}
            >
              <Send className="h-3 w-3 mr-1" />
              Invite
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CreateAssessmentDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("");
  const [duration, setDuration] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>([]);

  const questionTypes: QuestionType[] = [
    "Multiple Choice",
    "Code Editor",
    "Short Answer",
    "File Upload",
    "Video Response",
  ];

  function toggleType(t: QuestionType) {
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !category || !difficulty) return;
    toast.success("Assessment created successfully", {
      description: `"${title}" has been added to your assessment library.`,
    });
    setOpen(false);
    setTitle("");
    setDescription("");
    setCategory("");
    setDifficulty("");
    setDuration("");
    setSelectedTypes([]);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Assessment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Custom Assessment</DialogTitle>
            <DialogDescription>
              Design a new assessment with custom question types and settings.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="assess-title">Title</Label>
              <Input
                id="assess-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior React Developer Test"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="assess-desc">Description</Label>
              <Textarea
                id="assess-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this assessment evaluates..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Difficulty</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    {(["Easy", "Medium", "Hard", "Expert"] as Difficulty[]).map(
                      (d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="assess-dur">Duration (minutes)</Label>
              <Input
                id="assess-dur"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="45"
                min={5}
                max={240}
              />
            </div>
            <div className="grid gap-2">
              <Label>Question Types</Label>
              <div className="flex flex-wrap gap-2">
                {questionTypes.map((qt) => {
                  const QtIcon = QUESTION_TYPE_ICONS[qt];
                  const isSelected = selectedTypes.includes(qt);
                  return (
                    <Button
                      key={qt}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className="text-xs h-8"
                      onClick={() => toggleType(qt)}
                    >
                      <QtIcon className="h-3 w-3 mr-1" />
                      {qt}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Assessment</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SendInviteDialog({
  open,
  onOpenChange,
  assessmentId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  assessmentId: string | null;
}) {
  const [emails, setEmails] = useState("");
  const [deadline, setDeadline] = useState("");
  const [message, setMessage] = useState("");
  const assessment = ASSESSMENTS.find((a) => a.id === assessmentId);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const count = emails
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean).length;
    toast.success(`Invitations sent to ${count} candidate${count !== 1 ? "s" : ""}`, {
      description: `Assessment: ${assessment?.title}`,
    });
    onOpenChange(false);
    setEmails("");
    setDeadline("");
    setMessage("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSend}>
          <DialogHeader>
            <DialogTitle>Send Assessment Invitation</DialogTitle>
            <DialogDescription>
              Invite candidates to take &quot;{assessment?.title ?? ""}&quot;.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Candidate Emails</Label>
              <Textarea
                value={emails}
                onChange={(e) => setEmails(e.target.value)}
                placeholder="comma-separated emails..."
                rows={3}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Deadline</Label>
              <Input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Custom Message (optional)</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a personal note to the invitation..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              <Send className="mr-2 h-4 w-4" />
              Send Invitations
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CandidateResultsPanel({
  assessmentId,
  onBack,
}: {
  assessmentId: string;
  onBack: () => void;
}) {
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const assessment = ASSESSMENTS.find((a) => a.id === assessmentId);
  const results = CANDIDATE_RESULTS.filter(
    (r) => r.assessmentId === assessmentId
  ).sort((a, b) => b.score - a.score);

  const selectedResult = results.find((r) => r.id === selectedCandidate);
  const comparedResults = results.filter((r) => compareIds.includes(r.id));

  function toggleCompare(id: string) {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(-3)
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
          Back
        </Button>
        <div>
          <h3 className="font-semibold">{assessment?.title}</h3>
          <p className="text-xs text-muted-foreground">
            {results.length} candidate results
          </p>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <Label className="text-xs">Compare Mode</Label>
          <Switch
            checked={compareMode}
            onCheckedChange={(v) => {
              setCompareMode(v);
              if (!v) setCompareIds([]);
            }}
          />
        </div>
      </div>

      {/* Comparison View */}
      <AnimatePresence>
        {compareMode && comparedResults.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-blue-200 bg-blue-50/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Candidate Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Metric</TableHead>
                        {comparedResults.map((r) => (
                          <TableHead key={r.id}>{r.candidateName}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Score</TableCell>
                        {comparedResults.map((r) => (
                          <TableCell key={r.id}>
                            <span className={`font-bold ${scoreColor(r.score)}`}>
                              {r.score}%
                            </span>
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Percentile</TableCell>
                        {comparedResults.map((r) => (
                          <TableCell key={r.id}>{r.percentile}th</TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Time</TableCell>
                        {comparedResults.map((r) => (
                          <TableCell key={r.id}>{r.timeTaken}m</TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Flags</TableCell>
                        {comparedResults.map((r) => (
                          <TableCell key={r.id}>
                            <div className="flex gap-1 flex-wrap">
                              {r.tabSwitches > 2 && (
                                <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
                                  {r.tabSwitches} tabs
                                </Badge>
                              )}
                              {r.copyPasteDetected && (
                                <Badge variant="outline" className="text-[10px] text-red-600 border-red-300">
                                  copy/paste
                                </Badge>
                              )}
                              {r.timeAnomalies && (
                                <Badge variant="outline" className="text-[10px] text-red-600 border-red-300">
                                  time anomaly
                                </Badge>
                              )}
                              {r.tabSwitches <= 2 &&
                                !r.copyPasteDetected &&
                                !r.timeAnomalies && (
                                  <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300">
                                    clean
                                  </Badge>
                                )}
                            </div>
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Table */}
      <Card>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {compareMode && <TableHead className="w-10" />}
                  <TableHead>Candidate</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Percentile</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Integrity</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r, idx) => {
                  const hasFlags =
                    r.tabSwitches > 2 || r.copyPasteDetected || r.timeAnomalies;
                  return (
                    <motion.tr
                      key={r.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.04 }}
                      className="border-b last:border-0 hover:bg-muted/30"
                    >
                      {compareMode && (
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={compareIds.includes(r.id)}
                            onChange={() => toggleCompare(r.id)}
                            className="rounded border-gray-300"
                          />
                        </TableCell>
                      )}
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{r.candidateName}</p>
                          <p className="text-xs text-muted-foreground">
                            {r.candidateEmail}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`font-bold ${scoreColor(r.score)}`}>
                          {r.score}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{r.percentile}th</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{r.timeTaken}m</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            r.status === "passed"
                              ? "default"
                              : r.status === "failed"
                              ? "destructive"
                              : "secondary"
                          }
                          className="text-[10px]"
                        >
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {hasFlags ? (
                          <div className="flex gap-1 flex-wrap">
                            {r.tabSwitches > 2 && (
                              <Badge
                                variant="outline"
                                className="text-[10px] text-amber-600 border-amber-300"
                              >
                                <Monitor className="h-2.5 w-2.5 mr-0.5" />
                                {r.tabSwitches} tabs
                              </Badge>
                            )}
                            {r.copyPasteDetected && (
                              <Badge
                                variant="outline"
                                className="text-[10px] text-red-600 border-red-300"
                              >
                                <Copy className="h-2.5 w-2.5 mr-0.5" />
                                copy
                              </Badge>
                            )}
                            {r.timeAnomalies && (
                              <Badge
                                variant="outline"
                                className="text-[10px] text-red-600 border-red-300"
                              >
                                <Timer className="h-2.5 w-2.5 mr-0.5" />
                                time
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-[10px] text-emerald-600 border-emerald-300"
                          >
                            <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                            clean
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() =>
                            setSelectedCandidate(
                              selectedCandidate === r.id ? null : r.id
                            )
                          }
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Details
                        </Button>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Candidate Detail Breakdown */}
          <AnimatePresence>
            {selectedResult && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <Separator className="my-4" />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">
                      Question-by-Question Breakdown: {selectedResult.candidateName}
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => setSelectedCandidate(null)}
                    >
                      Close
                    </Button>
                  </div>
                  <div className="grid gap-2">
                    {selectedResult.questionBreakdown.map((q) => {
                      const pct = Math.round((q.score / q.maxScore) * 100);
                      const QtIcon = QUESTION_TYPE_ICONS[q.type];
                      return (
                        <motion.div
                          key={q.questionNumber}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: q.questionNumber * 0.05 }}
                          className="flex items-center gap-3 rounded-lg border p-3"
                        >
                          <div className="flex items-center gap-2 w-32 shrink-0">
                            <QtIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-medium">Q{q.questionNumber}</span>
                            <Badge variant="outline" className="text-[9px]">
                              {q.type}
                            </Badge>
                          </div>
                          <div className="flex-1">
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <motion.div
                                className={`h-full rounded-full ${scoreBarColor(pct)}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.5 }}
                              />
                            </div>
                          </div>
                          <span className={`text-xs font-semibold w-16 text-right ${scoreColor(pct)}`}>
                            {q.score}/{q.maxScore}
                          </span>
                          <span className="text-xs text-muted-foreground w-12 text-right">
                            {q.timeSpent}m
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Main Page ──────────────────────────────────────────────

export default function AssessmentsPage() {
  const [activeTab, setActiveTab] = useState("library");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingResults, setViewingResults] = useState<string | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteAssessmentId, setInviteAssessmentId] = useState<string | null>(null);

  const filteredAssessments = useMemo(() => {
    return ASSESSMENTS.filter((a) => {
      if (categoryFilter !== "all" && a.category !== categoryFilter) return false;
      if (
        searchQuery &&
        !a.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !a.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      return true;
    });
  }, [categoryFilter, searchQuery]);

  const allResults = CANDIDATE_RESULTS;

  function handleViewResults(id: string) {
    setViewingResults(id);
    setActiveTab("results");
  }

  function handleSendInvite(id: string) {
    setInviteAssessmentId(id);
    setInviteDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Skill Assessments
          </h1>
          <p className="text-muted-foreground">
            Pre-screening tests and coding challenges for candidates
          </p>
        </div>
        <CreateAssessmentDialog />
      </motion.div>

      <StatsBar />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="library">
            <ClipboardCheck className="h-4 w-4 mr-2" />
            Assessment Library
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Zap className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="results">
            <BarChart3 className="h-4 w-4 mr-2" />
            Candidate Results
          </TabsTrigger>
        </TabsList>

        {/* ─── Library Tab ─── */}
        <TabsContent value="library" className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search assessments..."
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category quick filters */}
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICONS[cat];
              const count = ASSESSMENTS.filter((a) => a.category === cat).length;
              return (
                <motion.div
                  key={cat}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Button
                    variant={categoryFilter === cat ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                    onClick={() =>
                      setCategoryFilter(categoryFilter === cat ? "all" : cat)
                    }
                  >
                    <Icon className="h-3 w-3 mr-1" />
                    {cat}
                    <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 h-4">
                      {count}
                    </Badge>
                  </Button>
                </motion.div>
              );
            })}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAssessments.map((assessment, index) => (
              <AssessmentCard
                key={assessment.id}
                assessment={assessment}
                index={index}
                onViewResults={handleViewResults}
                onSendInvite={handleSendInvite}
              />
            ))}
          </div>

          {filteredAssessments.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <Search className="h-8 w-8 text-muted-foreground mb-3" />
              <h3 className="text-lg font-semibold mb-1">No assessments found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filter criteria.
              </p>
            </motion.div>
          )}
        </TabsContent>

        {/* ─── Templates Tab ─── */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {TEMPLATES.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.08 }}
              >
                <Card className="hover:shadow-md transition-shadow h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">
                          {template.name}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          {template.description}
                        </p>
                      </div>
                      <Badge
                        className={DIFFICULTY_COLORS[template.difficulty]}
                        variant="outline"
                      >
                        {template.difficulty}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      {template.assessments.map((a, i) => (
                        <div
                          key={a}
                          className="flex items-center gap-2 text-sm"
                        >
                          <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                            {i + 1}
                          </div>
                          <span>{a}</span>
                        </div>
                      ))}
                    </div>
                    <Separator className="mb-3" />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {template.totalDuration}m total
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {template.assessments.length} assessments
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          toast.success(
                            `"${template.name}" template applied`,
                            {
                              description: `${template.assessments.length} assessments will be sent to candidates.`,
                            }
                          );
                        }}
                      >
                        <Zap className="h-3 w-3 mr-1" />
                        Use Template
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* ─── Results Tab ─── */}
        <TabsContent value="results" className="space-y-4">
          {viewingResults ? (
            <CandidateResultsPanel
              assessmentId={viewingResults}
              onBack={() => setViewingResults(null)}
            />
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  All candidate results across assessments. Click an assessment
                  below to drill in.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    toast.success("Results exported to CSV");
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Results
                </Button>
              </div>

              {/* Quick assessment selector */}
              <div className="flex gap-2 flex-wrap">
                {ASSESSMENTS.map((a) => {
                  const resultCount = allResults.filter(
                    (r) => r.assessmentId === a.id
                  ).length;
                  if (resultCount === 0) return null;
                  return (
                    <Button
                      key={a.id}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => setViewingResults(a.id)}
                    >
                      {a.title}
                      <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 h-4">
                        {resultCount}
                      </Badge>
                    </Button>
                  );
                })}
              </div>

              {/* All Results Table */}
              <Card>
                <CardContent className="pt-4">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Candidate</TableHead>
                          <TableHead>Assessment</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Percentile</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Integrity</TableHead>
                          <TableHead>Completed</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allResults.map((r, idx) => {
                          const hasFlags =
                            r.tabSwitches > 2 ||
                            r.copyPasteDetected ||
                            r.timeAnomalies;
                          return (
                            <motion.tr
                              key={r.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: idx * 0.03 }}
                              className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                              onClick={() => handleViewResults(r.assessmentId)}
                            >
                              <TableCell>
                                <p className="font-medium text-sm">
                                  {r.candidateName}
                                </p>
                              </TableCell>
                              <TableCell className="text-sm">
                                {r.assessmentTitle}
                              </TableCell>
                              <TableCell>
                                <span
                                  className={`font-bold ${scoreColor(r.score)}`}
                                >
                                  {r.score}%
                                </span>
                              </TableCell>
                              <TableCell>{r.percentile}th</TableCell>
                              <TableCell>{r.timeTaken}m</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    r.status === "passed"
                                      ? "default"
                                      : r.status === "failed"
                                      ? "destructive"
                                      : "secondary"
                                  }
                                  className="text-[10px]"
                                >
                                  {r.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {hasFlags ? (
                                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                                ) : (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {formatDate(r.completedAt)}
                              </TableCell>
                            </motion.tr>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </TabsContent>
      </Tabs>

      {/* Send Invite Dialog */}
      <SendInviteDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        assessmentId={inviteAssessmentId}
      />
    </div>
  );
}
