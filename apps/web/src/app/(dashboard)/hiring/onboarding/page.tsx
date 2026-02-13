"use client";

import { useState, useMemo } from "react";
import {
  Users,
  UserPlus,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  FileText,
  Upload,
  Calendar,
  Briefcase,
  Building2,
  Monitor,
  User,
  Shield,
  Star,
  Gift,
  Heart,
  ChevronRight,
  ChevronDown,
  Search,
  Plus,
  Eye,
  PenLine,
  Laptop,
  Package,
  BookOpen,
  Coffee,
  Award,
  Target,
  TrendingUp,
  ArrowUpRight,
  ClipboardCheck,
  ClipboardList,
  Sparkles,
  X,
  MoreHorizontal,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Wrench,
  MessageSquare,
  Timer,
  BarChart3,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
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

// ─── Types ──────────────────────────────────────────────

interface OnboardingTask {
  id: string;
  title: string;
  description: string;
  assignee: "HR" | "Manager" | "IT" | "New Hire";
  phase: "Before Day 1" | "Day 1" | "Week 1" | "Month 1";
  dueDateOffset: string;
  status: "Completed" | "In Progress" | "Pending" | "Overdue";
  completedDate?: string;
  requiredDocuments?: string[];
}

interface OnboardingDocument {
  id: string;
  name: string;
  type: string;
  status: "Signed" | "Pending" | "Not Started" | "Overdue";
  dueDate: string;
  signedDate?: string;
}

interface NewHire {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  startDate: string;
  manager: string;
  buddy: string;
  template: string;
  progress: number;
  tasksCompleted: number;
  totalTasks: number;
  location: string;
  tasks: OnboardingTask[];
  documents: OnboardingDocument[];
  welcomePackage: WelcomePackageItem[];
}

interface WelcomePackageItem {
  id: string;
  name: string;
  status: "Shipped" | "Preparing" | "Pending";
  icon: React.ElementType;
}

interface OnboardingTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  taskCount: number;
  phases: { phase: string; count: number }[];
  usedBy: number;
}

// ─── Simulated Data ─────────────────────────────────────

function buildTasks(template: string, startDate: string, completionLevel: number): OnboardingTask[] {
  const baseTasks: OnboardingTask[] = [
    // Before Day 1
    { id: "t01", title: "Send offer letter for signature", description: "Generate and send the official offer letter via DocuSign", assignee: "HR", phase: "Before Day 1", dueDateOffset: "-14 days", status: "Pending", requiredDocuments: ["Offer Letter"] },
    { id: "t02", title: "Complete background check", description: "Initiate and verify background check results", assignee: "HR", phase: "Before Day 1", dueDateOffset: "-10 days", status: "Pending" },
    { id: "t03", title: "Provision laptop and equipment", description: "Order and configure work laptop, monitors, peripherals", assignee: "IT", phase: "Before Day 1", dueDateOffset: "-5 days", status: "Pending" },
    { id: "t04", title: "Set up email and accounts", description: "Create email account, Slack, GitHub, Jira access", assignee: "IT", phase: "Before Day 1", dueDateOffset: "-3 days", status: "Pending" },
    { id: "t05", title: "Prepare welcome package", description: "Assemble company swag, welcome materials, and office supplies", assignee: "HR", phase: "Before Day 1", dueDateOffset: "-3 days", status: "Pending" },
    { id: "t06", title: "Assign buddy/mentor", description: "Select and notify onboarding buddy from the team", assignee: "Manager", phase: "Before Day 1", dueDateOffset: "-5 days", status: "Pending" },
    // Day 1
    { id: "t07", title: "Welcome meeting with HR", description: "Office tour, benefits overview, company policies", assignee: "HR", phase: "Day 1", dueDateOffset: "Day 1", status: "Pending" },
    { id: "t08", title: "Complete I-9 verification", description: "Verify employment eligibility documentation", assignee: "New Hire", phase: "Day 1", dueDateOffset: "Day 1", status: "Pending", requiredDocuments: ["I-9 Form"] },
    { id: "t09", title: "Sign W-4 tax withholding form", description: "Complete federal tax withholding elections", assignee: "New Hire", phase: "Day 1", dueDateOffset: "Day 1", status: "Pending", requiredDocuments: ["W-4 Form"] },
    { id: "t10", title: "Set up direct deposit", description: "Enter banking information for payroll", assignee: "New Hire", phase: "Day 1", dueDateOffset: "Day 1", status: "Pending", requiredDocuments: ["Direct Deposit Form"] },
    { id: "t11", title: "Team lunch introduction", description: "Welcome lunch with the immediate team", assignee: "Manager", phase: "Day 1", dueDateOffset: "Day 1", status: "Pending" },
    // Week 1
    { id: "t12", title: "Sign NDA and IP agreement", description: "Review and sign confidentiality and IP agreements", assignee: "New Hire", phase: "Week 1", dueDateOffset: "+3 days", status: "Pending", requiredDocuments: ["NDA"] },
    { id: "t13", title: "Complete equipment setup form", description: "Document all equipment received and configurations", assignee: "New Hire", phase: "Week 1", dueDateOffset: "+3 days", status: "Pending", requiredDocuments: ["Equipment Form"] },
    { id: "t14", title: "Review codebase / product walkthrough", description: "Guided tour of the product architecture and key systems", assignee: "Manager", phase: "Week 1", dueDateOffset: "+5 days", status: "Pending" },
    { id: "t15", title: "Complete security training", description: "Mandatory security awareness and compliance training", assignee: "New Hire", phase: "Week 1", dueDateOffset: "+5 days", status: "Pending" },
    { id: "t16", title: "1:1 with skip-level manager", description: "Introduction meeting with department head", assignee: "Manager", phase: "Week 1", dueDateOffset: "+5 days", status: "Pending" },
    // Month 1
    { id: "t17", title: "Complete first project milestone", description: "Deliver first meaningful contribution or feature", assignee: "New Hire", phase: "Month 1", dueDateOffset: "+21 days", status: "Pending" },
    { id: "t18", title: "30-day check-in with HR", description: "Discuss onboarding experience and any concerns", assignee: "HR", phase: "Month 1", dueDateOffset: "+30 days", status: "Pending" },
    { id: "t19", title: "30-day check-in with manager", description: "Review initial goals, feedback, and adjustment", assignee: "Manager", phase: "Month 1", dueDateOffset: "+30 days", status: "Pending" },
    { id: "t20", title: "Benefits enrollment deadline", description: "Complete health, dental, vision, and 401k selections", assignee: "New Hire", phase: "Month 1", dueDateOffset: "+30 days", status: "Pending" },
  ];

  // Apply completion based on level
  const completedCount = Math.floor(baseTasks.length * completionLevel);
  return baseTasks.map((task, index) => {
    if (index < completedCount) {
      return { ...task, status: "Completed" as const, completedDate: startDate };
    }
    if (index === completedCount && completionLevel > 0) {
      return { ...task, status: "In Progress" as const };
    }
    // Mark some as overdue if they should be done by now
    if (completionLevel > 0.3 && index < completedCount + 2 && task.phase === "Before Day 1") {
      return { ...task, status: "Overdue" as const };
    }
    return task;
  });
}

