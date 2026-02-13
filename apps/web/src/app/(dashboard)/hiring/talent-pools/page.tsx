"use client";

import { useState, useMemo } from "react";
import {
  Users,
  UserPlus,
  Search,
  Plus,
  Mail,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Clock,
  CheckCircle2,
  Eye,
  Send,
  Sparkles,
  Target,
  Zap,
  ArrowUpRight,
  ArrowRight,
  ChevronRight,
  Filter,
  Star,
  MessageSquare,
  Calendar,
  Globe,
  GraduationCap,
  Briefcase,
  Crown,
  Medal,
  MousePointerClick,
  MailOpen,
  Reply,
  Activity,
  Layers,
  RefreshCw,
  PenLine,
  Copy,
  MoreHorizontal,
  X,
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

interface PoolCandidate {
  id: string;
  name: string;
  email: string;
  title: string;
  company: string;
  source: string;
  lastInteraction: string;
  engagementScore: number;
  tags: string[];
  readyToMove: boolean;
  addedDate: string;
  linkedIn?: string;
}

interface TalentPool {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  count: number;
  lastUpdated: string;
  growthRate: number;
  engagementRate: number;
  candidates: PoolCandidate[];
}

interface NurtureCampaign {
  id: string;
  name: string;
  poolId: string;
  poolName: string;
  template: string;
  status: "Active" | "Paused" | "Draft" | "Completed";
  sent: number;
  openRate: number;
  clickRate: number;
  responseRate: number;
  lastSent: string;
  steps: CampaignStep[];
}

interface CampaignStep {
  id: string;
  type: string;
  subject: string;
  delay: string;
  sent: number;
  opened: number;
  clicked: number;
}

interface CampaignTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  steps: number;
  avgOpenRate: number;
}

// ─── Simulated Data ─────────────────────────────────────

