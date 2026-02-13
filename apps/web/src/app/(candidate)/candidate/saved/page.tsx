"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Bookmark,
  BookmarkX,
  MapPin,
  DollarSign,
  Briefcase,
  Clock,
  Search,
  Share2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Filter,
  Copy,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/dialog";
import { useSavedJobs, useUnsaveJob, type SavedJob } from "@/lib/hooks/use-saved-jobs";
import { cn } from "@/lib/utils";

function formatSalaryCents(cents: number | undefined): string {
  if (!cents) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatEmploymentType(type: string | undefined): string {
  if (!type) return "";
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

function SavedJobCard({
  savedJob,
  onUnsave,
  onShare,
}: {
  savedJob: SavedJob;
  onUnsave: (id: string) => void;
  onShare: (jobId: string, title: string) => void;
}) {
  const hasSalary = savedJob.salary_min_cents || savedJob.salary_max_cents;
  const isOpen = savedJob.job_status === "published" || savedJob.job_status === "open";
  const isClosed = savedJob.job_status === "closed" || savedJob.job_status === "archived";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      layout
    >
      <Card className={cn("transition-shadow hover:shadow-md", isClosed && "opacity-70")}>
        <CardContent className="p-5">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <Link href={`/jobs/${savedJob.job_id}`}>
                  <h3 className="text-base font-semibold hover:text-primary transition-colors line-clamp-1">
                    {savedJob.job_title || "Untitled Position"}
                  </h3>
                </Link>
                {savedJob.company_name && (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {savedJob.company_name}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {isOpen ? (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Open
                  </Badge>
                ) : isClosed ? (
                  <Badge variant="destructive">
                    <XCircle className="mr-1 h-3 w-3" />
                    Closed
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    {savedJob.job_status || "Unknown"}
                  </Badge>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              {savedJob.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{savedJob.location}</span>
                </div>
              )}
              {savedJob.employment_type && (
                <div className="flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5" />
                  <span>{formatEmploymentType(savedJob.employment_type)}</span>
                </div>
              )}
              {hasSalary && (
                <div className="flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5" />
                  <span>
                    {savedJob.salary_min_cents && formatSalaryCents(savedJob.salary_min_cents)}
                    {savedJob.salary_min_cents && savedJob.salary_max_cents && " - "}
                    {savedJob.salary_max_cents && formatSalaryCents(savedJob.salary_max_cents)}
                  </span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Saved {timeAgo(savedJob.created_at)}</span>
              </div>
              <div className="flex items-center gap-1">
                {isOpen && (
                  <Link href={`/candidate/apply/${savedJob.job_id}`}>
                    <Button size="sm" className="h-8 text-xs">
                      Apply
                    </Button>
                  </Link>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onShare(savedJob.job_id, savedJob.job_title || "Job")}
                >
                  <Share2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => onUnsave(savedJob.id)}
                >
                  <BookmarkX className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function CandidateSavedJobsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [unsaveDialogId, setUnsaveDialogId] = useState<string | null>(null);

  const { data: savedJobs, isLoading } = useSavedJobs();
  const unsaveJob = useUnsaveJob();

  const filteredJobs = useMemo(() => {
    if (!savedJobs) return [];

    let filtered = [...savedJobs];

    // Apply filter
    switch (filter) {
      case "open":
        filtered = filtered.filter(
          (j) => j.job_status === "published" || j.job_status === "open"
        );
        break;
      case "closed":
        filtered = filtered.filter(
          (j) => j.job_status === "closed" || j.job_status === "archived"
        );
        break;
      case "recent":
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        filtered = filtered.filter(
          (j) => new Date(j.created_at) >= weekAgo
        );
        break;
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (j) =>
          j.job_title?.toLowerCase().includes(query) ||
          j.company_name?.toLowerCase().includes(query) ||
          j.location?.toLowerCase().includes(query)
      );
    }

    // Sort by saved date (most recent first)
    filtered.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return filtered;
  }, [savedJobs, filter, searchQuery]);

  function handleUnsave(id: string) {
    setUnsaveDialogId(id);
  }

  function confirmUnsave() {
    if (!unsaveDialogId) return;
    unsaveJob.mutate(unsaveDialogId, {
      onSuccess: () => {
        toast.success("Job removed from saved list");
        setUnsaveDialogId(null);
      },
      onError: () => {
        toast.error("Failed to unsave job");
      },
    });
  }

  function handleShare(jobId: string, title: string) {
    const url = `${window.location.origin}/jobs/${jobId}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success(`Link to "${title}" copied to clipboard`);
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Saved Jobs</h1>
          <p className="text-sm text-muted-foreground">
            Jobs you have bookmarked for later
            {savedJobs && savedJobs.length > 0 && (
              <span className="ml-1">({savedJobs.length} total)</span>
            )}
          </p>
        </div>
        <Link href="/jobs">
          <Button variant="outline">
            <Search className="mr-2 h-4 w-4" />
            Browse More Jobs
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search saved jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Saved Jobs</SelectItem>
            <SelectItem value="open">Still Open</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="recent">Recently Saved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Bookmark className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-medium">
              {savedJobs && savedJobs.length > 0
                ? "No jobs match your filters"
                : "No saved jobs yet"}
            </h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              {savedJobs && savedJobs.length > 0
                ? "Try adjusting your search or filter to see more results."
                : "Browse jobs to save ones you're interested in. Saved jobs will appear here for easy access."}
            </p>
            <Link href="/jobs" className="mt-4">
              <Button>
                <Search className="mr-2 h-4 w-4" />
                Browse Jobs
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredJobs.map((savedJob) => (
            <SavedJobCard
              key={savedJob.id}
              savedJob={savedJob}
              onUnsave={handleUnsave}
              onShare={handleShare}
            />
          ))}
        </div>
      )}

      {/* Unsave Confirmation Dialog */}
      <Dialog
        open={!!unsaveDialogId}
        onOpenChange={(open) => {
          if (!open) setUnsaveDialogId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Saved Job</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to remove this job from your saved list? You can always
            save it again later.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnsaveDialogId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmUnsave}
              disabled={unsaveJob.isPending}
            >
              {unsaveJob.isPending ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