function buildDocuments(completionLevel: number): OnboardingDocument[] {
  const docs: OnboardingDocument[] = [
    { id: "d01", name: "Offer Letter", type: "Legal", status: "Not Started", dueDate: "-14 days" },
    { id: "d02", name: "I-9 Form", type: "Compliance", status: "Not Started", dueDate: "Day 1" },
    { id: "d03", name: "W-4 Tax Form", type: "Payroll", status: "Not Started", dueDate: "Day 1" },
    { id: "d04", name: "Direct Deposit Form", type: "Payroll", status: "Not Started", dueDate: "Day 1" },
    { id: "d05", name: "NDA / IP Agreement", type: "Legal", status: "Not Started", dueDate: "+3 days" },
    { id: "d06", name: "Equipment Receipt Form", type: "IT", status: "Not Started", dueDate: "+3 days" },
  ];

  const completedCount = Math.floor(docs.length * completionLevel);
  return docs.map((doc, index) => {
    if (index < completedCount) {
      return { ...doc, status: "Signed" as const, signedDate: "2026-02-01" };
    }
    if (index === completedCount && completionLevel > 0.2) {
      return { ...doc, status: "Pending" as const };
    }
    if (completionLevel > 0.5 && index === completedCount + 1) {
      return { ...doc, status: "Overdue" as const };
    }
    return doc;
  });
}

function buildWelcomePackage(completionLevel: number): WelcomePackageItem[] {
  const items: WelcomePackageItem[] = [
    { id: "w01", name: "MacBook Pro 16\"", status: "Pending", icon: Laptop },
    { id: "w02", name: "Company Swag Box", status: "Pending", icon: Gift },
    { id: "w03", name: "Welcome Handbook", status: "Pending", icon: BookOpen },
    { id: "w04", name: "Ergonomic Setup Kit", status: "Pending", icon: Package },
  ];

  if (completionLevel >= 0.8) {
    return items.map((i) => ({ ...i, status: "Shipped" as const }));
  }
  if (completionLevel >= 0.4) {
    return items.map((i, idx) =>
      idx < 2 ? { ...i, status: "Shipped" as const } : { ...i, status: "Preparing" as const }
    );
  }
  if (completionLevel >= 0.2) {
    return items.map((i, idx) =>
      idx === 0 ? { ...i, status: "Preparing" as const } : i
    );
  }
  return items;
}

