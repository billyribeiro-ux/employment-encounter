"use client";

import { useState, useMemo } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  FileText,
  Trash2,
  Download,
  Upload,
  Search,
  Filter,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Users,
  UserCheck,
  UserX,
  Settings,
  Bell,
  Globe,
  Cookie,
  ScrollText,
  Stamp,
  FileWarning,
  ClipboardList,
  BarChart3,
  ChevronRight,
  ChevronDown,
  Plus,
  RefreshCw,
  Mail,
  Building2,
  Scale,
  Fingerprint,
  Ban,
  Archive,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
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
  DialogTrigger,
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

// ─── Types ──────────────────────────────────────────────────

interface ConsentRecord {
  id: string;
  candidateName: string;
  candidateEmail: string;
  purpose: "processing" | "marketing" | "analytics" | "profiling";
  consentedAt: string;
  expiresAt: string;
  status: "active" | "expired" | "withdrawn";
  ipAddress: string;
}

interface DeletionRequest {
  id: string;
  candidateName: string;
  candidateEmail: string;
  requestedAt: string;
  status: "pending" | "in_progress" | "completed" | "rejected";
  completedAt: string | null;
  reason: string;
  dataTypes: string[];
  auditTrail: { action: string; timestamp: string; user: string }[];
}

interface DataRetentionPolicy {
  id: string;
  stage: string;
  retentionDays: number;
  autoDelete: boolean;
  recordsCount: number;
  lastPurge: string;
}

interface AuditLogEntry {
  id: string;
  action: string;
  category: "consent" | "deletion" | "access" | "export" | "policy" | "breach";
  user: string;
  timestamp: string;
  details: string;
  severity: "info" | "warning" | "critical";
}

interface ProcessingRecord {
  id: string;
  purpose: string;
  dataCategories: string[];
  legalBasis: string;
  recipients: string[];
  retentionPeriod: string;
  lastReviewed: string;
}

interface PolicyTemplate {
  id: string;
  name: string;
  type: "Privacy Notice" | "Data Processing Agreement" | "Cookie Policy";
  lastUpdated: string;
  status: "current" | "draft" | "review_needed";
  description: string;
}

interface RiskItem {
  id: string;
  risk: string;
  category: string;
  likelihood: "low" | "medium" | "high";
  impact: "low" | "medium" | "high" | "critical";
  status: "mitigated" | "accepted" | "open";
  mitigation: string;
}

// ─── Simulated Data ──────────────────────────────────────────

const COMPLIANCE_SCORE = 87;
const PENDING_ACTIONS = 5;
const CONSENT_RATE = 94;
const PENDING_DELETIONS = 3;
const RETENTION_COMPLIANCE = 96;

const CONSENT_RECORDS: ConsentRecord[] = [
  { id: "c1", candidateName: "Sarah Chen", candidateEmail: "sarah.chen@email.com", purpose: "processing", consentedAt: "2025-11-15T10:30:00Z", expiresAt: "2026-11-15T10:30:00Z", status: "active", ipAddress: "192.168.1.45" },
  { id: "c2", candidateName: "Marcus Johnson", candidateEmail: "marcus.j@email.com", purpose: "marketing", consentedAt: "2025-10-20T14:15:00Z", expiresAt: "2026-04-20T14:15:00Z", status: "active", ipAddress: "10.0.0.32" },
  { id: "c3", candidateName: "Emily Rodriguez", candidateEmail: "emily.r@email.com", purpose: "processing", consentedAt: "2025-09-05T09:00:00Z", expiresAt: "2026-09-05T09:00:00Z", status: "active", ipAddress: "172.16.0.12" },
  { id: "c4", candidateName: "David Kim", candidateEmail: "david.kim@email.com", purpose: "analytics", consentedAt: "2025-08-12T16:45:00Z", expiresAt: "2026-02-12T16:45:00Z", status: "expired", ipAddress: "192.168.2.78" },
  { id: "c5", candidateName: "Aisha Patel", candidateEmail: "aisha.p@email.com", purpose: "processing", consentedAt: "2025-12-01T11:20:00Z", expiresAt: "2026-12-01T11:20:00Z", status: "active", ipAddress: "10.1.0.55" },
  { id: "c6", candidateName: "James Thompson", candidateEmail: "james.t@email.com", purpose: "profiling", consentedAt: "2025-07-18T08:30:00Z", expiresAt: "2025-12-18T08:30:00Z", status: "withdrawn", ipAddress: "192.168.3.91" },
  { id: "c7", candidateName: "Lisa Wang", candidateEmail: "lisa.wang@email.com", purpose: "marketing", consentedAt: "2025-11-28T13:10:00Z", expiresAt: "2026-05-28T13:10:00Z", status: "active", ipAddress: "172.16.1.44" },
  { id: "c8", candidateName: "Robert Garcia", candidateEmail: "robert.g@email.com", purpose: "processing", consentedAt: "2025-10-10T10:00:00Z", expiresAt: "2026-10-10T10:00:00Z", status: "active", ipAddress: "10.0.1.22" },
  { id: "c9", candidateName: "Nina Petrova", candidateEmail: "nina.p@email.com", purpose: "analytics", consentedAt: "2025-06-25T15:30:00Z", expiresAt: "2025-12-25T15:30:00Z", status: "expired", ipAddress: "192.168.4.63" },
  { id: "c10", candidateName: "Alex Turner", candidateEmail: "alex.t@email.com", purpose: "processing", consentedAt: "2025-12-10T09:45:00Z", expiresAt: "2026-12-10T09:45:00Z", status: "active", ipAddress: "10.2.0.17" },
];

