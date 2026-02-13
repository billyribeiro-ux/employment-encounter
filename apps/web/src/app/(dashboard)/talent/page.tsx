"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  Users,
  MapPin,
  UserPlus,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Star,
  Download,
  Sparkles,
  BookmarkPlus,
  Bookmark,
  Trash2,
  ArrowUpDown,
  TrendingUp,
  Briefcase,
  Globe2,
  CircleDollarSign,
  ArrowRight,
  Info,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { SearchInput } from "@/components/dashboard/search-input";
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs";
import { useCandidates, type CandidateProfile } from "@/lib/hooks/use-candidates";
import { useJobs } from "@/lib/hooks/use-jobs";
import { useCreateApplication } from "@/lib/hooks/use-applications";
import { calculateMatchScore, type MatchResult } from "@/lib/hooks/use-matching";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { exportToCSV, cn } from "@/lib/utils";
import { toast } from "sonner";

// ============================================================================
// Types
// ============================================================================

interface SavedSearch {
  id: string;
  name: string;
  createdAt: string;
  filters: {
    searchQuery: string;
    availabilityFilter: string;
    remoteFilter: string;
    matchJobId: string;
    minMatchScore: number;
    sortBy: string;
  };
}

interface BooleanToken {
  type: "term" | "AND" | "OR" | "NOT";
  value: string;
}

// ============================================================================
// Helpers
// ============================================================================

function availabilityVariant(status: string) {
  switch (status) {
    case "available":
      return "default" as const;
    case "open":
      return "default" as const;
    case "not_looking":
      return "secondary" as const;
    case "employed":
      return "outline" as const;
    default:
      return "secondary" as const;
  }
}

