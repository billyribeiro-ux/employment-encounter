"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Users,
  Briefcase,
  DollarSign,
  FileText,
  Plus,
  Eye,
  MessageSquare,
  ChevronRight,
  ArrowRight,
  BarChart3,
  Shield,
  Send,
  UserPlus,
  Filter,
  Search,
  RotateCcw,
  Check,
  X,
  Zap,
  CalendarClock,
  Building2,
  Award,
  CircleDot,
  Loader2,
  Settings2,
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
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";

// ─── Types ──────────────────────────────────────────────────────────────────

type ApprovalType = "job_posting" | "offer" | "hire" | "budget";
type ApprovalStatus = "pending" | "approved" | "rejected" | "cancelled";

interface Approver {
  id: string;
  name: string;
  role: string;
  avatarInitials: string;
  avatarColor: string;
  status: ApprovalStatus | "waiting";
  comment?: string;
  actionDate?: string;
}

interface ApprovalItem {
  id: string;
  type: ApprovalType;
  title: string;
  description: string;
  requester: {
    name: string;
    role: string;
    avatarInitials: string;
    avatarColor: string;
  };
  createdAt: string;
  dueDate: string;
  status: ApprovalStatus;
  priority: "low" | "medium" | "high" | "urgent";
  approvalChain: Approver[];
  details: Record<string, string>;
  currentStep: number;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  type: ApprovalType;
  steps: { role: string; required: boolean }[];
}

// ─── Constants ──────────────────────────────────────────────────────────────

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

const TYPE_CONFIG: Record<
  ApprovalType,
  { label: string; icon: React.ReactNode; color: string; bgColor: string }
> = {
  job_posting: {
    label: "Job Posting",
    icon: <Briefcase className="h-4 w-4" />,
    color: "text-blue-600",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  offer: {
    label: "Offer Extension",
    icon: <DollarSign className="h-4 w-4" />,
    color: "text-emerald-600",
    bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  hire: {
    label: "Hiring Decision",
    icon: <UserPlus className="h-4 w-4" />,
    color: "text-violet-600",
    bgColor: "bg-violet-100 dark:bg-violet-900/30",
  },
  budget: {
    label: "Budget Exception",
    icon: <AlertCircle className="h-4 w-4" />,
    color: "text-amber-600",
    bgColor: "bg-amber-100 dark:bg-amber-900/30",
  },
};

const STATUS_CONFIG: Record<
  ApprovalStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }
> = {
  pending: {
    label: "Pending",
    variant: "secondary",
    icon: <Clock className="h-3 w-3" />,
  },
  approved: {
    label: "Approved",
    variant: "default",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  rejected: {
    label: "Rejected",
    variant: "destructive",
    icon: <XCircle className="h-3 w-3" />,
  },
  cancelled: {
    label: "Cancelled",
    variant: "outline",
    icon: <X className="h-3 w-3" />,
  },
};

const PRIORITY_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  low: { label: "Low", className: "text-muted-foreground border-muted" },
  medium: { label: "Medium", className: "text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-900/20" },
  high: { label: "High", className: "text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-900/20" },
  urgent: { label: "Urgent", className: "text-red-600 border-red-200 bg-red-50 dark:bg-red-900/20" },
};

// ─── Workflow Templates ─────────────────────────────────────────────────────

const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: "job_posting",
    name: "Job Posting Approval",
    description: "Required for publishing new job postings",
    icon: <Briefcase className="h-5 w-5" />,
    type: "job_posting",
    steps: [
      { role: "Hiring Manager", required: true },
      { role: "Department Head", required: true },
      { role: "HR Director", required: true },
    ],
  },
  {
    id: "offer_extension",
    name: "Offer Extension",
    description: "Approval chain for extending job offers",
    icon: <DollarSign className="h-5 w-5" />,
    type: "offer",
    steps: [
      { role: "Hiring Manager", required: true },
      { role: "Compensation Team", required: true },
      { role: "VP of Department", required: true },
      { role: "HR Director", required: false },
    ],
  },
  {
    id: "budget_exception",
    name: "Budget Exception",
    description: "For offers exceeding the standard compensation band",
    icon: <AlertCircle className="h-5 w-5" />,
    type: "budget",
    steps: [
      { role: "Hiring Manager", required: true },
      { role: "Finance Director", required: true },
      { role: "VP of Operations", required: true },
      { role: "CEO", required: true },
    ],
  },
  {
    id: "new_position",
    name: "New Position Request",
    description: "Request to open a new headcount",
    icon: <UserPlus className="h-5 w-5" />,
    type: "hire",
    steps: [
      { role: "Department Head", required: true },
      { role: "Finance Director", required: true },
      { role: "VP of People", required: true },
    ],
  },
];