const DELETION_REQUESTS: DeletionRequest[] = [
  {
    id: "d1",
    candidateName: "James Thompson",
    candidateEmail: "james.t@email.com",
    requestedAt: "2026-01-05T09:00:00Z",
    status: "completed",
    completedAt: "2026-01-08T14:30:00Z",
    reason: "No longer interested in opportunities",
    dataTypes: ["Personal Info", "Resume", "Assessment Results", "Interview Notes"],
    auditTrail: [
      { action: "Deletion request received", timestamp: "2026-01-05T09:00:00Z", user: "System" },
      { action: "Request validated and approved", timestamp: "2026-01-06T10:15:00Z", user: "Sarah Miller (DPO)" },
      { action: "Data deletion initiated", timestamp: "2026-01-07T08:00:00Z", user: "System" },
      { action: "All data permanently deleted", timestamp: "2026-01-08T14:30:00Z", user: "System" },
      { action: "Confirmation sent to candidate", timestamp: "2026-01-08T14:31:00Z", user: "System" },
    ],
  },
  {
    id: "d2",
    candidateName: "David Kim",
    candidateEmail: "david.kim@email.com",
    requestedAt: "2026-01-10T11:30:00Z",
    status: "in_progress",
    completedAt: null,
    reason: "GDPR Right to Erasure request",
    dataTypes: ["Personal Info", "Resume", "Assessment Results"],
    auditTrail: [
      { action: "Deletion request received", timestamp: "2026-01-10T11:30:00Z", user: "System" },
      { action: "Request validated and approved", timestamp: "2026-01-11T09:00:00Z", user: "Sarah Miller (DPO)" },
      { action: "Data deletion initiated", timestamp: "2026-01-12T08:00:00Z", user: "System" },
    ],
  },
  {
    id: "d3",
    candidateName: "Nina Petrova",
    candidateEmail: "nina.p@email.com",
    requestedAt: "2026-01-12T14:00:00Z",
    status: "pending",
    completedAt: null,
    reason: "Personal request for data removal",
    dataTypes: ["Personal Info", "Resume"],
    auditTrail: [
      { action: "Deletion request received", timestamp: "2026-01-12T14:00:00Z", user: "System" },
    ],
  },
  {
    id: "d4",
    candidateName: "Tom Winters",
    candidateEmail: "tom.w@email.com",
    requestedAt: "2026-01-13T08:20:00Z",
    status: "pending",
    completedAt: null,
    reason: "Consent withdrawn",
    dataTypes: ["Personal Info", "Resume", "Interview Notes", "Assessment Results", "Communication History"],
    auditTrail: [
      { action: "Deletion request received", timestamp: "2026-01-13T08:20:00Z", user: "System" },
    ],
  },
  {
    id: "d5",
    candidateName: "Rachel Adams",
    candidateEmail: "rachel.a@email.com",
    requestedAt: "2025-12-20T10:00:00Z",
    status: "rejected",
    completedAt: null,
    reason: "Candidate has active employment contract",
    dataTypes: ["Personal Info"],
    auditTrail: [
      { action: "Deletion request received", timestamp: "2025-12-20T10:00:00Z", user: "System" },
      { action: "Request reviewed - legal hold in place", timestamp: "2025-12-21T11:00:00Z", user: "Sarah Miller (DPO)" },
      { action: "Request rejected - active legal obligation", timestamp: "2025-12-22T09:00:00Z", user: "Legal Team" },
    ],
  },
];