function generateCandidates(pool: string): PoolCandidate[] {
  const candidateSets: Record<string, PoolCandidate[]> = {
    engineering: [
      { id: "ec-01", name: "Sarah Chen", email: "sarah.chen@techcorp.io", title: "Senior Software Engineer", company: "TechCorp", source: "LinkedIn", lastInteraction: "2026-02-10", engagementScore: 92, tags: ["React", "TypeScript", "Node.js"], readyToMove: true, addedDate: "2025-09-15" },
      { id: "ec-02", name: "Marcus Johnson", email: "marcus.j@startup.co", title: "Staff Engineer", company: "StartupCo", source: "Referral", lastInteraction: "2026-02-08", engagementScore: 85, tags: ["Go", "Kubernetes", "AWS"], readyToMove: true, addedDate: "2025-10-01" },
      { id: "ec-03", name: "Yuki Tanaka", email: "yuki.t@bigtech.com", title: "Principal Engineer", company: "BigTech Inc", source: "Conference", lastInteraction: "2026-01-28", engagementScore: 68, tags: ["Python", "ML", "Data"], readyToMove: false, addedDate: "2025-08-20" },
      { id: "ec-04", name: "Priya Sharma", email: "priya.s@devstudio.io", title: "Full Stack Developer", company: "DevStudio", source: "GitHub", lastInteraction: "2026-02-05", engagementScore: 78, tags: ["React", "Python", "PostgreSQL"], readyToMove: false, addedDate: "2025-11-10" },
      { id: "ec-05", name: "Alex Rivera", email: "alex.r@cloudco.com", title: "DevOps Lead", company: "CloudCo", source: "LinkedIn", lastInteraction: "2026-02-11", engagementScore: 95, tags: ["Docker", "Terraform", "CI/CD"], readyToMove: true, addedDate: "2025-07-25" },
      { id: "ec-06", name: "Emma Wilson", email: "emma.w@datatech.io", title: "Backend Engineer", company: "DataTech", source: "Job Board", lastInteraction: "2026-01-20", engagementScore: 55, tags: ["Java", "Spring", "Microservices"], readyToMove: false, addedDate: "2025-12-01" },
      { id: "ec-07", name: "Daniel Park", email: "daniel.p@innovate.co", title: "Mobile Engineer", company: "Innovate Co", source: "Referral", lastInteraction: "2026-02-03", engagementScore: 72, tags: ["React Native", "iOS", "Swift"], readyToMove: false, addedDate: "2025-10-15" },
      { id: "ec-08", name: "Lisa Nguyen", email: "lisa.n@quantumlab.ai", title: "ML Engineer", company: "QuantumLab", source: "Conference", lastInteraction: "2026-02-09", engagementScore: 88, tags: ["PyTorch", "NLP", "LLMs"], readyToMove: true, addedDate: "2025-09-05" },
      { id: "ec-09", name: "Chris Morgan", email: "chris.m@techflow.dev", title: "Platform Engineer", company: "TechFlow", source: "LinkedIn", lastInteraction: "2026-01-15", engagementScore: 61, tags: ["Rust", "WebAssembly", "Linux"], readyToMove: false, addedDate: "2025-11-20" },
      { id: "ec-10", name: "Olivia Brown", email: "olivia.b@codebase.io", title: "Frontend Lead", company: "Codebase", source: "GitHub", lastInteraction: "2026-02-12", engagementScore: 90, tags: ["Vue.js", "TypeScript", "Design Systems"], readyToMove: true, addedDate: "2025-08-10" },
    ],
    sales: [
      { id: "sc-01", name: "Michael Torres", email: "m.torres@salesforce.com", title: "Enterprise AE", company: "SalesForce", source: "LinkedIn", lastInteraction: "2026-02-11", engagementScore: 88, tags: ["Enterprise", "SaaS", "Fortune 500"], readyToMove: true, addedDate: "2025-09-20" },
      { id: "sc-02", name: "Jennifer Adams", email: "j.adams@hubspot.com", title: "Sales Director", company: "HubSpot", source: "Referral", lastInteraction: "2026-02-06", engagementScore: 75, tags: ["B2B", "Mid-Market", "Leadership"], readyToMove: false, addedDate: "2025-10-05" },
      { id: "sc-03", name: "Robert Kim", email: "r.kim@oracle.com", title: "Regional VP Sales", company: "Oracle", source: "Conference", lastInteraction: "2026-01-30", engagementScore: 82, tags: ["Enterprise", "Channel", "APAC"], readyToMove: true, addedDate: "2025-08-15" },
      { id: "sc-04", name: "Amanda Clark", email: "a.clark@stripe.com", title: "Account Executive", company: "Stripe", source: "LinkedIn", lastInteraction: "2026-02-09", engagementScore: 91, tags: ["Fintech", "SMB", "Payments"], readyToMove: true, addedDate: "2025-11-01" },
      { id: "sc-05", name: "David Lee", email: "d.lee@zoom.us", title: "Sales Manager", company: "Zoom", source: "LinkedIn", lastInteraction: "2026-02-01", engagementScore: 64, tags: ["SaaS", "Video", "Collaboration"], readyToMove: false, addedDate: "2025-12-10" },
      { id: "sc-06", name: "Rachel Greene", email: "r.greene@gong.io", title: "SDR Lead", company: "Gong", source: "Job Board", lastInteraction: "2026-01-25", engagementScore: 70, tags: ["SDR", "Outbound", "Revenue Intel"], readyToMove: false, addedDate: "2025-10-20" },
      { id: "sc-07", name: "James Wilson", email: "j.wilson@datadog.com", title: "Senior AE", company: "Datadog", source: "Referral", lastInteraction: "2026-02-07", engagementScore: 86, tags: ["DevOps", "Monitoring", "Enterprise"], readyToMove: true, addedDate: "2025-09-10" },
      { id: "sc-08", name: "Sophia Martinez", email: "s.martinez@twilio.com", title: "Sales Engineer", company: "Twilio", source: "Conference", lastInteraction: "2026-02-04", engagementScore: 79, tags: ["Technical Sales", "APIs", "Communications"], readyToMove: false, addedDate: "2025-11-15" },
    ],
    executive: [
      { id: "ex-01", name: "Dr. Katherine Price", email: "k.price@exec.com", title: "CTO", company: "ScaleUp Inc", source: "Executive Search", lastInteraction: "2026-02-08", engagementScore: 70, tags: ["CTO", "AI/ML", "Scaling"], readyToMove: false, addedDate: "2025-06-15" },
      { id: "ex-02", name: "Thomas Wright", email: "t.wright@corp.io", title: "VP Product", company: "ProductLab", source: "Board Network", lastInteraction: "2026-02-03", engagementScore: 65, tags: ["Product Strategy", "B2B", "Growth"], readyToMove: false, addedDate: "2025-07-20" },
      { id: "ex-03", name: "Christina Zhao", email: "c.zhao@venture.co", title: "CFO", company: "VentureCo", source: "Executive Search", lastInteraction: "2026-01-20", engagementScore: 55, tags: ["Finance", "IPO", "Fundraising"], readyToMove: false, addedDate: "2025-08-01" },
      { id: "ex-04", name: "Jonathan Blake", email: "j.blake@global.com", title: "VP Engineering", company: "GlobalTech", source: "Referral", lastInteraction: "2026-02-10", engagementScore: 82, tags: ["Engineering Leadership", "Platform", "Remote"], readyToMove: true, addedDate: "2025-09-01" },
      { id: "ex-05", name: "Natalie Foster", email: "n.foster@consulting.io", title: "Chief People Officer", company: "ConsultPro", source: "Conference", lastInteraction: "2026-01-28", engagementScore: 73, tags: ["People Ops", "Culture", "D&I"], readyToMove: false, addedDate: "2025-10-10" },
      { id: "ex-06", name: "William Chang", email: "w.chang@fintech.co", title: "CRO", company: "FintechFlow", source: "Board Network", lastInteraction: "2026-02-05", engagementScore: 78, tags: ["Revenue", "GTM", "Enterprise Sales"], readyToMove: true, addedDate: "2025-07-05" },
      { id: "ex-07", name: "Isabelle Moreau", email: "i.moreau@luxury.com", title: "CMO", company: "LuxBrand", source: "Executive Search", lastInteraction: "2026-01-15", engagementScore: 60, tags: ["Brand", "Digital Marketing", "International"], readyToMove: false, addedDate: "2025-11-05" },
      { id: "ex-08", name: "Andrew Patel", email: "a.patel@health.io", title: "VP Data", company: "HealthTech", source: "LinkedIn", lastInteraction: "2026-02-11", engagementScore: 85, tags: ["Data Science", "Healthcare", "AI"], readyToMove: true, addedDate: "2025-08-20" },
    ],
    silver: [
      { id: "sm-01", name: "Hannah Liu", email: "h.liu@email.com", title: "Senior Engineer", company: "Previously Applied", source: "Application", lastInteraction: "2026-02-01", engagementScore: 90, tags: ["Runner-up", "Q4 2025", "Engineering"], readyToMove: true, addedDate: "2025-12-15" },
      { id: "sm-02", name: "Brian Cooper", email: "b.cooper@email.com", title: "Product Manager", company: "Previously Applied", source: "Application", lastInteraction: "2026-01-20", engagementScore: 85, tags: ["Runner-up", "Q3 2025", "Product"], readyToMove: true, addedDate: "2025-10-05" },
      { id: "sm-03", name: "Maria Garcia", email: "m.garcia@email.com", title: "UX Designer", company: "Previously Applied", source: "Application", lastInteraction: "2026-02-08", engagementScore: 92, tags: ["Runner-up", "Q4 2025", "Design"], readyToMove: true, addedDate: "2025-12-20" },
      { id: "sm-04", name: "Kevin Thompson", email: "k.thompson@email.com", title: "Data Scientist", company: "Previously Applied", source: "Application", lastInteraction: "2026-01-15", engagementScore: 78, tags: ["Runner-up", "Q3 2025", "Data"], readyToMove: false, addedDate: "2025-09-25" },
      { id: "sm-05", name: "Jessica Yamada", email: "j.yamada@email.com", title: "Sales Executive", company: "Previously Applied", source: "Application", lastInteraction: "2026-02-05", engagementScore: 81, tags: ["Runner-up", "Q4 2025", "Sales"], readyToMove: true, addedDate: "2025-11-10" },
      { id: "sm-06", name: "Carlos Mendez", email: "c.mendez@email.com", title: "DevOps Engineer", company: "Previously Applied", source: "Application", lastInteraction: "2026-01-28", engagementScore: 76, tags: ["Runner-up", "Q3 2025", "Engineering"], readyToMove: false, addedDate: "2025-10-15" },
      { id: "sm-07", name: "Ashley Roberts", email: "a.roberts@email.com", title: "Marketing Lead", company: "Previously Applied", source: "Application", lastInteraction: "2026-02-10", engagementScore: 88, tags: ["Runner-up", "Q4 2025", "Marketing"], readyToMove: true, addedDate: "2025-12-01" },
      { id: "sm-08", name: "Ryan Patel", email: "r.patel@email.com", title: "Solutions Architect", company: "Previously Applied", source: "Application", lastInteraction: "2026-02-03", engagementScore: 83, tags: ["Runner-up", "Q4 2025", "Engineering"], readyToMove: true, addedDate: "2025-11-20" },
      { id: "sm-09", name: "Nina Kowalski", email: "n.kowalski@email.com", title: "Customer Success Manager", company: "Previously Applied", source: "Application", lastInteraction: "2026-01-22", engagementScore: 71, tags: ["Runner-up", "Q3 2025", "CS"], readyToMove: false, addedDate: "2025-09-30" },
    ],
    grads: [
      { id: "ug-01", name: "Aiden Foster", email: "a.foster@stanford.edu", title: "CS Senior", company: "Stanford University", source: "Career Fair", lastInteraction: "2026-02-12", engagementScore: 94, tags: ["CS", "ML", "Class of 2026"], readyToMove: true, addedDate: "2025-10-01" },
      { id: "ug-02", name: "Maya Jackson", email: "m.jackson@mit.edu", title: "CS/Math Junior", company: "MIT", source: "Hackathon", lastInteraction: "2026-02-09", engagementScore: 88, tags: ["Algorithms", "Full Stack", "Class of 2027"], readyToMove: false, addedDate: "2025-11-15" },
      { id: "ug-03", name: "Ethan Williams", email: "e.williams@berkeley.edu", title: "EECS Senior", company: "UC Berkeley", source: "Career Fair", lastInteraction: "2026-02-06", engagementScore: 82, tags: ["Systems", "Low-Level", "Class of 2026"], readyToMove: true, addedDate: "2025-09-20" },
      { id: "ug-04", name: "Zara Ahmed", email: "z.ahmed@gatech.edu", title: "CS Senior", company: "Georgia Tech", source: "Campus Event", lastInteraction: "2026-01-30", engagementScore: 76, tags: ["Cloud", "Backend", "Class of 2026"], readyToMove: true, addedDate: "2025-10-10" },
      { id: "ug-05", name: "Lucas Brown", email: "l.brown@cmu.edu", title: "CS/HCI Senior", company: "Carnegie Mellon", source: "Intern Program", lastInteraction: "2026-02-11", engagementScore: 97, tags: ["HCI", "Frontend", "Class of 2026"], readyToMove: true, addedDate: "2025-06-01" },
      { id: "ug-06", name: "Sofia Perez", email: "s.perez@columbia.edu", title: "Data Science MS", company: "Columbia University", source: "Career Fair", lastInteraction: "2026-02-04", engagementScore: 80, tags: ["Data", "Analytics", "Class of 2026"], readyToMove: true, addedDate: "2025-10-25" },
      { id: "ug-07", name: "Noah Chen", email: "n.chen@uw.edu", title: "CS Senior", company: "UW Seattle", source: "Referral", lastInteraction: "2026-01-25", engagementScore: 73, tags: ["Distributed Systems", "Cloud", "Class of 2026"], readyToMove: false, addedDate: "2025-11-05" },
      { id: "ug-08", name: "Isla Thompson", email: "i.thompson@princeton.edu", title: "COS Senior", company: "Princeton", source: "Campus Event", lastInteraction: "2026-02-07", engagementScore: 85, tags: ["Theory", "Security", "Class of 2026"], readyToMove: true, addedDate: "2025-09-10" },
      { id: "ug-09", name: "Oscar Diaz", email: "o.diaz@umich.edu", title: "CS/Business Senior", company: "University of Michigan", source: "Career Fair", lastInteraction: "2026-02-02", engagementScore: 69, tags: ["Product", "Startup", "Class of 2026"], readyToMove: false, addedDate: "2025-10-30" },
      { id: "ug-10", name: "Ruby Kim", email: "r.kim@utexas.edu", title: "CS Senior", company: "UT Austin", source: "Hackathon", lastInteraction: "2026-01-18", engagementScore: 77, tags: ["Mobile", "AR/VR", "Class of 2026"], readyToMove: false, addedDate: "2025-11-20" },
      { id: "ug-11", name: "Liam O'Brien", email: "l.obrien@nyu.edu", title: "CS/Design MS", company: "NYU", source: "Meetup", lastInteraction: "2026-02-08", engagementScore: 86, tags: ["Design Engineering", "React", "Class of 2026"], readyToMove: true, addedDate: "2025-08-15" },
    ],
  };
  return candidateSets[pool] || [];
}

