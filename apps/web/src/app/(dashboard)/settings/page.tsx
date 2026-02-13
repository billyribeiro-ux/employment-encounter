"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import {
  Users,
  Shield,
  Mail,
  Loader2,
  Trash2,
  Plus,
  Copy,
  Eye,
  EyeOff,
  Link2,
  Webhook,
  Key,
  Bell,
  Briefcase,
  Globe,
  Palette,
  Settings2,
  ArrowRight,
  GripVertical,
  Upload,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import {
  useProfile,
  useUpdateProfile,
  useFirmSettings,
  useUpdateFirmSettings,
  useTeamUsers,
  useInviteUser,
  useUpdateUserRole,
  useDeleteUser,
  type UserProfile,
} from "@/lib/hooks/use-settings";
import { motion, AnimatePresence } from "framer-motion";

// ---------------------------------------------------------------------------
// Zod Schemas
// ---------------------------------------------------------------------------

const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(100),
  last_name: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  title: z.string().optional(),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

const companySchema = z.object({
  name: z.string().min(1, "Company name is required").max(255),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  website: z.string().optional(),
  address: z.string().optional(),
  timezone: z.string(),
  target_cost_per_hire: z.number().min(0),
});
type CompanyFormValues = z.infer<typeof companySchema>;

const inviteSchema = z.object({
  email: z.string().email("Valid email is required"),
  role: z.string().min(1, "Role is required"),
  first_name: z.string().min(1, "First name is required").max(100),
  last_name: z.string().min(1, "Last name is required").max(100),
});
type InviteFormValues = z.infer<typeof inviteSchema>;

const passwordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z.string().min(12, "Password must be at least 12 characters"),
    confirm_password: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });
type PasswordFormValues = z.infer<typeof passwordSchema>;

// ---------------------------------------------------------------------------
// Profile Tab
// ---------------------------------------------------------------------------