// ─── Simulated Data ─────────────────────────────────────────────────────────

const INITIAL_APPROVALS: ApprovalItem[] = [
  {
    id: "a1",
    type: "job_posting",
    title: "Senior Frontend Engineer - Remote",
    description: "New position in the Platform team to support Q2 product launch",
    requester: { name: "Sarah Chen", role: "Engineering Manager", avatarInitials: "SC", avatarColor: AVATAR_COLORS[0] },
    createdAt: "2026-02-10",
    dueDate: "2026-02-15",
    status: "pending",
    priority: "high",
    currentStep: 1,
    approvalChain: [
      { id: "ap1", name: "Sarah Chen", role: "Hiring Manager", avatarInitials: "SC", avatarColor: AVATAR_COLORS[0], status: "approved", comment: "Critical role for Q2", actionDate: "2026-02-10" },
      { id: "ap2", name: "James Wilson", role: "VP Engineering", avatarInitials: "JW", avatarColor: AVATAR_COLORS[1], status: "pending" },
      { id: "ap3", name: "Maria Garcia", role: "HR Director", avatarInitials: "MG", avatarColor: AVATAR_COLORS[2], status: "waiting" },
    ],
    details: { Department: "Engineering", Location: "Remote", "Salary Range": "$150k - $190k", "Start Date": "Q2 2026" },
  },
  {
    id: "a2",
    type: "offer",
    title: "Offer: Yuki Tanaka - Backend Engineer",
    description: "Standard offer within compensation band for Backend Engineer role",
    requester: { name: "David Kim", role: "Engineering Lead", avatarInitials: "DK", avatarColor: AVATAR_COLORS[5] },
    createdAt: "2026-02-11",
    dueDate: "2026-02-14",
    status: "pending",
    priority: "urgent",
    currentStep: 0,
    approvalChain: [
      { id: "ap4", name: "David Kim", role: "Hiring Manager", avatarInitials: "DK", avatarColor: AVATAR_COLORS[5], status: "pending" },
      { id: "ap5", name: "Lisa Park", role: "Compensation Team", avatarInitials: "LP", avatarColor: AVATAR_COLORS[6], status: "waiting" },
      { id: "ap6", name: "James Wilson", role: "VP Engineering", avatarInitials: "JW", avatarColor: AVATAR_COLORS[1], status: "waiting" },
    ],
    details: { Candidate: "Yuki Tanaka", Position: "Backend Engineer", "Base Salary": "$165,000", Equity: "5,000 RSUs", "Sign-on Bonus": "$15,000" },
  },
  {
    id: "a3",
    type: "budget",
    title: "Budget Exception: Senior Architect Role",
    description: "Requesting 15% above band for exceptional candidate with unique expertise",
    requester: { name: "James Wilson", role: "VP Engineering", avatarInitials: "JW", avatarColor: AVATAR_COLORS[1] },
    createdAt: "2026-02-09",
    dueDate: "2026-02-16",
    status: "pending",
    priority: "high",
    currentStep: 2,
    approvalChain: [
      { id: "ap7", name: "James Wilson", role: "Hiring Manager", avatarInitials: "JW", avatarColor: AVATAR_COLORS[1], status: "approved", comment: "Exceptional systems design expertise", actionDate: "2026-02-09" },
      { id: "ap8", name: "Robert Taylor", role: "Finance Director", avatarInitials: "RT", avatarColor: AVATAR_COLORS[3], status: "approved", comment: "Within Q1 headcount budget", actionDate: "2026-02-10" },
      { id: "ap9", name: "Amanda Foster", role: "VP Operations", avatarInitials: "AF", avatarColor: AVATAR_COLORS[4], status: "pending" },
      { id: "ap10", name: "Michael Reed", role: "CEO", avatarInitials: "MR", avatarColor: AVATAR_COLORS[8], status: "waiting" },
    ],
    details: { Candidate: "Elena Volkov", "Current Offer": "$245,000", "Standard Band": "$195k - $215k", "Requested": "$245,000 (+15%)", Justification: "10+ years distributed systems experience" },
  },
  {
    id: "a4",
    type: "hire",
    title: "New Headcount: Product Designer",
    description: "Additional designer for the Growth team expansion",
    requester: { name: "Nina Petrova", role: "Design Director", avatarInitials: "NP", avatarColor: AVATAR_COLORS[5] },
    createdAt: "2026-02-08",
    dueDate: "2026-02-18",
    status: "approved",
    priority: "medium",
    currentStep: 3,
    approvalChain: [
      { id: "ap11", name: "Nina Petrova", role: "Department Head", avatarInitials: "NP", avatarColor: AVATAR_COLORS[5], status: "approved", comment: "Essential for Q2 redesign", actionDate: "2026-02-08" },
      { id: "ap12", name: "Robert Taylor", role: "Finance Director", avatarInitials: "RT", avatarColor: AVATAR_COLORS[3], status: "approved", comment: "Approved within budget", actionDate: "2026-02-09" },
      { id: "ap13", name: "Amanda Foster", role: "VP of People", avatarInitials: "AF", avatarColor: AVATAR_COLORS[4], status: "approved", comment: "Go ahead", actionDate: "2026-02-10" },
    ],
    details: { Department: "Design", Team: "Growth", Level: "Senior", "Budget Impact": "$145k - $175k annually" },
  },
  {
    id: "a5",
    type: "job_posting",
    title: "DevOps Engineer - Hybrid (NYC)",
    description: "Infrastructure team expansion for cloud migration project",
    requester: { name: "Alex Okafor", role: "Infrastructure Lead", avatarInitials: "AO", avatarColor: AVATAR_COLORS[9] },
    createdAt: "2026-02-07",
    dueDate: "2026-02-14",
    status: "rejected",
    priority: "medium",
    currentStep: 1,
    approvalChain: [
      { id: "ap14", name: "Alex Okafor", role: "Hiring Manager", avatarInitials: "AO", avatarColor: AVATAR_COLORS[9], status: "approved", actionDate: "2026-02-07" },
      { id: "ap15", name: "James Wilson", role: "VP Engineering", avatarInitials: "JW", avatarColor: AVATAR_COLORS[1], status: "rejected", comment: "Postpone to Q3 - reallocate budget to security team first", actionDate: "2026-02-08" },
      { id: "ap16", name: "Maria Garcia", role: "HR Director", avatarInitials: "MG", avatarColor: AVATAR_COLORS[2], status: "waiting" },
    ],
    details: { Department: "Infrastructure", Location: "NYC (Hybrid)", "Salary Range": "$140k - $170k", Priority: "Cloud Migration Q2" },
  },
  {
    id: "a6",
    type: "offer",
    title: "Offer: Carlos Mendez - Product Manager",
    description: "Offer for experienced PM with fintech background",
    requester: { name: "Rachel Green", role: "Product Director", avatarInitials: "RG", avatarColor: AVATAR_COLORS[0] },
    createdAt: "2026-02-12",
    dueDate: "2026-02-17",
    status: "pending",
    priority: "medium",
    currentStep: 1,
    approvalChain: [
      { id: "ap17", name: "Rachel Green", role: "Hiring Manager", avatarInitials: "RG", avatarColor: AVATAR_COLORS[0], status: "approved", comment: "Top pick from interview panel", actionDate: "2026-02-12" },
      { id: "ap18", name: "Lisa Park", role: "Compensation Team", avatarInitials: "LP", avatarColor: AVATAR_COLORS[6], status: "pending" },
      { id: "ap19", name: "Tom Anderson", role: "VP Product", avatarInitials: "TA", avatarColor: AVATAR_COLORS[7], status: "waiting" },
    ],
    details: { Candidate: "Carlos Mendez", Position: "Product Manager", "Base Salary": "$155,000", Equity: "4,000 RSUs", "Total Comp": "$195,000" },
  },
  {
    id: "a7",
    type: "hire",
    title: "New Headcount: Security Engineer",
    description: "Critical security hire after recent SOC2 audit findings",
    requester: { name: "James Wilson", role: "VP Engineering", avatarInitials: "JW", avatarColor: AVATAR_COLORS[1] },
    createdAt: "2026-02-06",
    dueDate: "2026-02-13",
    status: "approved",
    priority: "urgent",
    currentStep: 3,
    approvalChain: [
      { id: "ap20", name: "James Wilson", role: "Department Head", avatarInitials: "JW", avatarColor: AVATAR_COLORS[1], status: "approved", comment: "Critical for compliance", actionDate: "2026-02-06" },
      { id: "ap21", name: "Robert Taylor", role: "Finance Director", avatarInitials: "RT", avatarColor: AVATAR_COLORS[3], status: "approved", comment: "Emergency budget allocated", actionDate: "2026-02-06" },
      { id: "ap22", name: "Amanda Foster", role: "VP of People", avatarInitials: "AF", avatarColor: AVATAR_COLORS[4], status: "approved", comment: "Expedited - approved", actionDate: "2026-02-07" },
    ],
    details: { Department: "Engineering - Security", Level: "Senior", "Budget Impact": "$180k - $220k", Urgency: "SOC2 compliance deadline" },
  },
  {
    id: "a8",
    type: "job_posting",
    title: "Data Analyst - Marketing",
    description: "Analytics role to support marketing attribution modeling",
    requester: { name: "Sophie Laurent", role: "Marketing VP", avatarInitials: "SL", avatarColor: AVATAR_COLORS[3] },
    createdAt: "2026-02-11",
    dueDate: "2026-02-20",
    status: "pending",
    priority: "low",
    currentStep: 0,
    approvalChain: [
      { id: "ap23", name: "Sophie Laurent", role: "Hiring Manager", avatarInitials: "SL", avatarColor: AVATAR_COLORS[3], status: "pending" },
      { id: "ap24", name: "Tom Anderson", role: "VP Marketing", avatarInitials: "TA", avatarColor: AVATAR_COLORS[7], status: "waiting" },
      { id: "ap25", name: "Maria Garcia", role: "HR Director", avatarInitials: "MG", avatarColor: AVATAR_COLORS[2], status: "waiting" },
    ],
    details: { Department: "Marketing", Location: "Remote", "Salary Range": "$90k - $120k", "Start Date": "Q3 2026" },
  },
  {
    id: "a9",
    type: "budget",
    title: "Budget Exception: Head of AI/ML",
    description: "Executive-level hire requiring above-band compensation",
    requester: { name: "James Wilson", role: "VP Engineering", avatarInitials: "JW", avatarColor: AVATAR_COLORS[1] },
    createdAt: "2026-02-05",
    dueDate: "2026-02-12",
    status: "approved",
    priority: "urgent",
    currentStep: 4,
    approvalChain: [
      { id: "ap26", name: "James Wilson", role: "Hiring Manager", avatarInitials: "JW", avatarColor: AVATAR_COLORS[1], status: "approved", actionDate: "2026-02-05" },
      { id: "ap27", name: "Robert Taylor", role: "Finance Director", avatarInitials: "RT", avatarColor: AVATAR_COLORS[3], status: "approved", comment: "Justified by strategic importance", actionDate: "2026-02-06" },
      { id: "ap28", name: "Amanda Foster", role: "VP Operations", avatarInitials: "AF", avatarColor: AVATAR_COLORS[4], status: "approved", actionDate: "2026-02-07" },
      { id: "ap29", name: "Michael Reed", role: "CEO", avatarInitials: "MR", avatarColor: AVATAR_COLORS[8], status: "approved", comment: "Strategic priority - approved", actionDate: "2026-02-08" },
    ],
    details: { Candidate: "Dr. Mei Lin Zhang", "Offered Comp": "$380,000 + 25k RSUs", "Standard Band": "$280k - $330k", Exception: "+18% above band", Justification: "Former ML lead at top-tier AI lab" },
  },
  {
    id: "a10",
    type: "offer",
    title: "Offer: Priya Patel - Senior Frontend Engineer",
    description: "Competitive offer to secure top frontend candidate",
    requester: { name: "Sarah Chen", role: "Engineering Manager", avatarInitials: "SC", avatarColor: AVATAR_COLORS[0] },
    createdAt: "2026-02-13",
    dueDate: "2026-02-16",
    status: "pending",
    priority: "high",
    currentStep: 0,
    approvalChain: [
      { id: "ap30", name: "Sarah Chen", role: "Hiring Manager", avatarInitials: "SC", avatarColor: AVATAR_COLORS[0], status: "pending" },
      { id: "ap31", name: "Lisa Park", role: "Compensation Team", avatarInitials: "LP", avatarColor: AVATAR_COLORS[6], status: "waiting" },
      { id: "ap32", name: "James Wilson", role: "VP Engineering", avatarInitials: "JW", avatarColor: AVATAR_COLORS[1], status: "waiting" },
    ],
    details: { Candidate: "Priya Patel", Position: "Senior Frontend Engineer", "Base Salary": "$175,000", Equity: "6,000 RSUs", "Sign-on Bonus": "$20,000" },
  },
];