const TALENT_POOLS: TalentPool[] = [
  {
    id: "pool-eng",
    name: "Engineering Prospects",
    description: "Top engineering talent across frontend, backend, and infrastructure",
    icon: Zap,
    iconColor: "bg-blue-500",
    count: 10,
    lastUpdated: "2026-02-12",
    growthRate: 18,
    engagementRate: 74,
    candidates: generateCandidates("engineering"),
  },
  {
    id: "pool-sales",
    name: "Sales Pipeline",
    description: "Experienced sales professionals from top SaaS companies",
    icon: Target,
    iconColor: "bg-emerald-500",
    count: 8,
    lastUpdated: "2026-02-11",
    growthRate: 12,
    engagementRate: 68,
    candidates: generateCandidates("sales"),
  },
  {
    id: "pool-exec",
    name: "Executive Talent",
    description: "C-suite and VP-level leaders for strategic growth",
    icon: Crown,
    iconColor: "bg-purple-500",
    count: 8,
    lastUpdated: "2026-02-10",
    growthRate: 5,
    engagementRate: 58,
    candidates: generateCandidates("executive"),
  },
  {
    id: "pool-silver",
    name: "Silver Medalists",
    description: "Strong candidates from previous hiring rounds who were runners-up",
    icon: Medal,
    iconColor: "bg-amber-500",
    count: 9,
    lastUpdated: "2026-02-10",
    growthRate: 22,
    engagementRate: 82,
    candidates: generateCandidates("silver"),
  },
  {
    id: "pool-grads",
    name: "University Grads",
    description: "Promising new graduates from top computer science programs",
    icon: GraduationCap,
    iconColor: "bg-rose-500",
    count: 11,
    lastUpdated: "2026-02-12",
    growthRate: 30,
    engagementRate: 79,
    candidates: generateCandidates("grads"),
  },
];

