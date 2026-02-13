"use client";

import React, { useState, useMemo } from "react";
import {
  Users,
  UserPlus,
  CheckCircle2,
  Clock,
  Star,
  Search,
  Plus,
  Calendar,
  Mail,
  Briefcase,
  AlertTriangle,
  TrendingUp,
  Laptop,
  FileText,
  Shield,
  BookOpen,
  FolderKanban,
  UserCheck,
  Eye,
  Copy,
  ArrowLeft,
  Timer,
  CircleDot,
  Target,
  Sparkles,
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

// ─── Types ──────────────────────────────────────────────────────────────────

type OnboardingStatus = "on-track" | "at-risk" | "behind" | "completed";

type TaskCategory =
  | "equipment"
  | "hr"
  | "team"
  | "access"
  | "training"
  | "project";

interface OnboardingTask {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  completed: boolean;
  dueDate: string;
  responsiblePerson: string;
  completedDate?: string;
}

interface Onboarding {
  id: string;
  employeeName: string;
  employeeEmail: string;
  jobTitle: string;
  department: string;
  startDate: string;
  buddyName: string;
  templateId: string;
  status: OnboardingStatus;
  tasks: OnboardingTask[];
  avatarColor: string;
}

interface OnboardingTemplate {
  id: string;
  name: string;
  description: string;
  departments: string[];
  durationDays: number;
  taskCount: number;
  tasks: {
    id: string;
    title: string;
    description: string;
    category: TaskCategory;
    dayOffset: number;
    responsiblePerson: string;
  }[];
  usedCount: number;
  lastUsed: string;
}

// ─── Constants & Helpers ────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-pink-500",
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getProgressColor(pct: number): string {
  if (pct >= 75) return "text-emerald-600";
  if (pct >= 50) return "text-amber-600";
  return "text-red-600";
}

function getProgressBarColor(pct: number): string {
  if (pct >= 75) return "bg-emerald-500";
  if (pct >= 50) return "bg-amber-500";
  return "bg-red-500";
}

function getProgressTrackColor(pct: number): string {
  if (pct >= 75) return "bg-emerald-100";
  if (pct >= 50) return "bg-amber-100";
  return "bg-red-100";
}

function getStatusConfig(status: OnboardingStatus) {
  switch (status) {
    case "on-track":
      return {
        label: "On Track",
        variant: "default" as const,
        className: "bg-emerald-100 text-emerald-700 border-emerald-200",
        icon: CheckCircle2,
      };
    case "at-risk":
      return {
        label: "At Risk",
        variant: "secondary" as const,
        className: "bg-amber-100 text-amber-700 border-amber-200",
        icon: AlertTriangle,
      };
    case "behind":
      return {
        label: "Behind",
        variant: "destructive" as const,
        className: "bg-red-100 text-red-700 border-red-200",
        icon: Clock,
      };
    case "completed":
      return {
        label: "Completed",
        variant: "outline" as const,
        className: "bg-blue-100 text-blue-700 border-blue-200",
        icon: Star,
      };
  }
}

function getCategoryIcon(category: TaskCategory) {
  switch (category) {
    case "equipment":
      return Laptop;
    case "hr":
      return FileText;
    case "team":
      return Users;
    case "access":
      return Shield;
    case "training":
      return BookOpen;
    case "project":
      return FolderKanban;
  }
}

function getCategoryLabel(category: TaskCategory): string {
  switch (category) {
    case "equipment":
      return "Equipment Setup";
    case "hr":
      return "HR Paperwork";
    case "team":
      return "Team Introductions";
    case "access":
      return "System Access";
    case "training":
      return "Training Modules";
    case "project":
      return "First Project";
  }
}

function daysBetween(dateStr: string, reference: Date = new Date()): number {
  const date = new Date(dateStr);
  const diffMs = date.getTime() - reference.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function deriveStatus(tasks: OnboardingTask[]): OnboardingStatus {
  if (tasks.length === 0) return "on-track";
  const completedCount = tasks.filter((t) => t.completed).length;
  const pct = Math.round((completedCount / tasks.length) * 100);
  if (pct === 100) return "completed";
  if (pct >= 75) return "on-track";
  if (pct >= 50) return "at-risk";
  return "behind";
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

function makeTasks(
  startDate: string,
  completedStates: boolean[]
): OnboardingTask[] {
  const start = new Date(startDate);
  const taskDefs: {
    title: string;
    description: string;
    category: TaskCategory;
    dayOffset: number;
    responsible: string;
  }[] = [
      {
        title: "Equipment Setup",
        description:
          "Provision laptop, monitors, peripherals, and configure workstation",
        category: "equipment",
        dayOffset: 1,
        responsible: "IT Support",
      },
      {
        title: "HR Paperwork & Benefits",
        description:
          "Complete I-9 verification, tax forms, benefits enrollment, and company policies review",
        category: "hr",
        dayOffset: 2,
        responsible: "HR Coordinator",
      },
      {
        title: "Team Introductions",
        description:
          "Meet direct team members, cross-functional partners, and leadership stakeholders",
        category: "team",
        dayOffset: 5,
        responsible: "Hiring Manager",
      },
      {
        title: "System Access & Tools",
        description:
          "Set up email, Slack, GitHub, Jira, VPN, and all required development tools",
        category: "access",
        dayOffset: 3,
        responsible: "IT Support",
      },
      {
        title: "Training Modules",
        description:
          "Complete security awareness, compliance, product overview, and role-specific training",
        category: "training",
        dayOffset: 14,
        responsible: "L&D Team",
      },
      {
        title: "First Project Assignment",
        description:
          "Review project brief, set up local environment, complete starter task, and first PR",
        category: "project",
        dayOffset: 21,
        responsible: "Engineering Lead",
      },
    ];

  return taskDefs.map((def, i) => {
    const dueDate = new Date(start);
    dueDate.setDate(dueDate.getDate() + def.dayOffset);
    const completed = completedStates[i] ?? false;
    const completedDate = completed
      ? new Date(
        dueDate.getTime() - Math.random() * 2 * 24 * 60 * 60 * 1000
      )
        .toISOString()
        .split("T")[0]
      : undefined;

    return {
      id: `task-${i}-${startDate}-${Math.random().toString(36).slice(2, 7)}`,
      title: def.title,
      description: def.description,
      category: def.category,
      completed,
      dueDate: dueDate.toISOString().split("T")[0],
      responsiblePerson: def.responsible,
      completedDate,
    };
  });
}

const INITIAL_ONBOARDINGS: Onboarding[] = [
  {
    id: "ob-1",
    employeeName: "Sarah Chen",
    employeeEmail: "sarah.chen@company.com",
    jobTitle: "Senior Frontend Engineer",
    department: "Engineering",
    startDate: "2026-02-10",
    buddyName: "Alex Rivera",
    templateId: "tmpl-1",
    status: "on-track",
    tasks: makeTasks("2026-02-10", [true, true, true, true, false, false]),
    avatarColor: AVATAR_COLORS[0],
  },
  {
    id: "ob-2",
    employeeName: "Marcus Johnson",
    employeeEmail: "marcus.johnson@company.com",
    jobTitle: "Product Designer",
    department: "Design",
    startDate: "2026-02-03",
    buddyName: "Emily Zhang",
    templateId: "tmpl-2",
    status: "at-risk",
    tasks: makeTasks("2026-02-03", [true, true, false, true, false, false]),
    avatarColor: AVATAR_COLORS[1],
  },
  {
    id: "ob-3",
    employeeName: "Priya Patel",
    employeeEmail: "priya.patel@company.com",
    jobTitle: "Data Scientist",
    department: "Engineering",
    startDate: "2026-02-12",
    buddyName: "David Kim",
    templateId: "tmpl-1",
    status: "on-track",
    tasks: makeTasks("2026-02-12", [true, true, false, false, false, false]),
    avatarColor: AVATAR_COLORS[2],
  },
  {
    id: "ob-4",
    employeeName: "James O'Brien",
    employeeEmail: "james.obrien@company.com",
    jobTitle: "Sales Manager",
    department: "Sales",
    startDate: "2026-01-20",
    buddyName: "Lisa Nakamura",
    templateId: "tmpl-3",
    status: "behind",
    tasks: makeTasks("2026-01-20", [true, false, true, false, false, false]),
    avatarColor: AVATAR_COLORS[3],
  },
  {
    id: "ob-5",
    employeeName: "Ana Rodriguez",
    employeeEmail: "ana.rodriguez@company.com",
    jobTitle: "Marketing Analyst",
    department: "Marketing",
    startDate: "2026-01-27",
    buddyName: "Tom Wilson",
    templateId: "tmpl-2",
    status: "on-track",
    tasks: makeTasks("2026-01-27", [true, true, true, true, true, false]),
    avatarColor: AVATAR_COLORS[4],
  },
  {
    id: "ob-6",
    employeeName: "Kevin Park",
    employeeEmail: "kevin.park@company.com",
    jobTitle: "DevOps Engineer",
    department: "Engineering",
    startDate: "2025-12-15",
    buddyName: "Maria Santos",
    templateId: "tmpl-1",
    status: "completed",
    tasks: makeTasks("2025-12-15", [true, true, true, true, true, true]),
    avatarColor: AVATAR_COLORS[5],
  },
  {
    id: "ob-7",
    employeeName: "Rachel Foster",
    employeeEmail: "rachel.foster@company.com",
    jobTitle: "UX Researcher",
    department: "Design",
    startDate: "2025-12-28",
    buddyName: "Alex Rivera",
    templateId: "tmpl-2",
    status: "completed",
    tasks: makeTasks("2025-12-28", [true, true, true, true, true, true]),
    avatarColor: AVATAR_COLORS[6],
  },
];

const TEMPLATES: OnboardingTemplate[] = [
  {
    id: "tmpl-1",
    name: "Engineering Onboarding",
    description:
      "Comprehensive onboarding for all engineering roles including dev environment setup, codebase walkthroughs, and architecture reviews.",
    departments: ["Engineering"],
    durationDays: 30,
    taskCount: 6,
    tasks: [
      {
        id: "t-t1-1",
        title: "Equipment Setup",
        description: "Provision development laptop, monitors, and peripherals",
        category: "equipment",
        dayOffset: 1,
        responsiblePerson: "IT Support",
      },
      {
        id: "t-t1-2",
        title: "HR Paperwork & Benefits",
        description:
          "Complete all hiring documentation and benefits enrollment",
        category: "hr",
        dayOffset: 2,
        responsiblePerson: "HR Coordinator",
      },
      {
        id: "t-t1-3",
        title: "Team Introductions",
        description:
          "Meet engineering team, product managers, and stakeholders",
        category: "team",
        dayOffset: 5,
        responsiblePerson: "Hiring Manager",
      },
      {
        id: "t-t1-4",
        title: "System Access & Dev Tools",
        description:
          "Set up GitHub, CI/CD, cloud console, IDE, and development environment",
        category: "access",
        dayOffset: 3,
        responsiblePerson: "IT Support",
      },
      {
        id: "t-t1-5",
        title: "Training Modules",
        description:
          "Security training, architecture overview, coding standards, and code review process",
        category: "training",
        dayOffset: 14,
        responsiblePerson: "L&D Team",
      },
      {
        id: "t-t1-6",
        title: "First Project Assignment",
        description:
          "Set up local env, review project docs, complete onboarding task, submit first PR",
        category: "project",
        dayOffset: 21,
        responsiblePerson: "Engineering Lead",
      },
    ],
    usedCount: 24,
    lastUsed: "2026-02-12",
  },
  {
    id: "tmpl-2",
    name: "Design & Creative",
    description:
      "Tailored onboarding for design roles covering design systems, tool access, portfolio reviews, and creative workflow integration.",
    departments: ["Design", "Marketing"],
    durationDays: 21,
    taskCount: 6,
    tasks: [
      {
        id: "t-t2-1",
        title: "Equipment & Design Tools",
        description:
          "Provision hardware, Figma licenses, Adobe Creative Suite, and design peripherals",
        category: "equipment",
        dayOffset: 1,
        responsiblePerson: "IT Support",
      },
      {
        id: "t-t2-2",
        title: "HR Paperwork & Benefits",
        description:
          "Complete all hiring documentation and benefits enrollment",
        category: "hr",
        dayOffset: 2,
        responsiblePerson: "HR Coordinator",
      },
      {
        id: "t-t2-3",
        title: "Team & Stakeholder Intros",
        description:
          "Meet design team, product managers, engineers, and brand team",
        category: "team",
        dayOffset: 4,
        responsiblePerson: "Design Director",
      },
      {
        id: "t-t2-4",
        title: "System & Tool Access",
        description:
          "Set up Figma, Notion, design system access, and prototype tools",
        category: "access",
        dayOffset: 3,
        responsiblePerson: "IT Support",
      },
      {
        id: "t-t2-5",
        title: "Design System Training",
        description:
          "Review brand guidelines, component library, accessibility standards, and design tokens",
        category: "training",
        dayOffset: 10,
        responsiblePerson: "Design Lead",
      },
      {
        id: "t-t2-6",
        title: "First Design Assignment",
        description:
          "Pick up a design task, create explorations, present in design critique",
        category: "project",
        dayOffset: 14,
        responsiblePerson: "Design Director",
      },
    ],
    usedCount: 12,
    lastUsed: "2026-02-03",
  },
  {
    id: "tmpl-3",
    name: "Sales & Business Development",
    description:
      "Structured onboarding for revenue roles including CRM training, product demos, pitch decks, and shadowing opportunities.",
    departments: ["Sales", "Business Development"],
    durationDays: 30,
    taskCount: 6,
    tasks: [
      {
        id: "t-t3-1",
        title: "Equipment Setup",
        description: "Provision laptop, headset, and mobile phone",
        category: "equipment",
        dayOffset: 1,
        responsiblePerson: "IT Support",
      },
      {
        id: "t-t3-2",
        title: "HR Paperwork & Benefits",
        description:
          "Complete all hiring documentation and benefits enrollment",
        category: "hr",
        dayOffset: 2,
        responsiblePerson: "HR Coordinator",
      },
      {
        id: "t-t3-3",
        title: "Team & Territory Intros",
        description:
          "Meet sales team, territory overview, key account handoffs",
        category: "team",
        dayOffset: 3,
        responsiblePerson: "Sales Director",
      },
      {
        id: "t-t3-4",
        title: "CRM & Sales Tools",
        description:
          "Set up Salesforce, outreach tools, call recording, and analytics dashboards",
        category: "access",
        dayOffset: 3,
        responsiblePerson: "Sales Ops",
      },
      {
        id: "t-t3-5",
        title: "Product & Sales Training",
        description:
          "Product deep dive, competitive landscape, objection handling, and pitch practice",
        category: "training",
        dayOffset: 14,
        responsiblePerson: "Sales Enablement",
      },
      {
        id: "t-t3-6",
        title: "First Deal Shadowing",
        description:
          "Shadow senior rep on calls, co-pilot first outreach, begin pipeline building",
        category: "project",
        dayOffset: 21,
        responsiblePerson: "Sales Director",
      },
    ],
    usedCount: 8,
    lastUsed: "2026-01-20",
  },
];

// ─── Animation Variants ─────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 30 },
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
} as const;

const fadeIn = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// ─── Main Component ─────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const [onboardings, setOnboardings] =
    useState<Onboarding[]>(INITIAL_ONBOARDINGS);
  const [activeTab, setActiveTab] = useState("active");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOnboarding, setSelectedOnboarding] =
    useState<Onboarding | null>(null);
  const [startDialogOpen, setStartDialogOpen] = useState(false);

  // New onboarding form state
  const [newTemplate, setNewTemplate] = useState("");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newJobTitle, setNewJobTitle] = useState("");
  const [newDepartment, setNewDepartment] = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [newBuddy, setNewBuddy] = useState("");

  // ─── Derived Data ───────────────────────────────────────────────────

  const activeOnboardings = useMemo(
    () => onboardings.filter((o) => o.status !== "completed"),
    [onboardings]
  );

  const completedOnboardings = useMemo(
    () => onboardings.filter((o) => o.status === "completed"),
    [onboardings]
  );

  const stats = useMemo(() => {
    const active = activeOnboardings.length;
    const completedThisMonth = completedOnboardings.length;
    const avgCompletionDays =
      completedOnboardings.length > 0
        ? Math.round(
          completedOnboardings.reduce((acc, o) => {
            const lastTask = o.tasks
              .filter((t) => t.completedDate)
              .sort(
                (a, b) =>
                  new Date(b.completedDate!).getTime() -
                  new Date(a.completedDate!).getTime()
              )[0];
            if (!lastTask?.completedDate) return acc + 24;
            return (
              acc +
              Math.abs(
                daysBetween(lastTask.completedDate, new Date(o.startDate))
              )
            );
          }, 0) / completedOnboardings.length
        )
        : 0;
    return {
      active,
      completedThisMonth,
      avgCompletionDays: avgCompletionDays || 24,
      satisfactionScore: 4.7,
    };
  }, [activeOnboardings, completedOnboardings]);

  const filteredActive = useMemo(() => {
    let list = activeOnboardings;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.employeeName.toLowerCase().includes(q) ||
          o.jobTitle.toLowerCase().includes(q) ||
          o.department.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      list = list.filter((o) => o.status === statusFilter);
    }
    return list;
  }, [activeOnboardings, search, statusFilter]);

  const filteredCompleted = useMemo(() => {
    if (!search) return completedOnboardings;
    const q = search.toLowerCase();
    return completedOnboardings.filter(
      (o) =>
        o.employeeName.toLowerCase().includes(q) ||
        o.jobTitle.toLowerCase().includes(q) ||
        o.department.toLowerCase().includes(q)
    );
  }, [completedOnboardings, search]);

  // ─── Handlers ───────────────────────────────────────────────────────

  function getProgress(ob: Onboarding): number {
    if (ob.tasks.length === 0) return 0;
    const done = ob.tasks.filter((t) => t.completed).length;
    return Math.round((done / ob.tasks.length) * 100);
  }

  function getDaysInfo(ob: Onboarding): {
    label: string;
    value: number;
    isOverdue: boolean;
  } {
    if (ob.status === "completed") {
      const lastCompleted = ob.tasks
        .filter((t) => t.completedDate)
        .sort(
          (a, b) =>
            new Date(b.completedDate!).getTime() -
            new Date(a.completedDate!).getTime()
        )[0];
      const totalDays = lastCompleted?.completedDate
        ? Math.abs(
          daysBetween(lastCompleted.completedDate, new Date(ob.startDate))
        )
        : 0;
      return { label: "Days to Complete", value: totalDays, isOverdue: false };
    }

    const lastTaskDue = ob.tasks
      .filter((t) => !t.completed)
      .sort(
        (a, b) =>
          new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
      )[0];

    if (!lastTaskDue)
      return { label: "Days Remaining", value: 0, isOverdue: false };

    const remaining = daysBetween(lastTaskDue.dueDate);
    return {
      label: remaining >= 0 ? "Days Remaining" : "Days Overdue",
      value: Math.abs(remaining),
      isOverdue: remaining < 0,
    };
  }

  function toggleTask(onboardingId: string, taskId: string) {
    setOnboardings((prev) =>
      prev.map((ob) => {
        if (ob.id !== onboardingId) return ob;
        const updatedTasks = ob.tasks.map((t) => {
          if (t.id !== taskId) return t;
          const nowCompleted = !t.completed;
          return {
            ...t,
            completed: nowCompleted,
            completedDate: nowCompleted
              ? new Date().toISOString().split("T")[0]
              : undefined,
          };
        });
        const newStatus = deriveStatus(updatedTasks);
        return { ...ob, tasks: updatedTasks, status: newStatus };
      })
    );

    const ob = onboardings.find((o) => o.id === onboardingId);
    const task = ob?.tasks.find((t) => t.id === taskId);
    if (task) {
      const newState = !task.completed;
      toast.success(
        newState
          ? `"${task.title}" marked as complete`
          : `"${task.title}" marked as incomplete`
      );
    }

    if (selectedOnboarding?.id === onboardingId) {
      setSelectedOnboarding((prev) => {
        if (!prev) return prev;
        const updatedTasks = prev.tasks.map((t) => {
          if (t.id !== taskId) return t;
          const nowCompleted = !t.completed;
          return {
            ...t,
            completed: nowCompleted,
            completedDate: nowCompleted
              ? new Date().toISOString().split("T")[0]
              : undefined,
          };
        });
        const newStatus = deriveStatus(updatedTasks);
        return { ...prev, tasks: updatedTasks, status: newStatus };
      });
    }
  }

  function handleStartOnboarding() {
    if (!newTemplate || !newName || !newEmail || !newStartDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    const template = TEMPLATES.find((t) => t.id === newTemplate);
    if (!template) return;

    const startDateObj = new Date(newStartDate);
    const newTasks: OnboardingTask[] = template.tasks.map((tt, idx) => {
      const due = new Date(startDateObj);
      due.setDate(due.getDate() + tt.dayOffset);
      return {
        id: `new-task-${idx}-${Date.now()}`,
        title: tt.title,
        description: tt.description,
        category: tt.category,
        completed: false,
        dueDate: due.toISOString().split("T")[0],
        responsiblePerson: tt.responsiblePerson,
      };
    });

    const newOnboarding: Onboarding = {
      id: `ob-${Date.now()}`,
      employeeName: newName,
      employeeEmail: newEmail,
      jobTitle: newJobTitle || "New Hire",
      department: newDepartment || template.departments[0],
      startDate: newStartDate,
      buddyName: newBuddy || "Unassigned",
      templateId: template.id,
      status: "on-track",
      tasks: newTasks,
      avatarColor:
        AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    };

    setOnboardings((prev) => [newOnboarding, ...prev]);
    setStartDialogOpen(false);
    setNewTemplate("");
    setNewName("");
    setNewEmail("");
    setNewJobTitle("");
    setNewDepartment("");
    setNewStartDate("");
    setNewBuddy("");
    toast.success(`Onboarding started for ${newName}`, {
      description: `Using ${template.name} template`,
    });
  }

  // ─── Detail View ────────────────────────────────────────────────────

  if (selectedOnboarding) {
    const ob = selectedOnboarding;
    const progress = getProgress(ob);
    const statusConf = getStatusConfig(ob.status);
    const StatusIcon = statusConf.icon;
    const daysInfo = getDaysInfo(ob);
    const categories: TaskCategory[] = [
      "equipment",
      "hr",
      "team",
      "access",
      "training",
      "project",
    ];

    const completedTasks = ob.tasks
      .filter((t) => t.completed && t.completedDate)
      .sort(
        (a, b) =>
          new Date(a.completedDate!).getTime() -
          new Date(b.completedDate!).getTime()
      );

    return (
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedOnboarding(null)}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div className="h-5 w-px bg-border" />
          <span className="text-sm text-muted-foreground">
            Onboarding Detail
          </span>
        </div>

        {/* Employee header card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div
                className={`h-14 w-14 rounded-full ${ob.avatarColor} flex items-center justify-center text-white text-lg font-semibold shrink-0`}
              >
                {getInitials(ob.employeeName)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-xl font-bold tracking-tight">
                    {ob.employeeName}
                  </h1>
                  <Badge
                    variant={statusConf.variant}
                    className={statusConf.className}
                  >
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConf.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {ob.jobTitle} &middot; {ob.department}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {ob.employeeEmail}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Started {formatDate(ob.startDate)}
                  </span>
                  <span className="flex items-center gap-1">
                    <UserCheck className="h-3 w-3" />
                    Buddy: {ob.buddyName}
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div
                  className={`text-3xl font-bold ${getProgressColor(progress)}`}
                >
                  {progress}%
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {daysInfo.label}:{" "}
                  <span
                    className={
                      daysInfo.isOverdue ? "text-red-600 font-medium" : ""
                    }
                  >
                    {daysInfo.value} days
                  </span>
                </p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-4">
              <div
                className={`relative h-2.5 w-full overflow-hidden rounded-full ${getProgressTrackColor(progress)}`}
              >
                <motion.div
                  className={`h-full rounded-full ${getProgressBarColor(progress)}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
                <span>
                  {ob.tasks.filter((t) => t.completed).length} of{" "}
                  {ob.tasks.length} tasks completed
                </span>
                <span>{progress}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Task breakdown by category */}
        <div className="grid gap-4 md:grid-cols-2">
          {categories.map((cat) => {
            const task = ob.tasks.find((t) => t.category === cat);
            if (!task) return null;
            const CatIcon = getCategoryIcon(cat);
            return (
              <motion.div key={cat} variants={fadeIn}>
                <Card
                  className={`transition-all ${task.completed
                      ? "bg-muted/30 border-emerald-200/50"
                      : "hover:shadow-md"
                    }`}
                >
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleTask(ob.id, task.id)}
                        className={`mt-0.5 h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${task.completed
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : "border-muted-foreground/30 hover:border-primary"
                          }`}
                      >
                        {task.completed && (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <CatIcon className="h-4 w-4 text-muted-foreground" />
                          <h4
                            className={`text-sm font-semibold ${task.completed
                                ? "line-through text-muted-foreground"
                                : ""
                              }`}
                          >
                            {task.title}
                          </h4>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {task.description}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Due: {formatDate(task.dueDate)}
                          </span>
                          <span className="flex items-center gap-1">
                            <UserCheck className="h-3 w-3" />
                            {task.responsiblePerson}
                          </span>
                          {task.completedDate && (
                            <span className="flex items-center gap-1 text-emerald-600">
                              <CheckCircle2 className="h-3 w-3" />
                              Done: {formatDate(task.completedDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Completed milestones timeline */}
        {completedTasks.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-emerald-500" />
                Completed Milestones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative pl-6 space-y-4">
                {/* Vertical line */}
                <div className="absolute left-[11px] top-1 bottom-1 w-px bg-emerald-200" />
                {completedTasks.map((task, idx) => {
                  const CatIcon = getCategoryIcon(task.category);
                  return (
                    <motion.div
                      key={task.id}
                      className="relative flex items-start gap-3"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <div className="absolute -left-6 top-0.5 h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center">
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CatIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {task.title}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Completed on{" "}
                          {task.completedDate
                            ? formatDate(task.completedDate)
                            : "N/A"}{" "}
                          &middot; {task.responsiblePerson}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    );
  }

  // ─── Main List View ─────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Employee Onboarding
          </h1>
          <p className="text-muted-foreground">
            Manage and track new hire onboarding experiences
          </p>
        </div>
        <Dialog open={startDialogOpen} onOpenChange={setStartDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Start Onboarding
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Start New Onboarding</DialogTitle>
              <DialogDescription>
                Select a template and enter the new hire&apos;s details to begin
                their onboarding journey.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="template">
                  Onboarding Template <span className="text-red-500">*</span>
                </Label>
                <Select value={newTemplate} onValueChange={setNewTemplate}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATES.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} ({t.durationDays} days)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Jane Smith"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="jane@company.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Job Title</Label>
                  <Input
                    id="jobTitle"
                    placeholder="Software Engineer"
                    value={newJobTitle}
                    onChange={(e) => setNewJobTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select
                    value={newDepartment}
                    onValueChange={setNewDepartment}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Design">Design</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="Business Development">
                        Business Development
                      </SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="startDate">
                    Start Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buddy">Onboarding Buddy</Label>
                  <Input
                    id="buddy"
                    placeholder="Buddy name"
                    value={newBuddy}
                    onChange={(e) => setNewBuddy(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setStartDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleStartOnboarding} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Start Onboarding
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Row */}
      <motion.div
        className="grid gap-4 md:grid-cols-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={cardVariants}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Active Onboardings
                  </p>
                  <p className="text-2xl font-bold">{stats.active}</p>
                </div>
                <div className="rounded-full bg-blue-100 p-2.5">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={cardVariants}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Completed This Month
                  </p>
                  <p className="text-2xl font-bold">
                    {stats.completedThisMonth}
                  </p>
                </div>
                <div className="rounded-full bg-emerald-100 p-2.5">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={cardVariants}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Avg Completion Time
                  </p>
                  <p className="text-2xl font-bold">
                    {stats.avgCompletionDays}
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      days
                    </span>
                  </p>
                </div>
                <div className="rounded-full bg-violet-100 p-2.5">
                  <Timer className="h-5 w-5 text-violet-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={cardVariants}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Satisfaction Score
                  </p>
                  <p className="text-2xl font-bold">
                    {stats.satisfactionScore}
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      / 5
                    </span>
                  </p>
                </div>
                <div className="rounded-full bg-amber-100 p-2.5">
                  <Star className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Search + Filter */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search onboardings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {activeTab === "active" && (
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="on-track">On Track</SelectItem>
              <SelectItem value="at-risk">At Risk</SelectItem>
              <SelectItem value="behind">Behind</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active" className="gap-1.5">
            <CircleDot className="h-3.5 w-3.5" />
            Active ({activeOnboardings.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Completed ({completedOnboardings.length})
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5">
            <Copy className="h-3.5 w-3.5" />
            Templates ({TEMPLATES.length})
          </TabsTrigger>
        </TabsList>

        {/* ─── Active Tab ───────────────────────────────────────────── */}
        <TabsContent value="active" className="mt-4">
          <AnimatePresence mode="wait">
            {filteredActive.length === 0 ? (
              <motion.div
                key="empty"
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <Card>
                  <CardContent className="py-12">
                    <div className="flex flex-col items-center text-center">
                      <div className="rounded-full bg-muted p-4 mb-4">
                        <UserPlus className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold mb-1">
                        No active onboardings
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        Start an onboarding for a new hire to track their
                        progress through orientation tasks.
                      </p>
                      <Button
                        className="mt-4 gap-2"
                        onClick={() => setStartDialogOpen(true)}
                      >
                        <Plus className="h-4 w-4" />
                        Start Onboarding
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="list"
                className="space-y-3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {filteredActive.map((ob) => {
                  const progress = getProgress(ob);
                  const statusConf = getStatusConfig(ob.status);
                  const StatusIcon = statusConf.icon;
                  const daysInfo = getDaysInfo(ob);
                  const completedCount = ob.tasks.filter(
                    (t) => t.completed
                  ).length;

                  return (
                    <motion.div key={ob.id} variants={cardVariants} layout>
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-5 pb-4">
                          <div className="flex items-start gap-4">
                            {/* Avatar */}
                            <div
                              className={`h-11 w-11 rounded-full ${ob.avatarColor} flex items-center justify-center text-white text-sm font-semibold shrink-0`}
                            >
                              {getInitials(ob.employeeName)}
                            </div>

                            {/* Main info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                <button
                                  onClick={() => setSelectedOnboarding(ob)}
                                  className="text-sm font-semibold hover:underline text-left"
                                >
                                  {ob.employeeName}
                                </button>
                                <Badge
                                  variant={statusConf.variant}
                                  className={`text-[10px] ${statusConf.className}`}
                                >
                                  <StatusIcon className="h-3 w-3 mr-0.5" />
                                  {statusConf.label}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mb-2">
                                {ob.jobTitle} &middot; {ob.department}
                              </p>

                              {/* Meta row */}
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3 flex-wrap">
                                <span className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {ob.employeeEmail}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Started {formatDate(ob.startDate)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <UserCheck className="h-3 w-3" />
                                  Buddy: {ob.buddyName}
                                </span>
                              </div>

                              {/* Progress bar */}
                              <div className="mb-3">
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-xs text-muted-foreground">
                                    {completedCount} of {ob.tasks.length} tasks
                                  </span>
                                  <span
                                    className={`text-xs font-semibold ${getProgressColor(progress)}`}
                                  >
                                    {progress}%
                                  </span>
                                </div>
                                <div
                                  className={`relative h-2 w-full overflow-hidden rounded-full ${getProgressTrackColor(progress)}`}
                                >
                                  <motion.div
                                    className={`h-full rounded-full ${getProgressBarColor(progress)}`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{
                                      duration: 0.8,
                                      ease: "easeOut",
                                    }}
                                  />
                                </div>
                              </div>

                              {/* Task mini-checklist */}
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                                {ob.tasks.map((task) => {
                                  const CatIcon = getCategoryIcon(
                                    task.category
                                  );
                                  return (
                                    <button
                                      key={task.id}
                                      onClick={() =>
                                        toggleTask(ob.id, task.id)
                                      }
                                      className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors text-left ${task.completed
                                          ? "bg-emerald-50 text-emerald-700"
                                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                                        }`}
                                    >
                                      <div
                                        className={`h-3.5 w-3.5 rounded flex items-center justify-center shrink-0 ${task.completed
                                            ? "bg-emerald-500 text-white"
                                            : "border border-muted-foreground/30"
                                          }`}
                                      >
                                        {task.completed && (
                                          <CheckCircle2 className="h-2.5 w-2.5" />
                                        )}
                                      </div>
                                      <CatIcon className="h-3 w-3 shrink-0" />
                                      <span className="truncate">
                                        {getCategoryLabel(task.category)}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Right side: days info + actions */}
                            <div className="text-right shrink-0 flex flex-col items-end gap-2">
                              <div>
                                <p
                                  className={`text-lg font-bold ${daysInfo.isOverdue
                                      ? "text-red-600"
                                      : "text-foreground"
                                    }`}
                                >
                                  {daysInfo.value}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {daysInfo.label}
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1 text-xs"
                                onClick={() => setSelectedOnboarding(ob)}
                              >
                                <Eye className="h-3 w-3" />
                                View
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        {/* ─── Completed Tab ────────────────────────────────────────── */}
        <TabsContent value="completed" className="mt-4">
          <AnimatePresence mode="wait">
            {filteredCompleted.length === 0 ? (
              <motion.div
                key="empty-completed"
                variants={fadeIn}
                initial="hidden"
                animate="visible"
              >
                <Card>
                  <CardContent className="py-12">
                    <div className="flex flex-col items-center text-center">
                      <div className="rounded-full bg-muted p-4 mb-4">
                        <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold mb-1">
                        No completed onboardings
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        Completed onboardings will appear here once a new hire
                        finishes all their tasks.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ) : (
              <motion.div
                key="completed-list"
                className="space-y-3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {filteredCompleted.map((ob) => {
                  const daysInfo = getDaysInfo(ob);
                  return (
                    <motion.div key={ob.id} variants={cardVariants} layout>
                      <Card className="hover:shadow-md transition-shadow bg-muted/20">
                        <CardContent className="pt-5 pb-4">
                          <div className="flex items-center gap-4">
                            <div
                              className={`h-11 w-11 rounded-full ${ob.avatarColor} flex items-center justify-center text-white text-sm font-semibold shrink-0 opacity-80`}
                            >
                              {getInitials(ob.employeeName)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <button
                                  onClick={() => setSelectedOnboarding(ob)}
                                  className="text-sm font-semibold hover:underline text-left"
                                >
                                  {ob.employeeName}
                                </button>
                                <Badge
                                  variant="outline"
                                  className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"
                                >
                                  <CheckCircle2 className="h-3 w-3 mr-0.5" />
                                  Completed
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {ob.jobTitle} &middot; {ob.department} &middot;
                                Started {formatDate(ob.startDate)}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-semibold text-emerald-600">
                                {ob.tasks.length}/{ob.tasks.length} tasks
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {daysInfo.value} days to complete
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 text-xs shrink-0"
                              onClick={() => setSelectedOnboarding(ob)}
                            >
                              <Eye className="h-3 w-3" />
                              View
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        {/* ─── Templates Tab ────────────────────────────────────────── */}
        <TabsContent value="templates" className="mt-4">
          <motion.div
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {TEMPLATES.map((template) => (
              <motion.div key={template.id} variants={cardVariants}>
                <Card className="hover:shadow-md transition-shadow h-full flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">
                          {template.name}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {template.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1">
                    {/* Template meta */}
                    <div className="flex items-center gap-3 mb-4 flex-wrap">
                      <Badge variant="outline" className="text-xs gap-1">
                        <Clock className="h-3 w-3" />
                        {template.durationDays} days
                      </Badge>
                      <Badge variant="outline" className="text-xs gap-1">
                        <FolderKanban className="h-3 w-3" />
                        {template.taskCount} tasks
                      </Badge>
                      <Badge variant="secondary" className="text-xs gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Used {template.usedCount}x
                      </Badge>
                    </div>

                    {/* Departments */}
                    <div className="mb-4">
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">
                        Departments
                      </p>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {template.departments.map((dept) => (
                          <Badge
                            key={dept}
                            variant="outline"
                            className="text-[10px] bg-blue-50 text-blue-700 border-blue-200"
                          >
                            <Briefcase className="h-2.5 w-2.5 mr-0.5" />
                            {dept}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Task list */}
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Tasks
                      </p>
                      <div className="space-y-1.5">
                        {template.tasks.map((task) => {
                          const CatIcon = getCategoryIcon(task.category);
                          return (
                            <div
                              key={task.id}
                              className="flex items-center gap-2 text-xs text-muted-foreground rounded-md bg-muted/40 px-2.5 py-1.5"
                            >
                              <CatIcon className="h-3.5 w-3.5 shrink-0" />
                              <span className="flex-1 truncate">
                                {task.title}
                              </span>
                              <span className="text-[10px] shrink-0">
                                Day {task.dayOffset}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                  <div className="px-6 pb-5 pt-2 mt-auto">
                    <Button
                      className="w-full gap-2"
                      variant="outline"
                      onClick={() => {
                        setNewTemplate(template.id);
                        setStartDialogOpen(true);
                        toast.info(`Selected "${template.name}" template`);
                      }}
                    >
                      <UserPlus className="h-4 w-4" />
                      Use Template
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
