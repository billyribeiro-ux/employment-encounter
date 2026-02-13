"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Brain,
  Search,
  Users,
  MapPin,
  Target,
  TrendingUp,
  Send,
  Eye,
  UserPlus,
  Filter,
  RotateCcw,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Sparkles,
  BarChart3,
  Briefcase,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs";
import { useMatching, type MatchResult } from "@/lib/hooks/use-matching";
import { useJobs } from "@/lib/hooks/use-jobs";
import { toast } from "sonner";

function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-500";
}

function scoreBgColor(score: number): string {
  if (score >= 80) return "bg-emerald-50 border-emerald-200";
  if (score >= 60) return "bg-amber-50 border-amber-200";
  return "bg-red-50 border-red-200";
}

function scoreBarColor(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-red-500";
}

function formatSalary(cents: number | null): string {
  if (!cents) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function MatchCardSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <Skeleton className="h-16 w-16 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ScoreBreakdown({ label, score }: { label: string; score: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={`font-semibold ${scoreColor(score)}`}>{score}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${scoreBarColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

function MatchCard({ match }: { match: MatchResult }) {
  const candidate = match.candidate;
  const location = [candidate.location_city, candidate.location_state]
    .filter(Boolean)
    .join(", ");

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          {/* Score */}
          <div
            className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-lg border-2 ${scoreBgColor(match.overall)}`}
          >
            <span className={`text-2xl font-bold ${scoreColor(match.overall)}`}>
              {match.overall}
            </span>
            <span className="text-[10px] text-muted-foreground font-medium">
              MATCH
            </span>
          </div>

          {/* Candidate Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link
                  href={`/talent/${candidate.id}`}
                  className="text-sm font-semibold hover:underline line-clamp-1"
                >
                  {candidate.headline || "Untitled Profile"}
                </Link>
                {location && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                    <MapPin className="h-3 w-3" />
                    {location}
                  </p>
                )}
                {(candidate.desired_salary_min_cents || candidate.desired_salary_max_cents) && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatSalary(candidate.desired_salary_min_cents)}
                    {candidate.desired_salary_min_cents && candidate.desired_salary_max_cents && " - "}
                    {formatSalary(candidate.desired_salary_max_cents)}
                  </p>
                )}
              </div>
              <Badge
                variant={candidate.availability_status === "available" ? "default" : "secondary"}
                className="text-[10px] shrink-0"
              >
                {candidate.availability_status.replace(/_/g, " ")}
              </Badge>
            </div>

            {/* Score Breakdown */}
            <div className="grid grid-cols-4 gap-3 mt-3">
              <ScoreBreakdown label="Skills" score={match.skillsScore} />
              <ScoreBreakdown label="Experience" score={match.experienceScore} />
              <ScoreBreakdown label="Location" score={match.locationScore} />
              <ScoreBreakdown label="Salary" score={match.salaryScore} />
            </div>

            {/* Matching / Missing Skills */}
            {(match.matchingSkills.length > 0 || match.missingSkills.length > 0) && (
              <div className="mt-3 space-y-1.5">
                {match.matchingSkills.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                    {match.matchingSkills.slice(0, 6).map((skill) => (
                      <Badge
                        key={skill}
                        variant="outline"
                        className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200"
                      >
                        {skill}
                      </Badge>
                    ))}
                    {match.matchingSkills.length > 6 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{match.matchingSkills.length - 6} more
                      </span>
                    )}
                  </div>
                )}
                {match.missingSkills.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <XCircle className="h-3 w-3 text-red-400 shrink-0" />
                    {match.missingSkills.slice(0, 4).map((skill) => (
                      <Badge
                        key={skill}
                        variant="outline"
                        className="text-[10px] bg-red-50 text-red-600 border-red-200"
                      >
                        {skill}
                      </Badge>
                    ))}
                    {match.missingSkills.length > 4 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{match.missingSkills.length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 mt-4 pt-3 border-t">
              <Button
                variant="default"
                size="sm"
                className="h-8 text-xs"
                onClick={() => toast.success("Message draft created")}
              >
                <Send className="mr-1 h-3 w-3" />
                Reach Out
              </Button>
              <Link href={`/talent/${candidate.id}`}>
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  <Eye className="mr-1 h-3 w-3" />
                  View Profile
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => toast.success("Added to pipeline")}
              >
                <UserPlus className="mr-1 h-3 w-3" />
                Add to Pipeline
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MatchingPage() {
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [minScore, setMinScore] = useState<string>("0");
  const [skillsFilter, setSkillsFilter] = useState<string>("");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"match" | "experience" | "recency">("match");

  const { data: jobsData, isLoading: jobsLoading } = useJobs({
    status: "published",
    per_page: 100,
  });
  const jobs = jobsData?.data ?? [];

  const skillsRequired = useMemo(() => {
    if (!skillsFilter.trim()) return undefined;
    return skillsFilter
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [skillsFilter]);

  const { results, job, isLoading } = useMatching({
    jobId: selectedJobId,
    minScore: Number(minScore) || 0,
    skillsRequired,
    location: locationFilter,
    availability: availabilityFilter,
    sortBy,
  });

  const hasActiveFilters =
    Number(minScore) > 0 ||
    skillsFilter !== "" ||
    locationFilter !== "all" ||
    availabilityFilter !== "all";

  function resetFilters() {
    setMinScore("0");
    setSkillsFilter("");
    setLocationFilter("all");
    setAvailabilityFilter("all");
    setSortBy("match");
  }

  // Stats
  const avgScore = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + r.overall, 0) / results.length)
    : 0;
  const highMatches = results.filter((r) => r.overall >= 80).length;
  const medMatches = results.filter((r) => r.overall >= 60 && r.overall < 80).length;

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Hiring", href: "/hiring" },
          { label: "AI Candidate Matching" },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-6 w-6 text-violet-600" />
            AI Candidate Matching
          </h1>
          <p className="text-muted-foreground">
            Find the best candidates for your open positions using intelligent matching
          </p>
        </div>
      </div>

      {/* Job Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Select a Job</span>
            </div>
            <Select value={selectedJobId} onValueChange={setSelectedJobId}>
              <SelectTrigger className="w-[400px]">
                <SelectValue placeholder="Choose a job to find matching candidates..." />
              </SelectTrigger>
              <SelectContent>
                {jobsLoading ? (
                  <SelectItem value="loading" disabled>
                    Loading jobs...
                  </SelectItem>
                ) : jobs.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No published jobs found
                  </SelectItem>
                ) : (
                  jobs.map((j) => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.title}
                      {j.department ? ` - ${j.department}` : ""}
                      {j.location_city ? ` (${j.location_city})` : ""}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {job && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {job.employment_type}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {job.remote_policy}
                </Badge>
                {job.skills_required.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {job.skills_required.length} required skills
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {!selectedJobId ? (
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="rounded-full bg-violet-100 p-4 mb-4">
                <Sparkles className="h-8 w-8 text-violet-600" />
              </div>
              <h3 className="text-lg font-semibold mb-1">
                Select a Job to Get Started
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Choose a published job from the dropdown above. The AI matching algorithm
                will analyze all candidates and rank them by how well they fit the
                position requirements.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats Summary */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Total Matches
                  </span>
                </div>
                <p className="text-2xl font-bold">{results.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Strong Matches (80%+)
                  </span>
                </div>
                <p className="text-2xl font-bold text-emerald-600">{highMatches}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Good Matches (60-80%)
                  </span>
                </div>
                <p className="text-2xl font-bold text-amber-600">{medMatches}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <BarChart3 className="h-4 w-4 text-violet-600" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Average Score
                  </span>
                </div>
                <p className="text-2xl font-bold">{avgScore}%</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            <Select value={minScore} onValueChange={setMinScore}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Min Score" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">No Minimum</SelectItem>
                <SelectItem value="40">40%+ Score</SelectItem>
                <SelectItem value="60">60%+ Score</SelectItem>
                <SelectItem value="70">70%+ Score</SelectItem>
                <SelectItem value="80">80%+ Score</SelectItem>
                <SelectItem value="90">90%+ Score</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Required skills (comma separated)..."
              value={skillsFilter}
              onChange={(e) => setSkillsFilter(e.target.value)}
              className="w-[250px]"
            />
            <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Availability</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="open">Open to Offers</SelectItem>
                <SelectItem value="not_looking">Not Looking</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as "match" | "experience" | "recency")}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="match">Match Score</SelectItem>
                <SelectItem value="experience">Experience</SelectItem>
                <SelectItem value="recency">Most Recent</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-muted-foreground"
                onClick={resetFilters}
              >
                <RotateCcw className="mr-1 h-3 w-3" />
                Reset
              </Button>
            )}
          </div>

          {/* Results */}
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <MatchCardSkeleton key={i} />
              ))}
            </div>
          ) : results.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1">No Matches Found</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    {hasActiveFilters
                      ? "No candidates match your current filters. Try adjusting or resetting filters."
                      : "No candidates found in the system. Candidates will appear as they create profiles."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Showing {results.length} candidates ranked by {sortBy === "match" ? "match score" : sortBy === "experience" ? "experience" : "most recent"}
              </p>
              {results.map((match, index) => (
                <div key={match.candidateId} className="relative">
                  {index < 3 && (
                    <div className="absolute -left-2 -top-2 z-10">
                      <Badge
                        className={`text-[10px] ${
                          index === 0
                            ? "bg-amber-500 hover:bg-amber-500"
                            : index === 1
                            ? "bg-slate-400 hover:bg-slate-400"
                            : "bg-amber-700 hover:bg-amber-700"
                        }`}
                      >
                        #{index + 1}
                      </Badge>
                    </div>
                  )}
                  <MatchCard match={match} />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
