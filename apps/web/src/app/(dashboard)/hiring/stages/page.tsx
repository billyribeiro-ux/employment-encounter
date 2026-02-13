"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  Copy,
  ChevronRight,
  ArrowRight,
  Clock,
  TrendingUp,
  BarChart3,
  Layers,
  Settings2,
  Zap,
  FileText,
  Shield,
  Users,
  Briefcase,
  GraduationCap,
  Star,
  RotateCcw,
  Check,
  Palette,
  Hash,
  Info,
  CheckCircle2,
  XCircle,
  Eye,
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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ─── Types ──────────────────────────────────────────────────────────────────

type StageType = "screening" | "interview" | "assessment" | "decision";

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  type: StageType;
  autoAdvance: boolean;
  autoAdvanceDays: number;
  avgDays: number;
  passThroughRate: number;
  candidateCount: number;
}

interface PipelineTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  stages: Omit<PipelineStage, "id" | "avgDays" | "passThroughRate" | "candidateCount">[];
  recommended?: boolean;
}

// ─── Color Options ──────────────────────────────────────────────────────────

const COLOR_OPTIONS = [
  { label: "Slate", value: "#64748b", bg: "bg-slate-500" },
  { label: "Blue", value: "#3b82f6", bg: "bg-blue-500" },
  { label: "Indigo", value: "#6366f1", bg: "bg-indigo-500" },
  { label: "Violet", value: "#8b5cf6", bg: "bg-violet-500" },
  { label: "Purple", value: "#a855f7", bg: "bg-purple-500" },
  { label: "Pink", value: "#ec4899", bg: "bg-pink-500" },
  { label: "Rose", value: "#f43f5e", bg: "bg-rose-500" },
  { label: "Red", value: "#ef4444", bg: "bg-red-500" },
  { label: "Orange", value: "#f97316", bg: "bg-orange-500" },
  { label: "Amber", value: "#f59e0b", bg: "bg-amber-500" },
  { label: "Emerald", value: "#10b981", bg: "bg-emerald-500" },
  { label: "Teal", value: "#14b8a6", bg: "bg-teal-500" },
  { label: "Cyan", value: "#06b6d4", bg: "bg-cyan-500" },
];

const STAGE_TYPE_CONFIG: Record<
  StageType,
  { label: string; icon: React.ReactNode; description: string }
> = {
  screening: {
    label: "Screening",
    icon: <FileText className="h-4 w-4" />,
    description: "Resume review and initial qualification",
  },
  interview: {
    label: "Interview",
    icon: <Users className="h-4 w-4" />,
    description: "Live interviews with team members",
  },
  assessment: {
    label: "Assessment",
    icon: <Shield className="h-4 w-4" />,
    description: "Skills tests and take-home assignments",
  },
  decision: {
    label: "Decision",
    icon: <CheckCircle2 className="h-4 w-4" />,
    description: "Final decision and offer stages",
  },
};

// ─── Pipeline Templates ─────────────────────────────────────────────────────