const CAMPAIGNS: NurtureCampaign[] = [
  {
    id: "camp-01",
    name: "Engineering Keep Warm",
    poolId: "pool-eng",
    poolName: "Engineering Prospects",
    template: "Keep Warm",
    status: "Active",
    sent: 156,
    openRate: 68,
    clickRate: 24,
    responseRate: 12,
    lastSent: "2026-02-10",
    steps: [
      { id: "s1", type: "Email", subject: "Exciting updates from our engineering team", delay: "Day 0", sent: 156, opened: 106, clicked: 37 },
      { id: "s2", type: "Email", subject: "Our tech stack deep dive - blog post", delay: "Day 7", sent: 142, opened: 95, clicked: 34 },
      { id: "s3", type: "Email", subject: "Meet our engineering culture", delay: "Day 21", sent: 130, opened: 82, clicked: 28 },
    ],
  },
  {
    id: "camp-02",
    name: "Sales Role Alert - Q1",
    poolId: "pool-sales",
    poolName: "Sales Pipeline",
    template: "New Role Alert",
    status: "Active",
    sent: 89,
    openRate: 72,
    clickRate: 31,
    responseRate: 18,
    lastSent: "2026-02-08",
    steps: [
      { id: "s1", type: "Email", subject: "New sales leadership roles at our company", delay: "Day 0", sent: 89, opened: 64, clicked: 28 },
      { id: "s2", type: "Email", subject: "What our sales team is achieving", delay: "Day 5", sent: 82, opened: 56, clicked: 22 },
    ],
  },
  {
    id: "camp-03",
    name: "Silver Medalist Re-engagement",
    poolId: "pool-silver",
    poolName: "Silver Medalists",
    template: "Keep Warm",
    status: "Active",
    sent: 67,
    openRate: 78,
    clickRate: 35,
    responseRate: 22,
    lastSent: "2026-02-05",
    steps: [
      { id: "s1", type: "Email", subject: "We haven't forgotten about you!", delay: "Day 0", sent: 67, opened: 52, clicked: 23 },
      { id: "s2", type: "Email", subject: "New roles that might be perfect for you", delay: "Day 14", sent: 58, opened: 44, clicked: 20 },
      { id: "s3", type: "Email", subject: "Company milestone - and we want you to be part of it", delay: "Day 30", sent: 50, opened: 38, clicked: 16 },
    ],
  },
  {
    id: "camp-04",
    name: "Campus Recruiting 2026",
    poolId: "pool-grads",
    poolName: "University Grads",
    template: "Event Invitation",
    status: "Paused",
    sent: 210,
    openRate: 82,
    clickRate: 45,
    responseRate: 28,
    lastSent: "2026-01-20",
    steps: [
      { id: "s1", type: "Email", subject: "You're invited to our virtual tech talk!", delay: "Day 0", sent: 210, opened: 172, clicked: 94 },
      { id: "s2", type: "Email", subject: "Apply for our new grad program", delay: "Day 3", sent: 195, opened: 156, clicked: 82 },
    ],
  },
  {
    id: "camp-05",
    name: "Executive Quarterly Update",
    poolId: "pool-exec",
    poolName: "Executive Talent",
    template: "Company Update",
    status: "Draft",
    sent: 0,
    openRate: 0,
    clickRate: 0,
    responseRate: 0,
    lastSent: "--",
    steps: [
      { id: "s1", type: "Email", subject: "Q1 2026 Company Highlights & Growth", delay: "Day 0", sent: 0, opened: 0, clicked: 0 },
    ],
  },
];

