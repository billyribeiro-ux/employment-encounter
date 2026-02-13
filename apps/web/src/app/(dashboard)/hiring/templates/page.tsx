"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs";
import {
  useEmailTemplates,
  useCreateEmailTemplate,
  useUpdateEmailTemplate,
  useDeleteEmailTemplate,
  useBulkSendTemplate,
  type EmailTemplate,
  type TemplateCategory,
  type CreateEmailTemplatePayload,
} from "@/lib/hooks/use-email-templates";
import { toast } from "sonner";
import {
  Plus,
  Mail,
  Pencil,
  Trash2,
  Copy,
  MoreHorizontal,
  Eye,
  EyeOff,
  Send,
  Search,
  FileText,
  Loader2,
  ChevronDown,
  Users,
  Variable,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES: { value: TemplateCategory; label: string }[] = [
  { value: "application_received", label: "Application Received" },
  { value: "interview_invitation", label: "Interview Invitation" },
  { value: "rejection", label: "Rejection" },
  { value: "offer", label: "Offer" },
  { value: "follow_up", label: "Follow-up" },
  { value: "custom", label: "Custom" },
];

const CATEGORY_MAP: Record<TemplateCategory, string> = {
  application_received: "Application Received",
  interview_invitation: "Interview Invitation",
  rejection: "Rejection",
  offer: "Offer",
  follow_up: "Follow-up",
  custom: "Custom",
};

const CATEGORY_COLORS: Record<TemplateCategory, string> = {
  application_received: "bg-blue-100 text-blue-800",
  interview_invitation: "bg-emerald-100 text-emerald-800",
  rejection: "bg-red-100 text-red-800",
  offer: "bg-violet-100 text-violet-800",
  follow_up: "bg-amber-100 text-amber-800",
  custom: "bg-gray-100 text-gray-800",
};

const TEMPLATE_VARIABLES = [
  { key: "{{candidate_name}}", label: "Candidate Name" },
  { key: "{{job_title}}", label: "Job Title" },
  { key: "{{company_name}}", label: "Company Name" },
  { key: "{{interview_date}}", label: "Interview Date" },
  { key: "{{interview_time}}", label: "Interview Time" },
  { key: "{{interviewer_name}}", label: "Interviewer Name" },
  { key: "{{offer_salary}}", label: "Offer Salary" },
  { key: "{{start_date}}", label: "Start Date" },
  { key: "{{portal_link}}", label: "Portal Link" },
];

const SAMPLE_DATA: Record<string, string> = {
  "{{candidate_name}}": "Jane Smith",
  "{{job_title}}": "Senior Software Engineer",
  "{{company_name}}": "Acme Corp",
  "{{interview_date}}": "March 15, 2026",
  "{{interview_time}}": "2:00 PM EST",
  "{{interviewer_name}}": "John Davis",
  "{{offer_salary}}": "$150,000",
  "{{start_date}}": "April 1, 2026",
  "{{portal_link}}": "https://careers.acmecorp.com/portal",
};

const DEFAULT_TEMPLATES: Omit<
  EmailTemplate,
  "id" | "tenant_id" | "created_by" | "created_at" | "updated_at" | "usage_count"
>[] = [
  {
    name: "Application Received",
    category: "application_received",
    subject: "Thank you for applying to {{job_title}} at {{company_name}}",
    body: `Dear {{candidate_name}},

Thank you for your interest in the {{job_title}} position at {{company_name}}. We have received your application and our team is currently reviewing it.

We appreciate the time you took to apply, and we will be in touch soon regarding next steps. In the meantime, you can track your application status through our portal:

{{portal_link}}

If you have any questions, please don't hesitate to reach out.

Best regards,
The {{company_name}} Hiring Team`,
    is_active: true,
    is_default: true,
  },
  {
    name: "Phone Screen Invitation",
    category: "interview_invitation",
    subject: "Phone Screen Invitation - {{job_title}} at {{company_name}}",
    body: `Dear {{candidate_name}},

We were impressed by your application for the {{job_title}} position and would love to schedule a phone screen to learn more about your experience.

Interview Details:
- Type: Phone Screen
- Date: {{interview_date}}
- Time: {{interview_time}}
- Interviewer: {{interviewer_name}}

Please confirm your availability by replying to this email or through our scheduling portal:
{{portal_link}}

We look forward to speaking with you!

Best regards,
The {{company_name}} Hiring Team`,
    is_active: true,
    is_default: true,
  },
  {
    name: "Technical Interview",
    category: "interview_invitation",
    subject:
      "Technical Interview Scheduled - {{job_title}} at {{company_name}}",
    body: `Dear {{candidate_name}},

Congratulations on advancing to the technical interview stage for the {{job_title}} position at {{company_name}}!

Interview Details:
- Type: Technical Interview
- Date: {{interview_date}}
- Time: {{interview_time}}
- Interviewer: {{interviewer_name}}

What to expect:
- A coding exercise relevant to the role
- System design discussion
- Technical Q&A

Please make sure you have a stable internet connection and a quiet environment. You may use your preferred IDE or text editor.

Confirm your attendance: {{portal_link}}

Good luck!

Best regards,
The {{company_name}} Hiring Team`,
    is_active: true,
    is_default: true,
  },
  {
    name: "Onsite Invitation",
    category: "interview_invitation",
    subject: "Onsite Interview Invitation - {{job_title}} at {{company_name}}",
    body: `Dear {{candidate_name}},

We are excited to invite you for an onsite interview for the {{job_title}} position at {{company_name}}.

Interview Details:
- Type: Onsite Interview
- Date: {{interview_date}}
- Time: {{interview_time}}

Your schedule for the day will include meetings with several team members, including {{interviewer_name}}. We'll send a detailed itinerary closer to the date.

Please confirm your availability: {{portal_link}}

If you need any accommodations for travel or the interview process, please let us know.

We look forward to meeting you in person!

Best regards,
The {{company_name}} Hiring Team`,
    is_active: true,
    is_default: true,
  },
  {
    name: "Rejection - After Screen",
    category: "rejection",
    subject: "Update on your application for {{job_title}} at {{company_name}}",
    body: `Dear {{candidate_name}},

Thank you for taking the time to speak with us about the {{job_title}} position at {{company_name}}. We truly appreciate your interest in joining our team.

After careful consideration, we have decided to move forward with other candidates whose qualifications more closely align with our current needs for this particular role.

This decision does not reflect on your abilities, and we encourage you to apply for future openings that match your skills and experience.

We wish you all the best in your career journey.

Sincerely,
The {{company_name}} Hiring Team`,
    is_active: true,
    is_default: true,
  },
  {
    name: "Rejection - After Interview",
    category: "rejection",
    subject:
      "Update on your {{job_title}} interview at {{company_name}}",
    body: `Dear {{candidate_name}},

Thank you for interviewing with us for the {{job_title}} position at {{company_name}}. We enjoyed learning about your background and experience.

After thorough deliberation, we have decided to proceed with another candidate for this role. This was a difficult decision given the quality of your interview.

We value the time and effort you invested in the interview process. If you would like feedback on your interview, please don't hesitate to reach out and we'll be happy to provide it.

We will keep your profile in our talent pool and may reach out if a suitable opportunity arises in the future.

Thank you again, and we wish you the very best.

Warm regards,
The {{company_name}} Hiring Team`,
    is_active: true,
    is_default: true,
  },
  {
    name: "Offer Letter",
    category: "offer",
    subject: "Offer Letter - {{job_title}} at {{company_name}}",
    body: `Dear {{candidate_name}},

We are thrilled to extend an offer for the {{job_title}} position at {{company_name}}!

Offer Details:
- Position: {{job_title}}
- Annual Salary: {{offer_salary}}
- Start Date: {{start_date}}

Please review the full offer details and terms in the attached document. To accept or discuss the offer, please visit:

{{portal_link}}

This offer is valid for 7 business days. If you have any questions about the role, compensation, or benefits, please don't hesitate to reach out.

We are very excited about the possibility of you joining our team!

Best regards,
The {{company_name}} Hiring Team`,
    is_active: true,
    is_default: true,
  },
  {
    name: "Offer Accepted - Welcome",
    category: "offer",
    subject: "Welcome to {{company_name}}, {{candidate_name}}!",
    body: `Dear {{candidate_name}},

Welcome to {{company_name}}! We are absolutely delighted that you have accepted our offer for the {{job_title}} position.

Your start date is {{start_date}}. Here's what to expect next:

1. You'll receive an onboarding packet via email within the next few days
2. Our HR team will reach out to collect necessary documentation
3. Your manager, {{interviewer_name}}, will schedule a welcome call before your start date
4. On your first day, please arrive by {{interview_time}}

If you have any questions before your start date, feel free to reach out at any time through:
{{portal_link}}

The entire team is looking forward to working with you!

Warmest welcome,
The {{company_name}} Team`,
    is_active: true,
    is_default: true,
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderPreview(text: string): string {
  let result = text;
  for (const [key, value] of Object.entries(SAMPLE_DATA)) {
    result = result.replaceAll(key, value);
  }
  return result;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Template Editor Dialog
// ---------------------------------------------------------------------------

function TemplateEditorDialog({
  open,
  onOpenChange,
  template,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: EmailTemplate | null;
}) {
  const isEditing = !!template;
  const createTemplate = useCreateEmailTemplate();
  const updateTemplate = useUpdateEmailTemplate(template?.id ?? "");

  const [name, setName] = useState(template?.name ?? "");
  const [category, setCategory] = useState<TemplateCategory>(
    template?.category ?? "custom"
  );
  const [subject, setSubject] = useState(template?.subject ?? "");
  const [body, setBody] = useState(template?.body ?? "");
  const [isActive, setIsActive] = useState(template?.is_active ?? true);
  const [showPreview, setShowPreview] = useState(false);
  const [activeField, setActiveField] = useState<"subject" | "body">("body");

  function resetForm() {
    setName(template?.name ?? "");
    setCategory(template?.category ?? "custom");
    setSubject(template?.subject ?? "");
    setBody(template?.body ?? "");
    setIsActive(template?.is_active ?? true);
    setShowPreview(false);
  }

  function insertVariable(variable: string) {
    if (activeField === "subject") {
      setSubject((prev) => prev + variable);
    } else {
      setBody((prev) => prev + variable);
    }
  }

  async function handleSave() {
    if (!name.trim() || !subject.trim() || !body.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    const payload = {
      name: name.trim(),
      category,
      subject: subject.trim(),
      body: body.trim(),
      is_active: isActive,
    };

    try {
      if (isEditing) {
        await updateTemplate.mutateAsync(payload);
        toast.success("Template updated successfully");
      } else {
        await createTemplate.mutateAsync(payload);
        toast.success("Template created successfully");
      }
      onOpenChange(false);
      resetForm();
    } catch {
      toast.error(
        isEditing ? "Failed to update template" : "Failed to create template"
      );
    }
  }

  const isPending = createTemplate.isPending || updateTemplate.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Template" : "Create Template"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modify your email template. Use variables to personalize messages."
              : "Create a new email template for your hiring communications."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Technical Interview Invite"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={category}
                  onValueChange={(v) => setCategory(v as TemplateCategory)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-subject">Subject Line</Label>
              <Input
                id="template-subject"
                value={showPreview ? renderPreview(subject) : subject}
                onChange={(e) => setSubject(e.target.value)}
                onFocus={() => setActiveField("subject")}
                placeholder="e.g. Interview Invitation - {{job_title}}"
                readOnly={showPreview}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="template-body">Email Body</Label>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Variable className="mr-1 h-3 w-3" />
                        Insert Variable
                        <ChevronDown className="ml-1 h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {TEMPLATE_VARIABLES.map((v) => (
                        <DropdownMenuItem
                          key={v.key}
                          onClick={() => insertVariable(v.key)}
                        >
                          <code className="text-xs mr-2 bg-muted px-1 py-0.5 rounded">
                            {v.key}
                          </code>
                          {v.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant={showPreview ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    {showPreview ? (
                      <EyeOff className="mr-1 h-3 w-3" />
                    ) : (
                      <Eye className="mr-1 h-3 w-3" />
                    )}
                    {showPreview ? "Edit" : "Preview"}
                  </Button>
                </div>
              </div>
              {showPreview ? (
                <div className="min-h-[250px] rounded-md border bg-muted/30 p-4 text-sm whitespace-pre-wrap">
                  {renderPreview(body)}
                </div>
              ) : (
                <Textarea
                  id="template-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  onFocus={() => setActiveField("body")}
                  placeholder="Write your email body here. Use {{variable_name}} for personalization."
                  className="min-h-[250px] font-mono text-sm"
                />
              )}
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Active Status</Label>
                <p className="text-xs text-muted-foreground">
                  Inactive templates won&apos;t appear in the send menu
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>

            <div className="rounded-md bg-muted/50 p-3">
              <p className="text-xs font-medium mb-2 text-muted-foreground">
                Available Variables
              </p>
              <div className="flex flex-wrap gap-1.5">
                {TEMPLATE_VARIABLES.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => insertVariable(v.key)}
                    className="inline-flex items-center rounded-md bg-background border px-2 py-1 text-xs font-mono hover:bg-accent transition-colors cursor-pointer"
                  >
                    {v.key}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Save Changes" : "Create Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Bulk Send Dialog
// ---------------------------------------------------------------------------

function BulkSendDialog({
  open,
  onOpenChange,
  templates,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: EmailTemplate[];
}) {
  const bulkSend = useBulkSendTemplate();
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [candidateEmails, setCandidateEmails] = useState("");

  async function handleSend() {
    if (!selectedTemplate) {
      toast.error("Please select a template");
      return;
    }
    if (!candidateEmails.trim()) {
      toast.error("Please enter at least one candidate email");
      return;
    }

    const emails = candidateEmails
      .split("\n")
      .map((e) => e.trim())
      .filter(Boolean);

    try {
      await bulkSend.mutateAsync({
        template_id: selectedTemplate,
        candidate_ids: emails,
      });
      toast.success(`Email sent to ${emails.length} candidate(s)`);
      onOpenChange(false);
      setSelectedTemplate("");
      setCandidateEmails("");
    } catch {
      toast.error("Failed to send bulk emails");
    }
  }

  const activeTemplates = templates.filter((t) => t.is_active);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk Send Email</DialogTitle>
          <DialogDescription>
            Select a template and enter candidate emails to send in bulk.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Email Template</Label>
            <Select
              value={selectedTemplate}
              onValueChange={setSelectedTemplate}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {activeTemplates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Candidate Emails (one per line)</Label>
            <Textarea
              value={candidateEmails}
              onChange={(e) => setCandidateEmails(e.target.value)}
              placeholder={"jane@example.com\njohn@example.com\nalex@example.com"}
              className="min-h-[120px]"
            />
            <p className="text-xs text-muted-foreground">
              {candidateEmails
                .split("\n")
                .filter((e) => e.trim()).length}{" "}
              recipient(s)
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={bulkSend.isPending}>
            {bulkSend.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            <Send className="mr-2 h-4 w-4" />
            Send Emails
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Template Card
// ---------------------------------------------------------------------------

function TemplateCard({
  template,
  onEdit,
  onDuplicate,
}: {
  template: EmailTemplate;
  onEdit: (t: EmailTemplate) => void;
  onDuplicate: (t: EmailTemplate) => void;
}) {
  const deleteTemplate = useDeleteEmailTemplate();

  function handleDelete() {
    deleteTemplate.mutate(template.id, {
      onSuccess: () => toast.success("Template deleted"),
      onError: () => toast.error("Failed to delete template"),
    });
  }

  return (
    <Card className="group relative">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-semibold truncate">
                {template.name}
              </CardTitle>
              {!template.is_active && (
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  Inactive
                </Badge>
              )}
              {template.is_default && (
                <Badge variant="outline" className="text-[10px] shrink-0">
                  Default
                </Badge>
              )}
            </div>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                CATEGORY_COLORS[template.category]
              }`}
            >
              {CATEGORY_MAP[template.category]}
            </span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(template)}>
                <Pencil className="mr-2 h-3.5 w-3.5" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(template)}>
                <Copy className="mr-2 h-3.5 w-3.5" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Subject</p>
          <p className="text-sm truncate">{template.subject}</p>
        </div>
        <div className="text-xs text-muted-foreground line-clamp-2">
          {template.body}
        </div>
        <Separator />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Used {template.usage_count} time{template.usage_count !== 1 ? "s" : ""}
          </span>
          <span>Edited {formatDate(template.updated_at)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function TemplateCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
        <Separator />
        <div className="flex justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function EmailTemplatesPage() {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(
    null
  );
  const [bulkSendOpen, setBulkSendOpen] = useState(false);

  const { data: templates, isLoading } = useEmailTemplates(
    categoryFilter !== "all"
      ? { category: categoryFilter as TemplateCategory }
      : undefined
  );
  const createTemplate = useCreateEmailTemplate();

  // Merge API templates with defaults for display when no data loaded yet
  const displayTemplates = useMemo(() => {
    if (isLoading) return [];
    if (templates && templates.length > 0) {
      if (!searchQuery) return templates;
      const q = searchQuery.toLowerCase();
      return templates.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      );
    }

    // Display default templates when no API templates exist
    const now = new Date().toISOString();
    const defaults = DEFAULT_TEMPLATES.map((dt, i) => ({
      ...dt,
      id: `default-${i}`,
      tenant_id: "",
      created_by: "system",
      usage_count: 0,
      created_at: now,
      updated_at: now,
    }));

    if (!searchQuery) return defaults;
    const q = searchQuery.toLowerCase();
    return defaults.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
    );
  }, [templates, isLoading, searchQuery, categoryFilter]);

  function handleEdit(template: EmailTemplate) {
    setEditingTemplate(template);
    setEditorOpen(true);
  }

  function handleCreate() {
    setEditingTemplate(null);
    setEditorOpen(true);
  }

  function handleDuplicate(template: EmailTemplate) {
    const payload = {
      name: `${template.name} (Copy)`,
      category: template.category,
      subject: template.subject,
      body: template.body,
      is_active: template.is_active,
    };
    createTemplate.mutate(payload, {
      onSuccess: () => toast.success("Template duplicated"),
      onError: () => toast.error("Failed to duplicate template"),
    });
  }

  // Stats
  const totalCount = displayTemplates.length;
  const activeCount = displayTemplates.filter((t) => t.is_active).length;
  const categoryBreakdown = CATEGORIES.map((cat) => ({
    ...cat,
    count: displayTemplates.filter((t) => t.category === cat.value).length,
  }));

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Hiring", href: "/hiring" },
          { label: "Email Templates" },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Email Templates
          </h1>
          <p className="text-muted-foreground">
            Manage email templates for your hiring communications
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setBulkSendOpen(true)}
          >
            <Send className="mr-2 h-4 w-4" />
            Bulk Send
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-muted-foreground">
                Total Templates
              </span>
            </div>
            <p className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-7 w-10 inline-block" />
              ) : (
                totalCount
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Mail className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-medium text-muted-foreground">
                Active Templates
              </span>
            </div>
            <p className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-7 w-10 inline-block" />
              ) : (
                activeCount
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-medium text-muted-foreground">
                Categories Used
              </span>
            </div>
            <p className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-7 w-10 inline-block" />
              ) : (
                categoryBreakdown.filter((c) => c.count > 0).length
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Send className="h-4 w-4 text-violet-600" />
              <span className="text-xs font-medium text-muted-foreground">
                Total Sent
              </span>
            </div>
            <p className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-7 w-10 inline-block" />
              ) : (
                displayTemplates.reduce((sum, t) => sum + t.usage_count, 0)
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="pl-9 w-[250px]"
          />
        </div>
        <Select
          value={categoryFilter}
          onValueChange={setCategoryFilter}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Template Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <TemplateCardSkeleton key={i} />
          ))}
        </div>
      ) : displayTemplates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Mail className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No templates found</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              {searchQuery
                ? `No templates match "${searchQuery}". Try a different search.`
                : "Create your first email template to streamline your hiring communications."}
            </p>
            {!searchQuery && (
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Create Template
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {displayTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <TemplateEditorDialog
        key={editingTemplate?.id ?? "new"}
        open={editorOpen}
        onOpenChange={setEditorOpen}
        template={editingTemplate}
      />

      <BulkSendDialog
        open={bulkSendOpen}
        onOpenChange={setBulkSendOpen}
        templates={displayTemplates}
      />
    </div>
  );
}