const PIPELINE_TEMPLATES: PipelineTemplate[] = [
  {
    id: "standard",
    name: "Standard",
    description: "A balanced pipeline for most roles",
    icon: <Layers className="h-5 w-5" />,
    recommended: true,
    stages: [
      { name: "Applied", color: "#64748b", type: "screening", autoAdvance: false, autoAdvanceDays: 0 },
      { name: "Screening", color: "#3b82f6", type: "screening", autoAdvance: true, autoAdvanceDays: 3 },
      { name: "Phone Screen", color: "#6366f1", type: "interview", autoAdvance: false, autoAdvanceDays: 0 },
      { name: "Interview", color: "#8b5cf6", type: "interview", autoAdvance: false, autoAdvanceDays: 0 },
      { name: "Offer", color: "#f59e0b", type: "decision", autoAdvance: false, autoAdvanceDays: 0 },
      { name: "Hired", color: "#10b981", type: "decision", autoAdvance: false, autoAdvanceDays: 0 },
    ],
  },
  {
    id: "engineering",
    name: "Engineering",
    description: "Optimized for technical roles with coding challenges",
    icon: <Settings2 className="h-5 w-5" />,
    stages: [
      { name: "Applied", color: "#64748b", type: "screening", autoAdvance: false, autoAdvanceDays: 0 },
      { name: "Resume Review", color: "#3b82f6", type: "screening", autoAdvance: true, autoAdvanceDays: 2 },
      { name: "Coding Challenge", color: "#8b5cf6", type: "assessment", autoAdvance: false, autoAdvanceDays: 0 },
      { name: "Technical Screen", color: "#6366f1", type: "interview", autoAdvance: false, autoAdvanceDays: 0 },
      { name: "System Design", color: "#a855f7", type: "interview", autoAdvance: false, autoAdvanceDays: 0 },
      { name: "Team Fit", color: "#ec4899", type: "interview", autoAdvance: false, autoAdvanceDays: 0 },
      { name: "Offer", color: "#f59e0b", type: "decision", autoAdvance: false, autoAdvanceDays: 0 },
      { name: "Hired", color: "#10b981", type: "decision", autoAdvance: false, autoAdvanceDays: 0 },
    ],
  },
  {
    id: "sales",
    name: "Sales",
    description: "Fast-paced pipeline for sales and BD roles",
    icon: <TrendingUp className="h-5 w-5" />,
    stages: [
      { name: "Applied", color: "#64748b", type: "screening", autoAdvance: false, autoAdvanceDays: 0 },
      { name: "Phone Screen", color: "#3b82f6", type: "screening", autoAdvance: true, autoAdvanceDays: 1 },
      { name: "Sales Roleplay", color: "#f97316", type: "assessment", autoAdvance: false, autoAdvanceDays: 0 },
      { name: "Manager Interview", color: "#8b5cf6", type: "interview", autoAdvance: false, autoAdvanceDays: 0 },
      { name: "Reference Check", color: "#06b6d4", type: "screening", autoAdvance: false, autoAdvanceDays: 0 },
      { name: "Offer", color: "#f59e0b", type: "decision", autoAdvance: false, autoAdvanceDays: 0 },
      { name: "Hired", color: "#10b981", type: "decision", autoAdvance: false, autoAdvanceDays: 0 },
    ],
  },
  {
    id: "executive",
    name: "Executive",
    description: "Comprehensive pipeline for leadership positions",
    icon: <Star className="h-5 w-5" />,
    stages: [
      { name: "Sourced", color: "#64748b", type: "screening", autoAdvance: false, autoAdvanceDays: 0 },
      { name: "Preliminary Review", color: "#3b82f6", type: "screening", autoAdvance: false, autoAdvanceDays: 0 },
      { name: "Recruiter Screen", color: "#6366f1", type: "interview", autoAdvance: false, autoAdvanceDays: 0 },
      { name: "Hiring Manager", color: "#8b5cf6", type: "interview", autoAdvance: false, autoAdvanceDays: 0 },
      { name: "Panel Interview", color: "#a855f7", type: "interview", autoAdvance: false, autoAdvanceDays: 0 },
      { name: "Executive Meet", color: "#ec4899", type: "interview", autoAdvance: false, autoAdvanceDays: 0 },
      { name: "References", color: "#06b6d4", type: "screening", autoAdvance: false, autoAdvanceDays: 0 },
      { name: "Offer", color: "#f59e0b", type: "decision", autoAdvance: false, autoAdvanceDays: 0 },
      { name: "Hired", color: "#10b981", type: "decision", autoAdvance: false, autoAdvanceDays: 0 },
    ],
  },
  {
    id: "internship",
    name: "Internship",
    description: "Simplified pipeline for intern and co-op programs",
    icon: <GraduationCap className="h-5 w-5" />,
    stages: [
      { name: "Applied", color: "#64748b", type: "screening", autoAdvance: false, autoAdvanceDays: 0 },
      { name: "Screening", color: "#3b82f6", type: "screening", autoAdvance: true, autoAdvanceDays: 2 },
      { name: "Interview", color: "#8b5cf6", type: "interview", autoAdvance: false, autoAdvanceDays: 0 },
      { name: "Offer", color: "#f59e0b", type: "decision", autoAdvance: false, autoAdvanceDays: 0 },
      { name: "Hired", color: "#10b981", type: "decision", autoAdvance: false, autoAdvanceDays: 0 },
    ],
  },
];

