"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  X,
  Plus,
  Loader2,
  Briefcase,
  MapPin,
  DollarSign,
  Settings,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs";
import { useJob, useUpdateJob } from "@/lib/hooks/use-jobs";
import { toast } from "sonner";

function TagInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}) {
  const [inputValue, setInputValue] = useState("");

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      const tag = inputValue.trim();
      if (!value.includes(tag)) {
        onChange([...value, tag]);
      }
      setInputValue("");
    }
    if (e.key === "Backspace" && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  function removeTag(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-1.5 rounded-md border border-input bg-transparent px-3 py-2 min-h-[40px]">
        {value.map((tag, i) => (
          <Badge key={i} variant="secondary" className="gap-1 text-xs">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(i)}
              className="ml-0.5 rounded-full hover:bg-muted-foreground/20"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Type a skill and press Enter to add
      </p>
    </div>
  );
}

export default function JobEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: job, isLoading, isError } = useJob(id);
  const updateJob = useUpdateJob(id);

  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [responsibilities, setResponsibilities] = useState("");
  const [benefits, setBenefits] = useState("");
  const [locationCity, setLocationCity] = useState("");
  const [locationState, setLocationState] = useState("");
  const [locationCountry, setLocationCountry] = useState("");
  const [remotePolicy, setRemotePolicy] = useState("onsite");
  const [employmentType, setEmploymentType] = useState("full_time");
  const [experienceLevel, setExperienceLevel] = useState("mid");
  const [salaryMinDollars, setSalaryMinDollars] = useState("");
  const [salaryMaxDollars, setSalaryMaxDollars] = useState("");
  const [equityOffered, setEquityOffered] = useState(false);
  const [visibility, setVisibility] = useState("public");
  const [maxApplications, setMaxApplications] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [closesAt, setClosesAt] = useState("");
  const [skillsRequired, setSkillsRequired] = useState<string[]>([]);
  const [skillsPreferred, setSkillsPreferred] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  const populateForm = useCallback(() => {
    if (job && !initialized) {
      setTitle(job.title || "");
      setDepartment(job.department || "");
      setDescription(job.description || "");
      setRequirements(job.requirements || "");
      setResponsibilities(job.responsibilities || "");
      setBenefits(job.benefits || "");
      setLocationCity(job.location_city || "");
      setLocationState(job.location_state || "");
      setLocationCountry(job.location_country || "");
      setRemotePolicy(job.remote_policy || "onsite");
      setEmploymentType(job.employment_type || "full_time");
      setExperienceLevel(job.experience_level || "mid");
      setSalaryMinDollars(
        job.salary_min_cents ? String(job.salary_min_cents / 100) : ""
      );
      setSalaryMaxDollars(
        job.salary_max_cents ? String(job.salary_max_cents / 100) : ""
      );
      setEquityOffered(job.equity_offered || false);
      setVisibility(job.visibility || "public");
      setMaxApplications(
        job.max_applications ? String(job.max_applications) : ""
      );
      setIsUrgent(job.is_urgent || false);
      setClosesAt(
        job.closes_at ? job.closes_at.split("T")[0] : ""
      );
      setSkillsRequired(job.skills_required || []);
      setSkillsPreferred(job.skills_preferred || []);
      setInitialized(true);
    }
  }, [job, initialized]);

  useEffect(() => {
    populateForm(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [populateForm]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Job title is required");
      return;
    }

    updateJob.mutate(
      {
        title: title.trim(),
        department: department.trim() || undefined,
        description: description.trim() || undefined,
        requirements: requirements.trim() || undefined,
        responsibilities: responsibilities.trim() || undefined,
        benefits: benefits.trim() || undefined,
        location_city: locationCity.trim() || undefined,
        location_state: locationState.trim() || undefined,
        location_country: locationCountry.trim() || undefined,
        remote_policy: remotePolicy,
        employment_type: employmentType,
        experience_level: experienceLevel,
        salary_min_cents: salaryMinDollars
          ? Math.round(parseFloat(salaryMinDollars) * 100)
          : undefined,
        salary_max_cents: salaryMaxDollars
          ? Math.round(parseFloat(salaryMaxDollars) * 100)
          : undefined,
        equity_offered: equityOffered,
        visibility,
        max_applications: maxApplications
          ? parseInt(maxApplications, 10)
          : undefined,
        is_urgent: isUrgent,
        closes_at: closesAt || undefined,
        skills_required: skillsRequired.length > 0 ? skillsRequired : undefined,
        skills_preferred:
          skillsPreferred.length > 0 ? skillsPreferred : undefined,
      },
      {
        onSuccess: () => {
          toast.success("Job updated successfully");
          router.push(`/hiring/jobs/${id}`);
        },
        onError: () => {
          toast.error("Failed to update job");
        },
      }
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (isError || !job) {
    return (
      <div className="space-y-4">
        <Breadcrumbs
          items={[
            { label: "Hiring", href: "/hiring" },
            { label: "Job not found" },
          ]}
        />
        <div className="text-center py-12">
          <p className="text-sm text-destructive">
            Job not found or failed to load.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push("/hiring")}
          >
            Back to Hiring
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Hiring", href: "/hiring" },
          { label: job.title, href: `/hiring/jobs/${id}` },
          { label: "Edit" },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Job</h1>
          <p className="text-muted-foreground">
            Update the details for {job.title}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/hiring/jobs/${id}`)}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={updateJob.isPending}>
            {updateJob.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Briefcase className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="title">
                Job Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Software Engineer"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Engineering"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the role, team, and what makes this opportunity exciting..."
                className="min-h-[160px]"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="requirements">Requirements</Label>
                <Textarea
                  id="requirements"
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="List the qualifications and experience required..."
                  className="min-h-[120px]"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="responsibilities">Responsibilities</Label>
                <Textarea
                  id="responsibilities"
                  value={responsibilities}
                  onChange={(e) => setResponsibilities(e.target.value)}
                  placeholder="List the key responsibilities for this role..."
                  className="min-h-[120px]"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="benefits">Benefits</Label>
              <Textarea
                id="benefits"
                value={benefits}
                onChange={(e) => setBenefits(e.target.value)}
                placeholder="List the benefits and perks offered with this position..."
                className="min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Location & Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5" />
              Location &amp; Type
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="locationCity">City</Label>
                <Input
                  id="locationCity"
                  value={locationCity}
                  onChange={(e) => setLocationCity(e.target.value)}
                  placeholder="e.g. San Francisco"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="locationState">State</Label>
                <Input
                  id="locationState"
                  value={locationState}
                  onChange={(e) => setLocationState(e.target.value)}
                  placeholder="e.g. CA"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="locationCountry">Country</Label>
                <Input
                  id="locationCountry"
                  value={locationCountry}
                  onChange={(e) => setLocationCountry(e.target.value)}
                  placeholder="e.g. US"
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="remotePolicy">Work Mode</Label>
                <Select value={remotePolicy} onValueChange={setRemotePolicy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="onsite">Onsite</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="employmentType">Employment Type</Label>
                <Select
                  value={employmentType}
                  onValueChange={setEmploymentType}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="part_time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="experienceLevel">Seniority Level</Label>
                <Select
                  value={experienceLevel}
                  onValueChange={setExperienceLevel}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="junior">Junior</SelectItem>
                    <SelectItem value="mid">Mid</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Compensation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5" />
              Compensation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="salaryMin">Salary Min (USD)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    $
                  </span>
                  <Input
                    id="salaryMin"
                    type="number"
                    min="0"
                    step="1000"
                    value={salaryMinDollars}
                    onChange={(e) => setSalaryMinDollars(e.target.value)}
                    placeholder="80000"
                    className="pl-7"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="salaryMax">Salary Max (USD)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    $
                  </span>
                  <Input
                    id="salaryMax"
                    type="number"
                    min="0"
                    step="1000"
                    value={salaryMaxDollars}
                    onChange={(e) => setSalaryMaxDollars(e.target.value)}
                    placeholder="120000"
                    className="pl-7"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={equityOffered}
                onCheckedChange={setEquityOffered}
                id="equityOffered"
              />
              <Label htmlFor="equityOffered" className="cursor-pointer">
                Equity Offered
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="h-5 w-5" />
              Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="visibility">Visibility</Label>
                <Select value={visibility} onValueChange={setVisibility}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="maxApplications">Max Applications</Label>
                <Input
                  id="maxApplications"
                  type="number"
                  min="0"
                  value={maxApplications}
                  onChange={(e) => setMaxApplications(e.target.value)}
                  placeholder="No limit"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="closesAt">Closes At</Label>
                <Input
                  id="closesAt"
                  type="date"
                  value={closesAt}
                  onChange={(e) => setClosesAt(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={isUrgent}
                onCheckedChange={setIsUrgent}
                id="isUrgent"
              />
              <Label htmlFor="isUrgent" className="cursor-pointer">
                Mark as Urgent
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Skills */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5" />
              Skills
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <TagInput
              label="Skills Required"
              value={skillsRequired}
              onChange={setSkillsRequired}
              placeholder="e.g. React, TypeScript, Node.js..."
            />
            <Separator />
            <TagInput
              label="Skills Preferred"
              value={skillsPreferred}
              onChange={setSkillsPreferred}
              placeholder="e.g. GraphQL, AWS, Docker..."
            />
          </CardContent>
        </Card>

        {/* Bottom action bar */}
        <div className="flex items-center justify-end gap-2 pb-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/hiring/jobs/${id}`)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={updateJob.isPending}>
            {updateJob.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
