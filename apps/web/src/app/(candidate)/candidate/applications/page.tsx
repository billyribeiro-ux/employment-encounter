"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Search,
  Filter,
  RotateCcw,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Calendar,
  Briefcase,
  Building2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/dialog";
import {
  useApplications,
  useWithdrawApplication,
  useStageHistory,
} from "@/lib/hooks/use-applications";
import type { Application, ApplicationStageEvent } from "@/lib/hooks/use-applications";
import { useDebounce } from "@/lib/hooks/use-debounce";

function stageIcon(stage: string) {
  switch (stage) {
    case "applied":
      return <FileText className="h-4 w-4 text-blue-600" />;
    case "screening":
      return <AlertCircle className="h-4 w-4 text-amber-600" />;
    case "interview":
      return <Calendar className="h-4 w-4 text-violet-600" />;
    case "offer":
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case "hired":
      return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    case "rejected":
      return <XCircle className="h-4 w-4 text-red-600" />;
    case "withdrawn":
      return <XCircle className="h-4 w-4 text-muted-foreground" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
}

function stageBadgeVariant(
  stage: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (stage) {
    case "offer":
    case "hired":
      return "default";
    case "rejected":
      return "destructive";
    case "withdrawn":
      return "outline";
    default:
      return "secondary";
  }
}

function stageLabel(stage: string): string {
  return stage
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StageTimeline({ applicationId }: { applicationId: string }) {
  const { data: history, isLoading } = useStageHistory(applicationId);

  if (isLoading) {
    return (
      <div className="space-y-3 pl-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10" />
        ))}
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <p className="text-sm text-muted-foreground pl-4">
        No stage history available.
      </p>
    );
  }

  return (
    <div className="relative pl-6">
      {/* Timeline line */}
      <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />

      <div className="space-y-4">
        {history.map((event, index) => (
          <div key={event.id} className="relative flex gap-3">
            <div className="absolute -left-6 mt-1.5">
              <div
                className={`h-3 w-3 rounded-full border-2 ${index === 0
                    ? "border-primary bg-primary"
                    : "border-muted-foreground/30 bg-background"
                  }`}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {stageLabel(event.to_stage)}
                </span>
                {event.from_stage && (
                  <span className="text-xs text-muted-foreground">
                    from {stageLabel(event.from_stage)}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDateTime(event.created_at)}
              </p>
              {event.notes && (
                <p className="mt-1 text-xs text-muted-foreground italic">
                  {event.notes}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ApplicationCard({ application }: { application: Application }) {
  const [expanded, setExpanded] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const withdrawApplication = useWithdrawApplication();

  const isActive =
    application.status === "active" &&
    application.stage !== "rejected" &&
    application.stage !== "withdrawn";

  function handleWithdraw() {
    withdrawApplication.mutate(application.id, {
      onSuccess: () => {
        toast.success("Application withdrawn successfully");
        setWithdrawDialogOpen(false);
      },
      onError: () => {
        toast.error("Failed to withdraw application");
      },
    });
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {stageIcon(application.stage)}
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold truncate">
                {application.job_title || "Untitled Position"}
              </h3>
              {application.candidate_name && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                  <Building2 className="h-3.5 w-3.5" />
                  <span>{application.candidate_name}</span>
                </div>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant={stageBadgeVariant(application.stage)}>
                  {stageLabel(application.stage)}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Applied {formatDate(application.created_at)}
                </span>
                {application.updated_at !== application.created_at && (
                  <span className="text-xs text-muted-foreground">
                    Updated {formatDate(application.updated_at)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-4">
            {isActive && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setWithdrawDialogOpen(true)}
                >
                  Withdraw
                </Button>
                <Dialog
                  open={withdrawDialogOpen}
                  onOpenChange={setWithdrawDialogOpen}
                >
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Withdraw Application?</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to withdraw your application for{" "}
                        <strong>
                          {application.job_title || "this position"}
                        </strong>
                        ? This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setWithdrawDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleWithdraw}
                        disabled={withdrawApplication.isPending}
                      >
                        {withdrawApplication.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Withdraw
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Source info */}
        {application.source && (
          <div className="mt-2 text-xs text-muted-foreground">
            Source: {application.source}
          </div>
        )}

        {/* Rejection reason */}
        {application.rejection_reason && (
          <div className="mt-3 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <strong>Rejection reason:</strong> {application.rejection_reason}
          </div>
        )}

        {/* Expandable Stage History */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <Separator className="my-4" />
              <div>
                <h4 className="mb-3 text-sm font-medium">Stage History</h4>
                <StageTimeline applicationId={application.id} />
              </div>

              {application.cover_letter && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <h4 className="mb-2 text-sm font-medium">Cover Letter</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {application.cover_letter}
                    </p>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

export default function CandidateApplicationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const perPage = 20;

  const { data, isLoading, isError } = useApplications({
    search: debouncedSearch || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    page,
    per_page: perPage,
    sort: "updated_at",
    order: "desc",
  });

  const applications = data?.data ?? [];
  const meta = data?.meta;

  const hasActiveFilters = searchQuery || statusFilter !== "all";

  function resetFilters() {
    setSearchQuery("");
    setStatusFilter("all");
    setPage(1);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Applications</h1>
        <p className="text-muted-foreground">
          Track and manage all your job applications
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search applications..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="withdrawn">Withdrawn</SelectItem>
            <SelectItem value="hired">Hired</SelectItem>
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
            {meta.total} {meta.total === 1 ? "application" : "applications"}
          </span>
        )}
      </div>

      {/* Applications List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-6 w-6 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-32" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">Unable to load applications</h3>
          <p className="text-sm text-muted-foreground">
            Please try again later or check your connection.
          </p>
        </div>
      ) : applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">
            {hasActiveFilters ? "No matching applications" : "No applications yet"}
          </h3>
          <p className="mb-4 text-sm text-muted-foreground max-w-md">
            {hasActiveFilters
              ? "Try adjusting your filters to see more results."
              : "Start your job search by browsing available positions and submitting your first application."}
          </p>
          {hasActiveFilters ? (
            <Button variant="outline" onClick={resetFilters}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          ) : (
            <Link href="/jobs">
              <Button>
                <Briefcase className="mr-2 h-4 w-4" />
                Browse Jobs
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {applications.map((application) => (
              <motion.div
                key={application.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <ApplicationCard application={application} />
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {meta && meta.total_pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(meta.page - 1) * meta.per_page + 1}&ndash;
                {Math.min(meta.page * meta.per_page, meta.total)} of{" "}
                {meta.total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= meta.total_pages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