function ProfileTab() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      title: "",
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        email: profile.email || "",
        phone: "",
        title: "",
      });
    }
  }, [profile, form]);

  async function onSubmit(values: ProfileFormValues) {
    try {
      await updateProfile.mutateAsync({
        first_name: values.first_name,
        last_name: values.last_name,
      });
      toast.success("Profile updated successfully");
    } catch {
      toast.error("Failed to update profile");
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-9 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-9 w-full" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-9 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-9 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-9 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Update your personal information</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="(555) 123-4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Recruiter, Hiring Manager" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Company Tab
// ---------------------------------------------------------------------------

function CompanyTab() {
  const { data: firm, isLoading } = useFirmSettings();
  const updateFirm = useUpdateFirmSettings();

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      website: "",
      address: "",
      timezone: "America/New_York",
      target_cost_per_hire: 5000,
    },
  });

  useEffect(() => {
    if (firm) {
      const s = (firm.settings || {}) as Record<string, unknown>;
      form.reset({
        name: firm.name || "",
        phone: (s.phone as string) || "",
        email: (s.email as string) || "",
        website: (s.website as string) || "",
        address: (s.address as string) || "",
        timezone: (s.timezone as string) || "America/New_York",
        target_cost_per_hire: (s.target_cost_per_hire as number) || 5000,
      });
    }
  }, [firm, form]);

  async function onSubmit(values: CompanyFormValues) {
    try {
      await updateFirm.mutateAsync({
        name: values.name,
        settings: {
          phone: values.phone,
          email: values.email,
          website: values.website,
          address: values.address,
          timezone: values.timezone,
          target_cost_per_hire: values.target_cost_per_hire,
        },
      });
      toast.success("Company settings updated successfully");
    } catch {
      toast.error("Failed to update company settings");
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Company Settings</CardTitle>
            <CardDescription>Manage your company profile and preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Company Settings</CardTitle>
          <CardDescription>Manage your company profile and preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your Company Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="(555) 000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="hiring@yourcompany.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://yourcompany.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="123 Main St, Suite 100, City, ST 12345" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timezone</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="America/New_York">Eastern (ET)</SelectItem>
                          <SelectItem value="America/Chicago">Central (CT)</SelectItem>
                          <SelectItem value="America/Denver">Mountain (MT)</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific (PT)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="target_cost_per_hire"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Cost-per-Hire ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="5000"
                          value={field.value}
                          onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" disabled={updateFirm.isPending}>
                {updateFirm.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pipeline Configuration Tab
// ---------------------------------------------------------------------------

function PipelineTab() {
  const [stages, setStages] = useState([
    { id: "1", name: "Applied", color: "bg-blue-500" },
    { id: "2", name: "Screening", color: "bg-sky-500" },
    { id: "3", name: "Phone Screen", color: "bg-indigo-500" },
    { id: "4", name: "Technical Interview", color: "bg-purple-500" },
    { id: "5", name: "Onsite Interview", color: "bg-orange-500" },
    { id: "6", name: "Offer", color: "bg-amber-500" },
    { id: "7", name: "Hired", color: "bg-green-500" },
  ]);
  const [newStageName, setNewStageName] = useState("");

  function addStage() {
    if (!newStageName.trim()) return;
    const id = String(Date.now());
    setStages((prev) => [
      ...prev.slice(0, -1),
      { id, name: newStageName.trim(), color: "bg-violet-500" },
      prev[prev.length - 1],
    ]);
    setNewStageName("");
    toast.success("Stage added");
  }

  function removeStage(id: string) {
    setStages((prev) => prev.filter((s) => s.id !== id));
    toast.success("Stage removed");
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Pipeline Stages
          </CardTitle>
          <CardDescription>
            Configure the stages candidates move through in your hiring pipeline
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 mb-4">
            {stages.map((stage, i) => (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 rounded-md border p-3"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                <div className={`h-3 w-3 rounded-full ${stage.color}`} />
                <span className="text-sm font-medium flex-1">{stage.name}</span>
                <Badge variant="outline" className="text-xs">
                  Stage {i + 1}
                </Badge>
                {i > 0 && i < stages.length - 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => removeStage(stage.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </motion.div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="New stage name..."
              value={newStageName}
              onChange={(e) => setNewStageName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addStage()}
              className="max-w-xs"
            />
            <Button variant="outline" size="sm" onClick={addStage}>
              <Plus className="mr-1 h-3 w-3" />
              Add Stage
            </Button>
          </div>
          <Separator className="my-4" />
          <Button onClick={() => toast.success("Pipeline configuration saved")}>
            Save Pipeline
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Default Pipeline</CardTitle>
          <CardDescription>
            Choose which pipeline is used when creating new jobs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select defaultValue="standard">
            <SelectTrigger className="w-[280px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Standard Pipeline (7 stages)</SelectItem>
              <SelectItem value="fast-track">Fast Track (4 stages)</SelectItem>
              <SelectItem value="executive">Executive (9 stages)</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Notifications Tab
// ---------------------------------------------------------------------------

function NotificationsTab() {
  const [settings, setSettings] = useState({
    new_application: true,
    stage_change: true,
    interview_scheduled: true,
    interview_reminder: true,
    scorecard_submitted: true,
    offer_sent: true,
    offer_accepted: true,
    offer_declined: true,
    candidate_withdrawn: true,
    team_mention: true,
    weekly_digest: true,
    daily_summary: false,
  });

  function toggle(key: keyof typeof settings) {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const notifications = [
    { key: "new_application" as const, label: "New Application Received", description: "When a candidate applies to a job" },
    { key: "stage_change" as const, label: "Stage Change", description: "When a candidate moves between pipeline stages" },
    { key: "interview_scheduled" as const, label: "Interview Scheduled", description: "When an interview is booked" },
    { key: "interview_reminder" as const, label: "Interview Reminder", description: "30 minutes before an interview starts" },
    { key: "scorecard_submitted" as const, label: "Scorecard Submitted", description: "When a team member submits an evaluation" },
    { key: "offer_sent" as const, label: "Offer Sent", description: "When an offer letter is sent to a candidate" },
    { key: "offer_accepted" as const, label: "Offer Accepted", description: "When a candidate accepts an offer" },
    { key: "offer_declined" as const, label: "Offer Declined", description: "When a candidate declines an offer" },
    { key: "candidate_withdrawn" as const, label: "Candidate Withdrawn", description: "When a candidate withdraws their application" },
    { key: "team_mention" as const, label: "Team Mentions", description: "When someone mentions you in a note or comment" },
    { key: "weekly_digest" as const, label: "Weekly Digest", description: "Summary of hiring activity sent every Monday" },
    { key: "daily_summary" as const, label: "Daily Summary", description: "End-of-day summary of all activity" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Email Notifications
        </CardTitle>
        <CardDescription>
          Choose which events trigger email notifications
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {notifications.map((n) => (
            <div
              key={n.key}
              className="flex items-center justify-between rounded-md border p-3"
            >
              <div>
                <p className="text-sm font-medium">{n.label}</p>
                <p className="text-xs text-muted-foreground">{n.description}</p>
              </div>
              <Switch
                checked={settings[n.key]}
                onCheckedChange={() => toggle(n.key)}
              />
            </div>
          ))}
        </div>
        <Separator className="my-4" />
        <Button onClick={() => toast.success("Notification preferences saved")}>
          Save Preferences
        </Button>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Career Page Tab
// ---------------------------------------------------------------------------

function CareerPageTab() {
  const [companyDescription, setCompanyDescription] = useState(
    "We are a growing company looking for talented individuals to join our team."
  );
  const [customCss, setCustomCss] = useState("");

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Career Page Settings
          </CardTitle>
          <CardDescription>
            Customize your public-facing career page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Company Description</label>
            <Textarea
              value={companyDescription}
              onChange={(e) => setCompanyDescription(e.target.value)}
              rows={4}
              placeholder="Tell candidates about your company culture, mission, and values..."
            />
            <p className="text-xs text-muted-foreground">
              This appears at the top of your careers page
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Company Logo</label>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <Button variant="outline" size="sm">
                  <Upload className="mr-2 h-3 w-3" />
                  Upload Logo
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG up to 2MB. Recommended 400x400px
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Cover Image</label>
            <div className="h-24 w-full rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
              <div className="text-center">
                <Upload className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">
                  Drop an image or click to upload
                </p>
              </div>
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <label className="text-sm font-medium">Custom CSS</label>
            <Textarea
              value={customCss}
              onChange={(e) => setCustomCss(e.target.value)}
              rows={3}
              placeholder=".career-page { /* your custom styles */ }"
              className="font-mono text-xs"
            />
          </div>
          <Button onClick={() => toast.success("Career page settings saved")}>
            Save Changes
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Theme
          </CardTitle>
          <CardDescription>
            Customize colors to match your brand
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Primary Color</label>
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-md bg-primary border" />
                <Input defaultValue="#6366f1" className="max-w-32 font-mono text-xs" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Accent Color</label>
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-md bg-blue-500 border" />
                <Input defaultValue="#3b82f6" className="max-w-32 font-mono text-xs" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// API Keys Tab
// ---------------------------------------------------------------------------

function ApiKeysTab() {
  const [keys, setKeys] = useState([
    {
      id: "1",
      name: "Production API Key",
      prefix: "sk_live_...x4f2",
      created: "2026-01-15",
      lastUsed: "2026-02-12",
      status: "active",
    },
    {
      id: "2",
      name: "Development API Key",
      prefix: "sk_test_...m9k1",
      created: "2026-01-20",
      lastUsed: "2026-02-10",
      status: "active",
    },
  ]);
  const [showKey, setShowKey] = useState<string | null>(null);

  function revokeKey(id: string) {
    setKeys((prev) => prev.filter((k) => k.id !== id));
    toast.success("API key revoked");
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                API Keys
              </CardTitle>
              <CardDescription>
                Manage API keys for programmatic access to your hiring data
              </CardDescription>
            </div>
            <Button
              size="sm"
              onClick={() => {
                const newKey = {
                  id: String(Date.now()),
                  name: "New API Key",
                  prefix: `sk_live_...${Math.random().toString(36).slice(-4)}`,
                  created: new Date().toISOString().slice(0, 10),
                  lastUsed: "Never",
                  status: "active",
                };
                setKeys((prev) => [...prev, newKey]);
                toast.success("New API key generated");
              }}
            >
              <Plus className="mr-1 h-3 w-3" />
              Generate Key
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {keys.length === 0 ? (
            <div className="text-center py-8">
              <Key className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No API keys yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {keys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Key className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{key.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {key.prefix}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() =>
                            setShowKey(showKey === key.id ? null : key.id)
                          }
                        >
                          {showKey === key.id ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => {
                            navigator.clipboard.writeText(key.prefix);
                            toast.success("Copied to clipboard");
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Created {key.created} · Last used {key.lastUsed}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => revokeKey(key.id)}
                  >
                    Revoke
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-4 w-4" />
            Webhooks
          </CardTitle>
          <CardDescription>
            Receive real-time notifications when events happen in your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">Application Events</p>
                <code className="text-xs text-muted-foreground">
                  https://api.yoursite.com/webhooks/applications
                </code>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-xs">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Active
                </Badge>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Settings2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">Interview Events</p>
                <code className="text-xs text-muted-foreground">
                  https://api.yoursite.com/webhooks/interviews
                </code>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  <XCircle className="mr-1 h-3 w-3" />
                  Inactive
                </Badge>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Settings2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
          <Separator className="my-4" />
          <Button variant="outline" size="sm">
            <Plus className="mr-1 h-3 w-3" />
            Add Webhook Endpoint
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Team Tab
// ---------------------------------------------------------------------------

function InviteMemberDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const inviteUser = useInviteUser();

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      role: "staff",
      first_name: "",
      last_name: "",
    },
  });

  async function onSubmit(values: InviteFormValues) {
    try {
      await inviteUser.mutateAsync(values);
      toast.success(`Invitation sent to ${values.email}`);
      form.reset();
      onOpenChange(false);
    } catch {
      toast.error("Failed to send invitation");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Send an invitation to join your company.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Jane" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="jane@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="hiring_manager">Hiring Manager</SelectItem>
                      <SelectItem value="recruiter">Recruiter</SelectItem>
                      <SelectItem value="interviewer">Interviewer</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={inviteUser.isPending}>
                {inviteUser.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Send Invitation
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function TeamMemberRow({ member, currentUserId }: { member: UserProfile; currentUserId?: string }) {
  const updateRole = useUpdateUserRole();
  const deleteUser = useDeleteUser();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isCurrentUser = member.id === currentUserId;
  const initials = `${(member.first_name || "?")[0]}${(member.last_name || "?")[0]}`.toUpperCase();

  function handleRoleChange(newRole: string) {
    updateRole.mutate(
      { userId: member.id, role: newRole },
      {
        onSuccess: () => toast.success(`Role updated to ${newRole}`),
        onError: () => toast.error("Failed to update role"),
      }
    );
  }

  function handleDelete() {
    deleteUser.mutate(member.id, {
      onSuccess: () => {
        toast.success("Team member removed");
        setConfirmDelete(false);
      },
      onError: () => toast.error("Failed to remove team member"),
    });
  }

  return (
    <>
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
            {initials}
          </div>
          <div>
            <p className="text-sm font-medium">
              {member.first_name} {member.last_name}
              {isCurrentUser && (
                <span className="text-muted-foreground ml-1">(you)</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">{member.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={member.status === "active" ? "default" : "secondary"}
            className="capitalize"
          >
            {member.status}
          </Badge>
          {isCurrentUser ? (
            <Badge variant="outline">
              <Shield className="mr-1 h-3 w-3" />
              <span className="capitalize">{member.role}</span>
            </Badge>
          ) : (
            <Select
              value={member.role}
              onValueChange={handleRoleChange}
              disabled={updateRole.isPending}
            >
              <SelectTrigger className="h-7 w-[130px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="hiring_manager">Hiring Manager</SelectItem>
                <SelectItem value="recruiter">Recruiter</SelectItem>
                <SelectItem value="interviewer">Interviewer</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
          )}
          {!isCurrentUser && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => setConfirmDelete(true)}
              disabled={deleteUser.isPending}
            >
              {deleteUser.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove team member?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {member.first_name} {member.last_name} (
              {member.email}) from your company. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUser.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function TeamTab() {
  const { user } = useAuthStore();
  const { data: teamMembers, isLoading } = useTeamUsers();
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>Invite and manage team members</CardDescription>
            </div>
            <Button onClick={() => setInviteOpen(true)}>
              <Mail className="mr-2 h-4 w-4" />
              Invite Member
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {isLoading && (
              <>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-9 w-9 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-7 w-[130px]" />
                    </div>
                  </div>
                ))}
              </>
            )}

            {!isLoading && teamMembers && teamMembers.length > 0 && (
              teamMembers.map((member) => (
                <TeamMemberRow
                  key={member.id}
                  member={member}
                  currentUserId={user?.id}
                />
              ))
            )}

            {!isLoading && (!teamMembers || teamMembers.length === 0) && (
              <div className="flex flex-col items-center justify-center py-6 text-center border rounded-lg border-dashed">
                <Users className="h-6 w-6 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No team members yet. Invite recruiters, hiring managers, and admins to your company.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <InviteMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Integrations Tab
// ---------------------------------------------------------------------------

function IntegrationsTab() {
  const integrations = [
    {
      name: "Google Calendar",
      description: "Sync interview schedules with Google Calendar",
      connected: true,
      icon: "bg-red-100 text-red-700",
    },
    {
      name: "Outlook Calendar",
      description: "Sync interview schedules with Microsoft Outlook",
      connected: false,
      icon: "bg-blue-100 text-blue-700",
    },
    {
      name: "Slack",
      description: "Get hiring notifications in Slack channels",
      connected: true,
      icon: "bg-purple-100 text-purple-700",
    },
    {
      name: "LinkedIn",
      description: "Post jobs and import candidate profiles",
      connected: false,
      icon: "bg-sky-100 text-sky-700",
    },
    {
      name: "Indeed",
      description: "Syndicate job postings to Indeed",
      connected: false,
      icon: "bg-indigo-100 text-indigo-700",
    },
    {
      name: "BambooHR",
      description: "Sync hired candidates to your HRIS",
      connected: false,
      icon: "bg-green-100 text-green-700",
    },
    {
      name: "DocuSign",
      description: "Send offer letters with e-signatures",
      connected: true,
      icon: "bg-amber-100 text-amber-700",
    },
    {
      name: "Zoom",
      description: "Auto-generate video interview links",
      connected: false,
      icon: "bg-blue-100 text-blue-700",
    },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Connected Services
          </CardTitle>
          <CardDescription>
            Manage third-party integrations for your hiring workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {integrations.map((int) => (
              <div
                key={int.name}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`h-9 w-9 rounded-md flex items-center justify-center text-xs font-bold ${int.icon}`}
                  >
                    {int.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{int.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {int.description}
                    </p>
                  </div>
                </div>
                {int.connected ? (
                  <Badge variant="default" className="text-xs">
                    Connected
                  </Badge>
                ) : (
                  <Button variant="outline" size="sm">
                    Connect
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Security Tab
// ---------------------------------------------------------------------------

function SecurityTab() {
  const [mfaLoading, setMfaLoading] = useState(false);

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  async function onPasswordSubmit(values: PasswordFormValues) {
    try {
      await api.post("/auth/change-password", {
        current_password: values.current_password,
        new_password: values.new_password,
      });
      toast.success("Password updated successfully");
      form.reset();
    } catch {
      toast.error("Failed to update password. Check your current password.");
    }
  }

  async function handleEnableMfa() {
    setMfaLoading(true);
    try {
      await api.post("/auth/mfa/setup");
      toast.success("MFA setup initiated. Check your authenticator app.");
    } catch {
      toast.error("Failed to set up MFA");
    } finally {
      setMfaLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="current_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="new_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirm_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Update Password
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <Separator />
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>Add an extra layer of security to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleEnableMfa} disabled={mfaLoading}>
            {mfaLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enable MFA
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Billing Tab
// ---------------------------------------------------------------------------

function BillingTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription</CardTitle>
        <CardDescription>Manage your subscription and billing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Current Plan</p>
              <p className="text-sm text-muted-foreground">Growth — $99/month</p>
            </div>
            <Button variant="outline">Upgrade</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Settings Page
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and company settings
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="career-page">Career Page</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="api-keys">API & Webhooks</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab />
        </TabsContent>

        <TabsContent value="company">
          <CompanyTab />
        </TabsContent>

        <TabsContent value="pipeline">
          <PipelineTab />
        </TabsContent>

        <TabsContent value="team">
          <TeamTab />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationsTab />
        </TabsContent>

        <TabsContent value="career-page">
          <CareerPageTab />
        </TabsContent>

        <TabsContent value="integrations">
          <IntegrationsTab />
        </TabsContent>

        <TabsContent value="api-keys">
          <ApiKeysTab />
        </TabsContent>

        <TabsContent value="security">
          <SecurityTab />
        </TabsContent>

        <TabsContent value="billing">
          <BillingTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
