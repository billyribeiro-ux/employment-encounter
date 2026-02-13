"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserCheck,
  Plus,
  Send,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Eye,
  Mail,
  Phone,
  Star,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Bell,
  Users,
  CalendarDays,
  Briefcase,
  MessageSquare,
  X,
  ShieldCheck,
  TrendingUp,
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ReferenceStatus = "pending" | "sent" | "completed" | "overdue";

type RefereeRelationship =
  | "Manager"
  | "Colleague"
  | "Direct Report"
  | "Skip-Level Manager"
  | "Client"
  | "Mentor";

interface QAResponse {
  question: string;
  answer: string;
  rating?: number;
}

interface RatingBreakdown {
  category: string;
  score: number;
}

interface ReferenceRequest {
  id: string;
  candidateName: string;
  candidateJobTitle: string;
  refereeName: string;
  refereeEmail: string;
  refereePhone: string;
  relationship: RefereeRelationship;
  status: ReferenceStatus;
  overallRating: number;
  sentDate: string | null;
  completedDate: string | null;
  responses: QAResponse[];
  ratingBreakdown: RatingBreakdown[];
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const mockReferences: ReferenceRequest[] = [
  {
    id: "ref-001",
    candidateName: "Sarah Chen",
    candidateJobTitle: "Senior Frontend Engineer",
    refereeName: "Michael Torres",
    refereeEmail: "m.torres@techcorp.com",
    refereePhone: "+1 (555) 123-4567",
    relationship: "Manager",
    status: "completed",
    overallRating: 4.8,
    sentDate: "2026-01-20",
    completedDate: "2026-01-25",
    responses: [
      {
        question: "How long did you work with the candidate and in what capacity?",
        answer: "I managed Sarah for 3 years on our platform engineering team. She was one of our most reliable senior engineers.",
      },
      {
        question: "How would you rate their overall job performance?",
        answer: "Exceptional across the board. Sarah consistently exceeded expectations and was instrumental in shipping our design system.",
        rating: 5,
      },
      {
        question: "What are the candidate's greatest professional strengths?",
        answer: "Deep technical expertise in React and TypeScript, outstanding mentorship of junior engineers, and an ability to translate complex requirements into elegant solutions.",
      },
      {
        question: "What areas could the candidate improve in?",
        answer: "She could benefit from more exposure to executive-level stakeholder communication. Her technical communication is superb, but presenting to C-suite is still a growth area.",
      },
      {
        question: "Would you rehire this candidate?",
        answer: "Absolutely, without any hesitation. She is one of the best engineers I have managed.",
        rating: 5,
      },
    ],
    ratingBreakdown: [
      { category: "Technical Skills", score: 5 },
      { category: "Communication", score: 4 },
      { category: "Teamwork", score: 5 },
      { category: "Leadership", score: 5 },
      { category: "Reliability", score: 5 },
    ],
  },
  {
    id: "ref-002",
    candidateName: "Sarah Chen",
    candidateJobTitle: "Senior Frontend Engineer",
    refereeName: "Lisa Wang",
    refereeEmail: "l.wang@techcorp.com",
    refereePhone: "+1 (555) 234-5678",
    relationship: "Colleague",
    status: "completed",
    overallRating: 4.5,
    sentDate: "2026-01-20",
    completedDate: "2026-01-23",
    responses: [
      {
        question: "How long did you work with the candidate and in what capacity?",
        answer: "Worked alongside Sarah for 2 years as a product manager collaborating on multiple product launches.",
      },
      {
        question: "How would you rate their overall job performance?",
        answer: "Excellent. She always delivered on time and the quality of her work was consistently high.",
        rating: 5,
      },
      {
        question: "What are the candidate's greatest professional strengths?",
        answer: "Strong technical execution, great collaborative instincts, and she always takes ownership of deliverables end-to-end.",
      },
      {
        question: "What areas could the candidate improve in?",
        answer: "She sometimes takes on too much work and could benefit from delegating more effectively.",
      },
      {
        question: "Would you rehire this candidate?",
        answer: "Yes, definitely. She elevated the quality of every project she touched.",
        rating: 4,
      },
    ],
    ratingBreakdown: [
      { category: "Technical Skills", score: 5 },
      { category: "Communication", score: 4 },
      { category: "Teamwork", score: 5 },
      { category: "Leadership", score: 4 },
      { category: "Reliability", score: 5 },
    ],
  },
  {
    id: "ref-003",
    candidateName: "Marcus Johnson",
    candidateJobTitle: "Product Designer",
    refereeName: "Rachel Green",
    refereeEmail: "r.green@designco.com",
    refereePhone: "+1 (555) 345-6789",
    relationship: "Manager",
    status: "completed",
    overallRating: 3.2,
    sentDate: "2026-01-22",
    completedDate: "2026-01-30",
    responses: [
      {
        question: "How long did you work with the candidate and in what capacity?",
        answer: "Marcus reported directly to me for about 18 months as a mid-level product designer.",
      },
      {
        question: "How would you rate their overall job performance?",
        answer: "Satisfactory. Marcus has genuine creative talent but there were recurring issues with deadlines and incorporating feedback.",
        rating: 3,
      },
      {
        question: "What are the candidate's greatest professional strengths?",
        answer: "Strong visual design skills and a good aesthetic sense. He produces visually appealing work when given enough time.",
      },
      {
        question: "What areas could the candidate improve in?",
        answer: "Time management, responsiveness to feedback, and cross-functional collaboration with engineering partners.",
      },
      {
        question: "Would you rehire this candidate?",
        answer: "I would consider it if the role had more flexibility around timelines and the team had strong project management support.",
        rating: 3,
      },
    ],
    ratingBreakdown: [
      { category: "Technical Skills", score: 4 },
      { category: "Communication", score: 3 },
      { category: "Teamwork", score: 3 },
      { category: "Leadership", score: 2 },
      { category: "Reliability", score: 3 },
    ],
  },
  {
    id: "ref-004",
    candidateName: "Emily Zhang",
    candidateJobTitle: "Product Manager",
    refereeName: "David Lee",
    refereeEmail: "d.lee@bigtech.com",
    refereePhone: "+1 (555) 456-7890",
    relationship: "Skip-Level Manager",
    status: "pending",
    overallRating: 0,
    sentDate: "2026-02-05",
    completedDate: null,
    responses: [],
    ratingBreakdown: [],
  },
  {
    id: "ref-005",
    candidateName: "Emily Zhang",
    candidateJobTitle: "Product Manager",
    refereeName: "Sandra Nguyen",
    refereeEmail: "s.nguyen@bigtech.com",
    refereePhone: "+1 (555) 567-8901",
    relationship: "Colleague",
    status: "sent",
    overallRating: 0,
    sentDate: "2026-02-06",
    completedDate: null,
    responses: [],
    ratingBreakdown: [],
  },
  {
    id: "ref-006",
    candidateName: "David Kim",
    candidateJobTitle: "Engineering Manager",
    refereeName: "Nina Patel",
    refereeEmail: "n.patel@scaleco.com",
    refereePhone: "+1 (555) 678-9012",
    relationship: "Manager",
    status: "overdue",
    overallRating: 0,
    sentDate: "2026-01-10",
    completedDate: null,
    responses: [],
    ratingBreakdown: [],
  },
  {
    id: "ref-007",
    candidateName: "David Kim",
    candidateJobTitle: "Engineering Manager",
    refereeName: "Chris Martinez",
    refereeEmail: "c.martinez@scaleco.com",
    refereePhone: "+1 (555) 789-0123",
    relationship: "Direct Report",
    status: "completed",
    overallRating: 4.9,
    sentDate: "2026-01-15",
    completedDate: "2026-01-18",
    responses: [
      {
        question: "How long did you work with the candidate and in what capacity?",
        answer: "David was my direct manager for almost 4 years. He helped me grow from a junior to a senior engineer.",
      },
      {
        question: "How would you rate their leadership ability?",
        answer: "Outstanding. David creates an environment where people feel safe to take risks and learn from mistakes. He balances empathy with accountability perfectly.",
        rating: 5,
      },
      {
        question: "What are the candidate's greatest professional strengths?",
        answer: "Exceptional people management, strong technical vision, and an incredible ability to grow and scale engineering teams. He promoted 6 engineers during his tenure.",
      },
      {
        question: "What areas could the candidate improve in?",
        answer: "He could be more assertive in pushing back on unrealistic timelines from product. He sometimes absorbs too much pressure to shield his team.",
      },
      {
        question: "Would you rehire this candidate?",
        answer: "Without a doubt. David is the best manager I have ever had.",
        rating: 5,
      },
    ],
    ratingBreakdown: [
      { category: "Technical Skills", score: 5 },
      { category: "Communication", score: 5 },
      { category: "Teamwork", score: 5 },
      { category: "Leadership", score: 5 },
      { category: "Reliability", score: 4 },
    ],
  },
  {
    id: "ref-008",
    candidateName: "Ana Martinez",
    candidateJobTitle: "Full Stack Developer",
    refereeName: "Karen Fisher",
    refereeEmail: "k.fisher@webdev.com",
    refereePhone: "+1 (555) 890-1234",
    relationship: "Manager",
    status: "pending",
    overallRating: 0,
    sentDate: null,
    completedDate: null,
    responses: [],
    ratingBreakdown: [],
  },
  {
    id: "ref-009",
    candidateName: "James O'Brien",
    candidateJobTitle: "DevOps Engineer",
    refereeName: "Tanya Williams",
    refereeEmail: "t.williams@cloudops.io",
    refereePhone: "+1 (555) 901-2345",
    relationship: "Mentor",
    status: "overdue",
    overallRating: 0,
    sentDate: "2026-01-08",
    completedDate: null,
    responses: [],
    ratingBreakdown: [],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStatusConfig(status: ReferenceStatus) {
  const config = {
    pending: {
      label: "Pending",
      variant: "secondary" as const,
      color: "text-amber-600",
      bg: "bg-amber-50 border-amber-200",
      icon: <Clock className="h-4 w-4 text-amber-500" />,
    },
    sent: {
      label: "Sent",
      variant: "outline" as const,
      color: "text-blue-600",
      bg: "bg-blue-50 border-blue-200",
      icon: <Send className="h-4 w-4 text-blue-500" />,
    },
    completed: {
      label: "Completed",
      variant: "default" as const,
      color: "text-emerald-600",
      bg: "bg-emerald-50 border-emerald-200",
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
    },
    overdue: {
      label: "Overdue",
      variant: "destructive" as const,
      color: "text-red-600",
      bg: "bg-red-50 border-red-200",
      icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
    },
  };
  return config[status];
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "--";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ratingColorClass(rating: number): string {
  if (rating >= 4.5) return "text-emerald-600";
  if (rating >= 3.5) return "text-blue-600";
  if (rating >= 2.5) return "text-amber-600";
  if (rating > 0) return "text-red-600";
  return "text-muted-foreground";
}

// ---------------------------------------------------------------------------
// Star Rating Display
// ---------------------------------------------------------------------------

function StarRating({ rating, max = 5, size = "md" }: { rating: number; max?: number; size?: "sm" | "md" }) {
  const sizeClass = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < Math.floor(rating);
        const partial = !filled && i < rating;
        return (
          <Star
            key={i}
            className={`${sizeClass} ${
              filled
                ? "fill-amber-400 text-amber-400"
                : partial
                  ? "fill-amber-400/50 text-amber-400"
                  : "text-muted-foreground/25"
            }`}
          />
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stats Row
// ---------------------------------------------------------------------------

function StatsRow({ references }: { references: ReferenceRequest[] }) {
  const total = references.length;
  const completed = references.filter((r) => r.status === "completed").length;
  const pending = references.filter(
    (r) => r.status === "pending" || r.status === "sent"
  ).length;
  const completedRefs = references.filter((r) => r.status === "completed");
  const avgRating =
    completedRefs.length > 0
      ? completedRefs.reduce((sum, r) => sum + r.overallRating, 0) / completedRefs.length
      : 0;

  const stats = [
    {
      label: "Total References",
      value: total,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Completed",
      value: completed,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "Pending",
      value: pending,
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-500/10",
    },
    {
      label: "Average Rating",
      value: avgRating > 0 ? `${avgRating.toFixed(1)} / 5` : "-- / 5",
      icon: Star,
      color: "text-violet-600",
      bgColor: "bg-violet-500/10",
      extra:
        avgRating > 0 ? (
          <div className="mt-1">
            <StarRating rating={avgRating} size="sm" />
          </div>
        ) : null,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.4 }}
        >
          <Card className="relative overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  {stat.extra}
                </div>
                <div className={`rounded-xl p-2.5 ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
            <div
              className={`absolute bottom-0 left-0 right-0 h-1 ${stat.bgColor}`}
            />
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reference Detail Dialog
// ---------------------------------------------------------------------------

function ReferenceDetailDialog({
  reference,
  open,
  onOpenChange,
}: {
  reference: ReferenceRequest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const statusConfig = getStatusConfig(reference.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            Reference Details
          </DialogTitle>
          <DialogDescription>
            Reference for {reference.candidateName} ({reference.candidateJobTitle})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Referee Contact Card */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/40 border">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm shrink-0">
              {reference.refereeName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{reference.refereeName}</p>
              <p className="text-xs text-muted-foreground">
                {reference.relationship}
              </p>
              <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3 shrink-0" />
                  {reference.refereeEmail}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3 shrink-0" />
                  {reference.refereePhone}
                </span>
              </div>
            </div>
            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
          </div>

          {/* Rating Breakdown */}
          {reference.ratingBreakdown.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  Rating Breakdown
                </h4>
                <div className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className={`text-sm font-bold ${ratingColorClass(reference.overallRating)}`}>
                    {reference.overallRating.toFixed(1)} / 5.0
                  </span>
                </div>
              </div>
              <div className="grid gap-2">
                {reference.ratingBreakdown.map((item) => (
                  <div
                    key={item.category}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30"
                  >
                    <span className="text-sm text-muted-foreground">
                      {item.category}
                    </span>
                    <div className="flex items-center gap-2">
                      <StarRating rating={item.score} size="sm" />
                      <span className={`text-sm font-semibold min-w-[1.5rem] text-right ${ratingColorClass(item.score)}`}>
                        {item.score}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Q&A Responses */}
          {reference.responses.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                Questionnaire Responses
              </h4>
              <div className="space-y-3">
                {reference.responses.map((qa, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg bg-muted/30 border border-transparent hover:border-muted-foreground/10 transition-colors space-y-2"
                  >
                    <p className="text-sm font-medium">
                      <span className="text-muted-foreground mr-1.5">
                        Q{idx + 1}.
                      </span>
                      {qa.question}
                    </p>
                    <div className="pl-6 space-y-1.5">
                      {qa.rating !== undefined && (
                        <div className="flex items-center gap-2">
                          <StarRating rating={qa.rating} size="sm" />
                          <span className={`text-xs font-medium ${ratingColorClass(qa.rating)}`}>
                            {qa.rating}/5
                          </span>
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {qa.answer}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status-specific messaging */}
          {reference.status !== "completed" && (
            <div
              className={`flex items-start gap-3 p-3.5 rounded-lg border ${statusConfig.bg}`}
            >
              {statusConfig.icon}
              <div>
                <p className={`text-sm font-medium ${statusConfig.color}`}>
                  {reference.status === "overdue"
                    ? "This reference is overdue"
                    : reference.status === "sent"
                      ? "Awaiting response"
                      : "Questionnaire not yet sent"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {reference.status === "overdue"
                    ? "The referee has not responded within the expected timeframe. Consider sending a follow-up reminder."
                    : reference.status === "sent"
                      ? `Questionnaire was sent on ${formatDate(reference.sentDate)}. The referee has not yet submitted their response.`
                      : "This reference request has been created but the questionnaire has not been dispatched to the referee yet."}
                </p>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/30 text-center">
              <p className="text-xs text-muted-foreground">Sent Date</p>
              <p className="text-sm font-semibold mt-0.5">
                {formatDate(reference.sentDate)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 text-center">
              <p className="text-xs text-muted-foreground">Completed Date</p>
              <p className="text-sm font-semibold mt-0.5">
                {formatDate(reference.completedDate)}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {(reference.status === "pending" || reference.status === "overdue" || reference.status === "sent") && (
            <Button
              variant="outline"
              onClick={() => {
                toast.success(`Reminder sent to ${reference.refereeName}`, {
                  description: `A follow-up email has been dispatched to ${reference.refereeEmail}`,
                });
              }}
            >
              <Bell className="mr-1.5 h-4 w-4" />
              Send Reminder
            </Button>
          )}
          {reference.status === "pending" && (
            <Button
              onClick={() => {
                toast.success("Questionnaire sent successfully", {
                  description: `Reference questionnaire sent to ${reference.refereeEmail}`,
                });
              }}
            >
              <Send className="mr-1.5 h-4 w-4" />
              Send Questionnaire
            </Button>
          )}
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Request Reference Dialog
// ---------------------------------------------------------------------------

function RequestReferenceDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [candidateName, setCandidateName] = useState("");
  const [refereeName, setRefereeName] = useState("");
  const [refereeEmail, setRefereeEmail] = useState("");
  const [refereePhone, setRefereePhone] = useState("");
  const [relationship, setRelationship] = useState("");
  const [customQuestions, setCustomQuestions] = useState("");

  const candidates = [
    "Sarah Chen",
    "Marcus Johnson",
    "Emily Zhang",
    "David Kim",
    "Ana Martinez",
    "James O'Brien",
  ];

  function handleSubmit() {
    if (!candidateName || !refereeName || !refereeEmail) {
      toast.error("Please fill in all required fields", {
        description: "Candidate, referee name, and email are required.",
      });
      return;
    }
    toast.success("Reference request created", {
      description: `Request sent for ${candidateName} to ${refereeName}`,
    });
    setCandidateName("");
    setRefereeName("");
    setRefereeEmail("");
    setRefereePhone("");
    setRelationship("");
    setCustomQuestions("");
    onOpenChange(false);
  }

  function handleReset() {
    setCandidateName("");
    setRefereeName("");
    setRefereeEmail("");
    setRefereePhone("");
    setRelationship("");
    setCustomQuestions("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Request Reference
          </DialogTitle>
          <DialogDescription>
            Send a reference check request to a referee for a candidate.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Candidate <span className="text-red-500">*</span>
            </label>
            <Select value={candidateName} onValueChange={setCandidateName}>
              <SelectTrigger>
                <SelectValue placeholder="Select a candidate" />
              </SelectTrigger>
              <SelectContent>
                {candidates.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Referee Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Full name"
                value={refereeName}
                onChange={(e) => setRefereeName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Relationship</label>
              <Select value={relationship} onValueChange={setRelationship}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Colleague">Colleague</SelectItem>
                  <SelectItem value="Direct Report">Direct Report</SelectItem>
                  <SelectItem value="Skip-Level Manager">Skip-Level Manager</SelectItem>
                  <SelectItem value="Client">Client</SelectItem>
                  <SelectItem value="Mentor">Mentor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Referee Email <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              placeholder="referee@company.com"
              value={refereeEmail}
              onChange={(e) => setRefereeEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Referee Phone</label>
            <Input
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={refereePhone}
              onChange={(e) => setRefereePhone(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Custom Questions{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </label>
            <Textarea
              placeholder="Add any additional questions you would like to include in the reference questionnaire, one per line..."
              value={customQuestions}
              onChange={(e) => setCustomQuestions(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Standard questions will be included automatically. Add role-specific questions above.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={handleReset} className="mr-auto">
            <RefreshCw className="mr-1.5 h-4 w-4" />
            Reset
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            <Send className="mr-1.5 h-4 w-4" />
            Send Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Reference Card
// ---------------------------------------------------------------------------

function ReferenceCard({
  reference,
  index,
  onViewDetail,
}: {
  reference: ReferenceRequest;
  index: number;
  onViewDetail: (ref: ReferenceRequest) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const statusConfig = getStatusConfig(reference.status);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      layout
    >
      <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
        <div className="px-5 py-4">
          {/* Top section */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5 min-w-0 flex-1">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs shrink-0 mt-0.5">
                {reference.refereeName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold truncate">
                    {reference.refereeName}
                  </h3>
                  <Badge
                    variant={statusConfig.variant}
                    className="text-[10px] shrink-0"
                  >
                    {statusConfig.icon}
                    <span className="ml-1">{statusConfig.label}</span>
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Briefcase className="h-3 w-3 shrink-0" />
                    {reference.relationship}
                  </span>
                  <span className="text-muted-foreground/40 text-xs">|</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3 shrink-0" />
                    {reference.refereeEmail}
                  </span>
                  <span className="text-muted-foreground/40 text-xs hidden sm:inline">|</span>
                  <span className="text-xs text-muted-foreground items-center gap-1 hidden sm:flex">
                    <Phone className="h-3 w-3 shrink-0" />
                    {reference.refereePhone}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span className="text-xs font-medium text-foreground/80">
                    For: {reference.candidateName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {reference.candidateJobTitle}
                  </span>
                </div>
              </div>
            </div>

            {/* Rating + Actions */}
            <div className="flex flex-col items-end gap-2 shrink-0">
              {reference.overallRating > 0 && (
                <div className="flex items-center gap-1.5">
                  <StarRating rating={reference.overallRating} size="sm" />
                  <span
                    className={`text-sm font-bold ${ratingColorClass(reference.overallRating)}`}
                  >
                    {reference.overallRating.toFixed(1)}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                {(reference.status === "pending" || reference.status === "overdue" || reference.status === "sent") && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs px-2"
                    onClick={() => {
                      toast.success(`Reminder sent to ${reference.refereeName}`, {
                        description: "A follow-up notification has been dispatched.",
                      });
                    }}
                  >
                    <Bell className="mr-1 h-3 w-3" />
                    Remind
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => onViewDetail(reference)}
                >
                  <Eye className="mr-1 h-3 w-3" />
                  Detail
                </Button>
              </div>
            </div>
          </div>

          {/* Dates row */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-dashed">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              Sent: {formatDate(reference.sentDate)}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Completed: {formatDate(reference.completedDate)}
            </span>

            {reference.responses.length > 0 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="ml-auto flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >
                <MessageSquare className="h-3 w-3" />
                {expanded ? "Hide" : "Show"} Responses ({reference.responses.length})
                {expanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Expandable Responses */}
        <AnimatePresence>
          {expanded && reference.responses.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-4 pt-1 space-y-2.5 border-t bg-muted/20">
                {reference.responses.map((qa, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-background space-y-1"
                  >
                    <p className="text-xs font-medium text-muted-foreground">
                      Q{idx + 1}. {qa.question}
                    </p>
                    <div className="flex items-start gap-2">
                      {qa.rating !== undefined && (
                        <div className="shrink-0 mt-0.5">
                          <StarRating rating={qa.rating} size="sm" />
                        </div>
                      )}
                      <p className="text-sm text-foreground/80 leading-relaxed">
                        {qa.answer}
                      </p>
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
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function ReferencesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailRef, setDetailRef] = useState<ReferenceRequest | null>(null);

  const filteredReferences = useMemo(() => {
    let result = mockReferences;

    // Tab filter
    if (activeTab === "pending") {
      result = result.filter(
        (r) => r.status === "pending" || r.status === "sent"
      );
    } else if (activeTab === "completed") {
      result = result.filter((r) => r.status === "completed");
    } else if (activeTab === "overdue") {
      result = result.filter((r) => r.status === "overdue");
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.candidateName.toLowerCase().includes(q) ||
          r.candidateJobTitle.toLowerCase().includes(q) ||
          r.refereeName.toLowerCase().includes(q) ||
          r.refereeEmail.toLowerCase().includes(q) ||
          r.relationship.toLowerCase().includes(q)
      );
    }

    return result;
  }, [activeTab, searchQuery]);

  const tabCounts = useMemo(() => {
    const all = mockReferences.length;
    const pending = mockReferences.filter(
      (r) => r.status === "pending" || r.status === "sent"
    ).length;
    const completed = mockReferences.filter(
      (r) => r.status === "completed"
    ).length;
    const overdue = mockReferences.filter(
      (r) => r.status === "overdue"
    ).length;
    return { all, pending, completed, overdue };
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              Reference Checks
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage and track reference check requests across all candidates
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Request Reference
          </Button>
        </div>
      </motion.div>

      {/* Stats Row */}
      <StatsRow references={mockReferences} />

      {/* Search + Tabs */}
      <div className="space-y-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by candidate, referee, or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="all" className="gap-1.5">
              <Users className="h-4 w-4" />
              All
              <Badge variant="secondary" className="ml-1 text-[10px] h-5 px-1.5">
                {tabCounts.all}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-1.5">
              <Clock className="h-4 w-4" />
              Pending
              <Badge variant="secondary" className="ml-1 text-[10px] h-5 px-1.5">
                {tabCounts.pending}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              Completed
              <Badge variant="secondary" className="ml-1 text-[10px] h-5 px-1.5">
                {tabCounts.completed}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="overdue" className="gap-1.5">
              <AlertTriangle className="h-4 w-4" />
              Overdue
              <Badge variant="secondary" className="ml-1 text-[10px] h-5 px-1.5">
                {tabCounts.overdue}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {filteredReferences.map((ref, idx) => (
                  <ReferenceCard
                    key={ref.id}
                    reference={ref}
                    index={idx}
                    onViewDetail={setDetailRef}
                  />
                ))}
              </AnimatePresence>

              {filteredReferences.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardContent className="py-16">
                      <div className="flex flex-col items-center text-center">
                        <div className="rounded-full bg-muted p-4 mb-4">
                          <UserCheck className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-1">
                          No references found
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-md">
                          {searchQuery
                            ? `No reference requests match "${searchQuery}". Try adjusting your search or clearing filters.`
                            : "There are no reference requests in this category yet. Create a new request to get started."}
                        </p>
                        {!searchQuery && (
                          <Button
                            className="mt-4"
                            onClick={() => setCreateDialogOpen(true)}
                          >
                            <Plus className="mr-1.5 h-4 w-4" />
                            Request Reference
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Request Reference Dialog */}
      <RequestReferenceDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {/* Detail Dialog */}
      {detailRef && (
        <ReferenceDetailDialog
          reference={detailRef}
          open={!!detailRef}
          onOpenChange={(open) => {
            if (!open) setDetailRef(null);
          }}
        />
      )}
    </div>
  );
}
