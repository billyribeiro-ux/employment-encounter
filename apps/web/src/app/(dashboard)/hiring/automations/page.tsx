"use client";

import { useState, useCallback } from "react";
import {
  Zap,
  Plus,
  Play,
  Pause,
  Trash2,
  Clock,
  Mail,
  ArrowRight,
  UserCheck,
  Bell,
  Tag,
  ClipboardCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Activity,
  Settings,
  Copy,
  RotateCcw,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs";
import { toast } from "sonner";

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  isEnabled: boolean;
  isTemplate: boolean;
  trigger: {
    type: string;
    label: string;
  };
  condition: {
    type: string;
    operator: string;
    value: string;
    label: string;
  };
  action: {
    type: string;
    label: string;
    config: Record<string, string>;
  };
  executionCount: number;
  lastExecuted: string | null;
  createdAt: string;
}

interface ExecutionLog {
  id: string;
  ruleId: string;
  ruleName: string;
  action: string;
  candidateName: string;
  jobTitle: string;
  status: "success" | "failed" | "skipped";
  executedAt: string;
  details: string;
}

const TRIGGER_OPTIONS = [
  { value: "application_received", label: "Application Received" },
  { value: "stage_changed", label: "Stage Changed" },
  { value: "scorecard_submitted", label: "Scorecard Submitted" },
  { value: "time_elapsed", label: "Time Elapsed (Days)" },
  { value: "offer_sent", label: "Offer Sent" },
  { value: "offer_accepted", label: "Offer Accepted" },
  { value: "candidate_rejected", label: "Candidate Rejected" },
];

const CONDITION_OPTIONS = [
  { value: "score_gt", label: "Average score greater than", operator: ">", field: "score" },
  { value: "score_lt", label: "Average score less than", operator: "<", field: "score" },
  { value: "skills_contain", label: "Skills contain", operator: "contains", field: "skills" },
  { value: "source_is", label: "Source is", operator: "=", field: "source" },
  { value: "stage_is", label: "Stage is", operator: "=", field: "stage" },
  { value: "days_in_stage_gt", label: "Days in stage greater than", operator: ">", field: "days" },
  { value: "any", label: "Always (no condition)", operator: "any", field: "none" },
];

const ACTION_OPTIONS = [
  { value: "send_email", label: "Send Email Template", icon: Mail },
  { value: "move_stage", label: "Move to Stage", icon: ArrowRight },
  { value: "assign_reviewer", label: "Assign Reviewer", icon: UserCheck },
  { value: "create_task", label: "Create Task", icon: ClipboardCheck },
  { value: "notify_team", label: "Notify Team", icon: Bell },
  { value: "add_tag", label: "Add Tag", icon: Tag },
];

const TEMPLATE_RULES: AutomationRule[] = [
  {
    id: "tpl_1",
    name: "Auto-acknowledge all applications",
    description: "Send a receipt confirmation email when a new application is received",
    isEnabled: false,
    isTemplate: true,
    trigger: { type: "application_received", label: "Application Received" },
    condition: { type: "any", operator: "any", value: "", label: "Always" },
    action: {
      type: "send_email",
      label: "Send Email: Application Received Confirmation",
      config: { template: "application_received" },
    },
    executionCount: 0,
    lastExecuted: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "tpl_2",
    name: "Auto-reject below threshold",
    description: "Automatically reject candidates if their average screening score is below 2.0",
    isEnabled: false,
    isTemplate: true,
    trigger: { type: "scorecard_submitted", label: "Scorecard Submitted" },
    condition: { type: "score_lt", operator: "<", value: "2", label: "Avg score < 2.0" },
    action: {
      type: "move_stage",
      label: "Reject Candidate",
      config: { stage: "rejected" },
    },
    executionCount: 0,
    lastExecuted: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "tpl_3",
    name: "Remind reviewer after 3 days",
    description: "Send a nudge notification if no scorecard is submitted within 3 days of assignment",
    isEnabled: false,
    isTemplate: true,
    trigger: { type: "time_elapsed", label: "3 Days Elapsed" },
    condition: {
      type: "days_in_stage_gt",
      operator: ">",
      value: "3",
      label: "Days in stage > 3 without scorecard",
    },
    action: {
      type: "notify_team",
      label: "Notify: Review reminder",
      config: { message: "Please submit your scorecard for this candidate" },
    },
    executionCount: 0,
    lastExecuted: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "tpl_4",
    name: "Advance high scorers",
    description: "Automatically advance candidates to the next stage if average score exceeds 4.5",
    isEnabled: false,
    isTemplate: true,
    trigger: { type: "scorecard_submitted", label: "Scorecard Submitted" },
    condition: {
      type: "score_gt",
      operator: ">",
      value: "4.5",
      label: "Avg score > 4.5",
    },
    action: {
      type: "move_stage",
      label: "Advance to next stage",
      config: { stage: "next" },
    },
    executionCount: 0,
    lastExecuted: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: "tpl_5",
    name: "Notify hiring manager on final round",
    description: "Send a notification to the hiring manager when a candidate reaches the onsite stage",
    isEnabled: false,
    isTemplate: true,
    trigger: { type: "stage_changed", label: "Stage Changed" },
    condition: { type: "stage_is", operator: "=", value: "onsite", label: "Stage is Onsite" },
    action: {
      type: "notify_team",
      label: "Notify: Candidate reached onsite round",
      config: { message: "A candidate has reached the onsite interview stage" },
    },
    executionCount: 0,
    lastExecuted: null,
    createdAt: new Date().toISOString(),
  },
];

