"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Bell,
  Shield,
  Briefcase,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Trash2,
  Download,
  Save,
  X,
  Plus,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/stores/auth-store";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

function TagInput({
  tags,
  onAdd,
  onRemove,
  placeholder,
}: {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  placeholder: string;
}) {
  const [inputValue, setInputValue] = useState("");

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const trimmed = inputValue.trim().replace(/,$/, "");
      if (trimmed && !tags.includes(trimmed)) {
        onAdd(trimmed);
      }
      setInputValue("");
    }
    if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      onRemove(tags[tags.length - 1]);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 pl-2.5">
            {tag}
            <button
              type="button"
              onClick={() => onRemove(tag)}
              className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="text-sm"
      />
      <p className="text-xs text-muted-foreground">
        Press Enter or comma to add
      </p>
    </div>
  );
}

function ProfileTab() {
  const { user } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setChangingPassword(true);
    try {
      await api.put("/auth/password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Failed to update password. Check your current password.");
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleToggle2FA() {
    try {
      await api.put("/auth/2fa", { enabled: !twoFactorEnabled });
      setTwoFactorEnabled(!twoFactorEnabled);
      toast.success(
        twoFactorEnabled
          ? "Two-factor authentication disabled"
          : "Two-factor authentication enabled"
      );
    } catch {
      toast.error("Failed to update two-factor authentication");
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText !== "DELETE") return;
    try {
      await api.delete("/auth/account");
      toast.success("Account deletion requested. You will receive a confirmation email.");
      setDeleteDialogOpen(false);
    } catch {
      toast.error("Failed to request account deletion");
    }
  }

  return (
    <div className="space-y-6">
      {/* Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-4 w-4" />
            Email Address
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Input
              value={user?.email || ""}
              disabled
              className="max-w-sm bg-muted"
            />
            <Button variant="outline" size="sm" onClick={() => toast.info("A change request email will be sent to your current address")}>
              Request Change
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            For security, email changes require verification from both old and new addresses.
          </p>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="max-w-sm space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <div className="relative">
                <Input
                  id="current-password"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            <Button
              type="submit"
              disabled={
                changingPassword ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword
              }
            >
              {changingPassword ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 2FA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                {twoFactorEnabled ? "Enabled" : "Disabled"}
              </p>
              <p className="text-xs text-muted-foreground">
                {twoFactorEnabled
                  ? "Your account is protected with 2FA"
                  : "Enable 2FA for enhanced security"}
              </p>
            </div>
            <Switch
              checked={twoFactorEnabled}
              onCheckedChange={handleToggle2FA}
            />
          </div>
        </CardContent>
      </Card>

      {/* Delete Account */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-destructive">
            <Trash2 className="h-4 w-4" />
            Delete Account
          </CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            Delete My Account
          </Button>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. All your data, applications, messages, and
              profile information will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Type DELETE to confirm</Label>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeleteConfirmText("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteConfirmText !== "DELETE"}
              onClick={handleDeleteAccount}
            >
              Permanently Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NotificationsTab() {
  const [notifications, setNotifications] = useState({
    job_matches: true,
    application_updates: true,
    interview_reminders: true,
    employer_messages: true,
    weekly_digest: false,
    marketing: false,
  });
  const [saving, setSaving] = useState(false);

  function toggleNotification(key: keyof typeof notifications) {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.put("/settings/notifications", notifications);
      toast.success("Notification preferences saved");
    } catch {
      toast.error("Failed to save notification preferences");
    } finally {
      setSaving(false);
    }
  }

  const notificationOptions = [
    {
      key: "job_matches" as const,
      label: "New Job Matches",
      description: "Get notified when new jobs match your saved search criteria",
    },
    {
      key: "application_updates" as const,
      label: "Application Status Updates",
      description: "Receive updates when your application status changes",
    },
    {
      key: "interview_reminders" as const,
      label: "Interview Reminders",
      description: "Get reminders before your scheduled interviews",
    },
    {
      key: "employer_messages" as const,
      label: "Messages from Employers",
      description: "Receive notifications when employers send you messages",
    },
    {
      key: "weekly_digest" as const,
      label: "Weekly Job Digest Email",
      description: "A weekly summary of new jobs matching your preferences",
    },
    {
      key: "marketing" as const,
      label: "Marketing Communications",
      description: "Tips, articles, and promotions from Talent OS",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Bell className="h-4 w-4" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Choose which notifications you would like to receive
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {notificationOptions.map((opt, index) => (
          <div key={opt.key}>
            <div className="flex items-center justify-between py-3">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{opt.label}</p>
                <p className="text-xs text-muted-foreground">{opt.description}</p>
              </div>
              <Switch
                checked={notifications[opt.key]}
                onCheckedChange={() => toggleNotification(opt.key)}
              />
            </div>
            {index < notificationOptions.length - 1 && <Separator />}
          </div>
        ))}
        <div className="pt-4">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PrivacyTab() {
  const [visibility, setVisibility] = useState("public");
  const [recruiterSearch, setRecruiterSearch] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  async function handleSavePrivacy() {
    setSaving(true);
    try {
      await api.put("/settings/privacy", {
        profile_visibility: visibility,
        allow_recruiter_search: recruiterSearch,
      });
      toast.success("Privacy settings saved");
    } catch {
      toast.error("Failed to save privacy settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleExportData() {
    setExporting(true);
    try {
      const { data } = await api.get("/settings/data-export", {
        responseType: "blob",
      });
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `my-data-${new Date().toISOString().split("T")[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Data export started. Check your downloads.");
    } catch {
      toast.error("Failed to export data. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile Visibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            Profile Visibility
          </CardTitle>
          <CardDescription>
            Control who can see your profile information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {[
              {
                value: "public",
                label: "Public",
                description: "All employers can see your full profile",
              },
              {
                value: "anonymous",
                label: "Anonymous",
                description:
                  "Employers can see your skills and experience, but your name is hidden until you apply",
              },
              {
                value: "private",
                label: "Private (Invitation Only)",
                description:
                  "Your profile is hidden. Only employers you apply to can see your information",
              },
            ].map((option) => (
              <label
                key={option.value}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                  visibility === option.value
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50"
                )}
              >
                <input
                  type="radio"
                  name="visibility"
                  value={option.value}
                  checked={visibility === option.value}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-medium">{option.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {option.description}
                  </p>
                </div>
              </label>
            ))}
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Allow Recruiters to Find Me</p>
              <p className="text-xs text-muted-foreground">
                Let recruiters discover your profile through search
              </p>
            </div>
            <Switch
              checked={recruiterSearch}
              onCheckedChange={setRecruiterSearch}
            />
          </div>

          <Button onClick={handleSavePrivacy} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Privacy Settings"}
          </Button>
        </CardContent>
      </Card>

      {/* Data Export */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Download className="h-4 w-4" />
            Data Export
          </CardTitle>
          <CardDescription>
            Download a copy of all your data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            Export all your data including profile information, applications, messages,
            and saved jobs in JSON format.
          </p>
          <Button
            variant="outline"
            onClick={handleExportData}
            disabled={exporting}
          >
            <Download className="mr-2 h-4 w-4" />
            {exporting ? "Preparing Export..." : "Download My Data"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function JobPreferencesTab() {
  const [desiredTitles, setDesiredTitles] = useState<string[]>([]);
  const [preferredLocations, setPreferredLocations] = useState<string[]>([]);
  const [remotePreference, setRemotePreference] = useState("any");
  const [minSalary, setMinSalary] = useState("");
  const [employmentTypes, setEmploymentTypes] = useState({
    full_time: true,
    part_time: false,
    contract: false,
    internship: false,
  });
  const [willingToRelocate, setWillingToRelocate] = useState(false);
  const [noticePeriod, setNoticePeriod] = useState("immediately");
  const [saving, setSaving] = useState(false);

  function addTitle(title: string) {
    setDesiredTitles((prev) => [...prev, title]);
  }

  function removeTitle(title: string) {
    setDesiredTitles((prev) => prev.filter((t) => t !== title));
  }

  function addLocation(location: string) {
    setPreferredLocations((prev) => [...prev, location]);
  }

  function removeLocation(location: string) {
    setPreferredLocations((prev) => prev.filter((l) => l !== location));
  }

  function toggleEmploymentType(key: keyof typeof employmentTypes) {
    setEmploymentTypes((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.put("/settings/job-preferences", {
        desired_titles: desiredTitles,
        preferred_locations: preferredLocations,
        remote_preference: remotePreference,
        min_salary_cents: minSalary ? Math.round(parseFloat(minSalary) * 100) : null,
        employment_types: Object.entries(employmentTypes)
          .filter(([_, v]) => v)
          .map(([k]) => k),
        willing_to_relocate: willingToRelocate,
        notice_period: noticePeriod,
      });
      toast.success("Job preferences saved");
    } catch {
      toast.error("Failed to save job preferences");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Desired Job Titles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Desired Job Titles</CardTitle>
          <CardDescription>
            What positions are you looking for?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TagInput
            tags={desiredTitles}
            onAdd={addTitle}
            onRemove={removeTitle}
            placeholder="e.g., Software Engineer, Product Manager..."
          />
        </CardContent>
      </Card>

      {/* Preferred Locations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preferred Locations</CardTitle>
          <CardDescription>
            Where would you like to work?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TagInput
            tags={preferredLocations}
            onAdd={addLocation}
            onRemove={removeLocation}
            placeholder="e.g., San Francisco, New York, London..."
          />
        </CardContent>
      </Card>

      {/* Remote Preference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Remote Preference</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={remotePreference} onValueChange={setRemotePreference}>
            <SelectTrigger className="max-w-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="remote">Remote Only</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
              <SelectItem value="onsite">On-site Only</SelectItem>
              <SelectItem value="any">Open to Anything</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Minimum Salary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Minimum Salary Expectation</CardTitle>
          <CardDescription>
            Annual salary in USD (before taxes)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-sm">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              $
            </span>
            <Input
              type="number"
              value={minSalary}
              onChange={(e) => setMinSalary(e.target.value)}
              placeholder="e.g., 80000"
              className="pl-7"
            />
          </div>
        </CardContent>
      </Card>

      {/* Employment Type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Employment Type Preferences</CardTitle>
          <CardDescription>
            Select all types you are open to
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { key: "full_time" as const, label: "Full-time" },
              { key: "part_time" as const, label: "Part-time" },
              { key: "contract" as const, label: "Contract" },
              { key: "internship" as const, label: "Internship" },
            ].map((type) => (
              <label
                key={type.key}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                  employmentTypes[type.key]
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50"
                )}
              >
                <input
                  type="checkbox"
                  checked={employmentTypes[type.key]}
                  onChange={() => toggleEmploymentType(type.key)}
                  className="rounded"
                />
                <span className="text-sm font-medium">{type.label}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Relocation & Notice */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Additional Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Willing to Relocate</p>
              <p className="text-xs text-muted-foreground">
                Open to moving for the right opportunity
              </p>
            </div>
            <Switch
              checked={willingToRelocate}
              onCheckedChange={setWillingToRelocate}
            />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Notice Period</Label>
            <Select value={noticePeriod} onValueChange={setNoticePeriod}>
              <SelectTrigger className="max-w-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediately">Available Immediately</SelectItem>
                <SelectItem value="2_weeks">2 Weeks</SelectItem>
                <SelectItem value="1_month">1 Month</SelectItem>
                <SelectItem value="2_months">2 Months</SelectItem>
                <SelectItem value="3_months_plus">3+ Months</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving Preferences..." : "Save All Preferences"}
        </Button>
      </div>
    </div>
  );
}

export default function CandidateSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="gap-1.5">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="gap-1.5">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Privacy</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="gap-1.5">
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">Job Prefs</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationsTab />
        </TabsContent>

        <TabsContent value="privacy">
          <PrivacyTab />
        </TabsContent>

        <TabsContent value="preferences">
          <JobPreferencesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