// ─── Approval Chain Visualization ───────────────────────────────────────────

function ApprovalChain({
  chain,
  compact = false,
}: {
  chain: Approver[];
  compact?: boolean;
}) {
  return (
    <div className={`flex items-center ${compact ? "gap-1" : "gap-2"}`}>
      {chain.map((approver, i) => {
        const statusIcon =
          approver.status === "approved" ? (
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
          ) : approver.status === "rejected" ? (
            <XCircle className="h-3 w-3 text-red-500" />
          ) : approver.status === "pending" ? (
            <Loader2 className="h-3 w-3 text-amber-500 animate-spin" />
          ) : (
            <CircleDot className="h-3 w-3 text-muted-foreground/40" />
          );

        const ringColor =
          approver.status === "approved"
            ? "ring-emerald-500"
            : approver.status === "rejected"
              ? "ring-red-500"
              : approver.status === "pending"
                ? "ring-amber-500 animate-pulse"
                : "ring-muted-foreground/20";

        return (
          <div key={approver.id} className="flex items-center">
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <div
                      className={`${compact ? "h-7 w-7" : "h-8 w-8"} rounded-full ${approver.avatarColor} flex items-center justify-center text-white text-[10px] font-semibold ring-2 ${ringColor}`}
                    >
                      {approver.avatarInitials}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5">
                      {statusIcon}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <div className="space-y-1">
                    <p className="font-medium">{approver.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {approver.role}
                    </p>
                    <p className="text-xs capitalize">{approver.status}</p>
                    {approver.comment && (
                      <p className="text-xs italic">
                        &ldquo;{approver.comment}&rdquo;
                      </p>
                    )}
                    {approver.actionDate && (
                      <p className="text-[10px] text-muted-foreground">
                        {approver.actionDate}
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {i < chain.length - 1 && (
              <ArrowRight
                className={`${compact ? "h-3 w-3 mx-0.5" : "h-3.5 w-3.5 mx-1"} text-muted-foreground/30`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Approval Detail Dialog ─────────────────────────────────────────────────

function ApprovalDetailDialog({
  item,
  open,
  onOpenChange,
  onApprove,
  onReject,
}: {
  item: ApprovalItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (id: string, comment: string) => void;
  onReject: (id: string, comment: string) => void;
}) {
  const [comment, setComment] = useState("");

  if (!item) return null;

  const typeConfig = TYPE_CONFIG[item.type];
  const statusConfig = STATUS_CONFIG[item.status];
  const priorityConfig = PRIORITY_CONFIG[item.priority];
  const isPending = item.status === "pending";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className={`p-1.5 rounded-md ${typeConfig.bgColor} ${typeConfig.color}`}>
              {typeConfig.icon}
            </div>
            <Badge variant={statusConfig.variant} className="text-xs">
              {statusConfig.icon}
              <span className="ml-1">{statusConfig.label}</span>
            </Badge>
            <Badge variant="outline" className={`text-xs ${priorityConfig.className}`}>
              {priorityConfig.label}
            </Badge>
          </div>
          <DialogTitle className="text-lg">{item.title}</DialogTitle>
          <DialogDescription>{item.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Requester Info */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border">
            <div
              className={`h-10 w-10 rounded-full ${item.requester.avatarColor} flex items-center justify-center text-white text-sm font-semibold`}
            >
              {item.requester.avatarInitials}
            </div>
            <div>
              <p className="text-sm font-medium">{item.requester.name}</p>
              <p className="text-xs text-muted-foreground">
                {item.requester.role} -- Requested {item.createdAt}
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-muted-foreground">Due</p>
              <p className="text-sm font-medium">{item.dueDate}</p>
            </div>
          </div>

          {/* Details */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Details</h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(item.details).map(([key, value]) => (
                <div key={key} className="rounded-md border p-2.5">
                  <p className="text-[11px] text-muted-foreground">{key}</p>
                  <p className="text-sm font-medium">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Approval Chain */}
          <div>
            <h4 className="text-sm font-semibold mb-3">Approval Chain</h4>
            <div className="space-y-3">
              {item.approvalChain.map((approver, i) => {
                const sIcon =
                  approver.status === "approved" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : approver.status === "rejected" ? (
                    <XCircle className="h-4 w-4 text-red-500" />
                  ) : approver.status === "pending" ? (
                    <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />
                  ) : (
                    <CircleDot className="h-4 w-4 text-muted-foreground/30" />
                  );

                return (
                  <div key={approver.id} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`h-8 w-8 rounded-full ${approver.avatarColor} flex items-center justify-center text-white text-xs font-semibold`}
                      >
                        {approver.avatarInitials}
                      </div>
                      {i < item.approvalChain.length - 1 && (
                        <div className="w-px h-6 bg-border mt-1" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 pb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {approver.name}
                        </span>
                        {sIcon}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {approver.role}
                      </p>
                      {approver.comment && (
                        <p className="text-xs mt-1 italic text-muted-foreground bg-muted/50 rounded px-2 py-1">
                          &ldquo;{approver.comment}&rdquo;
                        </p>
                      )}
                      {approver.actionDate && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {approver.actionDate}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Area */}
          {isPending && (
            <div className="space-y-3 border-t pt-4">
              <div className="grid gap-2">
                <Label htmlFor="approval-comment">Comment (optional)</Label>
                <Textarea
                  id="approval-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment with your decision..."
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {isPending ? (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  onReject(item.id, comment);
                  setComment("");
                  onOpenChange(false);
                }}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button
                onClick={() => {
                  onApprove(item.id, comment);
                  setComment("");
                  onOpenChange(false);
                }}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Approve
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Create Workflow Dialog ─────────────────────────────────────────────────

function CreateWorkflowDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<ApprovalType>("job_posting");
  const [steps, setSteps] = useState<{ role: string; required: boolean }[]>([
    { role: "", required: true },
  ]);

  const addStep = () => {
    setSteps((prev) => [...prev, { role: "", required: true }]);
  };

  const removeStep = (index: number) => {
    if (steps.length <= 1) return;
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const updateStep = (
    index: number,
    field: "role" | "required",
    value: string | boolean
  ) => {
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Workflow name is required");
      return;
    }
    if (steps.some((s) => !s.role.trim())) {
      toast.error("All steps must have a role assigned");
      return;
    }
    toast.success(`Created workflow "${name}" with ${steps.length} approval steps`);
    setName("");
    setType("job_posting");
    setSteps([{ role: "", required: true }]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>Create Approval Workflow</DialogTitle>
          <DialogDescription>
            Define a new multi-step approval workflow
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-4">
          <div className="grid gap-2">
            <Label htmlFor="wf-name">Workflow Name</Label>
            <Input
              id="wf-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Executive Hire Approval"
            />
          </div>

          <div className="grid gap-2">
            <Label>Approval Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as ApprovalType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="job_posting">Job Posting</SelectItem>
                <SelectItem value="offer">Offer Extension</SelectItem>
                <SelectItem value="hire">Hiring Decision</SelectItem>
                <SelectItem value="budget">Budget Exception</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>Approval Steps</Label>
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={addStep}>
                <Plus className="h-3 w-3 mr-1" />
                Add Step
              </Button>
            </div>
            <div className="space-y-2">
              {steps.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2"
                >
                  <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
                    {i + 1}
                  </div>
                  <Input
                    value={step.role}
                    onChange={(e) => updateStep(i, "role", e.target.value)}
                    placeholder="Approver role (e.g. VP Engineering)"
                    className="h-8 text-sm"
                  />
                  <Badge
                    variant={step.required ? "default" : "outline"}
                    className="cursor-pointer text-[10px] h-5 shrink-0"
                    onClick={() => updateStep(i, "required", !step.required)}
                  >
                    {step.required ? "Required" : "Optional"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeStep(i)}
                    disabled={steps.length <= 1}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="rounded-lg border p-3 bg-muted/30">
            <Label className="text-xs text-muted-foreground mb-2 block">
              Workflow Preview
            </Label>
            <div className="flex items-center gap-1 flex-wrap">
              {steps.map((step, i) => (
                <div key={i} className="flex items-center">
                  <div className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px]">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {step.role || `Step ${i + 1}`}
                    {!step.required && (
                      <span className="text-muted-foreground">(opt)</span>
                    )}
                  </div>
                  {i < steps.length - 1 && (
                    <ArrowRight className="h-3 w-3 text-muted-foreground/30 mx-0.5" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Shield className="mr-2 h-4 w-4" />
            Create Workflow
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Approval Row Card ──────────────────────────────────────────────────────

function ApprovalCard({
  item,
  onView,
  onApprove,
  onReject,
}: {
  item: ApprovalItem;
  onView: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const typeConfig = TYPE_CONFIG[item.type];
  const statusConfig = STATUS_CONFIG[item.status];
  const priorityConfig = PRIORITY_CONFIG[item.priority];
  const isPending = item.status === "pending";
  const progressPercent =
    item.approvalChain.length > 0
      ? Math.round(
        (item.approvalChain.filter((a) => a.status === "approved").length /
          item.approvalChain.length) *
        100
      )
      : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, height: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="hover:shadow-sm transition-shadow">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-4">
            {/* Type Icon */}
            <div
              className={`p-2.5 rounded-lg shrink-0 ${typeConfig.bgColor} ${typeConfig.color}`}
            >
              {typeConfig.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4
                      className="text-sm font-semibold truncate cursor-pointer hover:text-primary transition-colors"
                      onClick={onView}
                    >
                      {item.title}
                    </h4>
                    <Badge
                      variant={statusConfig.variant}
                      className="text-[10px] h-4"
                    >
                      {statusConfig.icon}
                      <span className="ml-0.5">{statusConfig.label}</span>
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-[10px] h-4 ${priorityConfig.className}`}
                    >
                      {priorityConfig.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {item.description}
                  </p>
                </div>

                {/* Quick Actions */}
                {isPending && (
                  <div className="flex items-center gap-1 shrink-0">
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                            onClick={onReject}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Reject</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            className="h-8 w-8 bg-emerald-600 hover:bg-emerald-700"
                            onClick={onApprove}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Approve</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
              </div>

              {/* Meta row */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <div
                      className={`h-5 w-5 rounded-full ${item.requester.avatarColor} flex items-center justify-center text-white text-[8px] font-semibold`}
                    >
                      {item.requester.avatarInitials}
                    </div>
                    {item.requester.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarClock className="h-3 w-3" />
                    {item.createdAt}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Due {item.dueDate}
                  </span>
                </div>

                {/* Approval Chain Preview */}
                <div className="flex items-center gap-2 shrink-0">
                  <ApprovalChain chain={item.approvalChain} compact />
                </div>
              </div>

              {/* Progress */}
              <div className="flex items-center gap-2">
                <Progress value={progressPercent} className="h-1.5 flex-1" />
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {item.approvalChain.filter((a) => a.status === "approved").length}/
                  {item.approvalChain.length} approved
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Main Approvals Page ────────────────────────────────────────────────────

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<ApprovalItem[]>(INITIAL_APPROVALS);
  const [activeTab, setActiveTab] = useState("pending");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<ApprovalItem | null>(null);
  const [workflowDialogOpen, setWorkflowDialogOpen] = useState(false);

  // ── Filtered approvals ──
  const filteredApprovals = useMemo(() => {
    return approvals.filter((a) => {
      // Tab filter
      if (activeTab === "pending" && a.status !== "pending") return false;
      if (activeTab === "my_requests") {
        // Simulate: current user is "James Wilson"
        if (a.requester.name !== "James Wilson") return false;
      }
      // Type filter
      if (typeFilter !== "all" && a.type !== typeFilter) return false;
      // Search
      if (
        searchQuery &&
        !a.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !a.requester.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [approvals, activeTab, typeFilter, searchQuery]);

  // ── Stats ──
  const stats = useMemo(() => {
    const pending = approvals.filter((a) => a.status === "pending").length;
    const approved = approvals.filter((a) => a.status === "approved").length;
    const rejected = approvals.filter((a) => a.status === "rejected").length;
    const total = approvals.length;
    const approvalRate = total > 0 ? Math.round(((approved) / (approved + rejected || 1)) * 100) : 0;
    return { pending, approved, rejected, total, approvalRate };
  }, [approvals]);

  // ── Handlers ──
  const handleApprove = (id: string, comment: string) => {
    setApprovals((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const newChain = a.approvalChain.map((ap, i) => {
          if (i === a.currentStep && ap.status === "pending") {
            return {
              ...ap,
              status: "approved" as ApprovalStatus,
              comment: comment || undefined,
              actionDate: "2026-02-13",
            };
          }
          if (i === a.currentStep + 1 && ap.status === "waiting") {
            return { ...ap, status: "pending" as ApprovalStatus | "waiting" };
          }
          return ap;
        });
        const allApproved = newChain.every(
          (ap) => ap.status === "approved"
        );
        return {
          ...a,
          approvalChain: newChain,
          currentStep: a.currentStep + 1,
          status: allApproved ? "approved" : "pending",
        };
      })
    );
    const item = approvals.find((a) => a.id === id);
    toast.success(`Approved: ${item?.title}`);
  };

  const handleReject = (id: string, comment: string) => {
    setApprovals((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const newChain = a.approvalChain.map((ap, i) => {
          if (i === a.currentStep && ap.status === "pending") {
            return {
              ...ap,
              status: "rejected" as ApprovalStatus,
              comment: comment || "Rejected",
              actionDate: "2026-02-13",
            };
          }
          return ap;
        });
        return {
          ...a,
          approvalChain: newChain,
          status: "rejected",
        };
      })
    );
    const item = approvals.find((a) => a.id === id);
    toast(`Rejected: ${item?.title}`, {
      description: comment || "No reason provided",
    });
  };

  const handleViewDetail = (item: ApprovalItem) => {
    setSelectedApproval(item);
    setDetailDialogOpen(true);
  };

  const hasActiveFilters = searchQuery || typeFilter !== "all";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Approval Workflows
            </h1>
            {stats.pending > 0 && (
              <Badge className="bg-amber-500 hover:bg-amber-600 text-white">
                {stats.pending} pending
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            Review and manage approval requests for jobs, offers, and hiring decisions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWorkflowDialogOpen(true)}
          >
            <Settings2 className="mr-2 h-4 w-4" />
            Configure Workflows
          </Button>
          <Button size="sm" onClick={() => setWorkflowDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Workflow
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-amber-600" />
                <span className="text-xs font-medium text-muted-foreground">
                  Pending
                </span>
              </div>
              <p className="text-2xl font-bold">{stats.pending}</p>
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
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-medium text-muted-foreground">
                  Approved
                </span>
              </div>
              <p className="text-2xl font-bold">{stats.approved}</p>
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
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-xs font-medium text-muted-foreground">
                  Rejected
                </span>
              </div>
              <p className="text-2xl font-bold">{stats.rejected}</p>
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
                <BarChart3 className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium text-muted-foreground">
                  Approval Rate
                </span>
              </div>
              <p className="text-2xl font-bold">{stats.approvalRate}%</p>
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
                <CalendarClock className="h-4 w-4 text-violet-600" />
                <span className="text-xs font-medium text-muted-foreground">
                  Avg Approval Time
                </span>
              </div>
              <p className="text-2xl font-bold">1.8d</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabs and Filters */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <TabsList>
            <TabsTrigger value="pending">
              <Clock className="h-4 w-4 mr-1.5" />
              Pending My Approval
              {stats.pending > 0 && (
                <Badge className="ml-1.5 h-4 px-1 text-[10px] bg-amber-500">
                  {stats.pending}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="my_requests">
              <Send className="h-4 w-4 mr-1.5" />
              My Requests
            </TabsTrigger>
            <TabsTrigger value="all">
              <FileText className="h-4 w-4 mr-1.5" />
              All Approvals
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search approvals..."
                className="h-8 w-[180px] pl-8 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-8 w-[160px] text-sm">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="job_posting">Job Posting</SelectItem>
                <SelectItem value="offer">Offer Extension</SelectItem>
                <SelectItem value="hire">Hiring Decision</SelectItem>
                <SelectItem value="budget">Budget Exception</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground"
                onClick={() => {
                  setSearchQuery("");
                  setTypeFilter("all");
                }}
              >
                <RotateCcw className="mr-1 h-3 w-3" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <TabsContent value="pending" className="mt-4 space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredApprovals.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <div className="rounded-full bg-emerald-100 dark:bg-emerald-900/30 p-4 mb-4">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
                <h3 className="text-lg font-semibold mb-1">All caught up!</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  You have no pending approval requests. New requests will appear here.
                </p>
              </motion.div>
            ) : (
              filteredApprovals.map((item) => (
                <ApprovalCard
                  key={item.id}
                  item={item}
                  onView={() => handleViewDetail(item)}
                  onApprove={() => handleApprove(item.id, "")}
                  onReject={() => handleReject(item.id, "")}
                />
              ))
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="my_requests" className="mt-4 space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredApprovals.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Send className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-1">No requests yet</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Approval requests you submit will appear here so you can track their progress.
                </p>
              </motion.div>
            ) : (
              filteredApprovals.map((item) => (
                <ApprovalCard
                  key={item.id}
                  item={item}
                  onView={() => handleViewDetail(item)}
                  onApprove={() => handleApprove(item.id, "")}
                  onReject={() => handleReject(item.id, "")}
                />
              ))
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="all" className="mt-4 space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredApprovals.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <div className="rounded-full bg-muted p-4 mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-1">No approvals found</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  No approval records match your current filters. Try adjusting your search.
                </p>
              </motion.div>
            ) : (
              filteredApprovals.map((item) => (
                <ApprovalCard
                  key={item.id}
                  item={item}
                  onView={() => handleViewDetail(item)}
                  onApprove={() => handleApprove(item.id, "")}
                  onReject={() => handleReject(item.id, "")}
                />
              ))
            )}
          </AnimatePresence>
        </TabsContent>
      </Tabs>

      {/* Workflow Templates Section */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Workflow Templates</CardTitle>
                <CardDescription>
                  Pre-configured approval chains for common scenarios
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setWorkflowDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Create Custom
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              {WORKFLOW_TEMPLATES.map((template) => {
                const tConfig = TYPE_CONFIG[template.type];
                return (
                  <motion.div
                    key={template.id}
                    whileHover={{ scale: 1.005 }}
                    className="rounded-lg border p-4 hover:shadow-sm transition-all cursor-pointer"
                    onClick={() => {
                      toast.info(`Template "${template.name}" selected`);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-lg shrink-0 ${tConfig.bgColor} ${tConfig.color}`}
                      >
                        {template.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold">{template.name}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {template.description}
                        </p>
                        <div className="flex items-center gap-1 mt-2 flex-wrap">
                          {template.steps.map((step, i) => (
                            <div key={i} className="flex items-center">
                              <Badge
                                variant="outline"
                                className={`text-[10px] h-4 ${step.required ? "" : "opacity-60"
                                  }`}
                              >
                                {step.role}
                              </Badge>
                              {i < template.steps.length - 1 && (
                                <ChevronRight className="h-3 w-3 text-muted-foreground/30 mx-0.5" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Dialogs */}
      <ApprovalDetailDialog
        item={selectedApproval}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      <CreateWorkflowDialog
        open={workflowDialogOpen}
        onOpenChange={setWorkflowDialogOpen}
      />
    </div>
  );
}