const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
  { id: "tmpl-01", name: "Keep Warm", description: "Regular touchpoints to maintain engagement with passive candidates", icon: MessageSquare, steps: 4, avgOpenRate: 65 },
  { id: "tmpl-02", name: "New Role Alert", description: "Notify candidates when matching positions open up", icon: Briefcase, steps: 2, avgOpenRate: 72 },
  { id: "tmpl-03", name: "Company Update", description: "Share company news, milestones, and culture highlights", icon: Globe, steps: 3, avgOpenRate: 58 },
  { id: "tmpl-04", name: "Event Invitation", description: "Invite candidates to webinars, meetups, and career events", icon: Calendar, steps: 3, avgOpenRate: 75 },
];

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

function engagementColor(score: number): string {
  if (score >= 85) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 70) return "text-blue-600 dark:text-blue-400";
  if (score >= 55) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function engagementBg(score: number): string {
  if (score >= 85) return "bg-emerald-500";
  if (score >= 70) return "bg-blue-500";
  if (score >= 55) return "bg-amber-500";
  return "bg-red-500";
}

function campaignStatusVariant(status: NurtureCampaign["status"]) {
  switch (status) {
    case "Active": return "default" as const;
    case "Paused": return "secondary" as const;
    case "Completed": return "outline" as const;
    case "Draft": return "outline" as const;
  }
}

