"use client";

import React, { useState } from "react";
import {
  Shield,
  Lock,
  Trash2,
  FileText,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Download,
  UserX,
  Bell,
  Settings,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────────────────────

type ConsentType =
  | "data_processing"
  | "marketing"
  | "analytics"
  | "third_party_sharing";
type ConsentStatus = "granted" | "revoked";

interface ConsentRecord {
  id: string;
  candidateEmail: string;
  candidateName: string;
  consentType: ConsentType;
  status: ConsentStatus;
  grantedAt: string;
  revokedAt: string | null;
  ipAddress: string;
  userAgent: string;
}

type DeletionStatus = "pending" | "processing" | "completed" | "rejected";
type RequestType = "full_deletion" | "partial_deletion" | "data_export";

interface DeletionRequest {
  id: string;
  candidateEmail: string;
  candidateName: string;
  requestType: RequestType;
  status: DeletionStatus;
  requestedAt: string;
  deadline: string;
  completedAt: string | null;
  reason: string;
  affectedSystems: string[];
}

interface RetentionPolicy {
  id: string;
  dataType: string;
  description: string;
  retentionDays: number;
  autoDelete: boolean;
  recordCount: number;
  lastReviewedAt: string;
}

type AuditActionType =
  | "consent_granted"
  | "consent_revoked"
  | "data_exported"
  | "records_deleted"
  | "policy_updated"
  | "access_logged"
  | "breach_reported"
  | "retention_enforced"
  | "request_processed"
  | "settings_changed";

interface AuditEntry {
  id: string;
  actionType: AuditActionType;
  description: string;
  performedBy: string;
  performedAt: string;
  targetEntity: string;
  metadata: string;
}

// ─── Compliance Score Breakdown ─────────────────────────────────────────────────

interface ComplianceArea {
  label: string;
  score: number;
  maxScore: number;
}

const COMPLIANCE_AREAS: ComplianceArea[] = [
  { label: "Consent Management", score: 98, maxScore: 100 },
  { label: "Data Retention", score: 92, maxScore: 100 },
  { label: "Right to Erasure", score: 88, maxScore: 100 },
  { label: "Data Portability", score: 96, maxScore: 100 },
  { label: "Breach Notification", score: 100, maxScore: 100 },
  { label: "Privacy by Design", score: 90, maxScore: 100 },
];

const OVERALL_COMPLIANCE_SCORE = 94;

// ─── Mock Data: Consent Records ─────────────────────────────────────────────────

const CONSENT_RECORDS: ConsentRecord[] = [
  {
    id: "cr-001",
    candidateEmail: "emma.wilson@protonmail.com",
    candidateName: "Emma Wilson",
    consentType: "data_processing",
    status: "granted",
    grantedAt: "2026-01-15T09:23:00Z",
    revokedAt: null,
    ipAddress: "192.168.1.45",
    userAgent: "Mozilla/5.0 Chrome/120",
  },
  {
    id: "cr-002",
    candidateEmail: "liam.chen@gmail.com",
    candidateName: "Liam Chen",
    consentType: "marketing",
    status: "granted",
    grantedAt: "2026-01-14T14:11:00Z",
    revokedAt: null,
    ipAddress: "10.0.0.78",
    userAgent: "Mozilla/5.0 Safari/17",
  },
  {
    id: "cr-003",
    candidateEmail: "sofia.martinez@outlook.com",
    candidateName: "Sofia Martinez",
    consentType: "analytics",
    status: "revoked",
    grantedAt: "2025-11-20T10:45:00Z",
    revokedAt: "2026-01-10T16:30:00Z",
    ipAddress: "172.16.0.12",
    userAgent: "Mozilla/5.0 Firefox/121",
  },
  {
    id: "cr-004",
    candidateEmail: "noah.patel@yahoo.com",
    candidateName: "Noah Patel",
    consentType: "third_party_sharing",
    status: "granted",
    grantedAt: "2026-01-12T08:05:00Z",
    revokedAt: null,
    ipAddress: "192.168.2.91",
    userAgent: "Mozilla/5.0 Chrome/120",
  },
  {
    id: "cr-005",
    candidateEmail: "ava.johnson@icloud.com",
    candidateName: "Ava Johnson",
    consentType: "data_processing",
    status: "granted",
    grantedAt: "2026-01-11T11:30:00Z",
    revokedAt: null,
    ipAddress: "10.1.0.55",
    userAgent: "Mozilla/5.0 Safari/17",
  },
  {
    id: "cr-006",
    candidateEmail: "oliver.wright@tutanota.com",
    candidateName: "Oliver Wright",
    consentType: "marketing",
    status: "revoked",
    grantedAt: "2025-12-05T13:20:00Z",
    revokedAt: "2026-01-08T09:15:00Z",
    ipAddress: "172.16.1.44",
    userAgent: "Mozilla/5.0 Chrome/120",
  },
  {
    id: "cr-007",
    candidateEmail: "mia.kumar@protonmail.com",
    candidateName: "Mia Kumar",
    consentType: "analytics",
    status: "granted",
    grantedAt: "2026-01-09T15:50:00Z",
    revokedAt: null,
    ipAddress: "192.168.3.22",
    userAgent: "Mozilla/5.0 Edge/120",
  },
  {
    id: "cr-008",
    candidateEmail: "ethan.garcia@gmail.com",
    candidateName: "Ethan Garcia",
    consentType: "data_processing",
    status: "granted",
    grantedAt: "2026-01-13T07:40:00Z",
    revokedAt: null,
    ipAddress: "10.2.0.17",
    userAgent: "Mozilla/5.0 Chrome/120",
  },
  {
    id: "cr-009",
    candidateEmail: "isabella.lee@outlook.com",
    candidateName: "Isabella Lee",
    consentType: "third_party_sharing",
    status: "revoked",
    grantedAt: "2025-10-18T12:00:00Z",
    revokedAt: "2026-01-05T10:10:00Z",
    ipAddress: "192.168.4.63",
    userAgent: "Mozilla/5.0 Firefox/121",
  },
  {
    id: "cr-010",
    candidateEmail: "james.oconnor@gmail.com",
    candidateName: "James O'Connor",
    consentType: "marketing",
    status: "granted",
    grantedAt: "2026-01-07T16:25:00Z",
    revokedAt: null,
    ipAddress: "172.16.2.88",
    userAgent: "Mozilla/5.0 Safari/17",
  },
];

// ─── Mock Data: Deletion Requests ───────────────────────────────────────────────

const DELETION_REQUESTS: DeletionRequest[] = [
  {
    id: "dr-001",
    candidateEmail: "sofia.martinez@outlook.com",
    candidateName: "Sofia Martinez",
    requestType: "full_deletion",
    status: "pending",
    requestedAt: "2026-02-12T08:00:00Z",
    deadline: "2026-02-15T08:00:00Z",
    completedAt: null,
    reason: "No longer seeking employment",
    affectedSystems: ["ATS", "Email Platform", "Assessment Portal", "CRM"],
  },
  {
    id: "dr-002",
    candidateEmail: "oliver.wright@tutanota.com",
    candidateName: "Oliver Wright",
    requestType: "data_export",
    status: "processing",
    requestedAt: "2026-02-11T14:30:00Z",
    deadline: "2026-02-14T14:30:00Z",
    completedAt: null,
    reason: "GDPR Article 20 - Data portability request",
    affectedSystems: ["ATS", "Assessment Portal"],
  },
  {
    id: "dr-003",
    candidateEmail: "isabella.lee@outlook.com",
    candidateName: "Isabella Lee",
    requestType: "full_deletion",
    status: "completed",
    requestedAt: "2026-02-05T10:00:00Z",
    deadline: "2026-02-08T10:00:00Z",
    completedAt: "2026-02-07T16:45:00Z",
    reason: "Right to be forgotten - GDPR Article 17",
    affectedSystems: ["ATS", "Email Platform", "CRM"],
  },
  {
    id: "dr-004",
    candidateEmail: "rachel.nguyen@gmail.com",
    candidateName: "Rachel Nguyen",
    requestType: "partial_deletion",
    status: "rejected",
    requestedAt: "2026-02-03T09:15:00Z",
    deadline: "2026-02-06T09:15:00Z",
    completedAt: null,
    reason: "Remove assessment data only",
    affectedSystems: ["Assessment Portal"],
  },
  {
    id: "dr-005",
    candidateEmail: "marcus.jones@protonmail.com",
    candidateName: "Marcus Jones",
    requestType: "full_deletion",
    status: "pending",
    requestedAt: "2026-02-12T16:00:00Z",
    deadline: "2026-02-15T16:00:00Z",
    completedAt: null,
    reason: "Withdrawing all consents and requesting erasure",
    affectedSystems: ["ATS", "Email Platform", "Assessment Portal", "CRM", "Background Check"],
  },
];

// ─── Mock Data: Retention Policies ──────────────────────────────────────────────

const RETENTION_POLICIES: RetentionPolicy[] = [
  {
    id: "rp-001",
    dataType: "candidate_data",
    description: "Personal information, contact details, and profile data",
    retentionDays: 365,
    autoDelete: true,
    recordCount: 2847,
    lastReviewedAt: "2026-01-15T10:00:00Z",
  },
  {
    id: "rp-002",
    dataType: "application_data",
    description: "Job applications, cover letters, and submission metadata",
    retentionDays: 730,
    autoDelete: true,
    recordCount: 5621,
    lastReviewedAt: "2026-01-15T10:00:00Z",
  },
  {
    id: "rp-003",
    dataType: "interview_records",
    description: "Interview notes, scorecards, and feedback",
    retentionDays: 545,
    autoDelete: false,
    recordCount: 1893,
    lastReviewedAt: "2026-01-10T14:30:00Z",
  },
  {
    id: "rp-004",
    dataType: "assessment_results",
    description: "Skill assessments, test scores, and evaluation data",
    retentionDays: 365,
    autoDelete: true,
    recordCount: 3214,
    lastReviewedAt: "2026-01-12T09:00:00Z",
  },
  {
    id: "rp-005",
    dataType: "communication_logs",
    description: "Email correspondence, scheduling, and messaging history",
    retentionDays: 180,
    autoDelete: true,
    recordCount: 12463,
    lastReviewedAt: "2026-01-14T11:00:00Z",
  },
  {
    id: "rp-006",
    dataType: "background_checks",
    description: "Verification results and compliance screening records",
    retentionDays: 90,
    autoDelete: true,
    recordCount: 876,
    lastReviewedAt: "2026-01-08T16:00:00Z",
  },
];

// ─── Mock Data: Audit Log ───────────────────────────────────────────────────────

const AUDIT_LOG: AuditEntry[] = [
  {
    id: "al-001",
    actionType: "consent_granted",
    description: "Data processing consent granted via application form",
    performedBy: "emma.wilson@protonmail.com",
    performedAt: "2026-02-13T09:23:00Z",
    targetEntity: "Emma Wilson",
    metadata: "IP: 192.168.1.45 | Consent version: v3.2",
  },
  {
    id: "al-002",
    actionType: "data_exported",
    description: "Candidate data package exported for portability request",
    performedBy: "Sarah Miller (DPO)",
    performedAt: "2026-02-12T15:10:00Z",
    targetEntity: "Oliver Wright",
    metadata: "Format: JSON | Size: 2.4MB | Systems: ATS, Assessment Portal",
  },
  {
    id: "al-003",
    actionType: "records_deleted",
    description: "Full candidate record permanently deleted across all systems",
    performedBy: "System (Auto)",
    performedAt: "2026-02-07T16:45:00Z",
    targetEntity: "Isabella Lee",
    metadata: "Deletion request DR-003 | Systems: ATS, Email Platform, CRM",
  },
  {
    id: "al-004",
    actionType: "consent_revoked",
    description: "Third-party sharing consent withdrawn by candidate",
    performedBy: "isabella.lee@outlook.com",
    performedAt: "2026-02-05T10:10:00Z",
    targetEntity: "Isabella Lee",
    metadata: "Consent type: third_party_sharing | Originally granted: Oct 18, 2025",
  },
  {
    id: "al-005",
    actionType: "policy_updated",
    description: "Background check retention period reduced from 180 to 90 days",
    performedBy: "Sarah Miller (DPO)",
    performedAt: "2026-02-04T11:30:00Z",
    targetEntity: "Retention Policy: background_checks",
    metadata: "Previous: 180 days | New: 90 days | Auto-delete: enabled",
  },
  {
    id: "al-006",
    actionType: "access_logged",
    description: "Bulk candidate data accessed for quarterly compliance audit",
    performedBy: "David Park (Compliance)",
    performedAt: "2026-02-03T14:00:00Z",
    targetEntity: "Candidate Database",
    metadata: "Records accessed: 2847 | Purpose: Q1 2026 GDPR audit",
  },
  {
    id: "al-007",
    actionType: "retention_enforced",
    description: "Automated retention purge completed for expired communication logs",
    performedBy: "System (Auto)",
    performedAt: "2026-02-01T00:05:00Z",
    targetEntity: "communication_logs",
    metadata: "Records purged: 342 | Policy: 180-day retention",
  },
  {
    id: "al-008",
    actionType: "consent_granted",
    description: "Marketing consent granted via talent pool opt-in",
    performedBy: "james.oconnor@gmail.com",
    performedAt: "2026-01-30T16:25:00Z",
    targetEntity: "James O'Connor",
    metadata: "IP: 172.16.2.88 | Channel: Career portal",
  },
  {
    id: "al-009",
    actionType: "request_processed",
    description: "Partial deletion request rejected - active legal hold in effect",
    performedBy: "Legal Team",
    performedAt: "2026-01-28T09:45:00Z",
    targetEntity: "Rachel Nguyen",
    metadata: "Request: DR-004 | Reason: Active employment contract dispute",
  },
  {
    id: "al-010",
    actionType: "settings_changed",
    description: "GDPR notification preferences updated for DPO alerts",
    performedBy: "Sarah Miller (DPO)",
    performedAt: "2026-01-25T13:20:00Z",
    targetEntity: "System Settings",
    metadata: "Breach notification: 24h -> 12h | Consent expiry alert: 30 days",
  },
  {
    id: "al-011",
    actionType: "breach_reported",
    description: "Potential data exposure incident reported and contained",
    performedBy: "IT Security Team",
    performedAt: "2026-01-22T22:15:00Z",
    targetEntity: "Email Platform Integration",
    metadata: "Severity: Low | Records at risk: 0 | Status: False positive confirmed",
  },
  {
    id: "al-012",
    actionType: "data_exported",
    description: "Full compliance report generated for regulatory review",
    performedBy: "Sarah Miller (DPO)",
    performedAt: "2026-01-20T10:00:00Z",
    targetEntity: "Compliance Report Q4 2025",
    metadata: "Format: PDF | Pages: 47 | Scope: All GDPR processing activities",
  },
];

// ─── Utility Helpers ────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getHoursRemaining(deadline: string): number {
  const now = new Date("2026-02-13T10:00:00Z");
  const end = new Date(deadline);
  const diffMs = end.getTime() - now.getTime();
  return Math.max(0, Math.round(diffMs / (1000 * 60 * 60)));
}

