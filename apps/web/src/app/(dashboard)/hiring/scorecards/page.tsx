"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardCheck,
  Plus,
  Star,
  Users,
  BarChart3,
  Eye,
  Copy,
  Trash2,
  ChevronDown,
  ChevronRight,
  Search,
  Target,
  TrendingUp,
  Award,
  ThumbsUp,
  ThumbsDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Settings2,
  UserCheck,
  Radar,
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

interface Criterion {
  id: string;
  name: string;
  description: string;
  descriptors: Record<number, string>;
}

interface ScorecardSection {
  id: string;
  name: string;
  weight: number;
  criteria: Criterion[];
}

interface ScorecardTemplate {
  id: string;
  name: string;
  role: string;
  sections: ScorecardSection[];
  createdAt: string;
}

type Recommendation = "strong_hire" | "hire" | "no_hire" | "strong_no_hire";

interface CriterionScore {
  criterionId: string;
  score: number;
  notes: string;
}

interface CompletedScorecard {
  id: string;
  templateId: string;
  templateName: string;
  candidateName: string;
  candidateRole: string;
  interviewer: string;
  interviewerAvatar: string;
  interviewDate: string;
  recommendation: Recommendation;
  overallScore: number;
  sectionScores: Record<string, number>;
  scores: CriterionScore[];
  notes: string;
}

// ---------------------------------------------------------------------------
// Simulated Data
// ---------------------------------------------------------------------------

const scoreDescriptors: Record<number, string> = {
  1: "Does not meet expectations",
  2: "Partially meets expectations",
  3: "Meets expectations",
  4: "Exceeds expectations",
  5: "Significantly exceeds expectations",
};