function formatDate(dateStr: string): string {
  if (dateStr === "--") return "--";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Quick Add Candidate Dialog ─────────────────────────

function QuickAddCandidateDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [pool, setPool] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !pool) {
      toast.error("Please fill in all required fields");
      return;
    }
    const poolName = TALENT_POOLS.find((p) => p.id === pool)?.name || pool;
    toast.success(`Added ${name} to ${poolName}`, {
      description: "Candidate has been added to the talent pool",
    });
    setName("");
    setEmail("");
    setTitle("");
    setPool("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Candidate
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add Candidate to Pool</DialogTitle>
          <DialogDescription>
            Quickly add a candidate to any talent pool for nurturing.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="addName">Name *</Label>
              <Input id="addName" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addEmail">Email *</Label>
              <Input id="addEmail" type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="addTitle">Current Title</Label>
            <Input id="addTitle" placeholder="e.g. Senior Engineer at TechCo" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="addPool">Talent Pool *</Label>
            <Select value={pool} onValueChange={setPool}>
              <SelectTrigger>
                <SelectValue placeholder="Select a pool" />
              </SelectTrigger>
              <SelectContent>
                {TALENT_POOLS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit">
              <Plus className="mr-2 h-4 w-4" />
              Add to Pool
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Create Campaign Dialog ─────────────────────────────

function CreateCampaignDialog() {
  const [open, setOpen] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [selectedPool, setSelectedPool] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!campaignName.trim() || !selectedPool || !selectedTemplate) {
      toast.error("Please fill in all required fields");
      return;
    }
    toast.success(`Campaign "${campaignName}" created`, {
      description: "You can now customize and launch your nurture campaign",
    });
    setCampaignName("");
    setSelectedPool("");
    setSelectedTemplate("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Mail className="mr-2 h-4 w-4" />
          New Campaign
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Create Nurture Campaign</DialogTitle>
          <DialogDescription>
            Set up an email drip sequence to engage candidates in your talent pools.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="campName">Campaign Name *</Label>
            <Input id="campName" placeholder="e.g. Q1 Engineering Warm-Up" value={campaignName} onChange={(e) => setCampaignName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="campPool">Target Pool *</Label>
            <Select value={selectedPool} onValueChange={setSelectedPool}>
              <SelectTrigger>
                <SelectValue placeholder="Select talent pool" />
              </SelectTrigger>
              <SelectContent>
                {TALENT_POOLS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.count} candidates)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Campaign Template *</Label>
            <div className="grid grid-cols-2 gap-3">
              {CAMPAIGN_TEMPLATES.map((tmpl) => {
                const Icon = tmpl.icon;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => setSelectedTemplate(tmpl.id)}
                    className={`flex flex-col items-start rounded-lg border p-3 text-left transition-all hover:border-primary/50 ${
                      selectedTemplate === tmpl.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{tmpl.name}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">{tmpl.description}</p>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                      <span>{tmpl.steps} steps</span>
                      <span>&middot;</span>
                      <span>{tmpl.avgOpenRate}% avg open rate</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit">
              <Send className="mr-2 h-4 w-4" />
              Create Campaign
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Pool Detail View ───────────────────────────────────

function PoolDetailView({
  pool,
  onClose,
}: {
  pool: TalentPool;
  onClose: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("engagement");

  const filteredCandidates = useMemo(() => {
    let filtered = pool.candidates.filter(
      (c) =>
        !searchQuery ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    if (sortBy === "engagement") {
      filtered = [...filtered].sort((a, b) => b.engagementScore - a.engagementScore);
    } else if (sortBy === "recent") {
      filtered = [...filtered].sort((a, b) => new Date(b.lastInteraction).getTime() - new Date(a.lastInteraction).getTime());
    } else if (sortBy === "ready") {
      filtered = [...filtered].sort((a, b) => (b.readyToMove ? 1 : 0) - (a.readyToMove ? 1 : 0));
    }
    return filtered;
  }, [pool.candidates, searchQuery, sortBy]);

  const readyCount = pool.candidates.filter((c) => c.readyToMove).length;
  const Icon = pool.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg p-2.5 ${pool.iconColor}`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle>{pool.name}</CardTitle>
                <CardDescription>{pool.description}</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-4 mt-3">
            <Badge variant="secondary">{pool.count} candidates</Badge>
            <Badge variant="outline" className="gap-1">
              <Sparkles className="h-3 w-3 text-amber-500" />
              {readyCount} ready to move
            </Badge>
            <Badge variant="outline" className="gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              +{pool.growthRate}% growth
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Activity className="h-3 w-3 text-blue-500" />
              {pool.engagementRate}% engaged
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search candidates, skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="engagement">Engagement Score</SelectItem>
                <SelectItem value="recent">Last Interaction</SelectItem>
                <SelectItem value="ready">Ready to Move</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Current Role</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Last Interaction</TableHead>
                <TableHead>Engagement</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCandidates.map((candidate, index) => (
                <motion.tr
                  key={candidate.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  className="border-b transition-colors hover:bg-muted/50"
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {candidate.readyToMove && (
                        <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{candidate.name}</p>
                        <p className="text-xs text-muted-foreground">{candidate.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{candidate.title}</p>
                      <p className="text-xs text-muted-foreground">{candidate.company}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{candidate.source}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{formatDate(candidate.lastInteraction)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${engagementBg(candidate.engagementScore)}`} />
                      <span className={`text-sm font-medium ${engagementColor(candidate.engagementScore)}`}>
                        {candidate.engagementScore}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[180px]">
                      {candidate.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-[10px] h-5 px-1.5">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          toast.success(`Email drafted for ${candidate.name}`)
                        }
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          toast.success(`Viewing ${candidate.name}'s profile`)
                        }
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Main Page ──────────────────────────────────────────

export default function TalentPoolsPage() {
  const [activeTab, setActiveTab] = useState("pools");
  const [selectedPool, setSelectedPool] = useState<TalentPool | null>(null);
  const [poolSearch, setPoolSearch] = useState("");

  const totalCandidates = TALENT_POOLS.reduce((sum, p) => sum + p.count, 0);
  const avgEngagement = Math.round(
    TALENT_POOLS.reduce((sum, p) => sum + p.engagementRate, 0) / TALENT_POOLS.length
  );
  const activeCampaigns = CAMPAIGNS.filter((c) => c.status === "Active").length;
  const readyToMoveTotal = TALENT_POOLS.reduce(
    (sum, p) => sum + p.candidates.filter((c) => c.readyToMove).length,
    0
  );

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
          <h1 className="text-2xl font-bold tracking-tight">Talent Pools & Nurture Campaigns</h1>
          <p className="text-muted-foreground">
            Manage pools of passive candidates and engage them over time
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CreateCampaignDialog />
          <QuickAddCandidateDialog />
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        {[
          {
            title: "Total Candidates",
            value: totalCandidates,
            subtitle: `Across ${TALENT_POOLS.length} pools`,
            icon: Users,
            iconColor: "bg-blue-500",
            trend: { value: "+14%", positive: true },
          },
          {
            title: "Avg Engagement",
            value: `${avgEngagement}%`,
            subtitle: "Across all pools",
            icon: Activity,
            iconColor: "bg-emerald-500",
            trend: { value: "+5%", positive: true },
          },
          {
            title: "Active Campaigns",
            value: activeCampaigns,
            subtitle: `${CAMPAIGNS.length} total campaigns`,
            icon: Mail,
            iconColor: "bg-purple-500",
          },
          {
            title: "Ready to Move",
            value: readyToMoveTotal,
            subtitle: "Candidates showing signals",
            icon: Sparkles,
            iconColor: "bg-amber-500",
            trend: { value: "+8", positive: true },
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
                {stat.trend && (
                  <div className="mt-2 flex items-center gap-1">
                    <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                    <span className="text-xs font-medium text-emerald-500">{stat.trend.value}</span>
                    <span className="text-xs text-muted-foreground">this quarter</span>
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
            <TabsTrigger value="pools">
              <Layers className="mr-1.5 h-4 w-4" />
              Talent Pools
            </TabsTrigger>
            <TabsTrigger value="campaigns">
              <Mail className="mr-1.5 h-4 w-4" />
              Nurture Campaigns
            </TabsTrigger>
            <TabsTrigger value="recommendations">
              <Sparkles className="mr-1.5 h-4 w-4" />
              Smart Recommendations
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="mr-1.5 h-4 w-4" />
              Pool Analytics
            </TabsTrigger>
          </TabsList>

          {/* Talent Pools Tab */}
          <TabsContent value="pools" className="mt-4 space-y-4">
            <AnimatePresence mode="wait">
              {selectedPool ? (
                <PoolDetailView
                  key={selectedPool.id}
                  pool={selectedPool}
                  onClose={() => setSelectedPool(null)}
                />
              ) : (
                <motion.div
                  key="pool-grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                >
                  {TALENT_POOLS.map((pool, index) => {
                    const Icon = pool.icon;
                    const readyCount = pool.candidates.filter((c) => c.readyToMove).length;
                    return (
                      <motion.div
                        key={pool.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.07 }}
                      >
                        <Card
                          className="cursor-pointer hover:border-primary/40 transition-all hover:shadow-md group"
                          onClick={() => setSelectedPool(pool)}
                        >
                          <CardContent className="pt-5 pb-5">
                            <div className="flex items-start justify-between mb-4">
                              <div className={`rounded-lg p-2.5 ${pool.iconColor}`}>
                                <Icon className="h-5 w-5 text-white" />
                              </div>
                              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <h3 className="font-semibold mb-1">{pool.name}</h3>
                            <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{pool.description}</p>

                            <div className="grid grid-cols-2 gap-3 mb-4">
                              <div className="rounded-lg bg-muted/40 p-2.5 text-center">
                                <p className="text-lg font-bold">{pool.count}</p>
                                <p className="text-[10px] text-muted-foreground">Candidates</p>
                              </div>
                              <div className="rounded-lg bg-muted/40 p-2.5 text-center">
                                <p className="text-lg font-bold">{pool.engagementRate}%</p>
                                <p className="text-[10px] text-muted-foreground">Engagement</p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3 text-emerald-500" />
                                <span className="text-emerald-600 dark:text-emerald-400 font-medium">+{pool.growthRate}%</span>
                              </div>
                              {readyCount > 0 && (
                                <div className="flex items-center gap-1">
                                  <Sparkles className="h-3 w-3 text-amber-500" />
                                  <span>{readyCount} ready</span>
                                </div>
                              )}
                              <span>Updated {formatDate(pool.lastUpdated)}</span>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}

                  {/* Create New Pool Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: TALENT_POOLS.length * 0.07 }}
                  >
                    <Card
                      className="cursor-pointer border-dashed hover:border-primary/40 transition-all group flex items-center justify-center min-h-[220px]"
                      onClick={() => toast.success("Create new pool dialog coming soon!")}
                    >
                      <CardContent className="flex flex-col items-center justify-center text-center">
                        <div className="rounded-full p-3 bg-muted/50 group-hover:bg-primary/10 transition-colors mb-3">
                          <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                          Create New Pool
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="mt-4 space-y-4">
            {/* Campaign Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Campaign Templates</CardTitle>
                <CardDescription>Pre-built nurture sequences for different engagement goals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {CAMPAIGN_TEMPLATES.map((tmpl, index) => {
                    const Icon = tmpl.icon;
                    return (
                      <motion.div
                        key={tmpl.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => toast.success(`Template "${tmpl.name}" selected. Open the create campaign dialog to use it.`)}
                      >
                        <div className="rounded-md bg-primary/10 p-2">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{tmpl.name}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{tmpl.description}</p>
                          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                            <span>{tmpl.steps} steps</span>
                            <span>&middot;</span>
                            <span>{tmpl.avgOpenRate}% open rate</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Active Campaigns */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">All Campaigns</CardTitle>
                  <Badge variant="secondary">{CAMPAIGNS.length} total</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {CAMPAIGNS.map((campaign, index) => (
                  <motion.div
                    key={campaign.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.06 }}
                    className="rounded-lg border p-4 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm">{campaign.name}</h4>
                          <Badge variant={campaignStatusVariant(campaign.status)}>
                            {campaign.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Layers className="h-3 w-3" />
                            {campaign.poolName}
                          </span>
                          <span className="flex items-center gap-1">
                            <PenLine className="h-3 w-3" />
                            {campaign.template}
                          </span>
                          <span>{campaign.steps.length} steps</span>
                          {campaign.lastSent !== "--" && (
                            <span>Last sent: {formatDate(campaign.lastSent)}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {campaign.status === "Active" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toast.success(`Campaign "${campaign.name}" paused`)}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                        {campaign.status === "Paused" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toast.success(`Campaign "${campaign.name}" resumed`)}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {campaign.sent > 0 && (
                      <div className="grid grid-cols-4 gap-4">
                        <div className="rounded-md bg-muted/40 p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Send className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <p className="text-lg font-bold">{campaign.sent}</p>
                          <p className="text-[10px] text-muted-foreground">Sent</p>
                        </div>
                        <div className="rounded-md bg-muted/40 p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <MailOpen className="h-3 w-3 text-blue-500" />
                          </div>
                          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{campaign.openRate}%</p>
                          <p className="text-[10px] text-muted-foreground">Open Rate</p>
                        </div>
                        <div className="rounded-md bg-muted/40 p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <MousePointerClick className="h-3 w-3 text-purple-500" />
                          </div>
                          <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{campaign.clickRate}%</p>
                          <p className="text-[10px] text-muted-foreground">Click Rate</p>
                        </div>
                        <div className="rounded-md bg-muted/40 p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Reply className="h-3 w-3 text-emerald-500" />
                          </div>
                          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{campaign.responseRate}%</p>
                          <p className="text-[10px] text-muted-foreground">Response Rate</p>
                        </div>
                      </div>
                    )}

                    {campaign.status === "Draft" && (
                      <div className="flex items-center justify-center rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                        <Mail className="mr-2 h-4 w-4" />
                        Campaign not yet launched. Configure and send to start tracking metrics.
                      </div>
                    )}
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Smart Recommendations Tab */}
          <TabsContent value="recommendations" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  Smart Recommendations
                </CardTitle>
                <CardDescription>
                  Candidates showing signals they may be ready to make a move
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {TALENT_POOLS.flatMap((pool) =>
                    pool.candidates
                      .filter((c) => c.readyToMove)
                      .map((c) => ({ ...c, poolName: pool.name, poolIcon: pool.icon, poolColor: pool.iconColor }))
                  )
                    .sort((a, b) => b.engagementScore - a.engagementScore)
                    .map((candidate, index) => {
                      const PoolIcon = candidate.poolIcon;
                      return (
                        <motion.div
                          key={candidate.id}
                          initial={{ opacity: 0, x: -15 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/20 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                                {candidate.name.split(" ").map((n) => n[0]).join("")}
                              </div>
                              <Sparkles className="absolute -top-1 -right-1 h-3.5 w-3.5 text-amber-500" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm">{candidate.name}</p>
                                <Badge variant="outline" className="text-[10px] h-5 gap-1">
                                  <PoolIcon className="h-2.5 w-2.5" />
                                  {candidate.poolName}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {candidate.title} at {candidate.company}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                {candidate.tags.slice(0, 3).map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-[10px] h-4 px-1">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="flex items-center gap-1 justify-end">
                                <div className={`h-2 w-2 rounded-full ${engagementBg(candidate.engagementScore)}`} />
                                <span className={`text-sm font-bold ${engagementColor(candidate.engagementScore)}`}>
                                  {candidate.engagementScore}
                                </span>
                              </div>
                              <p className="text-[10px] text-muted-foreground">Engagement</p>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toast.success(`Reaching out to ${candidate.name}`)}
                              >
                                <Mail className="mr-1.5 h-3 w-3" />
                                Reach Out
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-4">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Pool Growth */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Pool Growth Over Time</CardTitle>
                  <CardDescription>Candidate additions per pool over the last 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {TALENT_POOLS.map((pool, index) => {
                      const Icon = pool.icon;
                      const widthPct = Math.min((pool.count / 12) * 100, 100);
                      return (
                        <motion.div
                          key={pool.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.08 }}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">{pool.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold">{pool.count}</span>
                              <Badge variant="outline" className="text-[10px] h-5 gap-0.5">
                                <TrendingUp className="h-2.5 w-2.5 text-emerald-500" />
                                +{pool.growthRate}%
                              </Badge>
                            </div>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted">
                            <motion.div
                              className={`h-full rounded-full ${pool.iconColor}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${widthPct}%` }}
                              transition={{ duration: 0.6, delay: index * 0.1 }}
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Engagement Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Engagement Trends</CardTitle>
                  <CardDescription>Average engagement score per pool</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {TALENT_POOLS.map((pool, index) => {
                      const Icon = pool.icon;
                      const avgEngagement = Math.round(
                        pool.candidates.reduce((sum, c) => sum + c.engagementScore, 0) /
                          pool.candidates.length
                      );
                      return (
                        <motion.div
                          key={pool.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.08 }}
                          className="flex items-center gap-4 rounded-lg border p-3"
                        >
                          <div className={`rounded-md p-2 ${pool.iconColor}`}>
                            <Icon className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{pool.name}</span>
                              <span className={`text-sm font-bold ${engagementColor(avgEngagement)}`}>
                                {avgEngagement}%
                              </span>
                            </div>
                            <Progress value={avgEngagement} className="h-1.5" />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Campaign Performance Summary */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Campaign Performance Summary</CardTitle>
                  <CardDescription>Aggregate metrics across all active nurture campaigns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                      {
                        label: "Total Emails Sent",
                        value: CAMPAIGNS.reduce((sum, c) => sum + c.sent, 0).toLocaleString(),
                        icon: Send,
                        color: "text-blue-500",
                      },
                      {
                        label: "Avg Open Rate",
                        value: `${Math.round(
                          CAMPAIGNS.filter((c) => c.sent > 0).reduce((sum, c) => sum + c.openRate, 0) /
                            CAMPAIGNS.filter((c) => c.sent > 0).length
                        )}%`,
                        icon: MailOpen,
                        color: "text-emerald-500",
                      },
                      {
                        label: "Avg Click Rate",
                        value: `${Math.round(
                          CAMPAIGNS.filter((c) => c.sent > 0).reduce((sum, c) => sum + c.clickRate, 0) /
                            CAMPAIGNS.filter((c) => c.sent > 0).length
                        )}%`,
                        icon: MousePointerClick,
                        color: "text-purple-500",
                      },
                      {
                        label: "Avg Response Rate",
                        value: `${Math.round(
                          CAMPAIGNS.filter((c) => c.sent > 0).reduce((sum, c) => sum + c.responseRate, 0) /
                            CAMPAIGNS.filter((c) => c.sent > 0).length
                        )}%`,
                        icon: Reply,
                        color: "text-amber-500",
                      },
                    ].map((metric, index) => (
                      <motion.div
                        key={metric.label}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.08 }}
                        className="rounded-lg border p-4 text-center"
                      >
                        <metric.icon className={`h-5 w-5 ${metric.color} mx-auto mb-2`} />
                        <p className="text-2xl font-bold">{metric.value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{metric.label}</p>
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