function formatConsentType(type: ConsentType): string {
  const labels: Record<ConsentType, string> = {
    data_processing: "Data Processing",
    marketing: "Marketing",
    analytics: "Analytics",
    third_party_sharing: "Third-Party Sharing",
  };
  return labels[type];
}

function formatRequestType(type: RequestType): string {
  const labels: Record<RequestType, string> = {
    full_deletion: "Full Deletion",
    partial_deletion: "Partial Deletion",
    data_export: "Data Export",
  };
  return labels[type];
}

function formatDataType(type: string): string {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const CONSENT_TYPE_COLORS: Record<ConsentType, string> = {
  data_processing: "bg-blue-50 text-blue-700 border-blue-200",
  marketing: "bg-purple-50 text-purple-700 border-purple-200",
  analytics: "bg-cyan-50 text-cyan-700 border-cyan-200",
  third_party_sharing: "bg-amber-50 text-amber-700 border-amber-200",
};

const DELETION_STATUS_COLORS: Record<DeletionStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  processing: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

const REQUEST_TYPE_COLORS: Record<RequestType, string> = {
  full_deletion: "bg-red-50 text-red-700 border-red-200",
  partial_deletion: "bg-orange-50 text-orange-700 border-orange-200",
  data_export: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

const AUDIT_ACTION_LABELS: Record<AuditActionType, string> = {
  consent_granted: "Consent Granted",
  consent_revoked: "Consent Revoked",
  data_exported: "Data Exported",
  records_deleted: "Records Deleted",
  policy_updated: "Policy Updated",
  access_logged: "Access Logged",
  breach_reported: "Breach Reported",
  retention_enforced: "Retention Enforced",
  request_processed: "Request Processed",
  settings_changed: "Settings Changed",
};

const AUDIT_ACTION_COLORS: Record<AuditActionType, string> = {
  consent_granted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  consent_revoked: "bg-red-50 text-red-700 border-red-200",
  data_exported: "bg-indigo-50 text-indigo-700 border-indigo-200",
  records_deleted: "bg-red-50 text-red-700 border-red-200",
  policy_updated: "bg-blue-50 text-blue-700 border-blue-200",
  access_logged: "bg-slate-50 text-slate-700 border-slate-200",
  breach_reported: "bg-red-50 text-red-700 border-red-200",
  retention_enforced: "bg-amber-50 text-amber-700 border-amber-200",
  request_processed: "bg-cyan-50 text-cyan-700 border-cyan-200",
  settings_changed: "bg-purple-50 text-purple-700 border-purple-200",
};

// ─── Stat Card Animation Variants ───────────────────────────────────────────────

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" as const },
  }),
} as const;

const rowVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.04, duration: 0.3 },
  }),
};

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function CompliancePage() {
  const [activeTab, setActiveTab] = useState("consent");

  // Consent Records state
  const [consentTypeFilter, setConsentTypeFilter] = useState<string>("all");
  const [consentStatusFilter, setConsentStatusFilter] = useState<string>("all");

  // Deletion Requests state
  const [deletionRequests, setDeletionRequests] =
    useState<DeletionRequest[]>(DELETION_REQUESTS);

  // Retention Policies state
  const [retentionPolicies, setRetentionPolicies] =
    useState<RetentionPolicy[]>(RETENTION_POLICIES);
  const [editingPolicy, setEditingPolicy] = useState<RetentionPolicy | null>(
    null
  );
  const [editRetentionDays, setEditRetentionDays] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Audit Log state
  const [auditActionFilter, setAuditActionFilter] = useState<string>("all");

  // ─── Derived Data ───────────────────────────────────────────

  const filteredConsent = CONSENT_RECORDS.filter((r) => {
    if (consentTypeFilter !== "all" && r.consentType !== consentTypeFilter)
      return false;
    if (consentStatusFilter !== "all" && r.status !== consentStatusFilter)
      return false;
    return true;
  });

  const filteredAudit = AUDIT_LOG.filter((e) => {
    if (auditActionFilter !== "all" && e.actionType !== auditActionFilter)
      return false;
    return true;
  });

  const consentRecordCount = CONSENT_RECORDS.length;
  const activeRetentionPolicies = retentionPolicies.filter(
    (p) => p.autoDelete
  ).length;
  const pendingDeletions = deletionRequests.filter(
    (d) => d.status === "pending"
  ).length;
  const dataBreaches = 0;

  // ─── Action Handlers ───────────────────────────────────────

  function handleProcessDeletion(id: string) {
    setDeletionRequests((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, status: "processing" as DeletionStatus } : d
      )
    );
    toast.success("Deletion request approved and processing initiated", {
      description:
        "The candidate will be notified once all data has been removed.",
    });
  }

  function handleRejectDeletion(id: string) {
    setDeletionRequests((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, status: "rejected" as DeletionStatus } : d
      )
    );
    toast.info("Deletion request rejected", {
      description: "The candidate will be notified with the rejection reason.",
    });
  }

  function handleToggleAutoDelete(policyId: string) {
    setRetentionPolicies((prev) =>
      prev.map((p) =>
        p.id === policyId ? { ...p, autoDelete: !p.autoDelete } : p
      )
    );
    const policy = retentionPolicies.find((p) => p.id === policyId);
    if (policy) {
      toast.success(
        `Auto-delete ${!policy.autoDelete ? "enabled" : "disabled"} for ${formatDataType(policy.dataType)}`,
        {
          description: !policy.autoDelete
            ? `Records will be automatically deleted after ${policy.retentionDays} days.`
            : "Records will require manual deletion.",
        }
      );
    }
  }

  function handleSaveRetentionEdit() {
    if (!editingPolicy || !editRetentionDays) return;
    const days = parseInt(editRetentionDays, 10);
    if (isNaN(days) || days < 1) {
      toast.error("Please enter a valid number of days (minimum 1).");
      return;
    }
    setRetentionPolicies((prev) =>
      prev.map((p) =>
        p.id === editingPolicy.id ? { ...p, retentionDays: days } : p
      )
    );
    toast.success(
      `Retention period updated for ${formatDataType(editingPolicy.dataType)}`,
      {
        description: `Changed from ${editingPolicy.retentionDays} days to ${days} days.`,
      }
    );
    setEditDialogOpen(false);
    setEditingPolicy(null);
    setEditRetentionDays("");
  }

  function handleExportReport() {
    toast.success("Compliance report exported", {
      description:
        "A full GDPR compliance audit report has been generated and is downloading.",
    });
  }

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              GDPR & Data Privacy Compliance
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage consent, data retention, deletion requests, and audit trails
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportReport}>
            <Download className="mr-2 h-4 w-4" />
            Export Compliance Report
          </Button>
        </div>
      </motion.div>

      {/* ── Compliance Score Card ────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, delay: 0.1 }}
      >
        <Card className="border-blue-100 bg-gradient-to-br from-blue-50/50 to-white">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-start">
              {/* Score Circle */}
              <div className="flex flex-col items-center gap-2 md:min-w-[180px]">
                <div className="relative flex h-32 w-32 items-center justify-center">
                  <svg
                    className="absolute inset-0 -rotate-90"
                    viewBox="0 0 120 120"
                  >
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="8"
                    />
                    <motion.circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="none"
                      stroke="#16a34a"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 52}`}
                      initial={{
                        strokeDashoffset: 2 * Math.PI * 52,
                      }}
                      animate={{
                        strokeDashoffset:
                          2 * Math.PI * 52 * (1 - OVERALL_COMPLIANCE_SCORE / 100),
                      }}
                      transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
                    />
                  </svg>
                  <div className="z-10 flex flex-col items-center">
                    <Shield className="mb-1 h-5 w-5 text-green-600" />
                    <motion.span
                      className="text-3xl font-bold text-green-600"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                    >
                      {OVERALL_COMPLIANCE_SCORE}%
                    </motion.span>
                  </div>
                </div>
                <p className="text-xs font-medium text-muted-foreground">
                  Overall GDPR Compliance
                </p>
                <Badge className="bg-green-50 text-green-700 border-green-200" variant="outline">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Compliant
                </Badge>
              </div>

              {/* Breakdown Areas */}
              <div className="flex-1 space-y-3">
                <div className="mb-2 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-semibold">Compliance Breakdown</h3>
                </div>
                {COMPLIANCE_AREAS.map((area, i) => (
                  <motion.div
                    key={area.label}
                    custom={i}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    className="flex items-center gap-3"
                  >
                    <span className="w-40 text-xs text-muted-foreground">
                      {area.label}
                    </span>
                    <div className="flex-1">
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <motion.div
                          className={`h-full rounded-full ${area.score >= 95
                              ? "bg-green-500"
                              : area.score >= 85
                                ? "bg-blue-500"
                                : "bg-amber-500"
                            }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${area.score}%` }}
                          transition={{ duration: 0.7, delay: 0.3 + i * 0.1 }}
                        />
                      </div>
                    </div>
                    <span
                      className={`w-10 text-right text-xs font-semibold ${area.score >= 95
                          ? "text-green-600"
                          : area.score >= 85
                            ? "text-blue-600"
                            : "text-amber-600"
                        }`}
                    >
                      {area.score}%
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Stats Row ────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          {
            label: "Consent Records",
            value: consentRecordCount,
            icon: FileText,
            color: "text-blue-600",
            bg: "bg-blue-50",
            desc: "Total tracked consents",
          },
          {
            label: "Active Retention Policies",
            value: activeRetentionPolicies,
            icon: Clock,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            desc: "Auto-delete enabled",
          },
          {
            label: "Pending Deletion Requests",
            value: pendingDeletions,
            icon: Trash2,
            color: "text-amber-600",
            bg: "bg-amber-50",
            desc: "Awaiting processing",
          },
          {
            label: "Data Breaches",
            value: dataBreaches,
            icon: Shield,
            color: "text-green-600",
            bg: "bg-green-50",
            desc: "No incidents reported",
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.bg}`}
                  >
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {stat.label}
                  </span>
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ── Tabs ─────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="consent">
            <FileText className="mr-2 h-4 w-4" />
            Consent Records
          </TabsTrigger>
          <TabsTrigger value="deletion">
            <Trash2 className="mr-2 h-4 w-4" />
            Deletion Requests
          </TabsTrigger>
          <TabsTrigger value="retention">
            <Clock className="mr-2 h-4 w-4" />
            Retention Policies
          </TabsTrigger>
          <TabsTrigger value="audit">
            <Eye className="mr-2 h-4 w-4" />
            Audit Log
          </TabsTrigger>
        </TabsList>

        {/* ── Consent Records Tab ──────────────────────────── */}
        <TabsContent value="consent">
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Select
                value={consentTypeFilter}
                onValueChange={setConsentTypeFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Consent Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Consent Types</SelectItem>
                  <SelectItem value="data_processing">
                    Data Processing
                  </SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="analytics">Analytics</SelectItem>
                  <SelectItem value="third_party_sharing">
                    Third-Party Sharing
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={consentStatusFilter}
                onValueChange={setConsentStatusFilter}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="granted">Granted</SelectItem>
                  <SelectItem value="revoked">Revoked</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex-1" />
              <Badge variant="outline" className="text-xs">
                {filteredConsent.length} record
                {filteredConsent.length !== 1 ? "s" : ""}
              </Badge>
            </div>

            <Card>
              <CardContent className="pt-4 pb-2">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-muted-foreground">
                        <th className="pb-3 pr-4 font-medium">Candidate</th>
                        <th className="pb-3 pr-4 font-medium">Consent Type</th>
                        <th className="pb-3 pr-4 font-medium">Status</th>
                        <th className="pb-3 pr-4 font-medium">Granted</th>
                        <th className="pb-3 pr-4 font-medium">Revoked</th>
                        <th className="pb-3 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence mode="popLayout">
                        {filteredConsent.map((record, i) => (
                          <motion.tr
                            key={record.id}
                            custom={i}
                            variants={rowVariants}
                            initial="hidden"
                            animate="visible"
                            exit={{ opacity: 0, x: -10 }}
                            className="border-b last:border-0 hover:bg-muted/30"
                          >
                            <td className="py-3 pr-4">
                              <div>
                                <p className="font-medium text-sm">
                                  {record.candidateName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {record.candidateEmail}
                                </p>
                              </div>
                            </td>
                            <td className="py-3 pr-4">
                              <Badge
                                variant="outline"
                                className={`text-[11px] ${CONSENT_TYPE_COLORS[record.consentType]}`}
                              >
                                {formatConsentType(record.consentType)}
                              </Badge>
                            </td>
                            <td className="py-3 pr-4">
                              {record.status === "granted" ? (
                                <Badge
                                  variant="outline"
                                  className="bg-green-50 text-green-700 border-green-200 text-[11px]"
                                >
                                  <CheckCircle2 className="mr-1 h-3 w-3" />
                                  Granted
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="bg-red-50 text-red-700 border-red-200 text-[11px]"
                                >
                                  <UserX className="mr-1 h-3 w-3" />
                                  Revoked
                                </Badge>
                              )}
                            </td>
                            <td className="py-3 pr-4 text-xs text-muted-foreground">
                              {formatDate(record.grantedAt)}
                            </td>
                            <td className="py-3 pr-4 text-xs text-muted-foreground">
                              {record.revokedAt
                                ? formatDate(record.revokedAt)
                                : "--"}
                            </td>
                            <td className="py-3 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() =>
                                  toast.info(
                                    `Viewing full consent record for ${record.candidateName}`,
                                    {
                                      description: `IP: ${record.ipAddress} | Agent: ${record.userAgent}`,
                                    }
                                  )
                                }
                              >
                                <Eye className="mr-1 h-3 w-3" />
                                View
                              </Button>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Deletion Requests Tab ────────────────────────── */}
        <TabsContent value="deletion">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Manage Right to be Forgotten requests (GDPR Article 17). All
                requests must be processed within{" "}
                <span className="font-semibold text-foreground">72 hours</span>.
              </p>
              <Badge
                variant="outline"
                className="bg-amber-50 text-amber-700 border-amber-200"
              >
                <AlertTriangle className="mr-1 h-3 w-3" />
                {pendingDeletions} pending
              </Badge>
            </div>

            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {deletionRequests.map((req, i) => {
                  const hoursLeft = getHoursRemaining(req.deadline);
                  const isUrgent =
                    (req.status === "pending" || req.status === "processing") &&
                    hoursLeft <= 24;
                  const isExpired =
                    (req.status === "pending" || req.status === "processing") &&
                    hoursLeft === 0;

                  return (
                    <motion.div
                      key={req.id}
                      custom={i}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <Card
                        className={
                          isExpired
                            ? "border-red-300 bg-red-50/30"
                            : isUrgent
                              ? "border-amber-300 bg-amber-50/30"
                              : req.status === "completed"
                                ? "border-green-200"
                                : undefined
                        }
                      >
                        <CardContent className="pt-4 pb-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1">
                              <div
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${req.status === "completed"
                                    ? "bg-green-100"
                                    : req.status === "rejected"
                                      ? "bg-red-100"
                                      : req.status === "processing"
                                        ? "bg-blue-100"
                                        : "bg-amber-100"
                                  }`}
                              >
                                {req.status === "completed" ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : req.status === "rejected" ? (
                                  <UserX className="h-4 w-4 text-red-600" />
                                ) : req.status === "processing" ? (
                                  <Settings className="h-4 w-4 text-blue-600 animate-spin" />
                                ) : (
                                  <Clock className="h-4 w-4 text-amber-600" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-semibold text-sm">
                                    {req.candidateName}
                                  </p>
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] ${DELETION_STATUS_COLORS[req.status]}`}
                                  >
                                    {req.status}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className={`text-[10px] ${REQUEST_TYPE_COLORS[req.requestType]}`}
                                  >
                                    {formatRequestType(req.requestType)}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {req.candidateEmail}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {req.reason}
                                </p>
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {req.affectedSystems.map((sys) => (
                                    <Badge
                                      key={sys}
                                      variant="secondary"
                                      className="text-[10px] h-5"
                                    >
                                      {sys}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-2 shrink-0">
                              {/* Countdown Timer */}
                              {(req.status === "pending" ||
                                req.status === "processing") && (
                                  <div
                                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${isExpired
                                        ? "bg-red-100 text-red-700"
                                        : isUrgent
                                          ? "bg-amber-100 text-amber-700"
                                          : "bg-blue-50 text-blue-700"
                                      }`}
                                  >
                                    <Clock className="h-3 w-3" />
                                    {isExpired
                                      ? "OVERDUE"
                                      : `${hoursLeft}h remaining`}
                                  </div>
                                )}

                              {req.status === "completed" &&
                                req.completedAt && (
                                  <p className="text-xs text-green-600 font-medium">
                                    Completed {formatDate(req.completedAt)}
                                  </p>
                                )}

                              <p className="text-[10px] text-muted-foreground">
                                Requested {formatDateTime(req.requestedAt)}
                              </p>

                              {/* Action Buttons */}
                              {req.status === "pending" && (
                                <div className="flex gap-1.5 mt-1">
                                  <Button
                                    size="sm"
                                    className="h-7 text-xs bg-green-600 hover:bg-green-700"
                                    onClick={() =>
                                      handleProcessDeletion(req.id)
                                    }
                                  >
                                    <CheckCircle2 className="mr-1 h-3 w-3" />
                                    Process
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50"
                                    onClick={() =>
                                      handleRejectDeletion(req.id)
                                    }
                                  >
                                    <UserX className="mr-1 h-3 w-3" />
                                    Reject
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </TabsContent>

        {/* ── Retention Policies Tab ───────────────────────── */}
        <TabsContent value="retention">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Configure data retention periods and automatic deletion rules for
                each data category.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  toast.info("Running retention compliance check...", {
                    description:
                      "Scanning all data categories for policy violations.",
                  })
                }
              >
                <Shield className="mr-2 h-4 w-4" />
                Verify Compliance
              </Button>
            </div>

            <Card>
              <CardContent className="pt-4 pb-2">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-muted-foreground">
                        <th className="pb-3 pr-4 font-medium">Data Type</th>
                        <th className="pb-3 pr-4 font-medium">Description</th>
                        <th className="pb-3 pr-4 font-medium">
                          Retention Period
                        </th>
                        <th className="pb-3 pr-4 font-medium">Auto-Delete</th>
                        <th className="pb-3 pr-4 font-medium">Records</th>
                        <th className="pb-3 pr-4 font-medium">Last Reviewed</th>
                        <th className="pb-3 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence mode="popLayout">
                        {retentionPolicies.map((policy, i) => (
                          <motion.tr
                            key={policy.id}
                            custom={i}
                            variants={rowVariants}
                            initial="hidden"
                            animate="visible"
                            exit={{ opacity: 0 }}
                            className="border-b last:border-0 hover:bg-muted/30"
                          >
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-2">
                                <Lock className="h-3.5 w-3.5 text-blue-500" />
                                <span className="font-medium text-sm">
                                  {formatDataType(policy.dataType)}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 pr-4 text-xs text-muted-foreground max-w-[200px] truncate">
                              {policy.description}
                            </td>
                            <td className="py-3 pr-4">
                              <Badge
                                variant="outline"
                                className="text-[11px] bg-blue-50 text-blue-700 border-blue-200"
                              >
                                {policy.retentionDays} days
                              </Badge>
                            </td>
                            <td className="py-3 pr-4">
                              <Switch
                                checked={policy.autoDelete}
                                onCheckedChange={() =>
                                  handleToggleAutoDelete(policy.id)
                                }
                              />
                            </td>
                            <td className="py-3 pr-4 text-xs">
                              {policy.recordCount.toLocaleString()}
                            </td>
                            <td className="py-3 pr-4 text-xs text-muted-foreground">
                              {formatDate(policy.lastReviewedAt)}
                            </td>
                            <td className="py-3 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => {
                                  setEditingPolicy(policy);
                                  setEditRetentionDays(
                                    String(policy.retentionDays)
                                  );
                                  setEditDialogOpen(true);
                                }}
                              >
                                <Settings className="mr-1 h-3 w-3" />
                                Edit
                              </Button>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Edit Retention Period Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Edit Retention Period
                </DialogTitle>
                <DialogDescription>
                  {editingPolicy
                    ? `Update the retention period for ${formatDataType(editingPolicy.dataType)}. Current policy: ${editingPolicy.retentionDays} days.`
                    : "Update the data retention period for this category."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Retention Period (days)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={editRetentionDays}
                    onChange={(e) => setEditRetentionDays(e.target.value)}
                    placeholder="Enter number of days"
                  />
                  <p className="text-xs text-muted-foreground">
                    Data older than this period will be{" "}
                    {editingPolicy?.autoDelete
                      ? "automatically deleted"
                      : "flagged for manual review"}
                    .
                  </p>
                </div>
                {editingPolicy && (
                  <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                    <p className="text-xs font-medium">Policy Summary</p>
                    <p className="text-xs text-muted-foreground">
                      Data type: {formatDataType(editingPolicy.dataType)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Active records: {editingPolicy.recordCount.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Auto-delete: {editingPolicy.autoDelete ? "Enabled" : "Disabled"}
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditDialogOpen(false);
                    setEditingPolicy(null);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveRetentionEdit}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ── Audit Log Tab ────────────────────────────────── */}
        <TabsContent value="audit">
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Select
                value={auditActionFilter}
                onValueChange={setAuditActionFilter}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Action Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="consent_granted">
                    Consent Granted
                  </SelectItem>
                  <SelectItem value="consent_revoked">
                    Consent Revoked
                  </SelectItem>
                  <SelectItem value="data_exported">Data Exported</SelectItem>
                  <SelectItem value="records_deleted">
                    Records Deleted
                  </SelectItem>
                  <SelectItem value="policy_updated">Policy Updated</SelectItem>
                  <SelectItem value="access_logged">Access Logged</SelectItem>
                  <SelectItem value="breach_reported">
                    Breach Reported
                  </SelectItem>
                  <SelectItem value="retention_enforced">
                    Retention Enforced
                  </SelectItem>
                  <SelectItem value="request_processed">
                    Request Processed
                  </SelectItem>
                  <SelectItem value="settings_changed">
                    Settings Changed
                  </SelectItem>
                </SelectContent>
              </Select>
              <div className="flex-1" />
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  toast.success("Audit log exported to CSV", {
                    description:
                      "The full audit trail has been exported for compliance review.",
                  })
                }
              >
                <Download className="mr-2 h-4 w-4" />
                Export Audit Log
              </Button>
            </div>

            <Card>
              <CardContent className="pt-4 pb-2">
                <div className="space-y-0">
                  <AnimatePresence mode="popLayout">
                    {filteredAudit.map((entry, i) => (
                      <motion.div
                        key={entry.id}
                        custom={i}
                        variants={rowVariants}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, x: -10 }}
                        className="flex items-start gap-3 border-b last:border-0 py-3"
                      >
                        {/* Timeline dot */}
                        <div className="flex flex-col items-center pt-1">
                          <div
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${entry.actionType === "breach_reported"
                                ? "bg-red-100"
                                : entry.actionType === "consent_granted"
                                  ? "bg-green-100"
                                  : entry.actionType === "records_deleted"
                                    ? "bg-red-100"
                                    : entry.actionType === "consent_revoked"
                                      ? "bg-red-100"
                                      : "bg-blue-100"
                              }`}
                          >
                            {entry.actionType === "breach_reported" ? (
                              <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
                            ) : entry.actionType === "consent_granted" ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                            ) : entry.actionType === "records_deleted" ? (
                              <Trash2 className="h-3.5 w-3.5 text-red-600" />
                            ) : entry.actionType === "consent_revoked" ? (
                              <UserX className="h-3.5 w-3.5 text-red-600" />
                            ) : entry.actionType === "data_exported" ? (
                              <Download className="h-3.5 w-3.5 text-indigo-600" />
                            ) : entry.actionType === "policy_updated" ? (
                              <Settings className="h-3.5 w-3.5 text-blue-600" />
                            ) : entry.actionType === "retention_enforced" ? (
                              <Clock className="h-3.5 w-3.5 text-amber-600" />
                            ) : entry.actionType === "settings_changed" ? (
                              <Bell className="h-3.5 w-3.5 text-purple-600" />
                            ) : entry.actionType === "access_logged" ? (
                              <Eye className="h-3.5 w-3.5 text-slate-600" />
                            ) : (
                              <FileText className="h-3.5 w-3.5 text-cyan-600" />
                            )}
                          </div>
                          {i < filteredAudit.length - 1 && (
                            <div className="mt-1 w-px flex-1 bg-border" />
                          )}
                        </div>

                        {/* Entry Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm">
                              {entry.description}
                            </p>
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${AUDIT_ACTION_COLORS[entry.actionType]}`}
                            >
                              {AUDIT_ACTION_LABELS[entry.actionType]}
                            </Badge>
                          </div>
                          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{entry.performedBy}</span>
                            <span>|</span>
                            <span>{formatDateTime(entry.performedAt)}</span>
                            <span>|</span>
                            <span>{entry.targetEntity}</span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground/80">
                            {entry.metadata}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
