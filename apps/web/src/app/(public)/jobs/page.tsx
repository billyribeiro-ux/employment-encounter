"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  Building2,
  Filter,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Laptop,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePublicJobs } from "@/lib/hooks/use-public-jobs";
import { useDebounce } from "@/lib/hooks/use-debounce";

function formatSalaryCents(cents: number | null, currency = "USD"): string {
  if (!cents) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatEmploymentType(type: string): string {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatRemotePolicy(policy: string): string {
  switch (policy) {
    case "remote":
      return "Remote";
    case "hybrid":
      return "Hybrid";
    case "onsite":
      return "On-site";
    default:
      return policy.charAt(0).toUpperCase() + policy.slice(1);
  }
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

function remotePolicyColor(policy: string): string {
  switch (policy) {
    case "remote":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    case "hybrid":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    case "onsite":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
    default:
      return "";
  }
}

export default function JobsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery);
  const [employmentType, setEmploymentType] = useState<string>("all");
  const [workMode, setWorkMode] = useState<string>("all");
  const [experienceLevel, setExperienceLevel] = useState<string>("all");
  const [page, setPage] = useState(1);
  const perPage = 12;

  const { data, isLoading, isError } = usePublicJobs({
    search: debouncedSearch || undefined,
    employment_type: employmentType !== "all" ? employmentType : undefined,
    work_mode: workMode !== "all" ? workMode : undefined,
    experience_level:
      experienceLevel !== "all" ? experienceLevel : undefined,
    page,
    per_page: perPage,
  });

  const jobs = data?.data ?? [];
  const meta = data?.meta;

  const hasActiveFilters =
    searchQuery ||
    employmentType !== "all" ||
    workMode !== "all" ||
    experienceLevel !== "all";

  function resetFilters() {
    setSearchQuery("");
    setEmploymentType("all");
    setWorkMode("all");
    setExperienceLevel("all");
    setPage(1);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-bold tracking-tight">Browse Jobs</h1>
        <p className="mt-2 text-muted-foreground">
          Discover opportunities that match your skills and aspirations
        </p>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        className="mb-8 space-y-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-12 pl-10 text-base"
            placeholder="Search by job title, company, or keyword..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {/* Filter Row */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            Filters:
          </div>

          <Select
            value={employmentType}
            onValueChange={(v) => {
              setEmploymentType(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Employment Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="full_time">Full Time</SelectItem>
              <SelectItem value="part_time">Part Time</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
              <SelectItem value="internship">Internship</SelectItem>
              <SelectItem value="freelance">Freelance</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={workMode}
            onValueChange={(v) => {
              setWorkMode(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Work Mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modes</SelectItem>
              <SelectItem value="remote">Remote</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
              <SelectItem value="onsite">On-site</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={experienceLevel}
            onValueChange={(v) => {
              setExperienceLevel(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Seniority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="entry">Entry Level</SelectItem>
              <SelectItem value="mid">Mid Level</SelectItem>
              <SelectItem value="senior">Senior</SelectItem>
              <SelectItem value="lead">Lead</SelectItem>
              <SelectItem value="executive">Executive</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={resetFilters}
            >
              <RotateCcw className="mr-1 h-3 w-3" />
              Reset
            </Button>
          )}

          {meta && (
            <span className="ml-auto text-sm text-muted-foreground">
              {meta.total} {meta.total === 1 ? "job" : "jobs"} found
            </span>
          )}
        </div>
      </motion.div>

      {/* Job Cards Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="mb-3 h-5 w-3/4" />
                <Skeleton className="mb-4 h-4 w-1/2" />
                <div className="mb-4 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Briefcase className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">Unable to load jobs</h3>
          <p className="text-sm text-muted-foreground">
            Please try again later or check your connection.
          </p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Search className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No jobs found</h3>
          <p className="mb-4 text-sm text-muted-foreground max-w-md">
            {hasActiveFilters
              ? "Try adjusting your filters or search terms to find more opportunities."
              : "There are no open positions at the moment. Check back soon!"}
          </p>
          {hasActiveFilters && (
            <Button variant="outline" onClick={resetFilters}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <>
          <motion.div
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            initial="initial"
            animate="animate"
            variants={{
              animate: { transition: { staggerChildren: 0.05 } },
            }}
          >
            {jobs.map((job) => (
              <motion.div
                key={job.id}
                variants={{
                  initial: { opacity: 0, y: 12 },
                  animate: { opacity: 1, y: 0 },
                }}
              >
                <Link href={`/jobs/${job.id}`}>
                  <Card className="h-full cursor-pointer transition-all hover:shadow-md hover:border-primary/20">
                    <CardContent className="pt-6">
                      <div className="mb-3">
                        <h3 className="text-lg font-semibold leading-tight line-clamp-2">
                          {job.title}
                        </h3>
                        {job.company_name && (
                          <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                            <Building2 className="h-3.5 w-3.5" />
                            {job.company_name}
                          </div>
                        )}
                      </div>

                      <div className="mb-4 space-y-1.5 text-sm text-muted-foreground">
                        {(job.location_city || job.location_state) && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span>
                              {[job.location_city, job.location_state]
                                .filter(Boolean)
                                .join(", ")}
                            </span>
                          </div>
                        )}
                        {job.show_salary &&
                          (job.salary_min_cents || job.salary_max_cents) && (
                            <div className="flex items-center gap-1.5">
                              <DollarSign className="h-3.5 w-3.5 shrink-0" />
                              <span>
                                {job.salary_min_cents &&
                                  formatSalaryCents(
                                    job.salary_min_cents,
                                    job.salary_currency
                                  )}
                                {job.salary_min_cents &&
                                  job.salary_max_cents &&
                                  " - "}
                                {job.salary_max_cents &&
                                  formatSalaryCents(
                                    job.salary_max_cents,
                                    job.salary_currency
                                  )}
                              </span>
                            </div>
                          )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="text-xs">
                          <Briefcase className="mr-1 h-3 w-3" />
                          {formatEmploymentType(job.employment_type)}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-xs ${remotePolicyColor(job.remote_policy)}`}
                        >
                          <Laptop className="mr-1 h-3 w-3" />
                          {formatRemotePolicy(job.remote_policy)}
                        </Badge>
                        {job.experience_level && (
                          <Badge variant="outline" className="text-xs">
                            {job.experience_level.charAt(0).toUpperCase() +
                              job.experience_level.slice(1)}
                          </Badge>
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {job.published_at
                            ? timeAgo(job.published_at)
                            : timeAgo(job.created_at)}
                        </div>
                        {job.department && (
                          <span className="truncate">{job.department}</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {/* Pagination */}
          {meta && meta.total_pages > 1 && (
            <div className="mt-8 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(meta.page - 1) * meta.per_page + 1}&ndash;
                {Math.min(meta.page * meta.per_page, meta.total)} of{" "}
                {meta.total} jobs
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
        </>
      )}
    </div>
  );
}