const RETENTION_POLICIES: DataRetentionPolicy[] = [
  { id: "rp1", stage: "Applied / Not Reviewed", retentionDays: 180, autoDelete: true, recordsCount: 342, lastPurge: "2026-01-01" },
  { id: "rp2", stage: "Screening", retentionDays: 365, autoDelete: true, recordsCount: 189, lastPurge: "2026-01-01" },
  { id: "rp3", stage: "Interviewed", retentionDays: 730, autoDelete: true, recordsCount: 156, lastPurge: "2025-12-15" },
  { id: "rp4", stage: "Offered / Rejected", retentionDays: 1095, autoDelete: false, recordsCount: 78, lastPurge: "2025-11-01" },
  { id: "rp5", stage: "Hired (Active)", retentionDays: 0, autoDelete: false, recordsCount: 45, lastPurge: "N/A" },
  { id: "rp6", stage: "Hired (Terminated)", retentionDays: 2555, autoDelete: true, recordsCount: 23, lastPurge: "2025-10-01" },
];

const AUDIT_LOG: AuditLogEntry[] = [
  { id: "al1", action: "Consent form updated", category: "consent", user: "Sarah Miller", timestamp: "2026-01-13T09:30:00Z", details: "Updated processing consent form with new data categories", severity: "info" },
  { id: "al2", action: "Deletion request processed", category: "deletion", user: "System", timestamp: "2026-01-12T14:00:00Z", details: "Automated deletion completed for candidate James Thompson", severity: "info" },
  { id: "al3", action: "Data export requested", category: "export", user: "Emily Rodriguez", timestamp: "2026-01-11T11:15:00Z", details: "Candidate requested portable data export under GDPR Article 20", severity: "info" },
  { id: "al4", action: "Unauthorized access attempt", category: "access", user: "Unknown", timestamp: "2026-01-10T22:45:00Z", details: "Failed login attempt to candidate data portal from unknown IP", severity: "critical" },
  { id: "al5", action: "Retention policy updated", category: "policy", user: "Sarah Miller", timestamp: "2026-01-09T10:00:00Z", details: "Screening stage retention changed from 180 to 365 days", severity: "warning" },
  { id: "al6", action: "Bulk consent renewal sent", category: "consent", user: "System", timestamp: "2026-01-08T08:00:00Z", details: "Renewal emails sent to 47 candidates with expiring consent", severity: "info" },
  { id: "al7", action: "Cookie policy reviewed", category: "policy", user: "Legal Team", timestamp: "2026-01-07T15:30:00Z", details: "Annual review of cookie consent policy completed", severity: "info" },
  { id: "al8", action: "Data breach simulation", category: "breach", user: "IT Security", timestamp: "2026-01-06T14:00:00Z", details: "Quarterly breach response drill conducted successfully", severity: "warning" },
  { id: "al9", action: "EEOC report generated", category: "export", user: "HR Admin", timestamp: "2026-01-05T09:00:00Z", details: "Q4 2025 EEO-1 component data report generated and filed", severity: "info" },
  { id: "al10", action: "New DPA signed", category: "policy", user: "Legal Team", timestamp: "2026-01-04T11:00:00Z", details: "Data Processing Agreement signed with new ATS integration partner", severity: "info" },
  { id: "al11", action: "Consent withdrawn", category: "consent", user: "James Thompson", timestamp: "2026-01-03T16:00:00Z", details: "Candidate withdrew marketing consent", severity: "info" },
  { id: "al12", action: "Automated purge executed", category: "deletion", user: "System", timestamp: "2026-01-01T00:00:00Z", details: "Monthly automated purge: 24 records deleted based on retention policies", severity: "info" },
];

const PROCESSING_RECORDS: ProcessingRecord[] = [
  {
    id: "pr1",
    purpose: "Recruitment & Hiring",
    dataCategories: ["Name", "Email", "Phone", "Resume", "Work History", "Education"],
    legalBasis: "Legitimate Interest (Article 6(1)(f))",
    recipients: ["Hiring Managers", "HR Team"],
    retentionPeriod: "Duration of hiring process + 12 months",
    lastReviewed: "2025-12-15",
  },
  {
    id: "pr2",
    purpose: "Skill Assessment",
    dataCategories: ["Assessment Responses", "Scores", "Video Recordings", "Code Submissions"],
    legalBasis: "Consent (Article 6(1)(a))",
    recipients: ["Assessment Platform", "Hiring Managers"],
    retentionPeriod: "24 months from assessment date",
    lastReviewed: "2025-11-20",
  },
  {
    id: "pr3",
    purpose: "Background Checks",
    dataCategories: ["Criminal Records", "Employment Verification", "Education Verification"],
    legalBasis: "Consent (Article 6(1)(a))",
    recipients: ["Background Check Provider"],
    retentionPeriod: "6 months from check completion",
    lastReviewed: "2025-10-10",
  },
  {
    id: "pr4",
    purpose: "Diversity & Inclusion Analytics",
    dataCategories: ["Gender", "Ethnicity", "Disability Status", "Veteran Status"],
    legalBasis: "Consent (Article 6(1)(a)) + Substantial Public Interest",
    recipients: ["HR Analytics Team"],
    retentionPeriod: "Aggregated data retained indefinitely; individual data for 36 months",
    lastReviewed: "2025-12-01",
  },
  {
    id: "pr5",
    purpose: "Marketing & Talent Pool",
    dataCategories: ["Name", "Email", "Job Preferences", "Location"],
    legalBasis: "Consent (Article 6(1)(a))",
    recipients: ["Marketing Team", "Email Platform"],
    retentionPeriod: "Until consent withdrawal or 6 months after last interaction",
    lastReviewed: "2025-09-15",
  },
];

