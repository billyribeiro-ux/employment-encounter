"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Users,
  MapPin,
  Filter,
  UserPlus,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Star,
  Download,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchInput } from "@/components/dashboard/search-input";
import { useCandidates } from "@/lib/hooks/use-candidates";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { exportToCSV } from "@/lib/utils";
import { toast } from "sonner";

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

export default function TalentPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery);
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all");
  const [remoteFilter, setRemoteFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(12);

  const { data, isLoading, isError } = useCandidates({
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
    availability_status:
      availabilityFilter !== "all" ? availabilityFilter : undefined,
    remote_preference: remoteFilter !== "all" ? remoteFilter : undefined,
  });

  const candidates = data?.data ?? [];
  const meta = data?.meta;

  const hasActiveFilters =
    searchQuery ||
    availabilityFilter !== "all" ||
    remoteFilter !== "all";

  function resetFilters() {
    setSearchQuery("");
    setAvailabilityFilter("all");
    setRemoteFilter("all");
    setPage(1);
  }

  function handleAddToPool(candidateId: string) {
    toast.success("Candidate added to talent pool");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Talent Discovery
          </h1>
          <p className="text-muted-foreground">
            Search and discover candidates for your open positions
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() =>
            exportToCSV(
              candidates.map((c) => ({
                headline: c.headline,
                location: [c.location_city, c.location_state].filter(Boolean).join(", "),
                availability: c.availability_status,
                remote_preference: c.remote_preference,
                score: c.reputation_score,
              })),
              "talent-export"
            )
          }
        >
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <SearchInput
          value={searchQuery}
          onChange={(v) => {
            setSearchQuery(v);
            setPage(1);
          }}
          placeholder="Search by skills, headline, location..."
        />
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
      ) : candidates.length === 0 && debouncedSearch ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <Search className="h-8 w-8 text-muted-foreground mb-3" />
              <h3 className="text-lg font-semibold mb-1">No results found</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                No candidates match &ldquo;{debouncedSearch}&rdquo;. Try
                different keywords or adjust your filters.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : candidates.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">
                No candidates yet
              </h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                Candidates will appear here as they create profiles on the
                platform.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {meta && (
            <p className="text-sm text-muted-foreground">
              Showing {(meta.page - 1) * meta.per_page + 1}&ndash;
              {Math.min(meta.page * meta.per_page, meta.total)} of{" "}
              {meta.total} candidates
            </p>
          )}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {candidates.map((candidate) => {
              const location = [
                candidate.location_city,
                candidate.location_state,
              ]
                .filter(Boolean)
                .join(", ");

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
                      {candidate.reputation_score > 0 && (
                        <div className="flex items-center gap-1 text-amber-500">
                          <Star className="h-4 w-4 fill-current" />
                          <span className="text-xs font-semibold">
                            {candidate.reputation_score}
                          </span>
                        </div>
                      )}
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

                    <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={() => handleAddToPool(candidate.id)}
                      >
                        <UserPlus className="mr-1 h-3 w-3" />
                        Add to Pool
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
    </div>
  );
}
