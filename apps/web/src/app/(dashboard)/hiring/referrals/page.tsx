"use client";

import { useState, useMemo } from "react";
import {
  Users,
  UserPlus,
  Trophy,
  DollarSign,
  Share2,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Mail,
  Briefcase,
  TrendingUp,
  Award,
  Gift,
  Star,
  Copy,
  ExternalLink,
  ArrowUpRight,
  Filter,
  Upload,
  ChevronRight,
  Medal,
  Sparkles,
  Target,
  Timer,
  Bell,
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

interface Referral {
  id: string;
  candidateName: string;
  candidateEmail: string;
  position: string;
  department: string;
  relationship: string;
  status: "Submitted" | "Screening" | "Interview" | "Hired" | "Rejected";
  rewardStatus: "Pending" | "Eligible" | "Paid" | "N/A";
  rewardAmount: number;
  referredBy: string;
  referrerId: string;
  submittedDate: string;
  lastUpdated: string;
  notes: string;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  department: string;
  totalReferrals: number;
  hired: number;
  successRate: number;
  totalRewards: number;
  badge: "Gold" | "Silver" | "Bronze" | null;
}

interface OpenPosition {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  referralBonus: number;
  urgency: "High" | "Medium" | "Low";
  applicants: number;
}

// ─── Simulated Data ─────────────────────────────────────

const REFERRALS: Referral[] = [
  {
    id: "ref-001",
    candidateName: "Sarah Chen",
    candidateEmail: "sarah.chen@email.com",
    position: "Senior Frontend Engineer",
    department: "Engineering",
    relationship: "Former Colleague",
    status: "Hired",
    rewardStatus: "Paid",
    rewardAmount: 5000,
    referredBy: "Alex Martinez",
    referrerId: "emp-001",
    submittedDate: "2025-11-15",
    lastUpdated: "2026-01-20",
    notes: "Worked together at TechCorp for 3 years",
  },
  {
    id: "ref-002",
    candidateName: "James Wilson",
    candidateEmail: "j.wilson@email.com",
    position: "Product Manager",
    department: "Product",
    relationship: "University Friend",
    status: "Interview",
    rewardStatus: "Pending",
    rewardAmount: 4000,
    referredBy: "Alex Martinez",
    referrerId: "emp-001",
    submittedDate: "2026-01-08",
    lastUpdated: "2026-02-05",
    notes: "MBA from Stanford, 6 years PM experience",
  },
  {
    id: "ref-003",
    candidateName: "Priya Patel",
    candidateEmail: "priya.p@email.com",
    position: "DevOps Engineer",
    department: "Engineering",
    relationship: "Conference Contact",
    status: "Screening",
    rewardStatus: "Pending",
    rewardAmount: 5000,
    referredBy: "Maria Santos",
    referrerId: "emp-002",
    submittedDate: "2026-02-01",
    lastUpdated: "2026-02-08",
    notes: "Met at KubeCon, strong Kubernetes expertise",
  },
  {
    id: "ref-004",
    candidateName: "David Kim",
    candidateEmail: "d.kim@email.com",
    position: "Sales Director",
    department: "Sales",
    relationship: "Professional Network",
    status: "Hired",
    rewardStatus: "Eligible",
    rewardAmount: 7500,
    referredBy: "Maria Santos",
    referrerId: "emp-002",
    submittedDate: "2025-12-10",
    lastUpdated: "2026-02-01",
    notes: "10+ years enterprise sales experience",
  },
  {
    id: "ref-005",
    candidateName: "Emily Rodriguez",
    candidateEmail: "e.rodriguez@email.com",
    position: "UX Designer",
    department: "Design",
    relationship: "Former Colleague",
    status: "Rejected",
    rewardStatus: "N/A",
    rewardAmount: 0,
    referredBy: "Tom Jackson",
    referrerId: "emp-003",
    submittedDate: "2025-12-20",
    lastUpdated: "2026-01-15",
    notes: "Great portfolio but looking for more senior level",
  },
  {
    id: "ref-006",
    candidateName: "Michael Brown",
    candidateEmail: "m.brown@email.com",
    position: "Backend Engineer",
    department: "Engineering",
    relationship: "Bootcamp Cohort",
    status: "Submitted",
    rewardStatus: "Pending",
    rewardAmount: 5000,
    referredBy: "Tom Jackson",
    referrerId: "emp-003",
    submittedDate: "2026-02-10",
    lastUpdated: "2026-02-10",
    notes: "Strong Go and Rust experience",
  },
  {
    id: "ref-007",
    candidateName: "Lisa Wang",
    candidateEmail: "l.wang@email.com",
    position: "Data Scientist",
    department: "Engineering",
    relationship: "Research Partner",
    status: "Interview",
    rewardStatus: "Pending",
    rewardAmount: 5000,
    referredBy: "Rachel Green",
    referrerId: "emp-004",
    submittedDate: "2026-01-25",
    lastUpdated: "2026-02-09",
    notes: "PhD in ML from MIT, published researcher",
  },
  {
    id: "ref-008",
    candidateName: "Carlos Mendez",
    candidateEmail: "c.mendez@email.com",
    position: "VP of Engineering",
    department: "Engineering",
    relationship: "Industry Contact",
    status: "Screening",
    rewardStatus: "Pending",
    rewardAmount: 10000,
    referredBy: "Rachel Green",
    referrerId: "emp-004",
    submittedDate: "2026-02-05",
    lastUpdated: "2026-02-11",
    notes: "Currently VP at competitor, 15 years experience",
  },
  {
    id: "ref-009",
    candidateName: "Anna Kowalski",
    candidateEmail: "a.kowalski@email.com",
    position: "Marketing Manager",
    department: "Marketing",
    relationship: "LinkedIn Connection",
    status: "Hired",
    rewardStatus: "Paid",
    rewardAmount: 4000,
    referredBy: "Jake Foster",
    referrerId: "emp-005",
    submittedDate: "2025-10-30",
    lastUpdated: "2025-12-15",
    notes: "Excellent track record in B2B SaaS marketing",
  },
  {
    id: "ref-010",
    candidateName: "Ryan Thompson",
    candidateEmail: "r.thompson@email.com",
    position: "Senior Frontend Engineer",
    department: "Engineering",
    relationship: "Open Source Collaborator",
    status: "Interview",
    rewardStatus: "Pending",
    rewardAmount: 5000,
    referredBy: "Jake Foster",
    referrerId: "emp-005",
    submittedDate: "2026-01-18",
    lastUpdated: "2026-02-07",
    notes: "Major contributor to React ecosystem",
  },
  {
    id: "ref-011",
    candidateName: "Nina Petrov",
    candidateEmail: "n.petrov@email.com",
    position: "Customer Success Lead",
    department: "Customer Success",
    relationship: "Former Manager",
    status: "Submitted",
    rewardStatus: "Pending",
    rewardAmount: 4000,
    referredBy: "Samantha Lee",
    referrerId: "emp-006",
    submittedDate: "2026-02-12",
    lastUpdated: "2026-02-12",
    notes: "Led CS teams of 20+ at enterprise SaaS companies",
  },
  {
    id: "ref-012",
    candidateName: "Tyler Brooks",
    candidateEmail: "t.brooks@email.com",
    position: "Solutions Architect",
    department: "Engineering",
    relationship: "Hackathon Teammate",
    status: "Rejected",
    rewardStatus: "N/A",
    rewardAmount: 0,
    referredBy: "Samantha Lee",
    referrerId: "emp-006",
    submittedDate: "2025-11-28",
    lastUpdated: "2026-01-05",
    notes: "Talented but salary expectations too high",
  },
];

const LEADERBOARD: LeaderboardEntry[] = [
  {
    id: "emp-001",
    name: "Alex Martinez",
    avatar: "AM",
    department: "Engineering",
    totalReferrals: 8,
    hired: 4,
    successRate: 50,
    totalRewards: 19000,
    badge: "Gold",
  },
  {
    id: "emp-004",
    name: "Rachel Green",
    avatar: "RG",
    department: "Engineering",
    totalReferrals: 6,
    hired: 2,
    successRate: 33,
    totalRewards: 10000,
    badge: "Silver",
  },
  {
    id: "emp-005",
    name: "Jake Foster",
    avatar: "JF",
    department: "Product",
    totalReferrals: 5,
    hired: 2,
    successRate: 40,
    totalRewards: 9000,
    badge: "Silver",
  },
  {
    id: "emp-002",
    name: "Maria Santos",
    avatar: "MS",
    department: "Operations",
    totalReferrals: 4,
    hired: 1,
    successRate: 25,
    totalRewards: 7500,
    badge: "Bronze",
  },
  {
    id: "emp-003",
    name: "Tom Jackson",
    avatar: "TJ",
    department: "Design",
    totalReferrals: 3,
    hired: 0,
    successRate: 0,
    totalRewards: 0,
    badge: null,
  },
  {
    id: "emp-006",
    name: "Samantha Lee",
    avatar: "SL",
    department: "Customer Success",
    totalReferrals: 2,
    hired: 0,
    successRate: 0,
    totalRewards: 0,
    badge: null,
  },
];

const OPEN_POSITIONS: OpenPosition[] = [
  { id: "pos-001", title: "Senior Frontend Engineer", department: "Engineering", location: "San Francisco, CA", type: "Full-time", referralBonus: 5000, urgency: "High", applicants: 12 },
  { id: "pos-002", title: "Backend Engineer", department: "Engineering", location: "Remote", type: "Full-time", referralBonus: 5000, urgency: "High", applicants: 8 },
  { id: "pos-003", title: "Product Manager", department: "Product", location: "New York, NY", type: "Full-time", referralBonus: 4000, urgency: "Medium", applicants: 15 },
  { id: "pos-004", title: "DevOps Engineer", department: "Engineering", location: "Remote", type: "Full-time", referralBonus: 5000, urgency: "High", applicants: 5 },
  { id: "pos-005", title: "UX Designer", department: "Design", location: "San Francisco, CA", type: "Full-time", referralBonus: 3500, urgency: "Medium", applicants: 20 },
  { id: "pos-006", title: "Sales Director", department: "Sales", location: "Chicago, IL", type: "Full-time", referralBonus: 7500, urgency: "Low", applicants: 6 },
  { id: "pos-007", title: "Data Scientist", department: "Engineering", location: "Remote", type: "Full-time", referralBonus: 5000, urgency: "Medium", applicants: 10 },
  { id: "pos-008", title: "VP of Engineering", department: "Engineering", location: "San Francisco, CA", type: "Full-time", referralBonus: 10000, urgency: "High", applicants: 3 },
];

const REWARD_TIERS = [
  { level: "Standard", description: "Individual Contributor roles", amount: 3500, color: "bg-blue-500" },
  { level: "Senior", description: "Senior & Lead roles", amount: 5000, color: "bg-purple-500" },
  { level: "Management", description: "Manager & Director roles", amount: 7500, color: "bg-amber-500" },
  { level: "Executive", description: "VP & C-Suite roles", amount: 10000, color: "bg-rose-500" },
];

// ─── Animations ─────────────────────────────────────────

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.06 },
  },
};