const templates: ScorecardTemplate[] = [
  {
    id: "tmpl-eng",
    name: "Engineering Interview",
    role: "Engineering",
    createdAt: "2025-11-15",
    sections: [
      {
        id: "sec-tech",
        name: "Technical Skills",
        weight: 40,
        criteria: [
          {
            id: "c1",
            name: "Coding Ability",
            description: "Ability to write clean, efficient, and correct code",
            descriptors: scoreDescriptors,
          },
          {
            id: "c2",
            name: "System Design",
            description: "Ability to design scalable and maintainable systems",
            descriptors: scoreDescriptors,
          },
          {
            id: "c3",
            name: "Problem Solving",
            description: "Analytical thinking and approach to complex problems",
            descriptors: scoreDescriptors,
          },
        ],
      },
      {
        id: "sec-comm",
        name: "Communication",
        weight: 25,
        criteria: [
          {
            id: "c4",
            name: "Clarity of Thought",
            description: "Ability to articulate ideas clearly and concisely",
            descriptors: scoreDescriptors,
          },
          {
            id: "c5",
            name: "Active Listening",
            description: "Attentiveness and responsiveness to interviewer cues",
            descriptors: scoreDescriptors,
          },
        ],
      },
      {
        id: "sec-culture",
        name: "Culture Fit",
        weight: 20,
        criteria: [
          {
            id: "c6",
            name: "Team Collaboration",
            description: "Willingness and ability to work in cross-functional teams",
            descriptors: scoreDescriptors,
          },
          {
            id: "c7",
            name: "Growth Mindset",
            description: "Openness to feedback and continuous learning",
            descriptors: scoreDescriptors,
          },
        ],
      },
      {
        id: "sec-leadership",
        name: "Leadership",
        weight: 15,
        criteria: [
          {
            id: "c8",
            name: "Initiative",
            description: "Proactiveness and ability to drive projects forward",
            descriptors: scoreDescriptors,
          },
        ],
      },
    ],
  },
  {
    id: "tmpl-design",
    name: "Design Interview",
    role: "Design",
    createdAt: "2025-12-02",
    sections: [
      {
        id: "sec-craft",
        name: "Design Craft",
        weight: 35,
        criteria: [
          {
            id: "d1",
            name: "Visual Design",
            description: "Aesthetic sense, typography, color, and layout skills",
            descriptors: scoreDescriptors,
          },
          {
            id: "d2",
            name: "Interaction Design",
            description: "Ability to design intuitive and engaging interactions",
            descriptors: scoreDescriptors,
          },
        ],
      },
      {
        id: "sec-thinking",
        name: "Design Thinking",
        weight: 30,
        criteria: [
          {
            id: "d3",
            name: "User Research",
            description: "Ability to gather and synthesize user insights",
            descriptors: scoreDescriptors,
          },
          {
            id: "d4",
            name: "Problem Framing",
            description: "Skill at defining and scoping design challenges",
            descriptors: scoreDescriptors,
          },
        ],
      },
      {
        id: "sec-collab-d",
        name: "Collaboration",
        weight: 20,
        criteria: [
          {
            id: "d5",
            name: "Cross-functional Work",
            description: "Ability to work with engineering, product, and stakeholders",
            descriptors: scoreDescriptors,
          },
        ],
      },
      {
        id: "sec-pres",
        name: "Presentation",
        weight: 15,
        criteria: [
          {
            id: "d6",
            name: "Portfolio Presentation",
            description: "Ability to present and defend design decisions",
            descriptors: scoreDescriptors,
          },
        ],
      },
    ],
  },
  {
    id: "tmpl-sales",
    name: "Sales Interview",
    role: "Sales",
    createdAt: "2026-01-10",
    sections: [
      {
        id: "sec-sales-skill",
        name: "Sales Acumen",
        weight: 35,
        criteria: [
          {
            id: "s1",
            name: "Prospecting",
            description: "Ability to identify and qualify leads",
            descriptors: scoreDescriptors,
          },
          {
            id: "s2",
            name: "Closing Skills",
            description: "Ability to negotiate and close deals effectively",
            descriptors: scoreDescriptors,
          },
        ],
      },
      {
        id: "sec-relationship",
        name: "Relationship Building",
        weight: 30,
        criteria: [
          {
            id: "s3",
            name: "Client Rapport",
            description: "Ability to establish trust and build lasting relationships",
            descriptors: scoreDescriptors,
          },
        ],
      },
      {
        id: "sec-knowledge",
        name: "Product Knowledge",
        weight: 20,
        criteria: [
          {
            id: "s4",
            name: "Market Understanding",
            description: "Knowledge of the market landscape and competitive positioning",
            descriptors: scoreDescriptors,
          },
        ],
      },
      {
        id: "sec-drive",
        name: "Drive & Resilience",
        weight: 15,
        criteria: [
          {
            id: "s5",
            name: "Motivation",
            description: "Self-driven attitude and ability to handle rejection",
            descriptors: scoreDescriptors,
          },
        ],
      },
    ],
  },
  {
    id: "tmpl-mgmt",
    name: "Management Interview",
    role: "Management",
    createdAt: "2026-01-22",
    sections: [
      {
        id: "sec-leadership-m",
        name: "Leadership",
        weight: 35,
        criteria: [
          {
            id: "m1",
            name: "Team Building",
            description: "Ability to recruit, develop, and retain talent",
            descriptors: scoreDescriptors,
          },
          {
            id: "m2",
            name: "Vision Setting",
            description: "Ability to set clear direction and inspire teams",
            descriptors: scoreDescriptors,
          },
        ],
      },
      {
        id: "sec-strategic",
        name: "Strategic Thinking",
        weight: 30,
        criteria: [
          {
            id: "m3",
            name: "Decision Making",
            description: "Ability to make sound decisions under uncertainty",
            descriptors: scoreDescriptors,
          },
        ],
      },
      {
        id: "sec-execution",
        name: "Execution",
        weight: 20,
        criteria: [
          {
            id: "m4",
            name: "Project Delivery",
            description: "Track record of delivering results on time",
            descriptors: scoreDescriptors,
          },
        ],
      },
      {
        id: "sec-comm-m",
        name: "Communication",
        weight: 15,
        criteria: [
          {
            id: "m5",
            name: "Stakeholder Management",
            description: "Ability to communicate with and influence stakeholders",
            descriptors: scoreDescriptors,
          },
        ],
      },
    ],
  },
];

