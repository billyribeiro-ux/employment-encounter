"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  MapPin,
  DollarSign,
  Laptop,
  Send,
  Loader2,
  Upload,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePublicJob } from "@/lib/hooks/use-public-jobs";
import { useCreateApplication } from "@/lib/hooks/use-applications";
import { api } from "@/lib/api";

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

export default function ApplyPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;
  const { data: job, isLoading: jobLoading } = usePublicJob(jobId);
  const createApplication = useCreateApplication();

  const [candidateId, setCandidateId] = useState<string>("");
  const [coverLetter, setCoverLetter] = useState("");
  const [source, setSource] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [candidateLoading, setCandidateLoading] = useState(true);

  // Fetch candidate ID for the current user
  useEffect(() => {
    async function fetchCandidate() {
      try {
        const { data } = await api.get("/candidates/me");
        setCandidateId(data.id);
      } catch {
        try {
          const { data } = await api.get("/candidates", {
            params: { per_page: 1 },
          });
          if (data.data && data.data.length > 0) {
            setCandidateId(data.data[0].id);
          }
        } catch {
          // No candidate profile
        }
      } finally {
        setCandidateLoading(false);
      }
    }
    fetchCandidate();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!candidateId) {
      toast.error(
        "Please complete your candidate profile before applying."
      );
      router.push("/candidate/profile");
      return;
    }

    setIsSubmitting(true);
    try {
      await createApplication.mutateAsync({
        job_id: jobId,
        candidate_id: candidateId,
        cover_letter: coverLetter.trim() || undefined,
        source: source || undefined,
      });
      setSubmitted(true);
      toast.success("Application submitted successfully!");
    } catch (error: unknown) {
      const axiosError = error as {
        response?: { data?: { error?: { message?: string } } };
      };
      const message =
        axiosError.response?.data?.error?.message ||
        "Failed to submit application. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (jobLoading || candidateLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Briefcase className="mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="mb-2 text-xl font-semibold">Job Not Found</h2>
        <p className="mb-6 text-muted-foreground">
          This job posting may have been removed or is no longer available.
        </p>
        <Link href="/jobs">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Browse Jobs
          </Button>
        </Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg py-20">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="mb-2 text-2xl font-bold">Application Submitted!</h2>
          <p className="mb-8 text-muted-foreground">
            Your application for <strong>{job.title}</strong>
            {job.company_name && (
              <>
                {" "}
                at <strong>{job.company_name}</strong>
              </>
            )}{" "}
            has been submitted successfully. You can track the status of your
            application in your dashboard.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/candidate/applications">
              <Button>
                <FileText className="mr-2 h-4 w-4" />
                View My Applications
              </Button>
            </Link>
            <Link href="/jobs">
              <Button variant="outline">
                <Briefcase className="mr-2 h-4 w-4" />
                Browse More Jobs
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const hasSalary =
    job.show_salary && (job.salary_min_cents || job.salary_max_cents);
  const location = [job.location_city, job.location_state]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground"
        onClick={() => router.back()}
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back
      </Button>

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Apply for Position</h1>
        <p className="text-muted-foreground">
          Review the job details and submit your application
        </p>
      </div>

      {/* Job Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold">{job.title}</h2>
                {job.company_name && (
                  <div className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    {job.company_name}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="secondary">
                <Briefcase className="mr-1 h-3 w-3" />
                {formatEmploymentType(job.employment_type)}
              </Badge>
              <Badge variant="outline">
                <Laptop className="mr-1 h-3 w-3" />
                {formatRemotePolicy(job.remote_policy)}
              </Badge>
              {location && (
                <Badge variant="outline">
                  <MapPin className="mr-1 h-3 w-3" />
                  {location}
                </Badge>
              )}
              {hasSalary && (
                <Badge variant="outline">
                  <DollarSign className="mr-1 h-3 w-3" />
                  {job.salary_min_cents &&
                    formatSalaryCents(
                      job.salary_min_cents,
                      job.salary_currency
                    )}
                  {job.salary_min_cents && job.salary_max_cents && " - "}
                  {job.salary_max_cents &&
                    formatSalaryCents(
                      job.salary_max_cents,
                      job.salary_currency
                    )}
                </Badge>
              )}
            </div>

            {job.description && (
              <>
                <Separator className="my-4" />
                <div className="text-sm text-muted-foreground line-clamp-4">
                  {job.description}
                </div>
                <Link
                  href={`/jobs/${job.id}`}
                  className="mt-2 inline-block text-sm text-primary hover:underline"
                >
                  View full job description
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Application Form */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Your Application</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Cover Letter */}
              <div>
                <Label htmlFor="cover-letter">
                  Cover Letter{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <Textarea
                  id="cover-letter"
                  placeholder="Tell the employer why you're a great fit for this role. Highlight relevant experience and what excites you about this opportunity..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  rows={8}
                  className="mt-1.5"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  A personalized cover letter can significantly improve your
                  chances.
                </p>
              </div>

              {/* Resume Upload */}
              <div>
                <Label>
                  Resume{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <div className="mt-1.5 flex items-center gap-3 rounded-lg border-2 border-dashed p-4">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      Upload resume or use your profile
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF, DOC, or DOCX up to 10MB
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm">
                    Browse
                  </Button>
                </div>
              </div>

              {/* Source */}
              <div>
                <Label>
                  How did you hear about this job?{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </Label>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Select a source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="job_board">Job Board</SelectItem>
                    <SelectItem value="company_website">
                      Company Website
                    </SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="social_media">Social Media</SelectItem>
                    <SelectItem value="recruiter">Recruiter</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Submit */}
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground max-w-sm">
                  By submitting this application, you agree to share your
                  profile information with the employer.
                </p>
                <Button
                  type="submit"
                  disabled={isSubmitting || !candidateId}
                  size="lg"
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Submit Application
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
