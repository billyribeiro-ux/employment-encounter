"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Star,
  Search,
  Users,
  ClipboardCheck,
  Heart,
  Gavel,
  Eye,
  StickyNote,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { SearchInput } from "@/components/dashboard/search-input";
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs";
import { useApplications } from "@/lib/hooks/use-applications";
import { useJobs } from "@/lib/hooks/use-jobs";
import { useFavorites } from "@/lib/hooks/use-favorites";
import { useAddFavorite, useRemoveFavorite } from "@/lib/hooks/use-favorites";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { toast } from "sonner";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function stageLabel(stage: string): string {
  const labels: Record<string, string> = {
    applied: "Applied",
    screening: "Screening",
    phone_screen: "Phone Screen",
    technical: "Technical",
    onsite: "Onsite",
    offer: "Offer",
  };
  return labels[stage] || stage.replace(/_/g, " ");
}

function stageVariant(stage: string) {
  switch (stage) {
    case "applied":
      return "secondary" as const;
    case "screening":
      return "outline" as const;
    case "phone_screen":
      return "outline" as const;
    case "technical":
      return "default" as const;
    case "onsite":
      return "default" as const;
    case "offer":
      return "default" as const;
    default:
      return "secondary" as const;
  }
}

function decisionVariant(decision: string) {
  switch (decision) {
    case "hire":
      return "default" as const;
    case "reject":
      return "destructive" as const;
    case "hold":
      return "secondary" as const;
    default:
      return "outline" as const;
  }
}

// --- All Candidates Tab ---

function AllCandidatesTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery);
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("updated_at");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [page, setPage] = useState(1);
  const perPage = 25;

  const { data, isLoading, isError } = useApplications({
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
    stage: stageFilter !== "all" ? stageFilter : undefined,
    status: "active",
    sort: sortBy,
    order: sortOrder,
  });

  const addFavorite = useAddFavorite();
  const removeFavorite = useRemoveFavorite();
  const { data: favoritesData } = useFavorites({ per_page: 200 });
  const favoriteMap = new Map(
    (favoritesData?.data ?? []).map((f) => [f.candidate_id, f.id])
  );

  const applications = data?.data ?? [];
  const meta = data?.meta;

  function toggleSort(col: string) {
    if (sortBy === col) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(col);
      setSortOrder("asc");
    }
    setPage(1);
  }

  function sortIcon(col: string) {
    if (sortBy !== col)
      return (
        <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground/50" />
      );
    return sortOrder === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    );
  }

  function handleToggleFavorite(candidateId: string) {
    const existingId = favoriteMap.get(candidateId);
    if (existingId) {
      removeFavorite.mutate(existingId, {
        onSuccess: () => toast.success("Removed from shortlist"),
        onError: () => toast.error("Failed to update shortlist"),
      });
    } else {
      addFavorite.mutate(
        { candidate_id: candidateId },
        {
          onSuccess: () => toast.success("Added to shortlist"),
          onError: () => toast.error("Failed to update shortlist"),
        }
      );
    }
  }

  const hasActiveFilters = searchQuery || stageFilter !== "all";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <SearchInput
          value={searchQuery}
          onChange={(v) => {
            setSearchQuery(v);
            setPage(1);
          }}
          placeholder="Search candidates..."
        />
        <Select
          value={stageFilter}
          onValueChange={(v) => {
            setStageFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            <SelectItem value="applied">Applied</SelectItem>
            <SelectItem value="screening">Screening</SelectItem>
            <SelectItem value="phone_screen">Phone Screen</SelectItem>
            <SelectItem value="technical">Technical</SelectItem>
            <SelectItem value="onsite">Onsite</SelectItem>
            <SelectItem value="offer">Offer</SelectItem>
          </SelectContent>
        </Select>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-muted-foreground"
            onClick={() => {
              setSearchQuery("");
              setStageFilter("all");
              setPage(1);
            }}
          >
            <RotateCcw className="mr-1 h-3 w-3" />
            Reset
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-destructive">
                Failed to load candidates. Make sure the backend is running.
              </p>
            </div>
          ) : applications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">
                {debouncedSearch ? "No results found" : "No candidates yet"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {debouncedSearch
                  ? `No candidates match "${debouncedSearch}". Try different keywords.`
                  : "Candidates will appear here as they apply to your open positions."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th
                      className="px-4 py-3 text-left font-medium cursor-pointer select-none"
                      onClick={() => toggleSort("candidate_name")}
                    >
                      <span className="flex items-center">
                        Name{sortIcon("candidate_name")}
                      </span>
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      Job Applied
                    </th>
                    <th className="px-4 py-3 text-left font-medium">Stage</th>
                    <th
                      className="px-4 py-3 text-left font-medium cursor-pointer select-none"
                      onClick={() => toggleSort("screening_score")}
                    >
                      <span className="flex items-center">
                        Avg Score{sortIcon("screening_score")}
                      </span>
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      Evaluations
                    </th>
                    <th
                      className="px-4 py-3 text-left font-medium cursor-pointer select-none"
                      onClick={() => toggleSort("updated_at")}
                    >
                      <span className="flex items-center">
                        Last Activity{sortIcon("updated_at")}
                      </span>
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => {
                    const isFavorited = favoriteMap.has(app.candidate_id);
                    return (
                      <tr
                        key={app.id}
                        className="border-b last:border-0 hover:bg-muted/30"
                      >
                        <td className="px-4 py-3 font-medium">
                          <Link
                            href={`/hiring/evaluate/${app.id}`}
                            className="hover:underline"
                          >
                            {app.candidate_name || "Unknown Candidate"}
                          </Link>
                          {app.candidate_headline && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                              {app.candidate_headline}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {app.job_title || "--"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={stageVariant(app.stage)}>
                            {stageLabel(app.stage)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {app.screening_score != null ? (
                            <div className="flex items-center gap-1 text-amber-500">
                              <Star className="h-3.5 w-3.5 fill-current" />
                              <span className="text-sm font-semibold">
                                {app.screening_score}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              --
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className="text-xs">
                            {app.screening_score != null ? "1+" : "0"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {formatDate(app.updated_at)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/hiring/evaluate/${app.id}`}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title="Evaluate"
                              >
                                <ClipboardCheck className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-8 w-8 ${
                                isFavorited
                                  ? "text-amber-500"
                                  : "text-muted-foreground"
                              }`}
                              title={
                                isFavorited
                                  ? "Remove from shortlist"
                                  : "Add to shortlist"
                              }
                              onClick={() =>
                                handleToggleFavorite(app.candidate_id)
                              }
                              disabled={
                                addFavorite.isPending ||
                                removeFavorite.isPending
                              }
                            >
                              <Star
                                className={`h-4 w-4 ${
                                  isFavorited ? "fill-current" : ""
                                }`}
                              />
                            </Button>
                            <Link href={`/hiring/evaluate/${app.id}`}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title="View profile"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {meta && meta.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(meta.page - 1) * meta.per_page + 1}&ndash;
            {Math.min(meta.page * meta.per_page, meta.total)} of {meta.total}
          </p>
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
    </div>
  );
}

// --- By Job Tab ---

function ByJobTab() {
  const [selectedJobId, setSelectedJobId] = useState<string>("all");
  const { data: jobsData, isLoading: jobsLoading } = useJobs({
    status: "published",
    per_page: 100,
  });
  const { data: appsData, isLoading: appsLoading } = useApplications({
    job_id: selectedJobId !== "all" ? selectedJobId : undefined,
    per_page: 100,
    sort: "screening_score",
    order: "desc",
  });

  const jobs = jobsData?.data ?? [];
  const applications = appsData?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select value={selectedJobId} onValueChange={setSelectedJobId}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Select a job" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Jobs</SelectItem>
            {jobs.map((job) => (
              <SelectItem key={job.id} value={job.id}>
                {job.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {jobsLoading || appsLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-5 w-40 mb-2" />
                <Skeleton className="h-4 w-28 mb-3" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : applications.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No candidates</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {selectedJobId === "all"
                  ? "No active applications found across any jobs."
                  : "No candidates have applied for this position yet."}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {applications.map((app, index) => (
            <Card
              key={app.id}
              className="hover:shadow-md transition-shadow relative"
            >
              <CardContent className="pt-6">
                <div className="absolute top-3 right-3">
                  <Badge variant="outline" className="text-xs">
                    #{index + 1}
                  </Badge>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    {(app.candidate_name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/hiring/evaluate/${app.id}`}
                      className="text-sm font-semibold hover:underline line-clamp-1"
                    >
                      {app.candidate_name || "Unknown Candidate"}
                    </Link>
                    {app.candidate_headline && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {app.candidate_headline}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-3">
                  <Badge variant={stageVariant(app.stage)} className="text-xs">
                    {stageLabel(app.stage)}
                  </Badge>
                  {app.screening_score != null && (
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      <span className="text-xs font-semibold">
                        {app.screening_score}
                      </span>
                    </div>
                  )}
                </div>

                {app.job_title && selectedJobId === "all" && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
                    Applied for: {app.job_title}
                  </p>
                )}

                <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                  <Link href={`/hiring/evaluate/${app.id}`} className="flex-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-8 text-xs"
                    >
                      <ClipboardCheck className="mr-1 h-3 w-3" />
                      Evaluate
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Shortlisted Tab ---

function ShortlistedTab() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery);
  const [jobFilter, setJobFilter] = useState<string>("all");

  const { data: favoritesData, isLoading } = useFavorites({
    per_page: 100,
    job_id: jobFilter !== "all" ? jobFilter : undefined,
    search: debouncedSearch || undefined,
  });
  const { data: jobsData } = useJobs({ status: "published", per_page: 100 });
  const removeFavorite = useRemoveFavorite();

  const favorites = favoritesData?.data ?? [];
  const jobs = jobsData?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search shortlisted..."
        />
        <Select value={jobFilter} onValueChange={setJobFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by job" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Jobs</SelectItem>
            {jobs.map((job) => (
              <SelectItem key={job.id} value={job.id}>
                {job.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-5 w-40 mb-2" />
                <Skeleton className="h-4 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Heart className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No shortlisted candidates</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Star candidates from the evaluation list to add them to your shortlist.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {favorites.map((fav) => (
            <Card key={fav.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                      {(fav.candidate_name || fav.candidate_headline || "?")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">
                        {fav.candidate_name || "Unknown Candidate"}
                      </p>
                      {fav.candidate_headline && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {fav.candidate_headline}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-amber-500"
                    onClick={() =>
                      removeFavorite.mutate(fav.id, {
                        onSuccess: () =>
                          toast.success("Removed from shortlist"),
                        onError: () =>
                          toast.error("Failed to remove from shortlist"),
                      })
                    }
                    disabled={removeFavorite.isPending}
                  >
                    <Star className="h-4 w-4 fill-current" />
                  </Button>
                </div>

                {fav.tags.length > 0 && (
                  <div className="flex gap-1 mt-3 flex-wrap">
                    {fav.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-[10px]"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {fav.notes && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {fav.notes}
                  </p>
                )}

                <p className="text-[10px] text-muted-foreground mt-2">
                  Added {formatDate(fav.created_at)}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Decisions Tab ---

function DecisionsTab() {
  const [decisionFilter, setDecisionFilter] = useState<string>("all");
  const { data: appsData, isLoading } = useApplications({
    per_page: 200,
  });

  const applications = appsData?.data ?? [];

  const decisioned = applications.filter((app) => {
    if (decisionFilter === "all") {
      return (
        app.status === "hired" ||
        app.status === "rejected" ||
        app.hired_at ||
        app.rejected_at
      );
    }
    if (decisionFilter === "hire") return app.status === "hired" || app.hired_at;
    if (decisionFilter === "reject")
      return app.status === "rejected" || app.rejected_at;
    return false;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select value={decisionFilter} onValueChange={setDecisionFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Decision type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Decisions</SelectItem>
            <SelectItem value="hire">Hired</SelectItem>
            <SelectItem value="reject">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : decisioned.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Gavel className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No decisions yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Hiring decisions will appear here as you evaluate and decide on
                candidates.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {decisioned.map((app) => {
                const isHired = app.status === "hired" || !!app.hired_at;
                const isRejected = app.status === "rejected" || !!app.rejected_at;
                const decisionDate = app.hired_at || app.rejected_at || app.updated_at;

                return (
                  <div
                    key={app.id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-xs">
                        {(app.candidate_name || "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {app.candidate_name || "Unknown Candidate"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {app.job_title || "Unknown Position"} &middot;{" "}
                          {formatDate(decisionDate)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {app.rejection_reason && (
                        <p className="text-xs text-muted-foreground max-w-[200px] truncate">
                          {app.rejection_reason}
                        </p>
                      )}
                      <Badge
                        variant={isHired ? "default" : "destructive"}
                      >
                        {isHired ? "Hired" : isRejected ? "Rejected" : "Hold"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// --- Main Page ---

export default function EvaluatePage() {
  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Hiring", href: "/hiring" },
          { label: "Candidate Evaluation Center" },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Candidate Evaluation Center
        </h1>
        <p className="text-muted-foreground">
          Score, compare, and make hiring decisions across all your open
          positions
        </p>
      </div>

      <Tabs defaultValue="all-candidates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all-candidates" className="gap-1.5">
            <Users className="h-4 w-4" />
            All Candidates
          </TabsTrigger>
          <TabsTrigger value="by-job" className="gap-1.5">
            <Filter className="h-4 w-4" />
            By Job
          </TabsTrigger>
          <TabsTrigger value="shortlisted" className="gap-1.5">
            <Heart className="h-4 w-4" />
            Shortlisted
          </TabsTrigger>
          <TabsTrigger value="decisions" className="gap-1.5">
            <Gavel className="h-4 w-4" />
            Decisions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all-candidates">
          <AllCandidatesTab />
        </TabsContent>

        <TabsContent value="by-job">
          <ByJobTab />
        </TabsContent>

        <TabsContent value="shortlisted">
          <ShortlistedTab />
        </TabsContent>

        <TabsContent value="decisions">
          <DecisionsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