const completedScorecards: CompletedScorecard[] = [
  {
    id: "sc-1",
    templateId: "tmpl-eng",
    templateName: "Engineering Interview",
    candidateName: "Sarah Chen",
    candidateRole: "Senior Frontend Engineer",
    interviewer: "Alex Rivera",
    interviewerAvatar: "AR",
    interviewDate: "2026-02-10",
    recommendation: "strong_hire",
    overallScore: 4.5,
    sectionScores: {
      "Technical Skills": 4.7,
      Communication: 4.5,
      "Culture Fit": 4.0,
      Leadership: 4.5,
    },
    scores: [
      { criterionId: "c1", score: 5, notes: "Excellent code quality with clean patterns" },
      { criterionId: "c2", score: 4, notes: "Solid architecture decisions" },
      { criterionId: "c3", score: 5, notes: "Outstanding problem decomposition" },
      { criterionId: "c4", score: 5, notes: "Very articulate and clear" },
      { criterionId: "c5", score: 4, notes: "Good listener, asks clarifying questions" },
      { criterionId: "c6", score: 4, notes: "Collaborative attitude" },
      { criterionId: "c7", score: 4, notes: "Open to feedback" },
      { criterionId: "c8", score: 5, notes: "Self-driven, takes ownership" },
    ],
    notes: "Exceptional candidate. Strong technical skills combined with excellent communication. Would be a great addition to the team.",
  },
  {
    id: "sc-2",
    templateId: "tmpl-eng",
    templateName: "Engineering Interview",
    candidateName: "Sarah Chen",
    candidateRole: "Senior Frontend Engineer",
    interviewer: "Jordan Patel",
    interviewerAvatar: "JP",
    interviewDate: "2026-02-10",
    recommendation: "hire",
    overallScore: 3.9,
    sectionScores: {
      "Technical Skills": 4.2,
      Communication: 3.5,
      "Culture Fit": 4.0,
      Leadership: 3.5,
    },
    scores: [
      { criterionId: "c1", score: 4, notes: "Good coding skills" },
      { criterionId: "c2", score: 4, notes: "Decent system design knowledge" },
      { criterionId: "c3", score: 5, notes: "Great problem solver" },
      { criterionId: "c4", score: 4, notes: "Communicates well" },
      { criterionId: "c5", score: 3, notes: "Could improve on active listening" },
      { criterionId: "c6", score: 4, notes: "Works well in teams" },
      { criterionId: "c7", score: 4, notes: "Willing to learn" },
      { criterionId: "c8", score: 3, notes: "Shows some initiative" },
    ],
    notes: "Solid candidate with strong technical foundation. Some room for growth in communication.",
  },
  {
    id: "sc-3",
    templateId: "tmpl-eng",
    templateName: "Engineering Interview",
    candidateName: "Sarah Chen",
    candidateRole: "Senior Frontend Engineer",
    interviewer: "Morgan Lee",
    interviewerAvatar: "ML",
    interviewDate: "2026-02-11",
    recommendation: "strong_hire",
    overallScore: 4.3,
    sectionScores: {
      "Technical Skills": 4.5,
      Communication: 4.0,
      "Culture Fit": 4.5,
      Leadership: 4.0,
    },
    scores: [
      { criterionId: "c1", score: 5, notes: "Top-tier coding ability" },
      { criterionId: "c2", score: 4, notes: "Good design instincts" },
      { criterionId: "c3", score: 4, notes: "Methodical problem solving" },
      { criterionId: "c4", score: 4, notes: "Clear communicator" },
      { criterionId: "c5", score: 4, notes: "Engaged and attentive" },
      { criterionId: "c6", score: 5, notes: "Excellent team player" },
      { criterionId: "c7", score: 4, notes: "Growth-oriented mindset" },
      { criterionId: "c8", score: 4, notes: "Takes initiative naturally" },
    ],
    notes: "Strong hire. Excellent culture fit and solid technical skills. Would strengthen the team.",
  },
  {
    id: "sc-4",
    templateId: "tmpl-design",
    templateName: "Design Interview",
    candidateName: "Marcus Johnson",
    candidateRole: "Product Designer",
    interviewer: "Alex Rivera",
    interviewerAvatar: "AR",
    interviewDate: "2026-02-08",
    recommendation: "no_hire",
    overallScore: 2.6,
    sectionScores: {
      "Design Craft": 3.0,
      "Design Thinking": 2.5,
      Collaboration: 2.0,
      Presentation: 3.0,
    },
    scores: [
      { criterionId: "d1", score: 3, notes: "Decent visual skills but inconsistent" },
      { criterionId: "d2", score: 3, notes: "Basic interaction patterns" },
      { criterionId: "d3", score: 2, notes: "Limited research experience" },
      { criterionId: "d4", score: 3, notes: "Average framing ability" },
      { criterionId: "d5", score: 2, notes: "Struggled with collaboration questions" },
      { criterionId: "d6", score: 3, notes: "Portfolio presentation was okay" },
    ],
    notes: "Candidate has potential but needs more experience, especially in user research and cross-functional collaboration.",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function recommendationLabel(rec: Recommendation): string {
  const labels: Record<Recommendation, string> = {
    strong_hire: "Strong Hire",
    hire: "Hire",
    no_hire: "No Hire",
    strong_no_hire: "Strong No Hire",
  };
  return labels[rec];
}

function recommendationVariant(rec: Recommendation) {
  switch (rec) {
    case "strong_hire":
      return "default" as const;
    case "hire":
      return "secondary" as const;
    case "no_hire":
      return "outline" as const;
    case "strong_no_hire":
      return "destructive" as const;
  }
}

function recommendationIcon(rec: Recommendation) {
  switch (rec) {
    case "strong_hire":
      return <ThumbsUp className="h-4 w-4 text-emerald-500" />;
    case "hire":
      return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
    case "no_hire":
      return <Minus className="h-4 w-4 text-amber-500" />;
    case "strong_no_hire":
      return <ThumbsDown className="h-4 w-4 text-red-500" />;
  }
}

function scoreColor(score: number): string {
  if (score >= 4.5) return "text-emerald-600";
  if (score >= 3.5) return "text-blue-600";
  if (score >= 2.5) return "text-amber-600";
  return "text-red-600";
}

function scoreBg(score: number): string {
  if (score >= 4.5) return "bg-emerald-50 border-emerald-200";
  if (score >= 3.5) return "bg-blue-50 border-blue-200";
  if (score >= 2.5) return "bg-amber-50 border-amber-200";
  return "bg-red-50 border-red-200";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Radar Chart Component (SVG)
// ---------------------------------------------------------------------------

function RadarChart({
  labels,
  datasets,
  size = 240,
}: {
  labels: string[];
  datasets: { label: string; values: number[]; color: string }[];
  size?: number;
}) {
  const n = labels.length;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 40;
  const levels = 5;

  function polarToCartesian(angle: number, r: number) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  }

  function getPoints(values: number[]) {
    return values
      .map((val, i) => {
        const angle = (360 / n) * i;
        const r = (val / 5) * radius;
        const { x, y } = polarToCartesian(angle, r);
        return `${x},${y}`;
      })
      .join(" ");
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="mx-auto"
    >
      {/* Grid levels */}
      {Array.from({ length: levels }).map((_, level) => {
        const r = ((level + 1) / levels) * radius;
        const pts = Array.from({ length: n })
          .map((_, i) => {
            const angle = (360 / n) * i;
            const { x, y } = polarToCartesian(angle, r);
            return `${x},${y}`;
          })
          .join(" ");
        return (
          <polygon
            key={level}
            points={pts}
            fill="none"
            stroke="currentColor"
            strokeWidth={0.5}
            className="text-border"
          />
        );
      })}

      {/* Axis lines */}
      {labels.map((_, i) => {
        const angle = (360 / n) * i;
        const { x, y } = polarToCartesian(angle, radius);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="currentColor"
            strokeWidth={0.5}
            className="text-border"
          />
        );
      })}

      {/* Data polygons */}
      {datasets.map((ds, di) => (
        <polygon
          key={di}
          points={getPoints(ds.values)}
          fill={ds.color}
          fillOpacity={0.15}
          stroke={ds.color}
          strokeWidth={2}
        />
      ))}

      {/* Data points */}
      {datasets.map((ds, di) =>
        ds.values.map((val, i) => {
          const angle = (360 / n) * i;
          const r = (val / 5) * radius;
          const { x, y } = polarToCartesian(angle, r);
          return (
            <circle
              key={`${di}-${i}`}
              cx={x}
              cy={y}
              r={3}
              fill={ds.color}
            />
          );
        })
      )}

      {/* Labels */}
      {labels.map((label, i) => {
        const angle = (360 / n) * i;
        const { x, y } = polarToCartesian(angle, radius + 22);
        return (
          <text
            key={i}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-muted-foreground text-[10px]"
          >
            {label.length > 12 ? `${label.substring(0, 11)}...` : label}
          </text>
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Score Stars Component
// ---------------------------------------------------------------------------

function ScoreStars({
  score,
  onChange,
  readonly = false,
}: {
  score: number;
  onChange?: (val: number) => void;
  readonly?: boolean;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((val) => (
        <button
          key={val}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(val)}
          className={`transition-colors ${
            readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
          }`}
        >
          <Star
            className={`h-4 w-4 ${
              val <= score
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
// Stats Cards
// ---------------------------------------------------------------------------

function StatsOverview() {
  const totalScorecards = completedScorecards.length;
  const avgScore =
    completedScorecards.reduce((sum, sc) => sum + sc.overallScore, 0) /
    totalScorecards;
  const strongHires = completedScorecards.filter(
    (sc) => sc.recommendation === "strong_hire"
  ).length;
  const uniqueInterviewers = new Set(
    completedScorecards.map((sc) => sc.interviewer)
  ).size;

  const stats = [
    {
      label: "Total Scorecards",
      value: totalScorecards,
      icon: ClipboardCheck,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Average Score",
      value: avgScore.toFixed(1),
      icon: Target,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "Strong Hires",
      value: strongHires,
      icon: Award,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      label: "Interviewers",
      value: uniqueInterviewers,
      icon: Users,
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
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateRole, setNewTemplateRole] = useState("");

  function handleCreateTemplate() {
    if (!newTemplateName || !newTemplateRole) {
      toast.error("Please fill in all fields");
      return;
    }
    toast.success(`Template "${newTemplateName}" created successfully`);
    setCreateDialogOpen(false);
    setNewTemplateName("");
    setNewTemplateRole("");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {templates.length} scorecard templates available
        </p>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1.5 h-4 w-4" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Scorecard Template</DialogTitle>
              <DialogDescription>
                Define a new evaluation template with weighted sections and criteria.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Template Name</label>
                <Input
                  placeholder="e.g., Senior Engineer Technical Screen"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Role Category</label>
                <Select value={newTemplateRole} onValueChange={setNewTemplateRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Management">Management</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTemplate}>Create Template</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {templates.map((template, idx) => {
          const isExpanded = expandedTemplate === template.id;
          return (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08, duration: 0.35 }}
            >
              <Card className="overflow-hidden">
                <div
                  className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() =>
                    setExpandedTemplate(isExpanded ? null : template.id)
                  }
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <ClipboardCheck className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">{template.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-[10px]">
                          {template.role}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {template.sections.length} sections &middot;{" "}
                          {template.sections.reduce(
                            (sum, s) => sum + s.criteria.length,
                            0
                          )}{" "}
                          criteria
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.success("Template duplicated");
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <Separator />
                      <div className="px-6 py-4 space-y-4">
                        {/* Weight visualization */}
                        <div className="flex items-center gap-1 h-6 rounded-full overflow-hidden">
                          {template.sections.map((section, si) => {
                            const colors = [
                              "bg-blue-500",
                              "bg-emerald-500",
                              "bg-amber-500",
                              "bg-violet-500",
                              "bg-rose-500",
                            ];
                            return (
                              <div
                                key={section.id}
                                className={`${colors[si % colors.length]} h-full flex items-center justify-center text-[10px] text-white font-medium transition-all`}
                                style={{ width: `${section.weight}%` }}
                                title={`${section.name}: ${section.weight}%`}
                              >
                                {section.weight}%
                              </div>
                            );
                          })}
                        </div>

                        {template.sections.map((section) => (
                          <div key={section.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium">
                                {section.name}
                              </h4>
                              <Badge variant="outline" className="text-[10px]">
                                Weight: {section.weight}%
                              </Badge>
                            </div>
                            <div className="space-y-1.5">
                              {section.criteria.map((criterion) => (
                                <div
                                  key={criterion.id}
                                  className="flex items-center justify-between py-1.5 px-3 rounded-md bg-muted/50"
                                >
                                  <div>
                                    <p className="text-sm">{criterion.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {criterion.description}
                                    </p>
                                  </div>
                                  <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((n) => (
                                      <div
                                        key={n}
                                        className="h-4 w-4 rounded-full border border-muted-foreground/20 flex items-center justify-center"
                                      >
                                        <span className="text-[8px] text-muted-foreground">
                                          {n}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Completed Scorecards Tab
// ---------------------------------------------------------------------------

function CompletedScorecardsTab() {
  const [selectedScorecard, setSelectedScorecard] =
    useState<CompletedScorecard | null>(null);
  const [filterRole, setFilterRole] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    return completedScorecards.filter((sc) => {
      if (filterRole !== "all") {
        const tmpl = templates.find((t) => t.id === sc.templateId);
        if (tmpl && tmpl.role.toLowerCase() !== filterRole.toLowerCase()) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          sc.candidateName.toLowerCase().includes(q) ||
          sc.interviewer.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [filterRole, searchQuery]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search candidate or interviewer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="Engineering">Engineering</SelectItem>
            <SelectItem value="Design">Design</SelectItem>
            <SelectItem value="Sales">Sales</SelectItem>
            <SelectItem value="Management">Management</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Candidate</TableHead>
                <TableHead>Interviewer</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Recommendation</TableHead>
                <TableHead className="text-right pr-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((sc, idx) => (
                <motion.tr
                  key={sc.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="border-b last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <TableCell className="pl-4">
                    <div>
                      <p className="text-sm font-medium">{sc.candidateName}</p>
                      <p className="text-xs text-muted-foreground">
                        {sc.candidateRole}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                        {sc.interviewerAvatar}
                      </div>
                      <span className="text-sm">{sc.interviewer}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {sc.templateName}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(sc.interviewDate)}
                  </TableCell>
                  <TableCell>
                    <div
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-semibold border ${scoreBg(
                        sc.overallScore
                      )} ${scoreColor(sc.overallScore)}`}
                    >
                      <Star className="h-3.5 w-3.5 fill-current" />
                      {sc.overallScore.toFixed(1)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {recommendationIcon(sc.recommendation)}
                      <Badge variant={recommendationVariant(sc.recommendation)}>
                        {recommendationLabel(sc.recommendation)}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedScorecard(sc)}
                    >
                      <Eye className="mr-1 h-3.5 w-3.5" />
                      View
                    </Button>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Scorecard Detail Dialog */}
      <Dialog
        open={!!selectedScorecard}
        onOpenChange={(open) => !open && setSelectedScorecard(null)}
      >
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedScorecard && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Scorecard: {selectedScorecard.candidateName}
                </DialogTitle>
                <DialogDescription>
                  Evaluated by {selectedScorecard.interviewer} on{" "}
                  {formatDate(selectedScorecard.interviewDate)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Overall */}
                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="text-center">
                    <p className="text-3xl font-bold">
                      {selectedScorecard.overallScore.toFixed(1)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Overall
                    </p>
                  </div>
                  <Separator orientation="vertical" className="h-12" />
                  <div className="flex items-center gap-2">
                    {recommendationIcon(selectedScorecard.recommendation)}
                    <div>
                      <Badge
                        variant={recommendationVariant(
                          selectedScorecard.recommendation
                        )}
                      >
                        {recommendationLabel(selectedScorecard.recommendation)}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Recommendation
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section scores */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Section Scores</h4>
                  {Object.entries(selectedScorecard.sectionScores).map(
                    ([name, score]) => (
                      <div key={name} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>{name}</span>
                          <span
                            className={`font-semibold ${scoreColor(score)}`}
                          >
                            {score.toFixed(1)} / 5.0
                          </span>
                        </div>
                        <Progress value={score} max={5} />
                      </div>
                    )
                  )}
                </div>

                {/* Individual criteria */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Detailed Scores</h4>
                  {(() => {
                    const tmpl = templates.find(
                      (t) => t.id === selectedScorecard.templateId
                    );
                    if (!tmpl) return null;
                    return tmpl.sections.map((section) => (
                      <div key={section.id} className="space-y-1.5">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          {section.name}
                        </p>
                        {section.criteria.map((criterion) => {
                          const found = selectedScorecard.scores.find(
                            (s) => s.criterionId === criterion.id
                          );
                          return (
                            <div
                              key={criterion.id}
                              className="flex items-center justify-between py-1.5 px-3 rounded-md bg-muted/30"
                            >
                              <div className="flex-1">
                                <p className="text-sm">{criterion.name}</p>
                                {found?.notes && (
                                  <p className="text-xs text-muted-foreground">
                                    {found.notes}
                                  </p>
                                )}
                              </div>
                              <ScoreStars
                                score={found?.score ?? 0}
                                readonly
                              />
                            </div>
                          );
                        })}
                      </div>
                    ));
                  })()}
                </div>

                {/* Notes */}
                {selectedScorecard.notes && (
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-semibold">
                      Interviewer Notes
                    </h4>
                    <p className="text-sm text-muted-foreground p-3 rounded-md bg-muted/50">
                      {selectedScorecard.notes}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compare Tab
// ---------------------------------------------------------------------------

function CompareTab() {
  const [selectedCandidate, setSelectedCandidate] = useState("Sarah Chen");

  const candidateNames = [
    ...new Set(completedScorecards.map((sc) => sc.candidateName)),
  ];

  const candidateScorecards = completedScorecards.filter(
    (sc) => sc.candidateName === selectedCandidate
  );

  const template = candidateScorecards.length
    ? templates.find((t) => t.id === candidateScorecards[0].templateId)
    : null;

  const sectionLabels = template
    ? template.sections.map((s) => s.name)
    : [];

  const radarDatasets = candidateScorecards.map((sc, i) => {
    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];
    return {
      label: sc.interviewer,
      values: sectionLabels.map(
        (name) => sc.sectionScores[name] ?? 0
      ),
      color: colors[i % colors.length],
    };
  });

  // Consistency metric: standard deviation of overall scores
  const scores = candidateScorecards.map((sc) => sc.overallScore);
  const mean = scores.reduce((a, b) => a + b, 0) / (scores.length || 1);
  const variance =
    scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) /
    (scores.length || 1);
  const stdDev = Math.sqrt(variance);
  const consistency = Math.max(0, 100 - stdDev * 30);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Select value={selectedCandidate} onValueChange={setSelectedCandidate}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Select candidate" />
          </SelectTrigger>
          <SelectContent>
            {candidateNames.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          {candidateScorecards.length} scorecards from{" "}
          {new Set(candidateScorecards.map((s) => s.interviewer)).size}{" "}
          interviewers
        </p>
      </div>

      {candidateScorecards.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <BarChart3 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No scorecards to compare</h3>
              <p className="text-sm text-muted-foreground">
                Select a candidate with completed evaluations.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Radar Chart */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Radar className="h-4 w-4" />
                  Score Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadarChart
                  labels={sectionLabels}
                  datasets={radarDatasets}
                  size={280}
                />
                <div className="flex items-center justify-center gap-4 mt-4">
                  {radarDatasets.map((ds) => (
                    <div key={ds.label} className="flex items-center gap-1.5">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: ds.color }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {ds.label}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Consistency Metrics */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Interviewer Consistency
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-muted/50 border-4 border-primary/20">
                    <span className="text-2xl font-bold">
                      {consistency.toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Agreement Score
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Std deviation: {stdDev.toFixed(2)}
                  </p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">
                    Score Breakdown by Interviewer
                  </h4>
                  {candidateScorecards.map((sc) => (
                    <div
                      key={sc.id}
                      className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium">
                          {sc.interviewerAvatar}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {sc.interviewer}
                          </p>
                          <div className="flex items-center gap-1">
                            {recommendationIcon(sc.recommendation)}
                            <span className="text-xs text-muted-foreground">
                              {recommendationLabel(sc.recommendation)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className={`text-lg font-bold ${scoreColor(sc.overallScore)}`}>
                        {sc.overallScore.toFixed(1)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Flags */}
                {stdDev > 0.5 && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">
                        Score Divergence Detected
                      </p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        There is notable disagreement between interviewers.
                        Consider a calibration discussion.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Side-by-side section comparison */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Section-by-Section Comparison
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4">Section</TableHead>
                      {candidateScorecards.map((sc) => (
                        <TableHead key={sc.id}>{sc.interviewer}</TableHead>
                      ))}
                      <TableHead>Average</TableHead>
                      <TableHead className="pr-4">Spread</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sectionLabels.map((label) => {
                      const sectionScores = candidateScorecards.map(
                        (sc) => sc.sectionScores[label] ?? 0
                      );
                      const avg =
                        sectionScores.reduce((a, b) => a + b, 0) /
                        sectionScores.length;
                      const spread =
                        Math.max(...sectionScores) -
                        Math.min(...sectionScores);
                      return (
                        <TableRow key={label}>
                          <TableCell className="pl-4 font-medium text-sm">
                            {label}
                          </TableCell>
                          {sectionScores.map((score, i) => (
                            <TableCell key={i}>
                              <span
                                className={`font-semibold text-sm ${scoreColor(
                                  score
                                )}`}
                              >
                                {score.toFixed(1)}
                              </span>
                            </TableCell>
                          ))}
                          <TableCell>
                            <span
                              className={`font-bold text-sm ${scoreColor(avg)}`}
                            >
                              {avg.toFixed(1)}
                            </span>
                          </TableCell>
                          <TableCell className="pr-4">
                            <Badge
                              variant={spread > 1 ? "destructive" : "secondary"}
                              className="text-[10px]"
                            >
                              {spread > 1 ? "High" : "Low"} ({spread.toFixed(1)})
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ScorecardsPage() {
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
              Interview Scorecards
            </h1>
            <p className="text-muted-foreground">
              Create evaluation templates, score candidates, and compare
              interviewer feedback
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Settings2 className="mr-1.5 h-4 w-4" />
              Configure
            </Button>
            <Button size="sm">
              <Plus className="mr-1.5 h-4 w-4" />
              New Scorecard
            </Button>
          </div>
        </div>
      </motion.div>

      <StatsOverview />

      <Tabs defaultValue="completed" className="space-y-4">
        <TabsList>
          <TabsTrigger value="completed" className="gap-1.5">
            <ClipboardCheck className="h-4 w-4" />
            Completed
          </TabsTrigger>
          <TabsTrigger value="compare" className="gap-1.5">
            <BarChart3 className="h-4 w-4" />
            Compare
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5">
            <Layers className="h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="completed">
          <CompletedScorecardsTab />
        </TabsContent>

        <TabsContent value="compare">
          <CompareTab />
        </TabsContent>

        <TabsContent value="templates">
          <TemplatesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
