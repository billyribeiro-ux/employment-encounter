"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  MessageSquare,
  Calendar,
  Linkedin,
  Github,
  Globe,
  Shield,
  ShieldCheck,
  Briefcase,
  FileText,
  Download,
  ExternalLink,
  Star,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs";
import {
  useCandidate,
  useCandidateSkills,
} from "@/lib/hooks/use-candidates";

function formatSalary(cents: number | null): string {
  if (!cents) return "Not specified";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function availabilityVariant(status: string) {
  switch (status) {
    case "available":
    case "open":
      return "default" as const;
    case "not_looking":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
}

function proficiencyColor(level: string | null) {
  switch (level) {
    case "expert":
      return "text-emerald-700 bg-emerald-50 border-emerald-200";
    case "advanced":
      return "text-blue-700 bg-blue-50 border-blue-200";
    case "intermediate":
      return "text-amber-700 bg-amber-50 border-amber-200";
    case "beginner":
      return "text-slate-600 bg-slate-50 border-slate-200";
    default:
      return "text-muted-foreground bg-muted";
  }
}

export default function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: candidate, isLoading, isError } = useCandidate(id);
  const { data: skills } = useCandidateSkills(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-48" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-7 w-56 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (isError || !candidate) {
    return (
      <div className="space-y-4">
        <Link href="/talent">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Talent
          </Button>
        </Link>
        <div className="text-center py-12">
          <p className="text-sm text-destructive">
            Candidate not found or failed to load.
          </p>
        </div>
      </div>
    );
  }

  const location = [
    candidate.location_city,
    candidate.location_state,
    candidate.location_country,
  ]
    .filter(Boolean)
    .join(", ");

  const candidateSkills = skills ?? [];

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Talent", href: "/talent" },
          { label: candidate.headline || "Candidate Profile" },
        ]}
      />

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-bold">
          {(candidate.headline || "?").charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">
              {candidate.headline || "Candidate Profile"}
            </h1>
            <Badge variant={availabilityVariant(candidate.availability_status)}>
              {candidate.availability_status.replace(/_/g, " ")}
            </Badge>
            {candidate.reputation_score > 0 && (
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="h-4 w-4 fill-current" />
                <span className="text-sm font-semibold">
                  {candidate.reputation_score}
                </span>
              </div>
            )}
          </div>
          {location && (
            <p className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <MapPin className="h-4 w-4" />
              {location}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <MessageSquare className="mr-2 h-4 w-4" />
            Message
          </Button>
          <Button>
            <Calendar className="mr-2 h-4 w-4" />
            Schedule Interview
          </Button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-muted-foreground">
                Remote Pref
              </span>
            </div>
            <p className="text-lg font-bold capitalize">
              {candidate.remote_preference || "Not set"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-medium text-muted-foreground">
                Work Auth
              </span>
            </div>
            <p className="text-lg font-bold">
              {candidate.work_authorization || "Not specified"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Star className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-medium text-muted-foreground">
                Profile Complete
              </span>
            </div>
            <p className="text-lg font-bold">
              {candidate.profile_completeness_pct}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-violet-600" />
              <span className="text-xs font-medium text-muted-foreground">
                Skills
              </span>
            </div>
            <p className="text-lg font-bold">{candidateSkills.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="experience">Experience</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Overview tab */}
        <TabsContent value="overview">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {candidate.summary ? (
                  <p className="text-sm leading-relaxed">{candidate.summary}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No summary provided.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Salary Expectations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Minimum</p>
                    <p className="font-medium">
                      {formatSalary(candidate.desired_salary_min_cents)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Maximum</p>
                    <p className="font-medium">
                      {formatSalary(candidate.desired_salary_max_cents)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Currency</p>
                    <p className="font-medium">
                      {candidate.desired_currency || "USD"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Visa Status</p>
                    <p className="font-medium">
                      {candidate.visa_status || "Not specified"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Links</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 flex-wrap">
                  {candidate.linkedin_url && (
                    <a
                      href={candidate.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                    >
                      <Linkedin className="h-4 w-4" />
                      LinkedIn
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {candidate.github_url && (
                    <a
                      href={candidate.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:underline"
                    >
                      <Github className="h-4 w-4" />
                      GitHub
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {candidate.portfolio_url && (
                    <a
                      href={candidate.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-emerald-600 hover:underline"
                    >
                      <Globe className="h-4 w-4" />
                      Portfolio
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {!candidate.linkedin_url &&
                    !candidate.github_url &&
                    !candidate.portfolio_url && (
                      <p className="text-sm text-muted-foreground">
                        No external links provided.
                      </p>
                    )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Skills tab */}
        <TabsContent value="skills">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Skills ({candidateSkills.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {candidateSkills.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  No skills listed yet.
                </p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {candidateSkills.map((skill) => (
                    <div
                      key={skill.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-2">
                        {skill.is_verified ? (
                          <ShieldCheck className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Shield className="h-4 w-4 text-muted-foreground/40" />
                        )}
                        <div>
                          <p className="text-sm font-medium">
                            {skill.skill_name}
                          </p>
                          {skill.years_experience && (
                            <p className="text-[10px] text-muted-foreground">
                              {skill.years_experience} yr
                              {skill.years_experience !== 1 ? "s" : ""}{" "}
                              experience
                            </p>
                          )}
                        </div>
                      </div>
                      {skill.proficiency_level && (
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${proficiencyColor(
                            skill.proficiency_level
                          )}`}
                        >
                          {skill.proficiency_level}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Experience tab */}
        <TabsContent value="experience">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Work History</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground py-6 text-center">
                Work history will be displayed here once the candidate adds
                their experience.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents tab */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground py-6 text-center">
                Uploaded documents such as resumes and certifications will
                appear here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