const POLICY_TEMPLATES: PolicyTemplate[] = [
  { id: "pt1", name: "Candidate Privacy Notice", type: "Privacy Notice", lastUpdated: "2026-01-07", status: "current", description: "Comprehensive privacy notice for job applicants detailing data collection and processing practices." },
  { id: "pt2", name: "ATS Data Processing Agreement", type: "Data Processing Agreement", lastUpdated: "2026-01-04", status: "current", description: "Standard DPA for third-party applicant tracking system integrations." },
  { id: "pt3", name: "Career Site Cookie Policy", type: "Cookie Policy", lastUpdated: "2025-12-15", status: "review_needed", description: "Cookie consent and tracking policy for the public-facing careers page." },
  { id: "pt4", name: "Assessment Platform DPA", type: "Data Processing Agreement", lastUpdated: "2025-11-20", status: "current", description: "Data processing agreement for external skill assessment service providers." },
  { id: "pt5", name: "Employee Referral Privacy Notice", type: "Privacy Notice", lastUpdated: "2025-10-01", status: "draft", description: "Privacy notice specific to employee referral program data handling." },
];

const RISK_MATRIX: RiskItem[] = [
  { id: "rm1", risk: "Unauthorized data access", category: "Security", likelihood: "low", impact: "critical", status: "mitigated", mitigation: "Role-based access control, MFA, audit logging" },
  { id: "rm2", risk: "Consent expiration missed", category: "Compliance", likelihood: "medium", impact: "high", status: "mitigated", mitigation: "Automated alerts 30 days before expiration" },
  { id: "rm3", risk: "Data retention exceeds policy", category: "Compliance", likelihood: "low", impact: "medium", status: "mitigated", mitigation: "Automated monthly purge scripts" },
  { id: "rm4", risk: "Cross-border data transfer", category: "Legal", likelihood: "medium", impact: "high", status: "accepted", mitigation: "Standard contractual clauses in place" },
  { id: "rm5", risk: "Third-party vendor breach", category: "Security", likelihood: "medium", impact: "critical", status: "open", mitigation: "Regular vendor security audits pending" },
  { id: "rm6", risk: "Incomplete deletion request", category: "Compliance", likelihood: "low", impact: "high", status: "mitigated", mitigation: "Multi-system deletion checklist and verification" },
  { id: "rm7", risk: "EEO data misuse", category: "Legal", likelihood: "low", impact: "high", status: "mitigated", mitigation: "Segregated storage, limited access, aggregated reporting only" },
];

// ─── Utility Helpers ──────────────────────────────────────

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const PURPOSE_COLORS: Record<string, string> = {
  processing: "bg-blue-100 text-blue-700 border-blue-200",
  marketing: "bg-purple-100 text-purple-700 border-purple-200",
  analytics: "bg-cyan-100 text-cyan-700 border-cyan-200",
  profiling: "bg-amber-100 text-amber-700 border-amber-200",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  expired: "bg-red-100 text-red-700",
  withdrawn: "bg-gray-100 text-gray-700",
  pending: "bg-amber-100 text-amber-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  current: "bg-emerald-100 text-emerald-700",
  draft: "bg-gray-100 text-gray-700",
  review_needed: "bg-amber-100 text-amber-700",
};

const SEVERITY_COLORS: Record<string, string> = {
  info: "bg-blue-100 text-blue-700",
  warning: "bg-amber-100 text-amber-700",
  critical: "bg-red-100 text-red-700",
};

const LIKELIHOOD_COLORS: Record<string, string> = {
  low: "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-red-100 text-red-700",
};