const NEW_HIRES: NewHire[] = [
  {
    id: "nh-001",
    name: "Aisha Patel",
    email: "aisha.patel@company.com",
    role: "Senior Frontend Engineer",
    department: "Engineering",
    startDate: "2026-02-17",
    manager: "Jordan Lee",
    buddy: "Chris Morgan",
    template: "Engineering",
    progress: 85,
    tasksCompleted: 17,
    totalTasks: 20,
    location: "San Francisco, CA",
    tasks: buildTasks("engineering", "2026-02-17", 0.85),
    documents: buildDocuments(0.85),
    welcomePackage: buildWelcomePackage(0.85),
  },
  {
    id: "nh-002",
    name: "Marcus Chen",
    email: "marcus.chen@company.com",
    role: "Account Executive",
    department: "Sales",
    startDate: "2026-02-24",
    manager: "Sarah Williams",
    buddy: "David Kim",
    template: "Sales",
    progress: 45,
    tasksCompleted: 9,
    totalTasks: 20,
    location: "New York, NY",
    tasks: buildTasks("sales", "2026-02-24", 0.45),
    documents: buildDocuments(0.45),
    welcomePackage: buildWelcomePackage(0.45),
  },
  {
    id: "nh-003",
    name: "Elena Rodriguez",
    email: "elena.rodriguez@company.com",
    role: "Product Designer",
    department: "Design",
    startDate: "2026-03-03",
    manager: "Tom Jackson",
    buddy: "Maya Lin",
    template: "Remote",
    progress: 20,
    tasksCompleted: 4,
    totalTasks: 20,
    location: "Remote (Austin, TX)",
    tasks: buildTasks("remote", "2026-03-03", 0.20),
    documents: buildDocuments(0.20),
    welcomePackage: buildWelcomePackage(0.20),
  },
  {
    id: "nh-004",
    name: "James O'Brien",
    email: "james.obrien@company.com",
    role: "VP of Marketing",
    department: "Marketing",
    startDate: "2026-03-10",
    manager: "CEO - Lisa Park",
    buddy: "Anna Kowalski",
    template: "Executive",
    progress: 10,
    tasksCompleted: 2,
    totalTasks: 20,
    location: "San Francisco, CA",
    tasks: buildTasks("executive", "2026-03-10", 0.10),
    documents: buildDocuments(0.10),
    welcomePackage: buildWelcomePackage(0.10),
  },
  {
    id: "nh-005",
    name: "Sophie Zhang",
    email: "sophie.zhang@company.com",
    role: "Data Engineer",
    department: "Engineering",
    startDate: "2026-02-10",
    manager: "Rachel Green",
    buddy: "Alex Martinez",
    template: "Engineering",
    progress: 100,
    tasksCompleted: 20,
    totalTasks: 20,
    location: "Remote (Seattle, WA)",
    tasks: buildTasks("engineering", "2026-02-10", 1.0),
    documents: buildDocuments(1.0),
    welcomePackage: buildWelcomePackage(1.0),
  },
];

const ONBOARDING_TEMPLATES: OnboardingTemplate[] = [
  {
    id: "tmpl-eng",
    name: "Engineering",
    description: "Technical setup, codebase onboarding, and engineering-specific workflows",
    icon: Monitor,
    iconColor: "bg-blue-500",
    taskCount: 20,
    phases: [
      { phase: "Before Day 1", count: 6 },
      { phase: "Day 1", count: 5 },
      { phase: "Week 1", count: 5 },
      { phase: "Month 1", count: 4 },
    ],
    usedBy: 12,
  },
  {
    id: "tmpl-sales",
    name: "Sales",
    description: "CRM setup, sales playbook training, and quota ramping schedule",
    icon: Target,
    iconColor: "bg-emerald-500",
    taskCount: 18,
    phases: [
      { phase: "Before Day 1", count: 5 },
      { phase: "Day 1", count: 5 },
      { phase: "Week 1", count: 4 },
      { phase: "Month 1", count: 4 },
    ],
    usedBy: 8,
  },
  {
    id: "tmpl-remote",
    name: "Remote",
    description: "Remote-specific setup with equipment shipping and virtual onboarding sessions",
    icon: Laptop,
    iconColor: "bg-purple-500",
    taskCount: 22,
    phases: [
      { phase: "Before Day 1", count: 7 },
      { phase: "Day 1", count: 5 },
      { phase: "Week 1", count: 5 },
      { phase: "Month 1", count: 5 },
    ],
    usedBy: 15,
  },
  {
    id: "tmpl-exec",
    name: "Executive",
    description: "Board introductions, strategic planning sessions, and executive assistant setup",
    icon: Crown,
    iconColor: "bg-amber-500",
    taskCount: 16,
    phases: [
      { phase: "Before Day 1", count: 4 },
      { phase: "Day 1", count: 4 },
      { phase: "Week 1", count: 4 },
      { phase: "Month 1", count: 4 },
    ],
    usedBy: 3,
  },
];