// ─── Helpers ────────────────────────────────────────────

function statusVariant(status: Referral["status"]) {
  switch (status) {
    case "Hired":
      return "default" as const;
    case "Interview":
      return "secondary" as const;
    case "Screening":
      return "outline" as const;
    case "Submitted":
      return "outline" as const;
    case "Rejected":
      return "destructive" as const;
  }
}

function statusIcon(status: Referral["status"]) {
  switch (status) {
    case "Hired":
      return <CheckCircle2 className="h-3 w-3" />;
    case "Interview":
      return <Users className="h-3 w-3" />;
    case "Screening":
      return <Eye className="h-3 w-3" />;
    case "Submitted":
      return <Clock className="h-3 w-3" />;
    case "Rejected":
      return <XCircle className="h-3 w-3" />;
  }
}

function rewardStatusVariant(status: Referral["rewardStatus"]) {
  switch (status) {
    case "Paid":
      return "default" as const;
    case "Eligible":
      return "secondary" as const;
    case "Pending":
      return "outline" as const;
    case "N/A":
      return "outline" as const;
  }
}

function badgeIcon(badge: LeaderboardEntry["badge"]) {
  switch (badge) {
    case "Gold":
      return <Trophy className="h-4 w-4 text-yellow-500" />;
    case "Silver":
      return <Medal className="h-4 w-4 text-slate-400" />;
    case "Bronze":
      return <Award className="h-4 w-4 text-amber-700" />;
    default:
      return null;
  }
}

