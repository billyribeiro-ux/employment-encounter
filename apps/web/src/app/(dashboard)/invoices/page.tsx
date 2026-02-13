"use client";

import { useState } from "react";
import {
  FileSignature,
  Plus,
  Search,
  Send,
  Copy,
  Edit,
  Trash2,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Loader2,
  FileText,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface OfferTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  usageCount: number;
  lastUsed: string | null;
  createdAt: string;
  variables: string[];
}

const SAMPLE_TEMPLATES: OfferTemplate[] = [
  {
    id: "1",
    name: "Standard Full-Time Offer",
    description: "Standard offer letter for full-time employees with benefits",
    content: "Dear {{candidate_name}},\n\nWe are pleased to offer you the position of {{job_title}} at {{company_name}}...",
    usageCount: 45,
    lastUsed: "2026-02-10",
    createdAt: "2025-06-01",
    variables: ["candidate_name", "job_title", "company_name", "salary", "start_date", "manager_name"],
  },
  {
    id: "2",
    name: "Executive Offer",
    description: "Executive-level offer with equity and bonus details",
    content: "Dear {{candidate_name}},\n\nOn behalf of the Board of Directors of {{company_name}}...",
    usageCount: 8,
    lastUsed: "2026-01-20",
    createdAt: "2025-08-15",
    variables: ["candidate_name", "job_title", "company_name", "base_salary", "equity_grant", "bonus_target", "start_date"],
  },
  {
    id: "3",
    name: "Contract/Freelance Offer",
    description: "Offer letter for contract or freelance engagements",
    content: "Dear {{candidate_name}},\n\nWe would like to engage your services as {{job_title}}...",
    usageCount: 22,
    lastUsed: "2026-02-05",
    createdAt: "2025-07-10",
    variables: ["candidate_name", "job_title", "hourly_rate", "contract_duration", "start_date"],
  },
  {
    id: "4",
    name: "Internship Offer",
    description: "Offer letter for summer and semester internships",
    content: "Dear {{candidate_name}},\n\nCongratulations! We are excited to offer you an internship...",
    usageCount: 15,
    lastUsed: "2026-01-30",
    createdAt: "2025-09-01",
    variables: ["candidate_name", "department", "stipend", "start_date", "end_date", "mentor_name"],
  },
  {
    id: "5",
    name: "Remote Position Offer",
    description: "Offer letter with remote work policy and equipment provisions",
    content: "Dear {{candidate_name}},\n\nWe are thrilled to offer you a fully remote position as {{job_title}}...",
    usageCount: 30,
    lastUsed: "2026-02-12",
    createdAt: "2025-10-01",
    variables: ["candidate_name", "job_title", "salary", "equipment_budget", "start_date"],
  },
];

interface SentOffer {
  id: string;
  templateName: string;
  candidateName: string;
  jobTitle: string;
  sentAt: string;
  status: "pending" | "accepted" | "declined" | "expired";
}

const SAMPLE_SENT: SentOffer[] = [
  { id: "s1", templateName: "Standard Full-Time Offer", candidateName: "Sarah Chen", jobTitle: "Senior Engineer", sentAt: "2026-02-10", status: "accepted" },
  { id: "s2", templateName: "Remote Position Offer", candidateName: "Marcus Johnson", jobTitle: "Data Scientist", sentAt: "2026-02-12", status: "pending" },
  { id: "s3", templateName: "Executive Offer", candidateName: "Emily Rodriguez", jobTitle: "VP of Design", sentAt: "2026-01-20", status: "pending" },
  { id: "s4", templateName: "Contract/Freelance Offer", candidateName: "James Park", jobTitle: "UX Consultant", sentAt: "2026-02-05", status: "declined" },
  { id: "s5", templateName: "Internship Offer", candidateName: "Alex Kim", jobTitle: "Engineering Intern", sentAt: "2026-01-30", status: "accepted" },
];

function statusBadge(status: SentOffer["status"]) {
  switch (status) {
    case "accepted": return <Badge className="bg-green-600 text-xs"><CheckCircle2 className="mr-1 h-3 w-3" />Accepted</Badge>;
    case "pending": return <Badge variant="secondary" className="text-xs"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
    case "declined": return <Badge variant="destructive" className="text-xs"><XCircle className="mr-1 h-3 w-3" />Declined</Badge>;
    case "expired": return <Badge variant="outline" className="text-xs">Expired</Badge>;
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function OfferLetterTemplatesPage() {
  const [templates] = useState(SAMPLE_TEMPLATES);
  const [sentOffers] = useState(SAMPLE_SENT);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewTemplate, setPreviewTemplate] = useState<OfferTemplate | null>(null);

  const filtered = templates.filter(
    t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
         t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: sentOffers.length,
    accepted: sentOffers.filter(o => o.status === "accepted").length,
    pending: sentOffers.filter(o => o.status === "pending").length,
    declined: sentOffers.filter(o => o.status === "declined").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Offer Letter Templates</h1>
          <p className="text-muted-foreground">
            Create and manage reusable offer letter templates
          </p>
        </div>
        <Button>
          <Plus className="mr-1.5 h-4 w-4" />
          New Template
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Templates</p>
            <p className="text-2xl font-bold">{templates.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Offers Sent</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Accepted</p>
            <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Templates Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((template, idx) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-2">
                  <div className="rounded-lg bg-muted p-2">
                    <FileSignature className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Used {template.usageCount}x
                  </Badge>
                </div>
                <h3 className="mt-3 font-semibold">{template.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {template.description}
                </p>

                <div className="mt-3 flex flex-wrap gap-1">
                  {template.variables.slice(0, 4).map(v => (
                    <Badge key={v} variant="secondary" className="text-xs font-mono">
                      {`{{${v}}}`}
                    </Badge>
                  ))}
                  {template.variables.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{template.variables.length - 4} more
                    </Badge>
                  )}
                </div>

                <Separator className="my-3" />

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setPreviewTemplate(template)}
                  >
                    <Eye className="mr-1 h-3.5 w-3.5" />
                    Preview
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Sent Offers */}
      <Card>
        <CardHeader>
          <CardTitle>Recently Sent Offers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sentOffers.map((offer) => (
                <TableRow key={offer.id}>
                  <TableCell className="font-medium">{offer.candidateName}</TableCell>
                  <TableCell>{offer.jobTitle}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{offer.templateName}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(offer.sentAt)}</TableCell>
                  <TableCell>{statusBadge(offer.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Download className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name}</DialogTitle>
            <DialogDescription>{previewTemplate?.description}</DialogDescription>
          </DialogHeader>
          <div className="rounded-lg bg-muted/50 p-4">
            <pre className="whitespace-pre-wrap text-sm font-mono">
              {previewTemplate?.content}
            </pre>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Available Variables:</p>
            <div className="flex flex-wrap gap-1">
              {previewTemplate?.variables.map(v => (
                <Badge key={v} variant="outline" className="text-xs font-mono">
                  {`{{${v}}}`}
                </Badge>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewTemplate(null)}>Close</Button>
            <Button>
              <Send className="mr-1.5 h-4 w-4" />
              Use Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