const MOCK_LOGS: ExecutionLog[] = [
  {
    id: "log_1",
    ruleId: "tpl_1",
    ruleName: "Auto-acknowledge all applications",
    action: "Sent application confirmation email",
    candidateName: "Sarah Chen",
    jobTitle: "Senior Software Engineer",
    status: "success",
    executedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    details: "Email sent to sarah.chen@email.com",
  },
  {
    id: "log_2",
    ruleId: "tpl_4",
    ruleName: "Advance high scorers",
    action: "Advanced to technical round",
    candidateName: "Marcus Johnson",
    jobTitle: "Data Scientist",
    status: "success",
    executedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    details: "Average score: 4.7/5 - Advanced from screening to technical",
  },
  {
    id: "log_3",
    ruleId: "tpl_2",
    ruleName: "Auto-reject below threshold",
    action: "Rejected candidate",
    candidateName: "Anonymous Candidate",
    jobTitle: "Product Manager",
    status: "success",
    executedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    details: "Average score: 1.5/5 - Below threshold of 2.0",
  },
  {
    id: "log_4",
    ruleId: "tpl_3",
    ruleName: "Remind reviewer after 3 days",
    action: "Sent review reminder",
    candidateName: "Emily Rodriguez",
    jobTitle: "UX Designer",
    status: "success",
    executedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    details: "Reminder sent to reviewer: John Smith",
  },
  {
    id: "log_5",
    ruleId: "tpl_1",
    ruleName: "Auto-acknowledge all applications",
    action: "Sent application confirmation email",
    candidateName: "James Wilson",
    jobTitle: "Backend Engineer",
    status: "failed",
    executedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    details: "Email delivery failed: Invalid email address",
  },
  {
    id: "log_6",
    ruleId: "tpl_5",
    ruleName: "Notify hiring manager on final round",
    action: "Sent notification",
    candidateName: "Lisa Park",
    jobTitle: "Frontend Engineer",
    status: "success",
    executedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    details: "Notification sent to hiring manager: Alex Thompson",
  },
  {
    id: "log_7",
    ruleId: "tpl_4",
    ruleName: "Advance high scorers",
    action: "Skipped - already in final stage",
    candidateName: "David Kim",
    jobTitle: "DevOps Engineer",
    status: "skipped",
    executedAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    details: "Candidate already in offer stage, cannot advance further",
  },
  {
    id: "log_8",
    ruleId: "tpl_1",
    ruleName: "Auto-acknowledge all applications",
    action: "Sent application confirmation email",
    candidateName: "Anna Mueller",
    jobTitle: "Marketing Analyst",
    status: "success",
    executedAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    details: "Email sent to anna.m@email.com",
  },
];

let ruleCounter = 100;

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function statusIcon(status: "success" | "failed" | "skipped") {
  switch (status) {
    case "success":
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "skipped":
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
  }
}

function statusBadge(status: "success" | "failed" | "skipped") {
  switch (status) {
    case "success":
      return (
        <Badge className="text-[10px] bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
          Success
        </Badge>
      );
    case "failed":
      return (
        <Badge className="text-[10px] bg-red-100 text-red-700 hover:bg-red-100">
          Failed
        </Badge>
      );
    case "skipped":
      return (
        <Badge className="text-[10px] bg-amber-100 text-amber-700 hover:bg-amber-100">
          Skipped
        </Badge>
      );
  }
}