function Crown(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M11.562 3.266a.5.5 0 0 1 .876 0L15.39 8.87a1 1 0 0 0 1.516.294L20.266 6.5a.5.5 0 0 1 .734.475l-.714 10.044a1 1 0 0 1-.997.981H4.711a1 1 0 0 1-.997-.981L3 6.975a.5.5 0 0 1 .734-.475l3.36 2.664a1 1 0 0 0 1.516-.294z" />
      <path d="M5 21h14" />
    </svg>
  );
}

// ─── Animations ─────────────────────────────────────────

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.06 } },
};

// ─── Helpers ────────────────────────────────────────────

function progressColor(progress: number): string {
  if (progress >= 100) return "text-emerald-600 dark:text-emerald-400";
  if (progress >= 60) return "text-blue-600 dark:text-blue-400";
  if (progress >= 30) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function taskStatusIcon(status: OnboardingTask["status"]) {
  switch (status) {
    case "Completed":
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case "In Progress":
      return <Clock className="h-4 w-4 text-blue-500" />;
    case "Pending":
      return <Circle className="h-4 w-4 text-muted-foreground" />;
    case "Overdue":
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
  }
}

function taskStatusVariant(status: OnboardingTask["status"]) {
  switch (status) {
    case "Completed":
      return "default" as const;
    case "In Progress":
      return "secondary" as const;
    case "Pending":
      return "outline" as const;
    case "Overdue":
      return "destructive" as const;
  }
}

function docStatusVariant(status: OnboardingDocument["status"]) {
  switch (status) {
    case "Signed":
      return "default" as const;
    case "Pending":
      return "secondary" as const;
    case "Not Started":
      return "outline" as const;
    case "Overdue":
      return "destructive" as const;
  }
}

function docStatusIcon(status: OnboardingDocument["status"]) {
  switch (status) {
    case "Signed":
      return <CheckCircle2 className="h-3 w-3" />;
    case "Pending":
      return <Clock className="h-3 w-3" />;
    case "Not Started":
      return <Circle className="h-3 w-3" />;
    case "Overdue":
      return <AlertTriangle className="h-3 w-3" />;
  }
}

function assigneeIcon(assignee: OnboardingTask["assignee"]) {
  switch (assignee) {
    case "HR":
      return <Shield className="h-3 w-3" />;
    case "Manager":
      return <Briefcase className="h-3 w-3" />;
    case "IT":
      return <Monitor className="h-3 w-3" />;
    case "New Hire":
      return <User className="h-3 w-3" />;
  }
}

function assigneeColor(assignee: OnboardingTask["assignee"]) {
  switch (assignee) {
    case "HR":
      return "border-purple-200 text-purple-700 dark:border-purple-800 dark:text-purple-400";
    case "Manager":
      return "border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-400";
    case "IT":
      return "border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-400";
    case "New Hire":
      return "border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400";
  }
}

function welcomeStatusVariant(status: WelcomePackageItem["status"]) {
  switch (status) {
    case "Shipped":
      return "default" as const;
    case "Preparing":
      return "secondary" as const;
    case "Pending":
      return "outline" as const;
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysUntil(dateStr: string): number {
  const now = new Date("2026-02-13");
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── New Hire Detail View ───────────────────────────────

function NewHireDetailView({
  hire,
  onClose,
}: {
  hire: NewHire;
  onClose: () => void;
}) {
  const [detailTab, setDetailTab] = useState("tasks");
  const [expandedPhase, setExpandedPhase] = useState<string | null>("Before Day 1");

  const phases = ["Before Day 1", "Day 1", "Week 1", "Month 1"];
  const tasksByPhase = phases.map((phase) => ({
    phase,
    tasks: hire.tasks.filter((t) => t.phase === phase),
    completed: hire.tasks.filter((t) => t.phase === phase && t.status === "Completed").length,
    total: hire.tasks.filter((t) => t.phase === phase).length,
  }));

  const days = daysUntil(hire.startDate);
  const daysLabel = days > 0 ? `Starts in ${days} days` : days === 0 ? "Starts today" : `Started ${Math.abs(days)} days ago`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                {hire.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div>
                <CardTitle className="text-lg">{hire.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{hire.role} &middot; {hire.department}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(hire.startDate)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {hire.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {hire.email}
                  </span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-4 mt-3">
            <Badge variant={days > 0 ? "secondary" : "default"} className="gap-1">
              <Clock className="h-3 w-3" />
              {daysLabel}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <User className="h-3 w-3" />
              Manager: {hire.manager}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Heart className="h-3 w-3" />
              Buddy: {hire.buddy}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <ClipboardList className="h-3 w-3" />
              Template: {hire.template}
            </Badge>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className={`text-sm font-bold ${progressColor(hire.progress)}`}>{hire.progress}%</span>
            </div>
            <Progress value={hire.progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">{hire.tasksCompleted} of {hire.totalTasks} tasks completed</p>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={detailTab} onValueChange={setDetailTab}>
            <TabsList>
              <TabsTrigger value="tasks">
                <ClipboardCheck className="mr-1.5 h-4 w-4" />
                Tasks
              </TabsTrigger>
              <TabsTrigger value="documents">
                <FileText className="mr-1.5 h-4 w-4" />
                Documents
              </TabsTrigger>
              <TabsTrigger value="welcome">
                <Gift className="mr-1.5 h-4 w-4" />
                Welcome Package
              </TabsTrigger>
              <TabsTrigger value="timeline">
                <Timer className="mr-1.5 h-4 w-4" />
                Timeline
              </TabsTrigger>
            </TabsList>

            {/* Tasks */}
            <TabsContent value="tasks" className="mt-4 space-y-3">
              {tasksByPhase.map(({ phase, tasks, completed, total }) => (
                <div key={phase} className="rounded-lg border">
                  <button
                    className="flex w-full items-center justify-between p-3 hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedPhase(expandedPhase === phase ? null : phase)}
                  >
                    <div className="flex items-center gap-3">
                      {expandedPhase === phase ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-medium text-sm">{phase}</span>
                      <Badge variant="outline" className="text-[10px] h-5">
                        {completed}/{total}
                      </Badge>
                    </div>
                    <Progress value={(completed / total) * 100} className="w-24 h-1.5" />
                  </button>
                  <AnimatePresence>
                    {expandedPhase === phase && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t px-3 pb-3 space-y-2 pt-2">
                          {tasks.map((task, index) => (
                            <motion.div
                              key={task.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.15, delay: index * 0.03 }}
                              className="flex items-start gap-3 rounded-md p-2 hover:bg-muted/20 transition-colors"
                            >
                              <button
                                className="mt-0.5 shrink-0"
                                onClick={() => {
                                  if (task.status !== "Completed") {
                                    toast.success(`Task "${task.title}" marked as complete`);
                                  }
                                }}
                              >
                                {taskStatusIcon(task.status)}
                              </button>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className={`text-sm font-medium ${task.status === "Completed" ? "line-through text-muted-foreground" : ""}`}>
                                    {task.title}
                                  </p>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <Badge variant="outline" className={`text-[10px] h-5 gap-0.5 ${assigneeColor(task.assignee)}`}>
                                    {assigneeIcon(task.assignee)}
                                    {task.assignee}
                                  </Badge>
                                  <span className="text-[10px] text-muted-foreground">{task.dueDateOffset}</span>
                                  {task.requiredDocuments && (
                                    <Badge variant="outline" className="text-[10px] h-5 gap-0.5">
                                      <FileText className="h-2.5 w-2.5" />
                                      {task.requiredDocuments.join(", ")}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <Badge variant={taskStatusVariant(task.status)} className="text-[10px] h-5 shrink-0">
                                {task.status}
                              </Badge>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </TabsContent>

            {/* Documents */}
            <TabsContent value="documents" className="mt-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {hire.documents.map((doc, index) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                  >
                    <Card className="border">
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{doc.name}</span>
                          </div>
                          <Badge variant={docStatusVariant(doc.status)} className="gap-1 text-[10px] h-5">
                            {docStatusIcon(doc.status)}
                            {doc.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{doc.type}</span>
                          <span>Due: {doc.dueDate}</span>
                        </div>
                        {doc.signedDate && (
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
                            Signed on {formatDate(doc.signedDate)}
                          </p>
                        )}
                        {doc.status !== "Signed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full mt-3"
                            onClick={() => toast.success(`Reminder sent for ${doc.name}`)}
                          >
                            <Mail className="mr-1.5 h-3 w-3" />
                            Send Reminder
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* Welcome Package */}
            <TabsContent value="welcome" className="mt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Package Items
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {hire.welcomePackage.map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                          className="flex items-center justify-between rounded-md border p-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className="rounded-md bg-muted p-2">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <span className="text-sm font-medium">{item.name}</span>
                          </div>
                          <Badge variant={welcomeStatusVariant(item.status)}>{item.status}</Badge>
                        </motion.div>
                      );
                    })}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Wrench className="h-4 w-4" />
                      Customize Welcome
                    </CardTitle>
                    <CardDescription>Personalize the welcome experience</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label>Welcome Message</Label>
                      <Textarea
                        placeholder="Write a personalized welcome message..."
                        rows={3}
                        defaultValue={`Welcome to the team, ${hire.name.split(" ")[0]}! We're thrilled to have you join us.`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Buddy/Mentor</Label>
                      <div className="flex items-center gap-2 rounded-md border p-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                          {hire.buddy.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{hire.buddy}</p>
                          <p className="text-xs text-muted-foreground">Assigned Buddy</p>
                        </div>
                        <Button variant="ghost" size="sm" className="ml-auto" onClick={() => toast.success("Buddy reassignment dialog coming soon!")}>
                          Change
                        </Button>
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => toast.success(`Welcome package customized for ${hire.name}`)}
                    >
                      <Gift className="mr-2 h-4 w-4" />
                      Save Customization
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Timeline */}
            <TabsContent value="timeline" className="mt-4">
              <div className="relative pl-8">
                <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
                {hire.tasks
                  .filter((t) => t.status === "Completed" || t.status === "In Progress")
                  .map((task, index) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.04 }}
                      className="relative pb-6 last:pb-0"
                    >
                      <div className="absolute -left-5 top-0.5">
                        {taskStatusIcon(task.status)}
                      </div>
                      <div className="rounded-lg border p-3 hover:bg-muted/20 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium">{task.title}</p>
                          <Badge variant="outline" className={`text-[10px] h-5 gap-0.5 ${assigneeColor(task.assignee)}`}>
                            {assigneeIcon(task.assignee)}
                            {task.assignee}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{task.description}</p>
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                          <Badge variant={taskStatusVariant(task.status)} className="text-[10px] h-4">
                            {task.status}
                          </Badge>
                          <span>{task.phase} &middot; {task.dueDateOffset}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                {hire.tasks.filter((t) => t.status === "Completed" || t.status === "In Progress").length === 0 && (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No tasks have been started yet.
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Main Page ──────────────────────────────────────────

export default function OnboardingPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedHire, setSelectedHire] = useState<NewHire | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const upcomingStarts = NEW_HIRES.filter((h) => daysUntil(h.startDate) > 0).length;
  const inProgress = NEW_HIRES.filter((h) => h.progress > 0 && h.progress < 100).length;
  const completed = NEW_HIRES.filter((h) => h.progress === 100).length;
  const overdueTasks = NEW_HIRES.flatMap((h) => h.tasks).filter((t) => t.status === "Overdue").length;
  const avgCompletion = Math.round(NEW_HIRES.reduce((sum, h) => sum + h.progress, 0) / NEW_HIRES.length);

  const filteredHires = useMemo(() => {
    if (!searchQuery) return NEW_HIRES;
    return NEW_HIRES.filter(
      (h) =>
        h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.department.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Onboarding Management</h1>
          <p className="text-muted-foreground">
            Manage new hire onboarding workflows and track completion
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => toast.success("Template builder opening...")}>
            <ClipboardList className="mr-2 h-4 w-4" />
            Templates
          </Button>
          <Button onClick={() => toast.success("New onboarding started!")}>
            <UserPlus className="mr-2 h-4 w-4" />
            Start Onboarding
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-5"
      >
        {[
          {
            title: "Upcoming Starts",
            value: upcomingStarts,
            subtitle: "In the next 30 days",
            icon: Calendar,
            iconColor: "bg-blue-500",
          },
          {
            title: "In Progress",
            value: inProgress,
            subtitle: "Actively onboarding",
            icon: Clock,
            iconColor: "bg-amber-500",
          },
          {
            title: "Completed",
            value: completed,
            subtitle: "Fully onboarded",
            icon: CheckCircle2,
            iconColor: "bg-emerald-500",
          },
          {
            title: "Overdue Tasks",
            value: overdueTasks,
            subtitle: "Need attention",
            icon: AlertTriangle,
            iconColor: "bg-red-500",
          },
          {
            title: "Avg Completion",
            value: `${avgCompletion}%`,
            subtitle: "Satisfaction: 4.7/5",
            icon: TrendingUp,
            iconColor: "bg-purple-500",
            trend: { value: "+8%", positive: true },
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.4, delay: index * 0.08 }}
          >
            <Card className="relative overflow-hidden">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                  </div>
                  <div className={`rounded-lg p-2.5 ${stat.iconColor}`}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
                {"trend" in stat && stat.trend && (
                  <div className="mt-2 flex items-center gap-1">
                    <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                    <span className="text-xs font-medium text-emerald-500">{stat.trend.value}</span>
                    <span className="text-xs text-muted-foreground">vs last quarter</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="dashboard">
              <Users className="mr-1.5 h-4 w-4" />
              New Hires
            </TabsTrigger>
            <TabsTrigger value="templates">
              <ClipboardList className="mr-1.5 h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="mr-1.5 h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="stats">
              <BarChart3 className="mr-1.5 h-4 w-4" />
              Statistics
            </TabsTrigger>
          </TabsList>

          {/* New Hires Tab */}
          <TabsContent value="dashboard" className="mt-4">
            <AnimatePresence mode="wait">
              {selectedHire ? (
                <NewHireDetailView
                  key={selectedHire.id}
                  hire={selectedHire}
                  onClose={() => setSelectedHire(null)}
                />
              ) : (
                <motion.div
                  key="hire-grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search new hires..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredHires.map((hire, index) => {
                      const days = daysUntil(hire.startDate);
                      const daysLabel = days > 0 ? `Starts in ${days} days` : days === 0 ? "Starts today" : `Day ${Math.abs(days)}`;
                      return (
                        <motion.div
                          key={hire.id}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.07 }}
                        >
                          <Card
                            className="cursor-pointer hover:border-primary/40 transition-all hover:shadow-md group"
                            onClick={() => setSelectedHire(hire)}
                          >
                            <CardContent className="pt-5 pb-5">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                                    {hire.name.split(" ").map((n) => n[0]).join("")}
                                  </div>
                                  <div>
                                    <h3 className="font-semibold text-sm">{hire.name}</h3>
                                    <p className="text-xs text-muted-foreground">{hire.role}</p>
                                  </div>
                                </div>
                                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>

                              <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                                <Badge variant={days > 0 ? "secondary" : hire.progress === 100 ? "default" : "outline"} className="text-[10px] h-5 gap-1">
                                  {hire.progress === 100 ? (
                                    <CheckCircle2 className="h-2.5 w-2.5" />
                                  ) : (
                                    <Clock className="h-2.5 w-2.5" />
                                  )}
                                  {hire.progress === 100 ? "Completed" : daysLabel}
                                </Badge>
                                <span>{hire.department}</span>
                                <span>&middot;</span>
                                <span>{hire.location}</span>
                              </div>

                              <div className="mb-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-muted-foreground">Progress</span>
                                  <span className={`text-xs font-bold ${progressColor(hire.progress)}`}>
                                    {hire.progress}%
                                  </span>
                                </div>
                                <Progress value={hire.progress} className="h-1.5" />
                              </div>

                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{hire.tasksCompleted}/{hire.totalTasks} tasks</span>
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  <span>{hire.manager}</span>
                                </div>
                              </div>

                              {/* Document status summary */}
                              <Separator className="my-3" />
                              <div className="flex items-center gap-2">
                                <FileText className="h-3 w-3 text-muted-foreground" />
                                <div className="flex gap-1">
                                  {hire.documents.map((doc) => (
                                    <div
                                      key={doc.id}
                                      className={`h-2 w-2 rounded-full ${
                                        doc.status === "Signed"
                                          ? "bg-emerald-500"
                                          : doc.status === "Pending"
                                          ? "bg-amber-500"
                                          : doc.status === "Overdue"
                                          ? "bg-red-500"
                                          : "bg-muted-foreground/30"
                                      }`}
                                      title={`${doc.name}: ${doc.status}`}
                                    />
                                  ))}
                                </div>
                                <span className="text-[10px] text-muted-foreground ml-auto">
                                  {hire.documents.filter((d) => d.status === "Signed").length}/{hire.documents.length} docs
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              {ONBOARDING_TEMPLATES.map((template, index) => {
                const Icon = template.icon;
                return (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.08 }}
                  >
                    <Card className="hover:border-primary/30 transition-colors">
                      <CardContent className="pt-5 pb-5">
                        <div className="flex items-start gap-4">
                          <div className={`rounded-lg p-3 ${template.iconColor}`}>
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold">{template.name}</h3>
                              <Badge variant="outline" className="text-[10px] h-5">
                                Used by {template.usedBy}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-3">{template.description}</p>

                            <div className="grid grid-cols-4 gap-2 mb-3">
                              {template.phases.map((phase) => (
                                <div
                                  key={phase.phase}
                                  className="rounded-md bg-muted/40 p-2 text-center"
                                >
                                  <p className="text-sm font-bold">{phase.count}</p>
                                  <p className="text-[10px] text-muted-foreground leading-tight">{phase.phase}</p>
                                </div>
                              ))}
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">
                                {template.taskCount} total tasks
                              </span>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toast.success(`Editing ${template.name} template`)}
                                >
                                  <PenLine className="mr-1.5 h-3 w-3" />
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => toast.success(`Using ${template.name} template for new onboarding`)}
                                >
                                  <Plus className="mr-1.5 h-3 w-3" />
                                  Use
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Template Builder */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="mt-4"
            >
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <div className="rounded-full p-3 bg-muted/50 mb-3">
                    <Plus className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium mb-1">Create Custom Template</p>
                  <p className="text-xs text-muted-foreground mb-3">Build a new onboarding workflow from scratch</p>
                  <Button variant="outline" onClick={() => toast.success("Template builder opening...")}>
                    <ClipboardList className="mr-2 h-4 w-4" />
                    Build Template
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Document Collection Tracking</CardTitle>
                <CardDescription>Track required documents across all new hires</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>New Hire</TableHead>
                      <TableHead>Offer Letter</TableHead>
                      <TableHead>I-9 Form</TableHead>
                      <TableHead>W-4 Form</TableHead>
                      <TableHead>Direct Deposit</TableHead>
                      <TableHead>NDA</TableHead>
                      <TableHead>Equipment Form</TableHead>
                      <TableHead>Completion</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {NEW_HIRES.map((hire, index) => {
                      const signedCount = hire.documents.filter((d) => d.status === "Signed").length;
                      const totalDocs = hire.documents.length;
                      return (
                        <motion.tr
                          key={hire.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                          className="border-b transition-colors hover:bg-muted/50"
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary">
                                {hire.name.split(" ").map((n) => n[0]).join("")}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{hire.name}</p>
                                <p className="text-[10px] text-muted-foreground">{hire.role}</p>
                              </div>
                            </div>
                          </TableCell>
                          {hire.documents.map((doc) => (
                            <TableCell key={doc.id}>
                              <Badge variant={docStatusVariant(doc.status)} className="gap-1 text-[10px] h-5">
                                {docStatusIcon(doc.status)}
                                {doc.status}
                              </Badge>
                            </TableCell>
                          ))}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={(signedCount / totalDocs) * 100} className="w-16 h-1.5" />
                              <span className="text-xs font-medium">{signedCount}/{totalDocs}</span>
                            </div>
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="stats" className="mt-4">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Onboarding Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Onboarding Metrics</CardTitle>
                  <CardDescription>Key performance indicators for the onboarding process</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: "Average Completion Rate", value: `${avgCompletion}%`, bar: avgCompletion, color: "bg-emerald-500" },
                    { label: "Avg Time to Full Completion", value: "18 days", bar: 60, color: "bg-blue-500" },
                    { label: "New Hire Satisfaction Score", value: "4.7 / 5", bar: 94, color: "bg-purple-500" },
                    { label: "Document Completion Rate", value: "89%", bar: 89, color: "bg-amber-500" },
                    { label: "Buddy Program Engagement", value: "92%", bar: 92, color: "bg-rose-500" },
                  ].map((metric, index) => (
                    <motion.div
                      key={metric.label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.06 }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm">{metric.label}</span>
                        <span className="text-sm font-bold">{metric.value}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <motion.div
                          className={`h-full rounded-full ${metric.color}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${metric.bar}%` }}
                          transition={{ duration: 0.6, delay: index * 0.08 }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>

              {/* Phase Completion */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Phase Completion Breakdown</CardTitle>
                  <CardDescription>Aggregate task completion by onboarding phase</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {["Before Day 1", "Day 1", "Week 1", "Month 1"].map((phase, index) => {
                      const allTasksInPhase = NEW_HIRES.flatMap((h) => h.tasks.filter((t) => t.phase === phase));
                      const completedInPhase = allTasksInPhase.filter((t) => t.status === "Completed").length;
                      const totalInPhase = allTasksInPhase.length;
                      const pct = totalInPhase > 0 ? Math.round((completedInPhase / totalInPhase) * 100) : 0;
                      const phaseColors = ["bg-blue-500", "bg-emerald-500", "bg-purple-500", "bg-amber-500"];

                      return (
                        <motion.div
                          key={phase}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.08 }}
                          className="rounded-lg border p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`h-3 w-3 rounded-full ${phaseColors[index]}`} />
                              <span className="text-sm font-medium">{phase}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-bold">{pct}%</span>
                              <span className="text-xs text-muted-foreground ml-1">
                                ({completedInPhase}/{totalInPhase})
                              </span>
                            </div>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted">
                            <motion.div
                              className={`h-full rounded-full ${phaseColors[index]}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.6, delay: index * 0.1 }}
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Per-Hire Summary */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Individual Progress Summary</CardTitle>
                  <CardDescription>Completion status for each new hire</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-5">
                    {NEW_HIRES.map((hire, index) => (
                      <motion.div
                        key={hire.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.06 }}
                        className="flex flex-col items-center text-center rounded-lg border p-4"
                      >
                        <div className="relative mb-2">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                            {hire.name.split(" ").map((n) => n[0]).join("")}
                          </div>
                          {hire.progress === 100 && (
                            <CheckCircle2 className="absolute -top-1 -right-1 h-4 w-4 text-emerald-500 bg-white dark:bg-gray-900 rounded-full" />
                          )}
                        </div>
                        <p className="text-sm font-medium">{hire.name.split(" ")[0]}</p>
                        <p className="text-[10px] text-muted-foreground mb-2">{hire.department}</p>
                        <div className="w-full mb-1">
                          <Progress value={hire.progress} className="h-1.5" />
                        </div>
                        <span className={`text-xs font-bold ${progressColor(hire.progress)}`}>
                          {hire.progress}%
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
