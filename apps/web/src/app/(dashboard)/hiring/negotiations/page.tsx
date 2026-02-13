"use client";

import { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  Plus,
  Edit,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Handshake,
  FileSignature,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

interface NegotiationRound {
  round: number;
  baseSalary: number;
  equity: string;
  bonus: string;
  benefits: string;
  notes: string;
  proposedBy: "company" | "candidate";
  date: string;
}

interface Negotiation {
  id: string;
  candidateName: string;
  jobTitle: string;
  status: "initial_offer" | "counter_offer" | "final_offer" | "accepted" | "declined";
  rounds: NegotiationRound[];
  daysActive: number;
  deadline: string;
}

const NEGOTIATIONS: Negotiation[] = [
  {
    id: "1",
    candidateName: "Sarah Chen",
    jobTitle: "Senior Software Engineer",
    status: "counter_offer",
    daysActive: 5,
    deadline: "Feb 20, 2026",
    rounds: [
      { round: 1, baseSalary: 155000, equity: "8,000 options", bonus: "15% target", benefits: "Standard", notes: "Initial offer based on L5 band", proposedBy: "company", date: "Feb 8" },
      { round: 2, baseSalary: 170000, equity: "12,000 options", bonus: "15% target", benefits: "Standard + signing bonus", notes: "Candidate countered citing competing offer from Meta", proposedBy: "candidate", date: "Feb 11" },
    ],
  },
  {
    id: "2",
    candidateName: "Marcus Johnson",
    jobTitle: "Data Scientist",
    status: "final_offer",
    daysActive: 8,
    deadline: "Feb 18, 2026",
    rounds: [
      { round: 1, baseSalary: 140000, equity: "5,000 options", bonus: "10% target", benefits: "Standard", notes: "Initial offer", proposedBy: "company", date: "Feb 5" },
      { round: 2, baseSalary: 155000, equity: "8,000 options", bonus: "12% target", benefits: "Standard", notes: "Requested higher base due to NYC cost of living", proposedBy: "candidate", date: "Feb 8" },
      { round: 3, baseSalary: 150000, equity: "10,000 options", bonus: "12% target", benefits: "Standard + remote stipend", notes: "Final offer with increased equity instead of full base increase", proposedBy: "company", date: "Feb 12" },
    ],
  },
  {
    id: "3",
    candidateName: "Emily Rodriguez",
    jobTitle: "VP of Design",
    status: "initial_offer",
    daysActive: 1,
    deadline: "Feb 25, 2026",
    rounds: [
      { round: 1, baseSalary: 220000, equity: "25,000 options", bonus: "20% target", benefits: "Executive package", notes: "Executive offer with signing bonus of $30K", proposedBy: "company", date: "Feb 12" },
    ],
  },
  {
    id: "4",
    candidateName: "James Park",
    jobTitle: "DevOps Engineer",
    status: "accepted",
    daysActive: 3,
    deadline: "Feb 15, 2026",
    rounds: [
      { round: 1, baseSalary: 145000, equity: "6,000 options", bonus: "10% target", benefits: "Standard", notes: "Initial offer", proposedBy: "company", date: "Feb 7" },
      { round: 2, baseSalary: 150000, equity: "6,000 options", bonus: "10% target", benefits: "Standard + home office", notes: "Accepted with minor base adjustment", proposedBy: "company", date: "Feb 10" },
    ],
  },
  {
    id: "5",
    candidateName: "Lisa Wang",
    jobTitle: "Frontend Engineer",
    status: "declined",
    daysActive: 7,
    deadline: "Feb 12, 2026",
    rounds: [
      { round: 1, baseSalary: 130000, equity: "4,000 options", bonus: "10% target", benefits: "Standard", notes: "Initial offer", proposedBy: "company", date: "Feb 3" },
      { round: 2, baseSalary: 150000, equity: "8,000 options", bonus: "15% target", benefits: "Full remote", notes: "Counter well above our band", proposedBy: "candidate", date: "Feb 7" },
    ],
  },
];

function statusConfig(status: Negotiation["status"]) {
  switch (status) {
    case "initial_offer": return { label: "Initial Offer", color: "bg-blue-600", icon: FileSignature };
    case "counter_offer": return { label: "Counter Offer", color: "bg-amber-600", icon: MessageSquare };
    case "final_offer": return { label: "Final Offer", color: "bg-purple-600", icon: AlertCircle };
    case "accepted": return { label: "Accepted", color: "bg-green-600", icon: CheckCircle2 };
    case "declined": return { label: "Declined", color: "bg-red-600", icon: XCircle };
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

export default function NegotiationsPage() {
  const [negotiations] = useState(NEGOTIATIONS);
  const [selectedNeg, setSelectedNeg] = useState<Negotiation | null>(null);
  const [counterDialogOpen, setCounterDialogOpen] = useState(false);

  const active = negotiations.filter(n => !["accepted", "declined"].includes(n.status));
  const resolved = negotiations.filter(n => ["accepted", "declined"].includes(n.status));
  const acceptRate = Math.round((negotiations.filter(n => n.status === "accepted").length / negotiations.length) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Offer Negotiations</h1>
          <p className="text-muted-foreground">
            Track and manage compensation negotiations with candidates
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Negotiations</p>
                <p className="text-2xl font-bold">{active.length}</p>
              </div>
              <Handshake className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Acceptance Rate</p>
            <p className="text-2xl font-bold text-green-600">{acceptRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Avg Rounds</p>
            <p className="text-2xl font-bold">{(negotiations.reduce((sum, n) => sum + n.rounds.length, 0) / negotiations.length).toFixed(1)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Avg Days to Close</p>
            <p className="text-2xl font-bold">{Math.round(negotiations.reduce((sum, n) => sum + n.daysActive, 0) / negotiations.length)}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
          <TabsTrigger value="resolved">Resolved ({resolved.length})</TabsTrigger>
        </TabsList>

        {[{ key: "active", items: active }, { key: "resolved", items: resolved }].map(({ key, items }) => (
          <TabsContent key={key} value={key} className="space-y-3">
            {items.map((neg, idx) => {
              const config = statusConfig(neg.status);
              const StatusIcon = config.icon;
              const lastRound = neg.rounds[neg.rounds.length - 1];
              const firstRound = neg.rounds[0];
              const salaryChange = lastRound.baseSalary - firstRound.baseSalary;

              return (
                <motion.div
                  key={neg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedNeg(neg)}>
                    <CardContent className="pt-5 pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                            {neg.candidateName.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{neg.candidateName}</h3>
                              <Badge className={`text-xs text-white ${config.color}`}>
                                <StatusIcon className="mr-1 h-3 w-3" />
                                {config.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{neg.jobTitle}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Current Offer</p>
                            <p className="font-bold">{formatCurrency(lastRound.baseSalary)}</p>
                          </div>
                          {salaryChange !== 0 && (
                            <div className={`flex items-center gap-0.5 text-xs ${salaryChange > 0 ? "text-amber-600" : "text-green-600"}`}>
                              {salaryChange > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                              {salaryChange > 0 ? "+" : ""}{formatCurrency(salaryChange)}
                            </div>
                          )}
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Rounds</p>
                            <p className="font-medium">{neg.rounds.length}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Deadline</p>
                            <p className="font-medium">{neg.deadline}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </TabsContent>
        ))}
      </Tabs>

      {/* Negotiation Detail Dialog */}
      <Dialog open={!!selectedNeg} onOpenChange={() => setSelectedNeg(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Negotiation: {selectedNeg?.candidateName}</DialogTitle>
            <DialogDescription>{selectedNeg?.jobTitle}</DialogDescription>
          </DialogHeader>

          {selectedNeg && (
            <div className="space-y-4">
              {/* Timeline */}
              <div className="space-y-4">
                {selectedNeg.rounds.map((round, idx) => (
                  <div key={idx} className="relative pl-8">
                    <div className={`absolute left-0 top-1 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${round.proposedBy === "company" ? "bg-primary" : "bg-amber-500"}`}>
                      {round.round}
                    </div>
                    {idx < selectedNeg.rounds.length - 1 && (
                      <div className="absolute left-3 top-7 h-full w-px bg-border" />
                    )}
                    <Card>
                      <CardContent className="pt-4 pb-3">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant={round.proposedBy === "company" ? "default" : "secondary"}>
                            {round.proposedBy === "company" ? "Company Offer" : "Candidate Counter"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{round.date}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Base Salary:</span>{" "}
                            <span className="font-semibold">{formatCurrency(round.baseSalary)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Equity:</span>{" "}
                            <span className="font-medium">{round.equity}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Bonus:</span>{" "}
                            <span className="font-medium">{round.bonus}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Benefits:</span>{" "}
                            <span className="font-medium">{round.benefits}</span>
                          </div>
                        </div>
                        {round.notes && (
                          <p className="mt-2 text-xs text-muted-foreground italic">{round.notes}</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>

              {!["accepted", "declined"].includes(selectedNeg.status) && (
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => { setSelectedNeg(null); toast.success("Counter offer sent"); }}>
                    <MessageSquare className="mr-1.5 h-4 w-4" />
                    Send Counter
                  </Button>
                  <Button variant="outline" onClick={() => { setSelectedNeg(null); toast.success("Offer marked as accepted"); }}>
                    <CheckCircle2 className="mr-1.5 h-4 w-4" />
                    Mark Accepted
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