function RuleCard({
  rule,
  onToggle,
  onDelete,
  onDuplicate,
}: {
  rule: AutomationRule;
  onToggle: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className={`transition-all ${rule.isEnabled ? "" : "opacity-60"}`}>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
              rule.isEnabled
                ? "bg-emerald-100 text-emerald-600"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <Zap className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">{rule.name}</h3>
                  {rule.isTemplate && (
                    <Badge variant="secondary" className="text-[10px]">
                      Template
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {rule.description}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Switch
                  checked={rule.isEnabled}
                  onCheckedChange={onToggle}
                />
              </div>
            </div>

            {/* Rule flow visualization */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <Badge variant="outline" className="text-[10px] gap-1">
                <Clock className="h-2.5 w-2.5" />
                WHEN: {rule.trigger.label}
              </Badge>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <Badge variant="outline" className="text-[10px] gap-1">
                <Settings className="h-2.5 w-2.5" />
                IF: {rule.condition.label}
              </Badge>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <Badge variant="outline" className="text-[10px] gap-1 bg-blue-50 text-blue-700 border-blue-200">
                <Zap className="h-2.5 w-2.5" />
                THEN: {rule.action.label}
              </Badge>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                Executed {rule.executionCount}x
              </span>
              {rule.lastExecuted && (
                <span>Last run: {formatRelativeTime(rule.lastExecuted)}</span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 mt-2">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="h-3 w-3" /> Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3" /> Details
                  </>
                )}
              </button>
              <span className="text-muted-foreground/30 mx-1">|</span>
              <button
                onClick={onDuplicate}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <Copy className="h-3 w-3" /> Duplicate
              </button>
              <span className="text-muted-foreground/30 mx-1">|</span>
              <button
                onClick={onDelete}
                className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600"
              >
                <Trash2 className="h-3 w-3" /> Delete
              </button>
            </div>

            {expanded && (
              <div className="mt-3 p-3 rounded-lg bg-muted/50 space-y-2 text-xs">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="font-semibold mb-1">Trigger</p>
                    <p className="text-muted-foreground">
                      Type: {rule.trigger.type.replace(/_/g, " ")}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Condition</p>
                    <p className="text-muted-foreground">
                      {rule.condition.type !== "any"
                        ? `${rule.condition.type.replace(/_/g, " ")} ${rule.condition.operator} ${rule.condition.value}`
                        : "No condition (always executes)"}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Action</p>
                    <p className="text-muted-foreground">
                      Type: {rule.action.type.replace(/_/g, " ")}
                    </p>
                    {Object.entries(rule.action.config).map(([k, v]) => (
                      <p key={k} className="text-muted-foreground">
                        {k}: {v}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AutomationsPage() {
  const [rules, setRules] = useState<AutomationRule[]>(TEMPLATE_RULES);
  const [logs] = useState<ExecutionLog[]>(MOCK_LOGS);

  // New rule form
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newTrigger, setNewTrigger] = useState("application_received");
  const [newCondition, setNewCondition] = useState("any");
  const [newConditionValue, setNewConditionValue] = useState("");
  const [newAction, setNewAction] = useState("send_email");
  const [newActionConfig, setNewActionConfig] = useState("");

  const enabledCount = rules.filter((r) => r.isEnabled).length;
  const totalExecutions = rules.reduce((sum, r) => sum + r.executionCount, 0);

  function handleToggle(ruleId: string) {
    setRules((prev) =>
      prev.map((r) =>
        r.id === ruleId ? { ...r, isEnabled: !r.isEnabled } : r
      )
    );
    const rule = rules.find((r) => r.id === ruleId);
    toast.success(
      rule?.isEnabled ? "Automation paused" : "Automation activated"
    );
  }

  function handleDelete(ruleId: string) {
    setRules((prev) => prev.filter((r) => r.id !== ruleId));
    toast.success("Automation rule deleted");
  }

  function handleDuplicate(ruleId: string) {
    const rule = rules.find((r) => r.id === ruleId);
    if (!rule) return;
    const newRule: AutomationRule = {
      ...rule,
      id: `rule_${++ruleCounter}`,
      name: `${rule.name} (Copy)`,
      isEnabled: false,
      isTemplate: false,
      executionCount: 0,
      lastExecuted: null,
      createdAt: new Date().toISOString(),
    };
    setRules((prev) => [newRule, ...prev]);
    toast.success("Rule duplicated");
  }

  function handleCreateRule() {
    if (!newName.trim()) return;

    const triggerOption = TRIGGER_OPTIONS.find((t) => t.value === newTrigger);
    const conditionOption = CONDITION_OPTIONS.find((c) => c.value === newCondition);
    const actionOption = ACTION_OPTIONS.find((a) => a.value === newAction);

    const newRule: AutomationRule = {
      id: `rule_${++ruleCounter}`,
      name: newName.trim(),
      description: newDescription.trim() || `Custom automation rule`,
      isEnabled: false,
      isTemplate: false,
      trigger: {
        type: newTrigger,
        label: triggerOption?.label || newTrigger,
      },
      condition: {
        type: newCondition,
        operator: conditionOption?.operator || "=",
        value: newConditionValue,
        label: newCondition === "any"
          ? "Always"
          : `${conditionOption?.label || newCondition} ${newConditionValue}`,
      },
      action: {
        type: newAction,
        label: actionOption?.label || newAction,
        config: newActionConfig ? { value: newActionConfig } : {},
      },
      executionCount: 0,
      lastExecuted: null,
      createdAt: new Date().toISOString(),
    };

    setRules((prev) => [newRule, ...prev]);
    toast.success("Automation rule created");
    setNewName("");
    setNewDescription("");
    setNewTrigger("application_received");
    setNewCondition("any");
    setNewConditionValue("");
    setNewAction("send_email");
    setNewActionConfig("");
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Hiring", href: "/hiring" },
          { label: "Pipeline Automations" },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Zap className="h-6 w-6 text-amber-500" />
            Pipeline Automations
          </h1>
          <p className="text-muted-foreground">
            Configure automated actions to streamline your hiring pipeline
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Automation Rule</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <Input
                placeholder="Rule name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <Input
                placeholder="Description (optional)"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
              />
              <Separator />
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold flex items-center gap-1 mb-1.5">
                    <Clock className="h-3 w-3" /> WHEN (Trigger)
                  </label>
                  <Select value={newTrigger} onValueChange={setNewTrigger}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRIGGER_OPTIONS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-semibold flex items-center gap-1 mb-1.5">
                    <Settings className="h-3 w-3" /> IF (Condition)
                  </label>
                  <div className="flex gap-2">
                    <Select value={newCondition} onValueChange={setNewCondition}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONDITION_OPTIONS.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {newCondition !== "any" && (
                      <Input
                        placeholder="Value..."
                        value={newConditionValue}
                        onChange={(e) => setNewConditionValue(e.target.value)}
                        className="w-[120px]"
                      />
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold flex items-center gap-1 mb-1.5">
                    <Zap className="h-3 w-3" /> THEN (Action)
                  </label>
                  <Select value={newAction} onValueChange={setNewAction}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTION_OPTIONS.map((a) => (
                        <SelectItem key={a.value} value={a.value}>
                          {a.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Action config (e.g., email template, stage name)..."
                    value={newActionConfig}
                    onChange={(e) => setNewActionConfig(e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleCreateRule} disabled={!newName.trim()}>
                Create Rule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-medium text-muted-foreground">
                Total Rules
              </span>
            </div>
            <p className="text-2xl font-bold">{rules.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Play className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-medium text-muted-foreground">
                Active Rules
              </span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{enabledCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-muted-foreground">
                Total Executions
              </span>
            </div>
            <p className="text-2xl font-bold">{totalExecutions}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-medium text-muted-foreground">
                Success Rate
              </span>
            </div>
            <p className="text-2xl font-bold">
              {logs.length > 0
                ? `${Math.round(
                    (logs.filter((l) => l.status === "success").length /
                      logs.length) *
                      100
                  )}%`
                : "N/A"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rules" className="gap-1.5">
            <Zap className="h-4 w-4" />
            Rules ({rules.length})
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5">
            <Sparkles className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-1.5">
            <Activity className="h-4 w-4" />
            Execution Log ({logs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rules">
          {rules.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="rounded-full bg-amber-100 p-4 mb-4">
                    <Zap className="h-8 w-8 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1">
                    No Automation Rules
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Create your first automation rule or use one of the
                    pre-built templates to get started.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => (
                <RuleCard
                  key={rule.id}
                  rule={rule}
                  onToggle={() => handleToggle(rule.id)}
                  onDelete={() => handleDelete(rule.id)}
                  onDuplicate={() => handleDuplicate(rule.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-2">
              Pre-built automation templates you can activate or customize.
              Enable any template to start using it immediately.
            </p>
            {TEMPLATE_RULES.map((tpl) => {
              const existingRule = rules.find((r) => r.id === tpl.id);
              return (
                <Card key={tpl.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold">{tpl.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {tpl.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge variant="outline" className="text-[10px]">
                            WHEN: {tpl.trigger.label}
                          </Badge>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <Badge variant="outline" className="text-[10px]">
                            IF: {tpl.condition.label}
                          </Badge>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                            THEN: {tpl.action.label}
                          </Badge>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {existingRule ? (
                          <Switch
                            checked={existingRule.isEnabled}
                            onCheckedChange={() => handleToggle(tpl.id)}
                          />
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRules((prev) => [...prev, { ...tpl, isEnabled: true }]);
                              toast.success("Template activated");
                            }}
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            Add
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardContent className="p-0">
              {logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Activity className="h-8 w-8 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No automation executions yet. Enable rules to see activity here.
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30"
                    >
                      <div className="mt-0.5">{statusIcon(log.status)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{log.action}</p>
                          {statusBadge(log.status)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {log.candidateName} &middot; {log.jobTitle}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {log.details}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-[10px]">
                            {log.ruleName}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {formatRelativeTime(log.executedAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