function formatSalary(cents: number | null): string {
  if (!cents) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function getInitials(headline: string | null): string {
  if (!headline) return "?";
  const words = headline.split(" ");
  return words
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-500";
}

function scoreBg(score: number): string {
  if (score >= 80) return "bg-green-100 text-green-700 border-green-200";
  if (score >= 60) return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-red-100 text-red-700 border-red-200";
}

/** Parse boolean search query into tokens */
function parseBooleanSearch(query: string): BooleanToken[] {
  if (!query.trim()) return [];
  const tokens: BooleanToken[] = [];
  // Split preserving AND, OR, NOT as operators and quoted phrases
  const regex = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\bAND\b|\bOR\b|\bNOT\b|\S+)/gi;
  let match;
  while ((match = regex.exec(query)) !== null) {
    const raw = match[1];
    const upper = raw.toUpperCase();
    if (upper === "AND" || upper === "OR" || upper === "NOT") {
      tokens.push({ type: upper as "AND" | "OR" | "NOT", value: raw });
    } else {
      // Strip surrounding quotes
      const cleaned = raw.replace(/^["']|["']$/g, "");
      tokens.push({ type: "term", value: cleaned });
    }
  }
  return tokens;
}

/** Apply boolean search against a candidate's searchable text */
function matchesBooleanSearch(candidate: CandidateProfile, tokens: BooleanToken[]): boolean {
  if (tokens.length === 0) return true;

  const text = [
    candidate.headline,
    candidate.summary,
    candidate.location_city,
    candidate.location_state,
    candidate.location_country,
    candidate.remote_preference,
    candidate.availability_status,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  let result = true;
  let currentOp: "AND" | "OR" | "NOT" = "AND";

  for (const token of tokens) {
    if (token.type === "AND" || token.type === "OR" || token.type === "NOT") {
      currentOp = token.type;
      continue;
    }

    const termMatch = text.includes(token.value.toLowerCase());

    switch (currentOp) {
      case "AND":
        result = result && termMatch;
        break;
      case "OR":
        result = result || termMatch;
        break;
      case "NOT":
        result = result && !termMatch;
        currentOp = "AND"; // Reset after NOT
        break;
    }
  }

  return result;
}

function extractSkillKeywords(candidate: CandidateProfile): string[] {
  const text = [candidate.headline, candidate.summary].filter(Boolean).join(" ");
  const commonSkills = [
    "JavaScript", "TypeScript", "React", "Angular", "Vue", "Node.js", "Python",
    "Java", "C++", "C#", "Go", "Rust", "Ruby", "PHP", "Swift", "Kotlin",
    "SQL", "NoSQL", "MongoDB", "PostgreSQL", "MySQL", "Redis", "GraphQL",
    "REST", "AWS", "Azure", "GCP", "Docker", "Kubernetes", "CI/CD",
    "Git", "Linux", "Agile", "Scrum", "Machine Learning", "AI",
    "Data Science", "DevOps", "CSS", "HTML", "Sass", "Tailwind",
    "Next.js", "Express", "Django", "Flask", "Spring", "Rails",
    "TensorFlow", "PyTorch", "Figma", "Sketch", "UI/UX", "Product Management",
    "Project Management", "Leadership", "Communication", "Teamwork",
  ];

  const found: string[] = [];
  const lower = text.toLowerCase();
  for (const skill of commonSkills) {
    if (lower.includes(skill.toLowerCase())) {
      found.push(skill);
    }
  }
  return found;
}

const SAVED_SEARCHES_KEY = "talent_saved_searches";

function loadSavedSearches(): SavedSearch[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SAVED_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistSavedSearches(searches: SavedSearch[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(searches));
}

// ============================================================================
// Sub-components
// ============================================================================

function CandidateCardSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-28" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

function PoolStatistics({
  total,
  available,
  avgScore,
  remoteCount,
  topLocations,
}: {
  total: number;
  available: number;
  avgScore: number | null;
  remoteCount: number;
  topLocations: { name: string; count: number }[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{total}</p>
              <p className="text-xs text-muted-foreground">Total Candidates</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{available}</p>
              <p className="text-xs text-muted-foreground">Available Now</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-2">
              <Globe2 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{remoteCount}</p>
              <p className="text-xs text-muted-foreground">Remote Preference</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-100 p-2">
              <Sparkles className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {avgScore !== null ? `${avgScore}%` : "--"}
              </p>
              <p className="text-xs text-muted-foreground">Avg Match Score</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BooleanSearchHint({ query }: { query: string }) {
  const tokens = parseBooleanSearch(query);
  const hasOperators = tokens.some(
    (t) => t.type === "AND" || t.type === "OR" || t.type === "NOT"
  );
  if (!hasOperators || tokens.length === 0) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-1.5">
      <Info className="h-3 w-3 shrink-0" />
      <span>Boolean search:</span>
      <div className="flex items-center gap-1 flex-wrap">
        {tokens.map((token, i) => (
          <span key={i}>
            {token.type === "AND" || token.type === "OR" || token.type === "NOT" ? (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono bg-background">
                {token.type}
              </Badge>
            ) : (
              <span className="font-medium text-foreground">{token.value}</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

function MatchScoreBadge({ score }: { score: number }) {
  return (
    <div className={cn("flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold", scoreBg(score))}>
      <Sparkles className="h-3 w-3" />
      {score}%
    </div>
  );
}

function MatchBreakdown({ match }: { match: MatchResult }) {
  const rows = [
    { label: "Skills", score: match.skillsScore, icon: Star },
    { label: "Experience", score: match.experienceScore, icon: Briefcase },
    { label: "Location", score: match.locationScore, icon: MapPin },
    { label: "Salary", score: match.salaryScore, icon: CircleDollarSign },
  ];

  return (
    <div className="space-y-1.5 mt-2">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-2 text-[10px]">
          <row.icon className="h-3 w-3 text-muted-foreground shrink-0" />
          <span className="w-16 text-muted-foreground">{row.label}</span>
          <div className="flex-1">
            <Progress value={row.score} className="h-1.5" />
          </div>
          <span className={cn("w-8 text-right font-medium", scoreColor(row.score))}>
            {row.score}%
          </span>
        </div>
      ))}
      {match.matchingSkills.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {match.matchingSkills.slice(0, 5).map((skill) => (
            <Badge key={skill} variant="secondary" className="text-[9px] px-1.5 py-0">
              {skill}
            </Badge>
          ))}
          {match.matchingSkills.length > 5 && (
            <span className="text-[9px] text-muted-foreground">
              +{match.matchingSkills.length - 5} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Page
// ============================================================================

export default function TalentPage() {
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery);
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all");
  const [remoteFilter, setRemoteFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(12);

  // AI Match
  const [matchJobId, setMatchJobId] = useState<string>("");
  const [minMatchScore, setMinMatchScore] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>("default");

  // Saved Search
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>(() => loadSavedSearches());
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState("");

  // Quick-add to pipeline
  const [pipelineJobId, setPipelineJobId] = useState<string>("");
  const [showPipelineDialog, setShowPipelineDialog] = useState(false);
  const [pipelineCandidateId, setPipelineCandidateId] = useState<string>("");

  // Expanded match details
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);

  // Fetch data
  const { data, isLoading, isError } = useCandidates({
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
    availability_status:
      availabilityFilter !== "all" ? availabilityFilter : undefined,
    remote_preference: remoteFilter !== "all" ? remoteFilter : undefined,
  });

  const { data: jobsData } = useJobs({ per_page: 100, status: "published" });
  const createApplication = useCreateApplication();

  const candidates = data?.data ?? [];
  const meta = data?.meta;
  const jobs = jobsData?.data ?? [];
  const selectedJob = jobs.find((j) => j.id === matchJobId);

  // Boolean search filtering (client-side on top of server search)
  const booleanTokens = useMemo(() => parseBooleanSearch(debouncedSearch), [debouncedSearch]);
  const hasBooleanOps = booleanTokens.some(
    (t) => t.type === "AND" || t.type === "OR" || t.type === "NOT"
  );

  // Calculate match scores for each candidate if a job is selected
  const matchResults = useMemo(() => {
    if (!selectedJob) return new Map<string, MatchResult>();
    const map = new Map<string, MatchResult>();
    for (const candidate of candidates) {
      const skills = extractSkillKeywords(candidate);
      const result = calculateMatchScore(candidate, skills, selectedJob);
      map.set(candidate.id, result);
    }
    return map;
  }, [candidates, selectedJob]);

  // Apply client-side filters: boolean search + match score filter + sorting
  const filteredCandidates = useMemo(() => {
    let result = [...candidates];

    // Boolean search
    if (hasBooleanOps) {
      result = result.filter((c) => matchesBooleanSearch(c, booleanTokens));
    }

    // Min match score filter
    if (selectedJob && minMatchScore > 0) {
      result = result.filter((c) => {
        const match = matchResults.get(c.id);
        return match ? match.overall >= minMatchScore : false;
      });
    }

    // Sort
    if (sortBy === "match" && selectedJob) {
      result.sort((a, b) => {
        const sa = matchResults.get(a.id)?.overall ?? 0;
        const sb = matchResults.get(b.id)?.overall ?? 0;
        return sb - sa;
      });
    } else if (sortBy === "score") {
      result.sort((a, b) => b.reputation_score - a.reputation_score);
    } else if (sortBy === "recent") {
      result.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    return result;
  }, [candidates, hasBooleanOps, booleanTokens, selectedJob, minMatchScore, matchResults, sortBy]);

  // Pool statistics
  const poolStats = useMemo(() => {
    const total = meta?.total ?? candidates.length;
    const available = candidates.filter(
      (c) => c.availability_status === "available" || c.availability_status === "open"
    ).length;
    const remoteCount = candidates.filter(
      (c) => c.remote_preference === "remote" || c.remote_preference === "flexible"
    ).length;

    let avgScore: number | null = null;
    if (selectedJob && matchResults.size > 0) {
      const scores = Array.from(matchResults.values()).map((m) => m.overall);
      avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }

    // Top locations
    const locMap = new Map<string, number>();
    for (const c of candidates) {
      const loc = [c.location_city, c.location_state].filter(Boolean).join(", ");
      if (loc) locMap.set(loc, (locMap.get(loc) ?? 0) + 1);
    }
    const topLocations = Array.from(locMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return { total, available, avgScore, remoteCount, topLocations };
  }, [candidates, meta, selectedJob, matchResults]);

  const hasActiveFilters =
    searchQuery ||
    availabilityFilter !== "all" ||
    remoteFilter !== "all" ||
    matchJobId ||
    minMatchScore > 0 ||
    sortBy !== "default";

  function resetFilters() {
    setSearchQuery("");
    setAvailabilityFilter("all");
    setRemoteFilter("all");
    setMatchJobId("");
    setMinMatchScore(0);
    setSortBy("default");
    setPage(1);
  }

  // Saved search handlers
  function handleSaveSearch() {
    if (!saveSearchName.trim()) return;
    const newSearch: SavedSearch = {
      id: `ss_${Date.now()}`,
      name: saveSearchName.trim(),
      createdAt: new Date().toISOString(),
      filters: {
        searchQuery,
        availabilityFilter,
        remoteFilter,
        matchJobId,
        minMatchScore,
        sortBy,
      },
    };
    const updated = [newSearch, ...savedSearches];
    setSavedSearches(updated);
    persistSavedSearches(updated);
    setSaveSearchName("");
    setShowSaveDialog(false);
    toast.success(`Search "${newSearch.name}" saved`);
  }

  function handleLoadSearch(search: SavedSearch) {
    setSearchQuery(search.filters.searchQuery);
    setAvailabilityFilter(search.filters.availabilityFilter);
    setRemoteFilter(search.filters.remoteFilter);
    setMatchJobId(search.filters.matchJobId);
    setMinMatchScore(search.filters.minMatchScore);
    setSortBy(search.filters.sortBy);
    setPage(1);
    setShowLoadDialog(false);
    toast.success(`Loaded search "${search.name}"`);
  }

  function handleDeleteSavedSearch(id: string) {
    const updated = savedSearches.filter((s) => s.id !== id);
    setSavedSearches(updated);
    persistSavedSearches(updated);
    toast.success("Saved search removed");
  }

  // Quick-add to pipeline
  function handleQuickAdd(candidateId: string) {
    if (jobs.length === 0) {
      toast.error("No published jobs available. Create a job first.");
      return;
    }
    if (jobs.length === 1) {
      // Auto-select single job
      createApplication.mutate(
        { job_id: jobs[0].id, candidate_id: candidateId, source: "talent_discovery" },
        {
          onSuccess: () => toast.success("Candidate added to pipeline"),
          onError: () => toast.error("Failed to add candidate to pipeline"),
        }
      );
      return;
    }
    // Show job selection dialog
    setPipelineCandidateId(candidateId);
    setPipelineJobId(jobs[0].id);
    setShowPipelineDialog(true);
  }

  function confirmPipelineAdd() {
    if (!pipelineJobId || !pipelineCandidateId) return;
    createApplication.mutate(
      { job_id: pipelineJobId, candidate_id: pipelineCandidateId, source: "talent_discovery" },
      {
        onSuccess: () => {
          toast.success("Candidate added to pipeline");
          setShowPipelineDialog(false);
        },
        onError: () => toast.error("Failed to add candidate to pipeline"),
      }
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/" },
          { label: "Talent Discovery" },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Talent Discovery
          </h1>
          <p className="text-muted-foreground">
            Search and discover candidates with AI-powered matching for your open positions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLoadDialog(true)}
          >
            <Bookmark className="mr-2 h-4 w-4" />
            Saved Searches
            {savedSearches.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0">
                {savedSearches.length}
              </Badge>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSaveDialog(true)}
            disabled={!hasActiveFilters}
          >
            <BookmarkPlus className="mr-2 h-4 w-4" />
            Save Search
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              exportToCSV(
                filteredCandidates.map((c) => ({
                  headline: c.headline,
                  location: [c.location_city, c.location_state].filter(Boolean).join(", "),
                  availability: c.availability_status,
                  remote_preference: c.remote_preference,
                  reputation_score: c.reputation_score,
                  match_score: matchResults.get(c.id)?.overall ?? "",
                })),
                "talent-export"
              )
            }
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Pool Statistics */}
      <PoolStatistics
        total={poolStats.total}
        available={poolStats.available}
        avgScore={poolStats.avgScore}
        remoteCount={poolStats.remoteCount}
        topLocations={poolStats.topLocations}
      />

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[240px]">
              <SearchInput
                value={searchQuery}
                onChange={(v) => {
                  setSearchQuery(v);
                  setPage(1);
                }}
                placeholder="Boolean search: React AND TypeScript NOT Angular..."
              />
            </div>
            <Select
              value={availabilityFilter}
              onValueChange={(v) => {
                setAvailabilityFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Availability</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="open">Open to Offers</SelectItem>
                <SelectItem value="not_looking">Not Looking</SelectItem>
                <SelectItem value="employed">Employed</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={remoteFilter}
              onValueChange={(v) => {
                setRemoteFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Remote Pref" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Preferences</SelectItem>
                <SelectItem value="remote">Remote Only</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
                <SelectItem value="onsite">On-site</SelectItem>
                <SelectItem value="flexible">Flexible</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Boolean search hint */}
          <BooleanSearchHint query={debouncedSearch} />

          {/* AI Match controls */}
          <Separator />
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">AI Match:</span>
            </div>
            <Select
              value={matchJobId || "none"}
              onValueChange={(v) => {
                setMatchJobId(v === "none" ? "" : v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[260px]">
                <SelectValue placeholder="Select a job to match..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No job selected</SelectItem>
                {jobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.title}
                    {job.department ? ` (${job.department})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedJob && (
              <>
                <Select
                  value={String(minMatchScore)}
                  onValueChange={(v) => {
                    setMinMatchScore(Number(v));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Min Score" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Any Score</SelectItem>
                    <SelectItem value="40">40%+ Match</SelectItem>
                    <SelectItem value="60">60%+ Match</SelectItem>
                    <SelectItem value="80">80%+ Match</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
            <Select
              value={sortBy}
              onValueChange={(v) => setSortBy(v)}
            >
              <SelectTrigger className="w-[160px]">
                <ArrowUpDown className="mr-2 h-3 w-3" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                {selectedJob && <SelectItem value="match">Match Score</SelectItem>}
                <SelectItem value="score">Reputation Score</SelectItem>
                <SelectItem value="recent">Most Recent</SelectItem>
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
                Reset All
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CandidateCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <p className="text-sm text-destructive">
                Failed to load candidates. Make sure the backend is running.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : filteredCandidates.length === 0 && debouncedSearch ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <Search className="h-8 w-8 text-muted-foreground mb-3" />
              <h3 className="text-lg font-semibold mb-1">No results found</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                No candidates match &ldquo;{debouncedSearch}&rdquo;. Try
                different keywords or adjust your filters.
              </p>
              {hasBooleanOps && (
                <p className="text-xs text-muted-foreground mt-2">
                  Tip: Check your boolean operators (AND, OR, NOT) are applied correctly.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : filteredCandidates.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">
                No candidates found
              </h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                {minMatchScore > 0
                  ? `No candidates meet the ${minMatchScore}% minimum match threshold. Try lowering the minimum score.`
                  : "Candidates will appear here as they create profiles on the platform."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {meta && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredCandidates.length} of{" "}
                {meta.total} candidates
                {selectedJob && (
                  <span className="ml-1">
                    matched against <span className="font-medium text-foreground">{selectedJob.title}</span>
                  </span>
                )}
              </p>
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCandidates.map((candidate) => {
              const location = [
                candidate.location_city,
                candidate.location_state,
              ]
                .filter(Boolean)
                .join(", ");

              const match = matchResults.get(candidate.id);
              const isExpanded = expandedMatchId === candidate.id;

              return (
                <Card
                  key={candidate.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                        {getInitials(candidate.headline)}
                      </div>
                      <div className="flex-1 min-w-0">
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
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge
                            variant={availabilityVariant(
                              candidate.availability_status
                            )}
                            className="text-[10px]"
                          >
                            {candidate.availability_status.replace(/_/g, " ")}
                          </Badge>
                          {candidate.remote_preference && (
                            <Badge variant="outline" className="text-[10px]">
                              {candidate.remote_preference}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {candidate.reputation_score > 0 && (
                          <div className="flex items-center gap-1 text-amber-500">
                            <Star className="h-4 w-4 fill-current" />
                            <span className="text-xs font-semibold">
                              {candidate.reputation_score}
                            </span>
                          </div>
                        )}
                        {match && <MatchScoreBadge score={match.overall} />}
                      </div>
                    </div>

                    {candidate.summary && (
                      <p className="text-xs text-muted-foreground mt-3 line-clamp-2">
                        {candidate.summary}
                      </p>
                    )}

                    {(candidate.desired_salary_min_cents ||
                      candidate.desired_salary_max_cents) && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatSalary(candidate.desired_salary_min_cents)}
                        {candidate.desired_salary_min_cents &&
                          candidate.desired_salary_max_cents &&
                          " - "}
                        {formatSalary(candidate.desired_salary_max_cents)}
                      </p>
                    )}

                    {/* Match breakdown (expandable) */}
                    {match && (
                      <div className="mt-3">
                        <button
                          className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                          onClick={() =>
                            setExpandedMatchId(isExpanded ? null : candidate.id)
                          }
                        >
                          <ArrowRight
                            className={cn(
                              "h-3 w-3 transition-transform",
                              isExpanded && "rotate-90"
                            )}
                          />
                          {isExpanded ? "Hide" : "Show"} match breakdown
                        </button>
                        {isExpanded && <MatchBreakdown match={match} />}
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={() => handleQuickAdd(candidate.id)}
                      >
                        <UserPlus className="mr-1 h-3 w-3" />
                        Add to Pipeline
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs"
                      >
                        <MessageSquare className="mr-1 h-3 w-3" />
                        Message
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {meta && meta.total_pages > 1 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground">
                  Page {meta.page} of {meta.total_pages}
                </p>
                <Select
                  value={String(perPage)}
                  onValueChange={(v) => {
                    setPerPage(Number(v));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[70px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12">12</SelectItem>
                    <SelectItem value="24">24</SelectItem>
                    <SelectItem value="48">48</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= meta.total_pages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Save Search Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Current Search</DialogTitle>
            <DialogDescription>
              Save your current filters and search query for quick access later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Name</label>
              <Input
                placeholder="e.g., Senior React Engineers in SF"
                value={saveSearchName}
                onChange={(e) => setSaveSearchName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveSearch();
                }}
              />
            </div>
            <div className="rounded-md bg-muted/50 p-3 space-y-1 text-xs">
              <p className="font-medium text-sm mb-2">Current Filters:</p>
              {searchQuery && (
                <p>
                  <span className="text-muted-foreground">Query:</span> {searchQuery}
                </p>
              )}
              {availabilityFilter !== "all" && (
                <p>
                  <span className="text-muted-foreground">Availability:</span>{" "}
                  {availabilityFilter}
                </p>
              )}
              {remoteFilter !== "all" && (
                <p>
                  <span className="text-muted-foreground">Remote:</span> {remoteFilter}
                </p>
              )}
              {selectedJob && (
                <p>
                  <span className="text-muted-foreground">Match Job:</span>{" "}
                  {selectedJob.title}
                </p>
              )}
              {minMatchScore > 0 && (
                <p>
                  <span className="text-muted-foreground">Min Score:</span>{" "}
                  {minMatchScore}%
                </p>
              )}
              {sortBy !== "default" && (
                <p>
                  <span className="text-muted-foreground">Sort:</span> {sortBy}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSearch} disabled={!saveSearchName.trim()}>
              Save Search
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Saved Searches Dialog */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Saved Searches</DialogTitle>
            <DialogDescription>
              Load a previously saved search to quickly apply filters.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto py-2">
            {savedSearches.length === 0 ? (
              <div className="text-center py-8">
                <Bookmark className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  No saved searches yet. Apply some filters and save them for quick access.
                </p>
              </div>
            ) : (
              savedSearches.map((search) => (
                <div
                  key={search.id}
                  className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{search.name}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {search.filters.searchQuery && (
                        <Badge variant="secondary" className="text-[10px]">
                          &ldquo;{search.filters.searchQuery}&rdquo;
                        </Badge>
                      )}
                      {search.filters.availabilityFilter !== "all" && (
                        <Badge variant="secondary" className="text-[10px]">
                          {search.filters.availabilityFilter}
                        </Badge>
                      )}
                      {search.filters.remoteFilter !== "all" && (
                        <Badge variant="secondary" className="text-[10px]">
                          {search.filters.remoteFilter}
                        </Badge>
                      )}
                      {search.filters.matchJobId && (
                        <Badge variant="secondary" className="text-[10px]">
                          Job Match
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Saved {new Date(search.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => handleLoadSearch(search)}
                    >
                      Load
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteSavedSearch(search.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLoadDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Add to Pipeline Dialog */}
      <Dialog open={showPipelineDialog} onOpenChange={setShowPipelineDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Pipeline</DialogTitle>
            <DialogDescription>
              Select a job to add this candidate to its hiring pipeline.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Select
              value={pipelineJobId}
              onValueChange={(v) => setPipelineJobId(v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a job..." />
              </SelectTrigger>
              <SelectContent>
                {jobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.title}
                    {job.department ? ` - ${job.department}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPipelineDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmPipelineAdd} disabled={!pipelineJobId}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add to Pipeline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
