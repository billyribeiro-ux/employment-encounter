"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User,
  MapPin,
  Briefcase,
  Link as LinkIcon,
  Shield,
  Plus,
  X,
  Save,
  Upload,
  Loader2,
  CheckCircle2,
  Globe,
  Github,
  Linkedin,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  useCandidate,
  useUpdateCandidate,
  useCandidateSkills,
  useAddCandidateSkill,
  useDeleteCandidateSkill,
} from "@/lib/hooks/use-candidates";
import type {
  CandidateProfile,
  UpdateCandidatePayload,
} from "@/lib/hooks/use-candidates";
import { useAuthStore } from "@/stores/auth-store";
import { api } from "@/lib/api";

function computeCompleteness(profile: CandidateProfile | undefined): number {
  if (!profile) return 0;
  const fields = [
    profile.headline,
    profile.summary,
    profile.location_city,
    profile.location_country,
    profile.remote_preference !== "no_preference" ? profile.remote_preference : null,
    profile.availability_status !== "not_looking" ? profile.availability_status : null,
    profile.desired_salary_min_cents,
    profile.linkedin_url,
    profile.visa_status,
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}

function formatSalaryForInput(cents: number | null): string {
  if (!cents) return "";
  return String(cents / 100);
}

function parseSalaryToCents(value: string): number | undefined {
  const num = parseFloat(value);
  if (isNaN(num) || num <= 0) return undefined;
  return Math.round(num * 100);
}

export default function CandidateProfilePage() {
  const { user } = useAuthStore();

  // We need to find the candidate profile for the current user.
  // The candidate ID might be available on the user object or we need to fetch it.
  // For now, we'll use user.id as the candidate identifier since the API
  // resolves by user_id when accessing /candidates/me or similar.
  const [candidateId, setCandidateId] = useState<string>("");
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Fetch the candidate profile for the current user
  useEffect(() => {
    async function fetchCandidateProfile() {
      try {
        const { data } = await api.get("/candidates/me");
        setCandidateId(data.id);
      } catch {
        // If no profile exists, try to get it from the candidates list
        try {
          const { data } = await api.get("/candidates", {
            params: { per_page: 1 },
          });
          if (data.data && data.data.length > 0) {
            setCandidateId(data.data[0].id);
          }
        } catch {
          // Profile doesn't exist yet
        }
      } finally {
        setIsLoadingProfile(false);
      }
    }
    fetchCandidateProfile();
  }, []);

  const { data: profile, isLoading: profileLoading } =
    useCandidate(candidateId);
  const updateCandidate = useUpdateCandidate(candidateId);
  const { data: skills, isLoading: skillsLoading } =
    useCandidateSkills(candidateId);
  const addSkill = useAddCandidateSkill(candidateId);
  const deleteSkill = useDeleteCandidateSkill(candidateId);

  // Form states
  const [headline, setHeadline] = useState("");
  const [summary, setSummary] = useState("");
  const [locationCity, setLocationCity] = useState("");
  const [locationState, setLocationState] = useState("");
  const [locationCountry, setLocationCountry] = useState("");
  const [remotePreference, setRemotePreference] = useState("no_preference");
  const [availabilityStatus, setAvailabilityStatus] = useState("actively_looking");
  const [desiredSalaryMin, setDesiredSalaryMin] = useState("");
  const [desiredSalaryMax, setDesiredSalaryMax] = useState("");
  const [desiredCurrency, setDesiredCurrency] = useState("USD");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [visaStatus, setVisaStatus] = useState("");
  const [workAuthorization, setWorkAuthorization] = useState("");

  // Skill dialog state
  const [skillDialogOpen, setSkillDialogOpen] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillCategory, setNewSkillCategory] = useState("");
  const [newSkillProficiency, setNewSkillProficiency] = useState("intermediate");
  const [newSkillYears, setNewSkillYears] = useState("");

  // Saving states per section
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [savingWork, setSavingWork] = useState(false);
  const [savingLinks, setSavingLinks] = useState(false);
  const [savingAuth, setSavingAuth] = useState(false);

  // Populate form when profile loads
  useEffect(() => {
    if (profile) {
      setHeadline(profile.headline || "");
      setSummary(profile.summary || "");
      setLocationCity(profile.location_city || "");
      setLocationState(profile.location_state || "");
      setLocationCountry(profile.location_country || "");
      setRemotePreference(profile.remote_preference || "no_preference");
      setAvailabilityStatus(profile.availability_status || "actively_looking");
      setDesiredSalaryMin(formatSalaryForInput(profile.desired_salary_min_cents));
      setDesiredSalaryMax(formatSalaryForInput(profile.desired_salary_max_cents));
      setDesiredCurrency(profile.desired_currency || "USD");
      setLinkedinUrl(profile.linkedin_url || "");
      setGithubUrl(profile.github_url || "");
      setPortfolioUrl(profile.portfolio_url || "");
      setVisaStatus(profile.visa_status || "");
      setWorkAuthorization(profile.work_authorization || "");
    }
  }, [profile]);

  async function saveSection(
    payload: UpdateCandidatePayload,
    setSaving: (v: boolean) => void
  ) {
    setSaving(true);
    try {
      await updateCandidate.mutateAsync(payload);
      toast.success("Profile updated successfully!");
    } catch {
      toast.error("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleSavePersonal() {
    saveSection(
      { headline: headline || undefined, summary: summary || undefined },
      setSavingPersonal
    );
  }

  function handleSaveLocation() {
    saveSection(
      {
        location_city: locationCity || undefined,
        location_state: locationState || undefined,
        location_country: locationCountry || undefined,
        remote_preference: remotePreference,
      },
      setSavingLocation
    );
  }

  function handleSaveWork() {
    saveSection(
      {
        availability_status: availabilityStatus,
        desired_salary_min_cents: parseSalaryToCents(desiredSalaryMin),
        desired_salary_max_cents: parseSalaryToCents(desiredSalaryMax),
        desired_currency: desiredCurrency,
      },
      setSavingWork
    );
  }

  function handleSaveLinks() {
    saveSection(
      {
        linkedin_url: linkedinUrl || undefined,
        github_url: githubUrl || undefined,
        portfolio_url: portfolioUrl || undefined,
      },
      setSavingLinks
    );
  }

  function handleSaveAuth() {
    saveSection(
      {
        visa_status: visaStatus || undefined,
        work_authorization: workAuthorization || undefined,
      },
      setSavingAuth
    );
  }

  function handleAddSkill() {
    if (!newSkillName.trim()) return;
    addSkill.mutate(
      {
        skill_name: newSkillName.trim(),
        category: newSkillCategory.trim() || undefined,
        proficiency_level: newSkillProficiency,
        years_experience: newSkillYears
          ? parseInt(newSkillYears, 10)
          : undefined,
      },
      {
        onSuccess: () => {
          toast.success("Skill added!");
          setSkillDialogOpen(false);
          setNewSkillName("");
          setNewSkillCategory("");
          setNewSkillProficiency("intermediate");
          setNewSkillYears("");
        },
        onError: () => toast.error("Failed to add skill"),
      }
    );
  }

  function handleDeleteSkill(skillId: string) {
    deleteSkill.mutate(skillId, {
      onSuccess: () => toast.success("Skill removed"),
      onError: () => toast.error("Failed to remove skill"),
    });
  }

  const completeness = computeCompleteness(profile);
  const isLoadingAll = isLoadingProfile || (candidateId && profileLoading);

  if (isLoadingAll) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-96" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  if (!candidateId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <User className="mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="mb-2 text-xl font-semibold">Profile Not Found</h2>
        <p className="mb-4 text-muted-foreground max-w-md">
          Your candidate profile has not been set up yet. This usually happens
          automatically when you register. Please try logging out and back in.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">
          Build a comprehensive profile to attract the best opportunities
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <CardTitle>Personal Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="headline">Professional Headline</Label>
                  <Input
                    id="headline"
                    placeholder="e.g. Senior Full-Stack Engineer with 8+ years experience"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    className="mt-1.5"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    A brief tagline that appears on your profile card
                  </p>
                </div>
                <div>
                  <Label htmlFor="summary">Professional Summary</Label>
                  <Textarea
                    id="summary"
                    placeholder="Tell employers about your experience, skills, and career goals..."
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    rows={5}
                    className="mt-1.5"
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={handleSavePersonal}
                    disabled={savingPersonal}
                    size="sm"
                  >
                    {savingPersonal ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Location & Preferences */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <CardTitle>Location & Preferences</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="San Francisco"
                      value={locationCity}
                      onChange={(e) => setLocationCity(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State / Province</Label>
                    <Input
                      id="state"
                      placeholder="CA"
                      value={locationState}
                      onChange={(e) => setLocationState(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      placeholder="United States"
                      value={locationCountry}
                      onChange={(e) => setLocationCountry(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                </div>
                <div>
                  <Label>Remote Preference</Label>
                  <Select
                    value={remotePreference}
                    onValueChange={setRemotePreference}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no_preference">
                        No Preference
                      </SelectItem>
                      <SelectItem value="remote_only">Remote Only</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                      <SelectItem value="onsite">On-site</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveLocation}
                    disabled={savingLocation}
                    size="sm"
                  >
                    {savingLocation ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Work Preferences */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <CardTitle>Work Preferences</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Availability Status</Label>
                  <Select
                    value={availabilityStatus}
                    onValueChange={setAvailabilityStatus}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="actively_looking">
                        Actively Looking
                      </SelectItem>
                      <SelectItem value="open_to_offers">
                        Open to Offers
                      </SelectItem>
                      <SelectItem value="not_looking">Not Looking</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <Label htmlFor="salary-min">Desired Salary Min</Label>
                    <Input
                      id="salary-min"
                      type="number"
                      placeholder="80000"
                      value={desiredSalaryMin}
                      onChange={(e) => setDesiredSalaryMin(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="salary-max">Desired Salary Max</Label>
                    <Input
                      id="salary-max"
                      type="number"
                      placeholder="120000"
                      value={desiredSalaryMax}
                      onChange={(e) => setDesiredSalaryMax(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Currency</Label>
                    <Select
                      value={desiredCurrency}
                      onValueChange={setDesiredCurrency}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="CAD">CAD</SelectItem>
                        <SelectItem value="AUD">AUD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveWork}
                    disabled={savingWork}
                    size="sm"
                  >
                    {savingWork ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Professional Links */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-5 w-5 text-primary" />
                  <CardTitle>Professional Links</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="linkedin">
                    <span className="flex items-center gap-1.5">
                      <Linkedin className="h-3.5 w-3.5" />
                      LinkedIn
                    </span>
                  </Label>
                  <Input
                    id="linkedin"
                    placeholder="https://linkedin.com/in/yourprofile"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="github">
                    <span className="flex items-center gap-1.5">
                      <Github className="h-3.5 w-3.5" />
                      GitHub
                    </span>
                  </Label>
                  <Input
                    id="github"
                    placeholder="https://github.com/yourusername"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="portfolio">
                    <span className="flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5" />
                      Portfolio
                    </span>
                  </Label>
                  <Input
                    id="portfolio"
                    placeholder="https://yourportfolio.com"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveLinks}
                    disabled={savingLinks}
                    size="sm"
                  >
                    {savingLinks ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Skills Management */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                    <CardTitle>Skills</CardTitle>
                  </div>
                  <Dialog
                    open={skillDialogOpen}
                    onOpenChange={setSkillDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Plus className="mr-1.5 h-3.5 w-3.5" />
                        Add Skill
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add a Skill</DialogTitle>
                        <DialogDescription>
                          Add a skill to showcase your expertise to potential
                          employers.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label htmlFor="skill-name">Skill Name</Label>
                          <Input
                            id="skill-name"
                            placeholder="e.g. React, Python, Project Management"
                            value={newSkillName}
                            onChange={(e) => setNewSkillName(e.target.value)}
                            className="mt-1.5"
                          />
                        </div>
                        <div>
                          <Label htmlFor="skill-category">Category</Label>
                          <Input
                            id="skill-category"
                            placeholder="e.g. Frontend, Backend, Soft Skills"
                            value={newSkillCategory}
                            onChange={(e) => setNewSkillCategory(e.target.value)}
                            className="mt-1.5"
                          />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <Label>Proficiency Level</Label>
                            <Select
                              value={newSkillProficiency}
                              onValueChange={setNewSkillProficiency}
                            >
                              <SelectTrigger className="mt-1.5">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="beginner">
                                  Beginner
                                </SelectItem>
                                <SelectItem value="intermediate">
                                  Intermediate
                                </SelectItem>
                                <SelectItem value="advanced">
                                  Advanced
                                </SelectItem>
                                <SelectItem value="expert">Expert</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="skill-years">
                              Years of Experience
                            </Label>
                            <Input
                              id="skill-years"
                              type="number"
                              min="0"
                              max="50"
                              placeholder="3"
                              value={newSkillYears}
                              onChange={(e) => setNewSkillYears(e.target.value)}
                              className="mt-1.5"
                            />
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setSkillDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleAddSkill}
                          disabled={addSkill.isPending || !newSkillName.trim()}
                        >
                          {addSkill.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="mr-2 h-4 w-4" />
                          )}
                          Add Skill
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {skillsLoading ? (
                  <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 w-24" />
                    ))}
                  </div>
                ) : !skills || skills.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No skills added yet. Add your first skill to help
                      employers find you.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <Badge
                        key={skill.id}
                        variant="secondary"
                        className="flex items-center gap-1.5 py-1.5 px-3 text-sm"
                      >
                        <span>{skill.skill_name}</span>
                        {skill.proficiency_level && (
                          <span className="text-xs text-muted-foreground">
                            ({skill.proficiency_level})
                          </span>
                        )}
                        {skill.years_experience !== null &&
                          skill.years_experience !== undefined && (
                            <span className="text-xs text-muted-foreground">
                              {skill.years_experience}y
                            </span>
                          )}
                        <button
                          onClick={() => handleDeleteSkill(skill.id)}
                          className="ml-1 rounded-full p-0.5 hover:bg-muted transition-colors"
                          disabled={deleteSkill.isPending}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Resume Upload */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  <CardTitle>Resume</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center">
                  <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    Drag and drop your resume here
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    PDF, DOC, or DOCX up to 10MB
                  </p>
                  <Button variant="outline" size="sm" className="mt-4">
                    <Upload className="mr-2 h-3.5 w-3.5" />
                    Browse Files
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Work Authorization */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <CardTitle>Work Authorization</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Visa Status</Label>
                  <Select value={visaStatus} onValueChange={setVisaStatus}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select visa status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="citizen">Citizen</SelectItem>
                      <SelectItem value="permanent_resident">
                        Permanent Resident
                      </SelectItem>
                      <SelectItem value="work_visa">Work Visa</SelectItem>
                      <SelectItem value="student_visa">Student Visa</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Work Authorization</Label>
                  <Select
                    value={workAuthorization}
                    onValueChange={setWorkAuthorization}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Select authorization" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="authorized">
                        Authorized to work
                      </SelectItem>
                      <SelectItem value="sponsorship_required">
                        Sponsorship required
                      </SelectItem>
                      <SelectItem value="sponsorship_not_required">
                        Sponsorship not required
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveAuth}
                    disabled={savingAuth}
                    size="sm"
                  >
                    {savingAuth ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Profile Completeness */}
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-base">Profile Completeness</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-semibold">{completeness}%</span>
                </div>
                <Progress value={completeness} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {completeness < 50
                    ? "Add more details to increase your visibility to employers."
                    : completeness < 80
                      ? "Good progress! A few more fields will boost your profile."
                      : completeness < 100
                        ? "Almost there! Complete the remaining fields."
                        : "Your profile is complete! Employers can now find you easily."}
                </p>

                <Separator className="my-2" />

                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    {headline ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <div className="h-3.5 w-3.5 rounded-full border-2" />
                    )}
                    <span
                      className={headline ? "" : "text-muted-foreground"}
                    >
                      Professional headline
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {summary ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <div className="h-3.5 w-3.5 rounded-full border-2" />
                    )}
                    <span
                      className={summary ? "" : "text-muted-foreground"}
                    >
                      Summary
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {locationCity ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <div className="h-3.5 w-3.5 rounded-full border-2" />
                    )}
                    <span
                      className={locationCity ? "" : "text-muted-foreground"}
                    >
                      Location
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {desiredSalaryMin ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <div className="h-3.5 w-3.5 rounded-full border-2" />
                    )}
                    <span
                      className={
                        desiredSalaryMin ? "" : "text-muted-foreground"
                      }
                    >
                      Salary expectations
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {linkedinUrl ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <div className="h-3.5 w-3.5 rounded-full border-2" />
                    )}
                    <span
                      className={linkedinUrl ? "" : "text-muted-foreground"}
                    >
                      LinkedIn profile
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {skills && skills.length > 0 ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <div className="h-3.5 w-3.5 rounded-full border-2" />
                    )}
                    <span
                      className={
                        skills && skills.length > 0
                          ? ""
                          : "text-muted-foreground"
                      }
                    >
                      Skills ({skills?.length || 0} added)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {visaStatus ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <div className="h-3.5 w-3.5 rounded-full border-2" />
                    )}
                    <span
                      className={visaStatus ? "" : "text-muted-foreground"}
                    >
                      Work authorization
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">
                  {user?.first_name} {user?.last_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium truncate ml-2">
                  {user?.email}
                </span>
              </div>
              {profile?.availability_status && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="outline" className="text-xs">
                    {profile.availability_status
                      .split("_")
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(" ")}
                  </Badge>
                </div>
              )}
              {profile?.reputation_score !== undefined &&
                profile.reputation_score > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reputation</span>
                    <span className="font-medium">
                      {profile.reputation_score}
                    </span>
                  </div>
                )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
