"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  Clock,
  DollarSign,
  Building2,
  Share2,
  Laptop,
  Calendar,
  Users,
  ExternalLink,
  Copy,
  CheckCircle2,
  Heart,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { usePublicJob, usePublicJobs } from "@/lib/hooks/use-public-jobs";
import { useSavedJobs, useSaveJob, useUnsaveJob } from "@/lib/hooks/use-saved-jobs";

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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function renderTextContent(text: string | null): React.ReactNode {
  if (!text) return null;
  return text.split("\n").map((line, i) => (
    <span key={i}>
      {line}
      {i < text.split("\n").length - 1 && <br />}
    </span>
  ));
}

function SaveJobButton({ jobId }: { jobId: string }) {
  const { data: savedJobs } = useSavedJobs();
  const saveJob = useSaveJob();
  const unsaveJob = useUnsaveJob();

  const savedEntry = savedJobs?.find((s) => s.job_id === jobId);
  const isSaved = !!savedEntry;

  function handleToggle() {
    if (isSaved && savedEntry) {
      unsaveJob.mutate(savedEntry.id, {
        onSuccess: () => toast.success("Job removed from saved list"),
        onError: () => toast.error("Failed to unsave job"),
      });
    } else {
      saveJob.mutate(jobId, {
        onSuccess: () => toast.success("Job saved to your list"),
        onError: () => toast.error("Failed to save job"),
      });
    }
  }

  const isPending = saveJob.isPending || unsaveJob.isPending;

  return (
    <Button
      variant={isSaved ? "default" : "outline"}
      className="w-full"
      onClick={handleToggle}
      disabled={isPending}
    >
      {isSaved ? (
        <>
          <BookmarkCheck className="mr-2 h-4 w-4" />
          {isPending ? "Removing..." : "Saved"}
        </>
      ) : (
        <>
          <Bookmark className="mr-2 h-4 w-4" />
          {isPending ? "Saving..." : "Save Job"}
        </>
      )}
    </Button>
  );
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;
  const { data: job, isLoading, isError } = usePublicJob(jobId);
  const [copied, setCopied] = useState(false);

  // Check if user is authenticated for the Apply button
  const isAuthenticated =
    typeof window !== "undefined" && !!localStorage.getItem("access_token");

  // Fetch related jobs (same employment type, different from current)
  const { data: relatedJobsData } = usePublicJobs({
    per_page: 4,
    employment_type: job?.employment_type,
  });
  const relatedJobs =
    relatedJobsData?.data?.filter((j) => j.id !== jobId).slice(0, 3) ?? [];

  function handleShare() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <Skeleton className="mb-6 h-8 w-32" />
        <Skeleton className="mb-4 h-10 w-3/4" />
        <Skeleton className="mb-2 h-5 w-1/2" />
        <div className="mt-8 space-y-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !job) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-20 text-center">
        <Briefcase className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="mb-2 text-xl font-semibold">Job Not Found</h2>
        <p className="mb-6 text-muted-foreground">
          This job posting may have been removed or is no longer available.
        </p>
        <Link href="/jobs">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Jobs
          </Button>
        </Link>
      </div>
    );
  }

  const hasSalary =
    job.show_salary && (job.salary_min_cents || job.salary_max_cents);
  const location = [job.location_city, job.location_state, job.location_country]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      {/* Back Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 text-muted-foreground"
          onClick={() => router.push("/jobs")}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Jobs
        </Button>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <motion.div
          className="lg:col-span-2 space-y-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{job.title}</h1>
            {job.company_name && (
              <div className="mt-2 flex items-center gap-2 text-lg text-muted-foreground">
                <Building2 className="h-5 w-5" />
                {job.company_name}
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="secondary">
                <Briefcase className="mr-1 h-3 w-3" />
                {formatEmploymentType(job.employment_type)}
              </Badge>
              <Badge variant="outline">
                <Laptop className="mr-1 h-3 w-3" />
                {formatRemotePolicy(job.remote_policy)}
              </Badge>
              {job.experience_level && (
                <Badge variant="outline">
                  {job.experience_level.charAt(0).toUpperCase() +
                    job.experience_level.slice(1)}{" "}
                  Level
                </Badge>
              )}
              {job.department && (
                <Badge variant="outline">{job.department}</Badge>
              )}
            </div>
          </div>

          {/* Description */}
          {job.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">About This Role</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
                  {renderTextContent(job.description)}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Requirements */}
          {job.requirements && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
                  {renderTextContent(job.requirements)}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Responsibilities */}
          {job.responsibilities && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Responsibilities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
                  {renderTextContent(job.responsibilities)}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Benefits */}
          {job.benefits && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
                  {renderTextContent(job.benefits)}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Related Jobs */}
          {relatedJobs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Similar Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {relatedJobs.map((relatedJob) => {
                    const relatedLocation = [
                      relatedJob.location_city,
                      relatedJob.location_state,
                    ]
                      .filter(Boolean)
                      .join(", ");

                    return (
                      <Link key={relatedJob.id} href={`/jobs/${relatedJob.id}`}>
                        <div className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/30 cursor-pointer">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold truncate">
                              {relatedJob.title}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              {relatedJob.company_name && (
                                <span className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  {relatedJob.company_name}
                                </span>
                              )}
                              {relatedLocation && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {relatedLocation}
                                </span>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline" className="ml-2 shrink-0 text-xs">
                            {formatRemotePolicy(relatedJob.remote_policy)}
                          </Badge>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Sidebar */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          {/* Apply Card */}
          <Card className="sticky top-6">
            <CardContent className="pt-6">
              <div className="space-y-3">
                {isAuthenticated ? (
                  <Link href={`/candidate/apply/${job.id}`} className="block">
                    <Button className="w-full" size="lg">
                      Apply Now
                    </Button>
                  </Link>
                ) : (
                  <Link
                    href={`/register?redirect=/candidate/apply/${job.id}`}
                    className="block"
                  >
                    <Button className="w-full" size="lg">
                      Apply Now
                    </Button>
                  </Link>
                )}

                {/* Save Job Button (only for authenticated candidates) */}
                {isAuthenticated && <SaveJobButton jobId={job.id} />}

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleShare}
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Share2 className="mr-2 h-4 w-4" />
                      Share This Job
                    </>
                  )}
                </Button>
              </div>

              <Separator className="my-6" />

              {/* Job Details */}
              <div className="space-y-4 text-sm">
                {location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-muted-foreground">{location}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Employment Type</p>
                    <p className="text-muted-foreground">
                      {formatEmploymentType(job.employment_type)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Laptop className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Work Mode</p>
                    <p className="text-muted-foreground">
                      {formatRemotePolicy(job.remote_policy)}
                    </p>
                  </div>
                </div>

                {hasSalary && (
                  <div className="flex items-start gap-3">
                    <DollarSign className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Salary Range</p>
                      <p className="text-muted-foreground">
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
                        {" / year"}
                      </p>
                    </div>
                  </div>
                )}

                {job.experience_level && (
                  <div className="flex items-start gap-3">
                    <Users className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Experience Level</p>
                      <p className="text-muted-foreground">
                        {job.experience_level.charAt(0).toUpperCase() +
                          job.experience_level.slice(1)}
                      </p>
                    </div>
                  </div>
                )}

                {job.published_at && (
                  <div className="flex items-start gap-3">
                    <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Posted</p>
                      <p className="text-muted-foreground">
                        {formatDate(job.published_at)}
                      </p>
                    </div>
                  </div>
                )}

                {job.closes_at && (
                  <div className="flex items-start gap-3">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Closes</p>
                      <p className="text-muted-foreground">
                        {formatDate(job.closes_at)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Company Info */}
              {job.company_name && (
                <>
                  <Separator className="my-6" />
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold">About the Company</h3>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{job.company_name}</p>
                        {job.department && (
                          <p className="text-xs text-muted-foreground">
                            {job.department} Department
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{job.application_count} applicant{job.application_count !== 1 ? "s" : ""}</span>
                        <span>{job.view_count} view{job.view_count !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