// ─── Default Pipeline Stages ────────────────────────────────────────────────

function makeId() {
  return Math.random().toString(36).substring(2, 9);
}

function createStagesFromTemplate(
  template: PipelineTemplate
): PipelineStage[] {
  return template.stages.map((s, i) => ({
    id: makeId(),
    name: s.name,
    color: s.color,
    type: s.type,
    autoAdvance: s.autoAdvance,
    autoAdvanceDays: s.autoAdvanceDays,
    avgDays: Math.floor(Math.random() * 5) + 1,
    passThroughRate: Math.max(40, 100 - i * 12 + Math.floor(Math.random() * 10)),
    candidateCount: Math.max(0, 20 - i * 3 + Math.floor(Math.random() * 5)),
  }));
}

const DEFAULT_STAGES = createStagesFromTemplate(PIPELINE_TEMPLATES[0]);

// ─── Stage Edit Dialog ──────────────────────────────────────────────────────

function StageDialog({
  stage,
  open,
  onOpenChange,
  onSave,
  mode,
}: {
  stage: PipelineStage | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (stage: Omit<PipelineStage, "id" | "avgDays" | "passThroughRate" | "candidateCount"> & { id?: string }) => void;
  mode: "create" | "edit";
}) {
  const [name, setName] = useState(stage?.name || "");
  const [color, setColor] = useState(stage?.color || "#3b82f6");
  const [type, setType] = useState<StageType>(stage?.type || "screening");
  const [autoAdvance, setAutoAdvance] = useState(stage?.autoAdvance || false);
  const [autoAdvanceDays, setAutoAdvanceDays] = useState(
    stage?.autoAdvanceDays || 3
  );

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Stage name is required");
      return;
    }
    onSave({
      id: stage?.id,
      name: name.trim(),
      color,
      type,
      autoAdvance,
      autoAdvanceDays: autoAdvance ? autoAdvanceDays : 0,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add Pipeline Stage" : "Edit Pipeline Stage"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Define a new stage in your hiring pipeline"
              : "Modify the stage settings"}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-5 py-4">
          {/* Stage Name */}
          <div className="grid gap-2">
            <Label htmlFor="stage-name">Stage Name</Label>
            <Input
              id="stage-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Technical Interview"
            />
          </div>

          {/* Color */}
          <div className="grid gap-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`h-7 w-7 rounded-full transition-all ${c.bg} ${
                    color === c.value
                      ? "ring-2 ring-offset-2 ring-primary scale-110"
                      : "hover:scale-105"
                  }`}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* Type */}
          <div className="grid gap-2">
            <Label>Stage Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {(
                Object.entries(STAGE_TYPE_CONFIG) as [
                  StageType,
                  (typeof STAGE_TYPE_CONFIG)[StageType],
                ][]
              ).map(([key, config]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setType(key)}
                  className={`flex items-center gap-2 rounded-lg border p-3 text-left transition-all ${
                    type === key
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div
                    className={`${
                      type === key
                        ? "text-primary"
                        : "text-muted-foreground"
                    }`}
                  >
                    {config.icon}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{config.label}</div>
                    <div className="text-[11px] text-muted-foreground leading-tight">
                      {config.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Auto-advance */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Auto-Advance</Label>
              <p className="text-xs text-muted-foreground">
                Automatically move candidates to the next stage
              </p>
            </div>
            <Switch checked={autoAdvance} onCheckedChange={setAutoAdvance} />
          </div>

          {autoAdvance && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="grid gap-2"
            >
              <Label htmlFor="auto-days">Days before auto-advance</Label>
              <Input
                id="auto-days"
                type="number"
                min={1}
                max={30}
                value={autoAdvanceDays}
                onChange={(e) => setAutoAdvanceDays(Number(e.target.value))}
              />
            </motion.div>
          )}

          {/* Preview */}
          <div className="rounded-lg border p-3 bg-muted/30">
            <Label className="text-xs text-muted-foreground mb-2 block">
              Preview
            </Label>
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-sm font-medium">{name || "Untitled"}</span>
              <Badge variant="outline" className="text-[10px] h-4">
                {STAGE_TYPE_CONFIG[type].label}
              </Badge>
              {autoAdvance && (
                <Badge variant="secondary" className="text-[10px] h-4">
                  <Zap className="h-2.5 w-2.5 mr-0.5" />
                  Auto {autoAdvanceDays}d
                </Badge>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {mode === "create" ? "Add Stage" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Stage Card in Reorder List ─────────────────────────────────────────────

function StageRow({
  stage,
  index,
  total,
  onEdit,
  onDelete,
  onDuplicate,
}: {
  stage: PipelineStage;
  index: number;
  total: number;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const typeConfig = STAGE_TYPE_CONFIG[stage.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      transition={{ duration: 0.2 }}
      className="group"
    >
      <div className="flex items-center gap-3 rounded-lg border bg-card p-3 hover:shadow-sm transition-shadow">
        {/* Drag Handle */}
        <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors">
          <GripVertical className="h-4 w-4" />
        </div>

        {/* Stage number and color */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: stage.color }}
            >
              {index + 1}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold truncate">{stage.name}</h4>
              <Badge variant="outline" className="text-[10px] h-4 shrink-0">
                {typeConfig.label}
              </Badge>
              {stage.autoAdvance && (
                <Badge
                  variant="secondary"
                  className="text-[10px] h-4 shrink-0"
                >
                  <Zap className="h-2.5 w-2.5 mr-0.5" />
                  Auto {stage.autoAdvanceDays}d
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Avg {stage.avgDays}d
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {stage.passThroughRate}% pass
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" />
                {stage.candidateCount} candidates
              </span>
            </div>
          </div>
        </div>

        {/* Pass-through bar */}
        <div className="w-24 hidden md:block">
          <div className="text-[10px] text-muted-foreground text-right mb-0.5">
            {stage.passThroughRate}%
          </div>
          <Progress value={stage.passThroughRate} className="h-1.5" />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={onDuplicate}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Duplicate</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={onEdit}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={onDelete}
                  disabled={total <= 2}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {total <= 2
                  ? "Minimum 2 stages required"
                  : "Delete"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Arrow connector */}
        {index < total - 1 && (
          <div className="absolute -bottom-2 left-8 z-10 text-muted-foreground/30 hidden">
            <ChevronRight className="h-4 w-4 rotate-90" />
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Visual Pipeline Preview ────────────────────────────────────────────────

function PipelinePreview({ stages }: { stages: PipelineStage[] }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto py-3 px-1">
      {stages.map((stage, i) => (
        <div key={stage.id} className="flex items-center shrink-0">
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 border text-xs font-medium"
            style={{
              borderColor: stage.color + "40",
              backgroundColor: stage.color + "10",
              color: stage.color,
            }}
          >
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: stage.color }}
            />
            {stage.name}
            {stage.autoAdvance && (
              <Zap className="h-3 w-3 opacity-60" />
            )}
          </motion.div>
          {i < stages.length - 1 && (
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 mx-1 shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Template Card ──────────────────────────────────────────────────────────

function TemplateCard({
  template,
  isActive,
  onApply,
}: {
  template: PipelineTemplate;
  isActive: boolean;
  onApply: () => void;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <Card
        className={`cursor-pointer transition-all ${
          isActive
            ? "ring-2 ring-primary border-primary"
            : "hover:border-primary/50"
        }`}
        onClick={onApply}
      >
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div
                className={`p-2 rounded-lg ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {template.icon}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-semibold">{template.name}</h4>
                  {template.recommended && (
                    <Badge className="text-[10px] h-4 bg-emerald-600">
                      Recommended
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {template.description}
                </p>
              </div>
            </div>
            {isActive && (
              <Badge variant="default" className="shrink-0">
                <Check className="h-3 w-3 mr-1" />
                Active
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 mt-3 flex-wrap">
            {template.stages.map((stage, i) => (
              <div key={i} className="flex items-center">
                <div
                  className="h-1.5 w-6 rounded-full"
                  style={{ backgroundColor: stage.color }}
                  title={stage.name}
                />
                {i < template.stages.length - 1 && (
                  <div className="w-1" />
                )}
              </div>
            ))}
            <span className="text-[10px] text-muted-foreground ml-2">
              {template.stages.length} stages
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Main Stages Page ───────────────────────────────────────────────────────

export default function StagesPage() {
  const [stages, setStages] = useState<PipelineStage[]>(DEFAULT_STAGES);
  const [activeTemplate, setActiveTemplate] = useState("standard");
  const [editingStage, setEditingStage] = useState<PipelineStage | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [activeTab, setActiveTab] = useState("pipeline");

  // ── Stats ──
  const stats = useMemo(() => {
    const totalCandidates = stages.reduce(
      (sum, s) => sum + s.candidateCount,
      0
    );
    const avgPassThrough =
      stages.length > 0
        ? Math.round(
            stages.reduce((sum, s) => sum + s.passThroughRate, 0) /
              stages.length
          )
        : 0;
    const totalAvgDays = stages.reduce((sum, s) => sum + s.avgDays, 0);
    const autoAdvanceCount = stages.filter((s) => s.autoAdvance).length;
    return { totalCandidates, avgPassThrough, totalAvgDays, autoAdvanceCount };
  }, [stages]);

  // ── Handlers ──
  const handleReorder = (newOrder: PipelineStage[]) => {
    setStages(newOrder);
  };

  const handleAddStage = () => {
    setEditingStage(null);
    setDialogMode("create");
    setDialogOpen(true);
  };

  const handleEditStage = (stage: PipelineStage) => {
    setEditingStage(stage);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const handleDeleteStage = (stageId: string) => {
    if (stages.length <= 2) {
      toast.error("A pipeline must have at least 2 stages");
      return;
    }
    const stage = stages.find((s) => s.id === stageId);
    setStages((prev) => prev.filter((s) => s.id !== stageId));
    toast(`Removed "${stage?.name}" stage`, {
      action: {
        label: "Undo",
        onClick: () => {
          setStages((prev) => {
            const newStages = [...prev];
            const idx = prev.findIndex((s) => s.id > stageId);
            if (stage) {
              newStages.splice(idx >= 0 ? idx : newStages.length, 0, stage);
            }
            return newStages;
          });
        },
      },
    });
  };

  const handleDuplicateStage = (stage: PipelineStage) => {
    const newStage: PipelineStage = {
      ...stage,
      id: makeId(),
      name: `${stage.name} (Copy)`,
      candidateCount: 0,
    };
    const idx = stages.findIndex((s) => s.id === stage.id);
    setStages((prev) => {
      const newStages = [...prev];
      newStages.splice(idx + 1, 0, newStage);
      return newStages;
    });
    toast.success(`Duplicated "${stage.name}"`);
  };

  const handleSaveStage = (
    data: Omit<PipelineStage, "id" | "avgDays" | "passThroughRate" | "candidateCount"> & {
      id?: string;
    }
  ) => {
    if (data.id) {
      // Edit existing
      setStages((prev) =>
        prev.map((s) =>
          s.id === data.id
            ? { ...s, name: data.name, color: data.color, type: data.type, autoAdvance: data.autoAdvance, autoAdvanceDays: data.autoAdvanceDays }
            : s
        )
      );
      toast.success(`Updated "${data.name}" stage`);
    } else {
      // Create new
      const newStage: PipelineStage = {
        id: makeId(),
        name: data.name,
        color: data.color,
        type: data.type,
        autoAdvance: data.autoAdvance,
        autoAdvanceDays: data.autoAdvanceDays,
        avgDays: 0,
        passThroughRate: 0,
        candidateCount: 0,
      };
      setStages((prev) => [...prev, newStage]);
      toast.success(`Added "${data.name}" stage`);
    }
  };

  const handleApplyTemplate = (template: PipelineTemplate) => {
    setActiveTemplate(template.id);
    setStages(createStagesFromTemplate(template));
    toast.success(`Applied "${template.name}" pipeline template`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Pipeline Stages
          </h1>
          <p className="text-muted-foreground">
            Customize your hiring pipeline stages per job and role type
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => {
            setStages(DEFAULT_STAGES);
            setActiveTemplate("standard");
            toast.success("Pipeline reset to default");
          }}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset Default
          </Button>
          <Button size="sm" onClick={handleAddStage}>
            <Plus className="mr-2 h-4 w-4" />
            Add Stage
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <Layers className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium text-muted-foreground">
                  Pipeline Stages
                </span>
              </div>
              <p className="text-2xl font-bold">{stages.length}</p>
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
                  Total Avg Duration
                </span>
              </div>
              <p className="text-2xl font-bold">{stats.totalAvgDays}d</p>
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
                  Avg Pass-Through
                </span>
              </div>
              <p className="text-2xl font-bold">{stats.avgPassThrough}%</p>
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
                <Zap className="h-4 w-4 text-violet-600" />
                <span className="text-xs font-medium text-muted-foreground">
                  Auto-Advance Rules
                </span>
              </div>
              <p className="text-2xl font-bold">{stats.autoAdvanceCount}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pipeline">
            <Layers className="h-4 w-4 mr-1.5" />
            Pipeline Builder
          </TabsTrigger>
          <TabsTrigger value="templates">
            <FileText className="h-4 w-4 mr-1.5" />
            Templates
          </TabsTrigger>
        </TabsList>

        {/* Pipeline Builder Tab */}
        <TabsContent value="pipeline" className="mt-4 space-y-4">
          {/* Visual Pipeline Preview */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Pipeline Flow</CardTitle>
                    <CardDescription>
                      Visual preview of your current pipeline
                    </CardDescription>
                  </div>
                  <Badge variant="outline">
                    {stages.length} stages
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <PipelinePreview stages={stages} />
              </CardContent>
            </Card>
          </motion.div>

          {/* Reorderable Stage List */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Stage Configuration</CardTitle>
                    <CardDescription>
                      Drag to reorder. Click edit to modify stage settings.
                    </CardDescription>
                  </div>
                  <Button size="sm" variant="outline" onClick={handleAddStage}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Stage
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Reorder.Group
                  axis="y"
                  values={stages}
                  onReorder={handleReorder}
                  className="space-y-2"
                >
                  <AnimatePresence mode="popLayout">
                    {stages.map((stage, index) => (
                      <Reorder.Item
                        key={stage.id}
                        value={stage}
                        className="list-none"
                      >
                        <StageRow
                          stage={stage}
                          index={index}
                          total={stages.length}
                          onEdit={() => handleEditStage(stage)}
                          onDelete={() => handleDeleteStage(stage.id)}
                          onDuplicate={() => handleDuplicateStage(stage)}
                        />
                      </Reorder.Item>
                    ))}
                  </AnimatePresence>
                </Reorder.Group>

                {/* Add stage button at bottom */}
                <motion.button
                  whileHover={{ scale: 1.005 }}
                  whileTap={{ scale: 0.995 }}
                  onClick={handleAddStage}
                  className="w-full mt-3 flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/20 p-3 text-sm text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add another stage
                </motion.button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-4 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pipeline Templates</CardTitle>
                <CardDescription>
                  Choose a pre-built template as a starting point. You can customize stages after applying.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {PIPELINE_TEMPLATES.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      isActive={activeTemplate === template.id}
                      onApply={() => handleApplyTemplate(template)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Template Detail Preview */}
          {activeTemplate && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Active Template: {PIPELINE_TEMPLATES.find((t) => t.id === activeTemplate)?.name}
                  </CardTitle>
                  <CardDescription>
                    Detailed view of stages in the selected template
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stages.map((stage, i) => (
                      <div
                        key={stage.id}
                        className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                      >
                        <div
                          className="h-6 w-6 rounded flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: stage.color }}
                        >
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <span className="text-sm font-medium">
                            {stage.name}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-[10px] h-4"
                        >
                          {STAGE_TYPE_CONFIG[stage.type].label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          ~{stage.avgDays}d avg
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {stage.passThroughRate}% pass
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </TabsContent>
      </Tabs>

      {/* Stage Edit/Create Dialog */}
      <StageDialog
        stage={editingStage}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSave={handleSaveStage}
        mode={dialogMode}
      />
    </div>
  );
}