const IMPACT_COLORS: Record<string, string> = {
  low: "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

// ─── Components ─────────────────────────────────────────────

function ComplianceDashboard() {
  const scoreColor =
    COMPLIANCE_SCORE >= 90
      ? "text-emerald-600"
      : COMPLIANCE_SCORE >= 70
      ? "text-blue-600"
      : "text-amber-600";

  return (
    <div className="space-y-6">
      {/* Score + Key Metrics */}
      <div className="grid gap-4 md:grid-cols-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="md:col-span-2"
        >
          <Card className="h-full">
            <CardContent className="pt-5 flex flex-col items-center justify-center h-full">
              <Shield className={`h-8 w-8 ${scoreColor} mb-2`} />
              <p className="text-xs text-muted-foreground mb-1">
                Overall Compliance Score
              </p>
              <motion.p
                className={`text-5xl font-bold ${scoreColor}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {COMPLIANCE_SCORE}%
              </motion.p>
              <div className="w-full mt-3">
                <motion.div
                  className="h-2 rounded-full bg-muted overflow-hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <motion.div
                    className={`h-full rounded-full ${
                      COMPLIANCE_SCORE >= 90
                        ? "bg-emerald-500"
                        : COMPLIANCE_SCORE >= 70
                        ? "bg-blue-500"
                        : "bg-amber-500"
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${COMPLIANCE_SCORE}%` }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                  />
                </motion.div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Last assessed: Jan 13, 2026
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <div className="md:col-span-3 grid gap-4 grid-cols-3">
          {[
            {
              label: "Consent Rate",
              value: `${CONSENT_RATE}%`,
              icon: UserCheck,
              color: "text-emerald-600",
              desc: "Active consents",
            },
            {
              label: "Pending Deletions",
              value: PENDING_DELETIONS,
              icon: Trash2,
              color: "text-amber-600",
              desc: "Awaiting processing",
            },
            {
              label: "Pending Actions",
              value: PENDING_ACTIONS,
              icon: AlertTriangle,
              color: "text-red-600",
              desc: "Require attention",
            },
            {
              label: "Retention Compliance",
              value: `${RETENTION_COMPLIANCE}%`,
              icon: Clock,
              color: "text-blue-600",
              desc: "Within policy limits",
            },
            {
              label: "Active Policies",
              value: POLICY_TEMPLATES.filter((p) => p.status === "current").length,
              icon: ScrollText,
              color: "text-violet-600",
              desc: "Up to date",
            },
            {
              label: "Open Risks",
              value: RISK_MATRIX.filter((r) => r.status === "open").length,
              icon: ShieldAlert,
              color: "text-orange-600",
              desc: "Unmitigated",
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
            >
              <Card>
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
                    <span className="text-[11px] text-muted-foreground">
                      {stat.label}
                    </span>
                  </div>
                  <p className="text-xl font-bold">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground">{stat.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {[
              { label: "Process Deletion Requests", icon: Trash2, count: PENDING_DELETIONS },
              { label: "Renew Expiring Consents", icon: RefreshCw, count: 2 },
              { label: "Review Flagged Policies", icon: FileWarning, count: 1 },
              { label: "Generate EEOC Report", icon: BarChart3, count: 0 },
              { label: "Run Data Audit", icon: Shield, count: 0 },
            ].map((action) => (
              <Button
                key={action.label}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() =>
                  toast.success(`Action initiated: ${action.label}`)
                }
              >
                <action.icon className="h-3 w-3 mr-1" />
                {action.label}
                {action.count > 0 && (
                  <Badge variant="destructive" className="ml-1.5 text-[10px] px-1.5 h-4">
                    {action.count}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ConsentManagement() {
  const [purposeFilter, setPurposeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [consentBuilderOpen, setConsentBuilderOpen] = useState(false);

  const filtered = CONSENT_RECORDS.filter((c) => {
    if (purposeFilter !== "all" && c.purpose !== purposeFilter) return false;
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Select value={purposeFilter} onValueChange={setPurposeFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Purpose" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Purposes</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="analytics">Analytics</SelectItem>
              <SelectItem value="profiling">Profiling</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="withdrawn">Withdrawn</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog open={consentBuilderOpen} onOpenChange={setConsentBuilderOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Build Consent Form
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Consent Form Builder</DialogTitle>
              <DialogDescription>
                Create a customized consent form for a specific data processing purpose.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Purpose</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="processing">Data Processing</SelectItem>
                    <SelectItem value="marketing">Marketing Communications</SelectItem>
                    <SelectItem value="analytics">Analytics & Improvement</SelectItem>
                    <SelectItem value="profiling">Candidate Profiling</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Consent Text</Label>
                <Textarea
                  placeholder="I consent to the processing of my personal data..."
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Validity Period</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">6 months</SelectItem>
                      <SelectItem value="12">12 months</SelectItem>
                      <SelectItem value="24">24 months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Data Categories</Label>
                  <Input placeholder="e.g. Name, Email, Resume" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch />
                <Label className="text-sm">Require explicit opt-in</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConsentBuilderOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  toast.success("Consent form created successfully");
                  setConsentBuilderOpen(false);
                }}
              >
                Create Form
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Consented</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c, idx) => (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    className="border-b last:border-0 hover:bg-muted/30"
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{c.candidateName}</p>
                        <p className="text-xs text-muted-foreground">{c.candidateEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={PURPOSE_COLORS[c.purpose]} variant="outline">
                        {c.purpose}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{formatDate(c.consentedAt)}</TableCell>
                    <TableCell className="text-xs">{formatDate(c.expiresAt)}</TableCell>
                    <TableCell>
                      <Badge className={`${STATUS_COLORS[c.status]} text-[10px]`} variant="outline">
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {c.status === "expired" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() =>
                              toast.success(`Renewal sent to ${c.candidateName}`)
                            }
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Renew
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() =>
                            toast.info(`Viewing consent record for ${c.candidateName}`)
                          }
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Cookie Consent Stats */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Cookie className="h-4 w-4 text-amber-600" />
            Cookie Consent Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { label: "Necessary Only", value: "12%", color: "bg-gray-500" },
              { label: "Functional", value: "28%", color: "bg-blue-500" },
              { label: "Analytics Accepted", value: "64%", color: "bg-emerald-500" },
              { label: "All Cookies", value: "52%", color: "bg-violet-500" },
            ].map((cookie, i) => (
              <motion.div
                key={cookie.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="space-y-2"
              >
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{cookie.label}</span>
                  <span className="font-semibold">{cookie.value}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${cookie.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: cookie.value }}
                    transition={{ duration: 0.6, delay: i * 0.1 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DeletionRequests() {
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Manage &quot;Right to be Forgotten&quot; requests with full audit trails.
        </p>
        <Badge variant="outline" className="text-amber-600 border-amber-300">
          {DELETION_REQUESTS.filter((d) => d.status === "pending").length} pending
        </Badge>
      </div>

      <div className="space-y-3">
        {DELETION_REQUESTS.map((req, idx) => (
          <motion.div
            key={req.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06 }}
          >
            <Card className={req.status === "pending" ? "border-amber-200" : undefined}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        req.status === "completed"
                          ? "bg-emerald-100"
                          : req.status === "pending"
                          ? "bg-amber-100"
                          : req.status === "rejected"
                          ? "bg-red-100"
                          : "bg-blue-100"
                      }`}
                    >
                      {req.status === "completed" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : req.status === "rejected" ? (
                        <XCircle className="h-4 w-4 text-red-600" />
                      ) : req.status === "in_progress" ? (
                        <RefreshCw className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-amber-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{req.candidateName}</p>
                      <p className="text-xs text-muted-foreground">{req.candidateEmail}</p>
                      <p className="text-xs text-muted-foreground mt-1">{req.reason}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${STATUS_COLORS[req.status]} text-[10px]`} variant="outline">
                      {req.status.replace("_", " ")}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7"
                      onClick={() =>
                        setExpandedRequest(expandedRequest === req.id ? null : req.id)
                      }
                    >
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          expandedRequest === req.id ? "rotate-180" : ""
                        }`}
                      />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2 mt-2 flex-wrap">
                  {req.dataTypes.map((dt) => (
                    <Badge key={dt} variant="outline" className="text-[10px]">
                      {dt}
                    </Badge>
                  ))}
                </div>

                <AnimatePresence>
                  {expandedRequest === req.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <Separator className="my-3" />
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Audit Trail
                        </p>
                        {req.auditTrail.map((entry, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex items-start gap-3 relative"
                          >
                            {i < req.auditTrail.length - 1 && (
                              <div className="absolute left-[9px] top-5 bottom-0 w-px bg-muted" />
                            )}
                            <div className="h-[18px] w-[18px] rounded-full bg-muted flex items-center justify-center shrink-0 z-10">
                              <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                            </div>
                            <div>
                              <p className="text-xs font-medium">{entry.action}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {formatDateTime(entry.timestamp)} &middot; {entry.user}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                      {req.status === "pending" && (
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            className="text-xs"
                            onClick={() =>
                              toast.success(
                                `Deletion approved for ${req.candidateName}`
                              )
                            }
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Approve & Process
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() =>
                              toast.info(
                                `Rejection recorded for ${req.candidateName}`
                              )
                            }
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function DataRetention() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Archive className="h-4 w-4" />
            Data Retention Policies by Pipeline Stage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pipeline Stage</TableHead>
                  <TableHead>Retention Period</TableHead>
                  <TableHead>Auto-Delete</TableHead>
                  <TableHead>Records</TableHead>
                  <TableHead>Last Purge</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {RETENTION_POLICIES.map((policy, idx) => (
                  <motion.tr
                    key={policy.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="border-b last:border-0 hover:bg-muted/30"
                  >
                    <TableCell className="font-medium text-sm">
                      {policy.stage}
                    </TableCell>
                    <TableCell>
                      {policy.retentionDays === 0 ? (
                        <Badge variant="outline" className="text-[10px]">
                          No limit
                        </Badge>
                      ) : (
                        <span className="text-sm">
                          {policy.retentionDays} days
                          <span className="text-xs text-muted-foreground ml-1">
                            ({Math.round(policy.retentionDays / 365)}y)
                          </span>
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={policy.autoDelete}
                        onCheckedChange={() =>
                          toast.info(
                            `Auto-delete ${!policy.autoDelete ? "enabled" : "disabled"} for "${policy.stage}"`
                          )
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {policy.recordsCount}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {policy.lastPurge}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() =>
                          toast.success(`Manual purge initiated for "${policy.stage}"`)
                        }
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Purge Now
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Processing Records (GDPR Article 30) */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-blue-600" />
            Data Processing Records (GDPR Article 30)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {PROCESSING_RECORDS.map((record, idx) => (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
                className="rounded-lg border p-4 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <h4 className="font-semibold text-sm">{record.purpose}</h4>
                  <span className="text-xs text-muted-foreground">
                    Last reviewed: {formatDate(record.lastReviewed)}
                  </span>
                </div>
                <div className="grid gap-2 md:grid-cols-2 text-xs">
                  <div>
                    <span className="font-medium text-muted-foreground">Legal Basis: </span>
                    <span>{record.legalBasis}</span>
                  </div>
                  <div>
                    <span className="font-medium text-muted-foreground">Retention: </span>
                    <span>{record.retentionPeriod}</span>
                  </div>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {record.dataCategories.map((cat) => (
                    <Badge key={cat} variant="outline" className="text-[10px]">
                      {cat}
                    </Badge>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">Recipients: </span>
                  {record.recipients.join(", ")}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AuditLog() {
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");

  const filtered = AUDIT_LOG.filter((entry) => {
    if (categoryFilter !== "all" && entry.category !== categoryFilter) return false;
    if (severityFilter !== "all" && entry.severity !== severityFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="consent">Consent</SelectItem>
            <SelectItem value="deletion">Deletion</SelectItem>
            <SelectItem value="access">Access</SelectItem>
            <SelectItem value="export">Export</SelectItem>
            <SelectItem value="policy">Policy</SelectItem>
            <SelectItem value="breach">Breach</SelectItem>
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.success("Audit log exported to CSV")}
        >
          <Download className="h-4 w-4 mr-2" />
          Export Log
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((entry, idx) => (
                  <motion.tr
                    key={entry.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    className={`border-b last:border-0 hover:bg-muted/30 ${
                      entry.severity === "critical" ? "bg-red-50/50" : ""
                    }`}
                  >
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDateTime(entry.timestamp)}
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {entry.action}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {entry.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{entry.user}</TableCell>
                    <TableCell>
                      <Badge
                        className={`${SEVERITY_COLORS[entry.severity]} text-[10px]`}
                        variant="outline"
                      >
                        {entry.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                      {entry.details}
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PoliciesAndRisk() {
  const [eeoDialogOpen, setEeoDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Policy Templates */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <ScrollText className="h-4 w-4" />
            Policy Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {POLICY_TEMPLATES.map((policy, idx) => (
              <motion.div
                key={policy.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.06 }}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{policy.name}</p>
                    <Badge className={`${STATUS_COLORS[policy.status]} text-[10px]`} variant="outline">
                      {policy.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {policy.description}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">
                    Updated {formatDate(policy.lastUpdated)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() =>
                      toast.info(`Opening "${policy.name}" for editing`)
                    }
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => toast.success(`"${policy.name}" downloaded`)}
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* EEO/EEOC Reporting */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Scale className="h-4 w-4 text-violet-600" />
              EEO / EEOC Reporting
            </CardTitle>
            <Dialog open={eeoDialogOpen} onOpenChange={setEeoDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs">
                  <Settings className="h-3 w-3 mr-1" />
                  Collection Settings
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>EEO Data Collection Settings</DialogTitle>
                  <DialogDescription>
                    Configure which demographic data points are collected and how
                    they are stored.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {[
                    { label: "Gender Identity", desc: "Collect gender identity data", enabled: true },
                    { label: "Race / Ethnicity", desc: "Collect race and ethnicity information", enabled: true },
                    { label: "Veteran Status", desc: "Collect veteran status", enabled: true },
                    { label: "Disability Status", desc: "Collect disability information", enabled: false },
                    { label: "Age Range", desc: "Collect age range (not exact DOB)", enabled: false },
                  ].map((setting) => (
                    <div
                      key={setting.label}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{setting.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {setting.desc}
                        </p>
                      </div>
                      <Switch defaultChecked={setting.enabled} />
                    </div>
                  ))}
                </div>
                <DialogFooter>
                  <Button
                    onClick={() => {
                      toast.success("EEO collection settings updated");
                      setEeoDialogOpen(false);
                    }}
                  >
                    Save Settings
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              { label: "EEO-1 Component 1", status: "Filed", date: "Jan 5, 2026", color: "text-emerald-600" },
              { label: "VETS-4212", status: "Due Mar 31", date: "Not yet filed", color: "text-amber-600" },
              { label: "EEO-1 Component 2", status: "N/A", date: "Federal contractors only", color: "text-muted-foreground" },
            ].map((report, i) => (
              <motion.div
                key={report.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="rounded-lg border p-3"
              >
                <p className="font-medium text-sm">{report.label}</p>
                <p className={`text-sm font-semibold ${report.color}`}>{report.status}</p>
                <p className="text-xs text-muted-foreground">{report.date}</p>
              </motion.div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => toast.success("EEO-1 report generated and ready for download")}
            >
              <BarChart3 className="h-3 w-3 mr-1" />
              Generate Report
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() =>
                toast.success("Data export initiated for portability request")
              }
            >
              <Download className="h-3 w-3 mr-1" />
              Export Data (Portability)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Risk Assessment Matrix */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-orange-600" />
            Risk Assessment Matrix
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Risk</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Likelihood</TableHead>
                  <TableHead>Impact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Mitigation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {RISK_MATRIX.map((risk, idx) => (
                  <motion.tr
                    key={risk.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.04 }}
                    className={`border-b last:border-0 hover:bg-muted/30 ${
                      risk.status === "open" ? "bg-red-50/50" : ""
                    }`}
                  >
                    <TableCell className="font-medium text-sm">
                      {risk.risk}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {risk.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${LIKELIHOOD_COLORS[risk.likelihood]} text-[10px]`}
                        variant="outline"
                      >
                        {risk.likelihood}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${IMPACT_COLORS[risk.impact]} text-[10px]`}
                        variant="outline"
                      >
                        {risk.impact}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`text-[10px] ${
                          risk.status === "mitigated"
                            ? "bg-emerald-100 text-emerald-700"
                            : risk.status === "accepted"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-red-100 text-red-700"
                        }`}
                        variant="outline"
                      >
                        {risk.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs">
                      {risk.mitigation}
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────

export default function CompliancePage() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            GDPR & Compliance Center
          </h1>
          <p className="text-muted-foreground">
            Data privacy, regulatory compliance, and audit management
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              toast.success("Compliance report exported", {
                description: "Full compliance audit report has been generated.",
              })
            }
          >
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Button
            onClick={() =>
              toast.info("Running full compliance scan...", {
                description: "This may take a few minutes.",
              })
            }
          >
            <Shield className="mr-2 h-4 w-4" />
            Run Audit
          </Button>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="dashboard">
            <Shield className="h-4 w-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="consent">
            <UserCheck className="h-4 w-4 mr-2" />
            Consent
          </TabsTrigger>
          <TabsTrigger value="deletion">
            <Trash2 className="h-4 w-4 mr-2" />
            Deletion Requests
          </TabsTrigger>
          <TabsTrigger value="retention">
            <Archive className="h-4 w-4 mr-2" />
            Data Retention
          </TabsTrigger>
          <TabsTrigger value="audit">
            <ClipboardList className="h-4 w-4 mr-2" />
            Audit Log
          </TabsTrigger>
          <TabsTrigger value="policies">
            <ScrollText className="h-4 w-4 mr-2" />
            Policies & Risk
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <ComplianceDashboard />
        </TabsContent>

        <TabsContent value="consent">
          <ConsentManagement />
        </TabsContent>

        <TabsContent value="deletion">
          <DeletionRequests />
        </TabsContent>

        <TabsContent value="retention">
          <DataRetention />
        </TabsContent>

        <TabsContent value="audit">
          <AuditLog />
        </TabsContent>

        <TabsContent value="policies">
          <PoliciesAndRisk />
        </TabsContent>
      </Tabs>
    </div>
  );
}
