"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  DollarSign,
  Users,
  Clock,
  ChevronRight,
  X,
  Star,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs";
import { useJob } from "@/lib/hooks/use-jobs";
import {
  useApplications,
  useAdvanceStage,
  useRejectApplication,
} from "@/lib/hooks/use-applications";
import type { Application } from "@/lib/hooks/use-applications";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";

const PIPELINE_STAGES = [
  { id: "applied", label: "Applied", color: "bg-slate-100" },
  { id: "screening", label: "Screening", color: "bg-blue-50" },
  { id: "phone_screen", label: "Phone Screen", color: "bg-cyan-50" },
  { id: "technical", label: "Technical", color: "bg-amber-50" },
  { id: "onsite", label: "Onsite", color: "bg-orange-50" },
  { id: "offer", label: "Offer", color: "bg-emerald-50" },
];

function formatSalaryCents(cents: number | null): string {
  if (!cents) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function statusVariant(status: string) {
  switch (status) {
    case "published":
      return "default" as const;
    case "draft":
      return "secondary" as const;
    case "closed":
      return "outline" as const;
    default:
      return "secondary" as const;
  }
}

function daysSince(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function PipelineCard({
  application,
  stageIndex,
  onAdvance,
  onReject,
  isAdvancing,
  isRejecting,
}: {
  application: Application;
  stageIndex: number;
  onAdvance: (id: string, nextStage: string) => void;
  onReject: (id: string) => void;
  isAdvancing: boolean;
  isRejecting: boolean;
}) {
  const nextStage =
    stageIndex < PIPELINE_STAGES.length - 1
      ? PIPELINE_STAGES[stageIndex + 1]
      : null;
  const daysInStage = daysSince(application.updated_at);

  return (
    <div className="rounded-lg border bg-background p-3 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-tight truncate">
            {application.candidate_name || "Unknown Candidate"}
          </p>
          {application.candidate_headline && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              {application.candidate_headline}
            </p>
          )}
        </div>
        {application.screening_score != null && (
          <div className="flex items-center gap-1 text-amber-500 shrink-0">
            <Star className="h-3 w-3 fill-current" />
            <span className="text-[10px] font-semibold">
              {application.screening_score}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mt-2">
        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
          <Clock className="h-2.5 w-2.5" />
          {daysInStage}d in stage
        </span>
        {application.status === "rejected" && (
          <Badge variant="destructive" className="text-[10px] h-4">
            Rejected
          </Badge>
        )}
      </div>

      {application.status !== "rejected" && (
        <div className="flex items-center gap-1 mt-2 pt-2 border-t opacity-0 group-hover:opacity-100 transition-opacity">
          {nextStage && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-7 text-xs"
              disabled={isAdvancing}
              onClick={() => onAdvance(application.id, nextStage.id)}
            >
              <ArrowRight className="mr-1 h-3 w-3" />
              {nextStage.label}
            </Button>
          )}
          <ConfirmDialog
            title="Reject candidate?"
            description={`This will reject ${application.candidate_name || "this candidate"} from the pipeline.`}
            actionLabel="Reject"
            onConfirm={() => onReject(application.id)}
          >
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-destructive hover:text-destructive"
              disabled={isRejecting}
            >
              <X className="mr-1 h-3 w-3" />
              Reject
            </Button>
          </ConfirmDialog>
        </div>
      )}
    </div>
  );
}

export default function JobPipelinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: job, isLoading: jobLoading, isError: jobError } = useJob(id);
  const { data: applicationsData, isLoading: appsLoading } = useApplications({
    job_id: id,
    per_page: 200,
  });
  const advanceStage = useAdvanceStage();
  const rejectApplication = useRejectApplication();

  const applications = applicationsData?.data ?? [];

  function getStageApplications(stageId: string): Application[] {
    return applications.filter((a) => a.stage === stageId);
  }

  function handleAdvance(applicationId: string, toStage: string) {
    advanceStage.mutate(
      { id: applicationId, to_stage: toStage },
      {
        onSuccess: () => toast.success("Candidate advanced"),
        onError: () => toast.error("Failed to advance candidate"),
      }
    );
  }

  function handleReject(applicationId: string) {
    rejectApplication.mutate(
      { id: applicationId },
      {
        onSuccess: () => toast.success("Candidate rejected"),
        onError: () => toast.error("Failed to reject candidate"),
      }
    );
  }

  if (jobLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-48" />
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="grid grid-cols-6 gap-3">
          {PIPELINE_STAGES.map((s) => (
            <div key={s.id}>
              <Skeleton className="h-8 mb-2" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24 mt-2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (jobError || !job) {
    return (
      <div className="space-y-4">
        <Link href="/hiring">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Hiring
          </Button>
        </Link>
        <div className="text-center py-12">
          <p className="text-sm text-destructive">
            Job not found or failed to load.
          </p>
        </div>
      </div>
    );
  }

  const location = [job.location_city, job.location_state, job.location_country]
    .filter(Boolean)
    .join(", ");
  const salaryRange = [
    formatSalaryCents(job.salary_min_cents),
    formatSalaryCents(job.salary_max_cents),
  ]
    .filter(Boolean)
    .join(" - ");

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Hiring", href: "/hiring" },
          { label: job.title },
        ]}
      />

      {/* Job header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">{job.title}</h1>
            <Badge variant={statusVariant(job.status)}>{job.status}</Badge>
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
            {job.department && (
              <span className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" />
                {job.department}
              </span>
            )}
            {location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {location}
              </span>
            )}
            {salaryRange && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                {salaryRange}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {applications.length} applicant
              {applications.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Pipeline board */}
      {appsLoading ? (
        <div className="grid grid-cols-6 gap-3">
          {PIPELINE_STAGES.map((stage) => (
            <div key={stage.id}>
              <div
                className={`rounded-t-lg px-3 py-2 ${stage.color} border border-b-0`}
              >
                <Skeleton className="h-5 w-20" />
              </div>
              <div className="rounded-b-lg border bg-card p-2 space-y-2 min-h-[200px]">
                <Skeleton className="h-20 rounded-md" />
                <Skeleton className="h-20 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : applications.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No applications yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Applications will appear here as candidates apply. Share
                your job posting to attract talent.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-6 gap-3 min-h-[60vh]">
          {PIPELINE_STAGES.map((stage, stageIndex) => {
            const stageApps = getStageApplications(stage.id);
            return (
              <div key={stage.id} className="flex flex-col">
                <div
                  className={`rounded-t-lg px-3 py-2 ${stage.color} border border-b-0`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold">{stage.label}</h3>
                    <Badge variant="secondary" className="text-[10px] h-5">
                      {stageApps.length}
                    </Badge>
                  </div>
                </div>
                <ScrollArea className="flex-1 rounded-b-lg border bg-card p-2 min-h-[200px]">
                  <div className="space-y-2">
                    {stageApps.map((app) => (
                      <PipelineCard
                        key={app.id}
                        application={app}
                        stageIndex={stageIndex}
                        onAdvance={handleAdvance}
                        onReject={handleReject}
                        isAdvancing={advanceStage.isPending}
                        isRejecting={rejectApplication.isPending}
                      />
                    ))}
                    {stageApps.length === 0 && (
                      <div className="flex items-center justify-center py-8 text-center">
                        <p className="text-[10px] text-muted-foreground">
                          No candidates
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