function badgeColor(badge: LeaderboardEntry["badge"]) {
  switch (badge) {
    case "Gold":
      return "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800";
    case "Silver":
      return "bg-slate-50 border-slate-200 dark:bg-slate-950/30 dark:border-slate-700";
    case "Bronze":
      return "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800";
    default:
      return "";
  }
}

function urgencyColor(urgency: OpenPosition["urgency"]) {
  switch (urgency) {
    case "High":
      return "destructive" as const;
    case "Medium":
      return "secondary" as const;
    case "Low":
      return "outline" as const;
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Submit Referral Dialog ─────────────────────────────

function SubmitReferralDialog() {
  const [open, setOpen] = useState(false);
  const [candidateName, setCandidateName] = useState("");
  const [candidateEmail, setCandidateEmail] = useState("");
  const [position, setPosition] = useState("");
  const [relationship, setRelationship] = useState("");
  const [notes, setNotes] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!candidateName.trim() || !candidateEmail.trim() || !position) {
      toast.error("Please fill in all required fields");
      return;
    }
    toast.success("Referral submitted successfully!", {
      description: `${candidateName} has been referred for ${position}`,
    });
    setCandidateName("");
    setCandidateEmail("");
    setPosition("");
    setRelationship("");
    setNotes("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Submit Referral
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Submit a Referral</DialogTitle>
          <DialogDescription>
            Refer someone from your network for an open position. You will earn a bonus if they are hired.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="candidateName">Candidate Name *</Label>
              <Input
                id="candidateName"
                placeholder="Full name"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="candidateEmail">Email *</Label>
              <Input
                id="candidateEmail"
                type="email"
                placeholder="email@example.com"
                value={candidateEmail}
                onChange={(e) => setCandidateEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="position">Position *</Label>
            <Select value={position} onValueChange={setPosition}>
              <SelectTrigger>
                <SelectValue placeholder="Select a position" />
              </SelectTrigger>
              <SelectContent>
                {OPEN_POSITIONS.map((pos) => (
                  <SelectItem key={pos.id} value={pos.title}>
                    {pos.title} - {pos.department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="relationship">Relationship</Label>
            <Select value={relationship} onValueChange={setRelationship}>
              <SelectTrigger>
                <SelectValue placeholder="How do you know them?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Former Colleague">Former Colleague</SelectItem>
                <SelectItem value="University Friend">University Friend</SelectItem>
                <SelectItem value="Professional Network">Professional Network</SelectItem>
                <SelectItem value="Conference Contact">Conference Contact</SelectItem>
                <SelectItem value="LinkedIn Connection">LinkedIn Connection</SelectItem>
                <SelectItem value="Open Source Collaborator">Open Source Collaborator</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Why would this person be a great fit?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="resume">Resume (optional)</Label>
            <div className="flex items-center gap-2">
              <Input id="resume" type="file" accept=".pdf,.doc,.docx" className="flex-1" />
              <Upload className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              <UserPlus className="mr-2 h-4 w-4" />
              Submit Referral
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Share Job Link Dialog ──────────────────────────────

function ShareJobDialog({ position }: { position: OpenPosition }) {
  const [open, setOpen] = useState(false);
  const referralCode = `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const shareLink = `https://careers.company.com/jobs/${position.id}?ref=${referralCode}`;

  function copyLink() {
    navigator.clipboard.writeText(shareLink).then(() => {
      toast.success("Referral link copied to clipboard!");
    }).catch(() => {
      toast.success("Referral link copied!");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Share2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Share Job Link</DialogTitle>
          <DialogDescription>
            Share this unique referral link. You will get credit for any candidate who applies through it.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-1">{position.title}</p>
            <p className="text-xs text-muted-foreground">{position.department} &middot; {position.location}</p>
          </div>
          <div className="flex items-center gap-2">
            <Input value={shareLink} readOnly className="text-xs font-mono" />
            <Button variant="outline" size="sm" onClick={copyLink}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Target className="h-3 w-3" />
            <span>Tracking code: {referralCode}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => { toast.success("Link shared via email!"); setOpen(false); }}>
              <Mail className="mr-2 h-4 w-4" />
              Email
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={() => { copyLink(); setOpen(false); }}>
              <ExternalLink className="mr-2 h-4 w-4" />
              LinkedIn
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Stats Cards ────────────────────────────────────────

function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  trend,
  index,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  iconColor: string;
  trend?: { value: string; positive: boolean };
  index: number;
}) {
  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      transition={{ duration: 0.4, delay: index * 0.08 }}
    >
      <Card className="relative overflow-hidden">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{title}</p>
              <p className="text-2xl font-bold tracking-tight">{value}</p>
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
            </div>
            <div className={`rounded-lg p-2.5 ${iconColor}`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
          </div>
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              <ArrowUpRight className={`h-3 w-3 ${trend.positive ? "text-emerald-500" : "text-red-500"}`} />
              <span className={`text-xs font-medium ${trend.positive ? "text-emerald-500" : "text-red-500"}`}>
                {trend.value}
              </span>
              <span className="text-xs text-muted-foreground">vs last quarter</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Main Page ──────────────────────────────────────────

export default function ReferralsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("referrals");

  const totalReferrals = REFERRALS.length;
  const hiredCount = REFERRALS.filter((r) => r.status === "Hired").length;
  const pendingCount = REFERRALS.filter((r) => ["Submitted", "Screening", "Interview"].includes(r.status)).length;
  const totalRewardsPaid = REFERRALS.filter((r) => r.rewardStatus === "Paid").reduce((sum, r) => sum + r.rewardAmount, 0);
  const totalRewardsEarned = REFERRALS.filter((r) => r.rewardStatus === "Paid" || r.rewardStatus === "Eligible").reduce((sum, r) => sum + r.rewardAmount, 0);
  const conversionRate = totalReferrals > 0 ? Math.round((hiredCount / totalReferrals) * 100) : 0;

  const filteredReferrals = useMemo(() => {
    return REFERRALS.filter((referral) => {
      const matchesSearch =
        !searchQuery ||
        referral.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        referral.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
        referral.referredBy.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || referral.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter]);

  function handleNotifyStatusChange(referral: Referral) {
    toast.success(`Notification sent to ${referral.referredBy}`, {
      description: `Update on ${referral.candidateName}'s referral status: ${referral.status}`,
    });
  }

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
          <h1 className="text-2xl font-bold tracking-tight">Employee Referral Program</h1>
          <p className="text-muted-foreground">
            Refer great talent from your network and earn rewards
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SubmitReferralDialog />
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-5"
      >
        <StatsCard
          title="Total Referrals"
          value={totalReferrals}
          subtitle={`${pendingCount} active`}
          icon={Users}
          iconColor="bg-blue-500"
          trend={{ value: "+23%", positive: true }}
          index={0}
        />
        <StatsCard
          title="Hired"
          value={hiredCount}
          subtitle={`${conversionRate}% conversion`}
          icon={CheckCircle2}
          iconColor="bg-emerald-500"
          trend={{ value: "+15%", positive: true }}
          index={1}
        />
        <StatsCard
          title="Pending Review"
          value={pendingCount}
          subtitle="In pipeline"
          icon={Clock}
          iconColor="bg-amber-500"
          index={2}
        />
        <StatsCard
          title="Rewards Earned"
          value={formatCurrency(totalRewardsEarned)}
          subtitle={`${formatCurrency(totalRewardsPaid)} paid out`}
          icon={DollarSign}
          iconColor="bg-purple-500"
          trend={{ value: "+$4,500", positive: true }}
          index={3}
        />
        <StatsCard
          title="Avg Time to Hire"
          value="28 days"
          subtitle="vs 42 days non-referral"
          icon={Timer}
          iconColor="bg-rose-500"
          trend={{ value: "-5 days", positive: true }}
          index={4}
        />
      </motion.div>

      {/* Main Content Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="referrals">
              <Users className="mr-1.5 h-4 w-4" />
              My Referrals
            </TabsTrigger>
            <TabsTrigger value="leaderboard">
              <Trophy className="mr-1.5 h-4 w-4" />
              Leaderboard
            </TabsTrigger>
            <TabsTrigger value="positions">
              <Briefcase className="mr-1.5 h-4 w-4" />
              Open Positions
            </TabsTrigger>
            <TabsTrigger value="rewards">
              <Gift className="mr-1.5 h-4 w-4" />
              Rewards Program
            </TabsTrigger>
          </TabsList>

          {/* Referrals Tab */}
          <TabsContent value="referrals" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle>Referral Tracking</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search referrals..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 w-[220px]"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[140px]">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="Submitted">Submitted</SelectItem>
                        <SelectItem value="Screening">Screening</SelectItem>
                        <SelectItem value="Interview">Interview</SelectItem>
                        <SelectItem value="Hired">Hired</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Candidate</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Referred By</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Reward</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence mode="popLayout">
                      {filteredReferrals.map((referral, index) => (
                        <motion.tr
                          key={referral.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ duration: 0.2, delay: index * 0.03 }}
                          className="border-b transition-colors hover:bg-muted/50"
                        >
                          <TableCell>
                            <div>
                              <p className="font-medium">{referral.candidateName}</p>
                              <p className="text-xs text-muted-foreground">{referral.candidateEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm">{referral.position}</p>
                              <p className="text-xs text-muted-foreground">{referral.department}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusVariant(referral.status)} className="gap-1">
                              {statusIcon(referral.status)}
                              {referral.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">{referral.referredBy}</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm text-muted-foreground">{formatDate(referral.submittedDate)}</p>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant={rewardStatusVariant(referral.rewardStatus)}>
                                {referral.rewardStatus}
                              </Badge>
                              {referral.rewardAmount > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  {formatCurrency(referral.rewardAmount)}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleNotifyStatusChange(referral)}
                            >
                              <Bell className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
                {filteredReferrals.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Users className="h-10 w-10 text-muted-foreground/50 mb-3" />
                    <p className="text-sm text-muted-foreground">No referrals found matching your filters.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard" className="mt-4">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Top 3 Podium */}
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      Top Referrers
                    </CardTitle>
                    <CardDescription>Employees who have made the most successful referrals</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      {LEADERBOARD.slice(0, 3).map((entry, index) => (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.4, delay: index * 0.1 }}
                        >
                          <Card className={`relative overflow-hidden border-2 ${badgeColor(entry.badge)}`}>
                            <CardContent className="pt-6 pb-5">
                              <div className="flex flex-col items-center text-center">
                                <div className="relative mb-3">
                                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                                    {entry.avatar}
                                  </div>
                                  {entry.badge && (
                                    <div className="absolute -top-1 -right-1 rounded-full bg-white dark:bg-gray-900 p-1 shadow-sm">
                                      {badgeIcon(entry.badge)}
                                    </div>
                                  )}
                                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                                    #{index + 1}
                                  </div>
                                </div>
                                <h3 className="font-semibold">{entry.name}</h3>
                                <p className="text-xs text-muted-foreground mb-3">{entry.department}</p>
                                <div className="grid grid-cols-3 gap-3 w-full">
                                  <div>
                                    <p className="text-lg font-bold">{entry.totalReferrals}</p>
                                    <p className="text-[10px] text-muted-foreground">Referrals</p>
                                  </div>
                                  <div>
                                    <p className="text-lg font-bold">{entry.hired}</p>
                                    <p className="text-[10px] text-muted-foreground">Hired</p>
                                  </div>
                                  <div>
                                    <p className="text-lg font-bold">{entry.successRate}%</p>
                                    <p className="text-[10px] text-muted-foreground">Rate</p>
                                  </div>
                                </div>
                                <Separator className="my-3" />
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                    {formatCurrency(entry.totalRewards)}
                                  </span>
                                  <span className="text-xs text-muted-foreground">earned</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Full Leaderboard Table */}
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle>All Referrers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Rank</TableHead>
                          <TableHead>Employee</TableHead>
                          <TableHead>Department</TableHead>
                          <TableHead>Total Referrals</TableHead>
                          <TableHead>Hired</TableHead>
                          <TableHead>Success Rate</TableHead>
                          <TableHead>Rewards Earned</TableHead>
                          <TableHead>Badge</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {LEADERBOARD.map((entry, index) => (
                          <motion.tr
                            key={entry.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                            className="border-b transition-colors hover:bg-muted/50"
                          >
                            <TableCell>
                              <span className="font-bold text-muted-foreground">#{index + 1}</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                                  {entry.avatar}
                                </div>
                                <span className="font-medium">{entry.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">{entry.department}</TableCell>
                            <TableCell className="font-medium">{entry.totalReferrals}</TableCell>
                            <TableCell className="font-medium">{entry.hired}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress value={entry.successRate} className="w-16 h-1.5" />
                                <span className="text-sm">{entry.successRate}%</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(entry.totalRewards)}
                            </TableCell>
                            <TableCell>
                              {entry.badge ? (
                                <Badge
                                  variant="outline"
                                  className={`gap-1 ${
                                    entry.badge === "Gold"
                                      ? "border-yellow-300 text-yellow-700 dark:text-yellow-400"
                                      : entry.badge === "Silver"
                                      ? "border-slate-300 text-slate-600 dark:text-slate-400"
                                      : "border-amber-300 text-amber-700 dark:text-amber-400"
                                  }`}
                                >
                                  {badgeIcon(entry.badge)}
                                  {entry.badge}
                                </Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">--</span>
                              )}
                            </TableCell>
                          </motion.tr>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Open Positions Tab */}
          <TabsContent value="positions" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Open Positions</CardTitle>
                    <CardDescription>Refer candidates for these active openings and earn bonuses</CardDescription>
                  </div>
                  <Badge variant="secondary" className="gap-1">
                    <Sparkles className="h-3 w-3" />
                    {OPEN_POSITIONS.length} positions
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {OPEN_POSITIONS.map((position, index) => (
                    <motion.div
                      key={position.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Card className="border hover:border-primary/30 transition-colors">
                        <CardContent className="pt-4 pb-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-sm">{position.title}</h3>
                                <Badge variant={urgencyColor(position.urgency)} className="text-[10px] h-5">
                                  {position.urgency}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Briefcase className="h-3 w-3" />
                                  {position.department}
                                </span>
                                <span>{position.location}</span>
                                <span>{position.type}</span>
                              </div>
                            </div>
                            <ShareJobDialog position={position} />
                          </div>
                          <Separator className="my-3" />
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <Gift className="h-3.5 w-3.5 text-emerald-500" />
                              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(position.referralBonus)}
                              </span>
                              <span className="text-xs text-muted-foreground">bonus</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-muted-foreground">
                                {position.applicants} applicants
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  toast.success(`Opening referral form for ${position.title}`);
                                }}
                              >
                                <UserPlus className="mr-1.5 h-3 w-3" />
                                Refer
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rewards Program Tab */}
          <TabsContent value="rewards" className="mt-4">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Reward Tiers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5 text-purple-500" />
                    Reward Tiers
                  </CardTitle>
                  <CardDescription>Bonus amounts by position level</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {REWARD_TIERS.map((tier, index) => (
                    <motion.div
                      key={tier.level}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-3 w-3 rounded-full ${tier.color}`} />
                        <div>
                          <p className="font-medium text-sm">{tier.level}</p>
                          <p className="text-xs text-muted-foreground">{tier.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{formatCurrency(tier.amount)}</p>
                        <p className="text-[10px] text-muted-foreground">per successful hire</p>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>

              {/* Your Rewards Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-emerald-500" />
                    Your Rewards Summary
                  </CardTitle>
                  <CardDescription>Track your referral bonus earnings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className="rounded-lg border p-4 text-center"
                    >
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(totalRewardsPaid)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Paid</p>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className="rounded-lg border p-4 text-center"
                    >
                      <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                        {formatCurrency(totalRewardsEarned - totalRewardsPaid)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Pending</p>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                      className="rounded-lg border p-4 text-center"
                    >
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(totalRewardsEarned)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Total Earned</p>
                    </motion.div>
                  </div>

                  <Separator />

                  {/* Recent Payouts */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Recent Payouts</h4>
                    <div className="space-y-3">
                      {REFERRALS.filter((r) => r.rewardStatus === "Paid").map((referral) => (
                        <div
                          key={referral.id}
                          className="flex items-center justify-between rounded-lg bg-muted/30 p-3"
                        >
                          <div>
                            <p className="text-sm font-medium">{referral.candidateName}</p>
                            <p className="text-xs text-muted-foreground">{referral.position}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(referral.rewardAmount)}
                            </p>
                            <p className="text-[10px] text-muted-foreground">{formatDate(referral.lastUpdated)}</p>
                          </div>
                        </div>
                      ))}
                      {REFERRALS.filter((r) => r.rewardStatus === "Eligible").map((referral) => (
                        <div
                          key={referral.id}
                          className="flex items-center justify-between rounded-lg border border-dashed p-3"
                        >
                          <div>
                            <p className="text-sm font-medium">{referral.candidateName}</p>
                            <p className="text-xs text-muted-foreground">{referral.position}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="secondary" className="gap-1">
                              <Clock className="h-3 w-3" />
                              {formatCurrency(referral.rewardAmount)} pending
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* How it works */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3">How Referral Rewards Work</h4>
                    <div className="space-y-2">
                      {[
                        { step: "1", text: "Submit a referral for any open position" },
                        { step: "2", text: "Candidate goes through the interview process" },
                        { step: "3", text: "If hired, you become eligible for the bonus" },
                        { step: "4", text: "Bonus is paid after 90-day retention period" },
                      ].map((item) => (
                        <div key={item.step} className="flex items-center gap-3">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                            {item.step}
                          </div>
                          <p className="text-sm text-muted-foreground">{item.text}</p>
                        </div>
                      ))}
                    </div>
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
