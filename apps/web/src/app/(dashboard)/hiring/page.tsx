"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Briefcase,
  Users,
  Calendar,
  FileCheck,
  Search,
  RotateCcw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Eye,
  Trash2,
  MoreHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchInput } from "@/components/dashboard/search-input";
import { TableSkeleton } from "@/components/dashboard/table-skeleton";
import { useJobs, useCreateJob, useDeleteJob } from "@/lib/hooks/use-jobs";
import type { JobPost } from "@/lib/hooks/use-jobs";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { exportToCSV } from "@/lib/utils";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";

function statusVariant(status: string) {
  switch (status) {
    case "published":
      return "default" as const;
    case "draft":
      return "secondary" as const;
    case "closed":
      return "outline" as const;
    case "archived":
      return "outline" as const;
    default:
      return "secondary" as const;
  }
}

function formatSalaryCents(cents: number | null): string {
  if (!cents) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function CreateJobDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [locationCity, setLocationCity] = useState("");
  const [employmentType, setEmploymentType] = useState("full_time");
  const createJob = useCreateJob();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    createJob.mutate(
      {
        title: title.trim(),
        department: department.trim() || undefined,
        location_city: locationCity.trim() || undefined,
        employment_type: employmentType,
      },
      {
        onSuccess: () => {
          toast.success("Job created successfully");
          setOpen(false);
          setTitle("");
          setDepartment("");
          setLocationCity("");
          setEmploymentType("full_time");
        },
        onError: () => toast.error("Failed to create job"),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Job Posting</DialogTitle>
            <DialogDescription>
              Create a new job posting to start receiving applications.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Software Engineer"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Engineering"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={locationCity}
                onChange={(e) => setLocationCity(e.target.value)}
                placeholder="e.g. San Francisco, CA"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Employment Type</Label>
              <Select value={employmentType} onValueChange={setEmploymentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">Full Time</SelectItem>
                  <SelectItem value="part_time">Part Time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createJob.isPending}>
              {createJob.isPending ? "Creating..." : "Create Job"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function HiringPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);

  const { data, isLoading, isError } = useJobs({
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    department: departmentFilter !== "all" ? departmentFilter : undefined,
    sort: sortBy,
    order: sortOrder,
  });

  const deleteJob = useDeleteJob();
  const jobs = data?.data ?? [];
  const meta = data?.meta;

  // Compute stats from visible data
  const openJobs = jobs.filter(
    (j) => j.status === "published" || j.status === "open"
  ).length;
  const totalApplications = jobs.reduce(
    (sum, j) => sum + (j.application_count || 0),
    0
  );

  // Extract unique departments for filter
  const departments = Array.from(
    new Set(jobs.map((j) => j.department).filter(Boolean))
  ) as string[];

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

  const hasActiveFilters =
    searchQuery || statusFilter !== "all" || departmentFilter !== "all";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hiring Cockpit</h1>
          <p className="text-muted-foreground">
            Manage job postings and track your hiring pipeline
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              exportToCSV(
                jobs.map((j) => ({
                  title: j.title,
                  department: j.department,
                  status: j.status,
                  applications: j.application_count,
                  posted: j.published_at,
                  employment_type: j.employment_type,
                })),
                "jobs"
              )
            }
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <CreateJobDialog>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Job
            </Button>
          </CreateJobDialog>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-muted-foreground">
                Open Jobs
              </span>
            </div>
            <p className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-7 w-10 inline-block" />
              ) : (
                openJobs
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-medium text-muted-foreground">
                Active Applications
              </span>
            </div>
            <p className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-7 w-10 inline-block" />
              ) : (
                totalApplications
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-medium text-muted-foreground">
                Interviews This Week
              </span>
            </div>
            <p className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-7 w-10 inline-block" />
              ) : (
                "--"
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <FileCheck className="h-4 w-4 text-violet-600" />
              <span className="text-xs font-medium text-muted-foreground">
                Offers Pending
              </span>
            </div>
            <p className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-7 w-10 inline-block" />
              ) : (
                "--"
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <SearchInput
          value={searchQuery}
          onChange={(v) => {
            setSearchQuery(v);
            setPage(1);
          }}
          placeholder="Search jobs..."
        />
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        {departments.length > 0 && (
          <Select
            value={departmentFilter}
            onValueChange={(v) => {
              setDepartmentFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-muted-foreground"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
              setDepartmentFilter("all");
              setPage(1);
            }}
          >
            <RotateCcw className="mr-1 h-3 w-3" />
            Reset
          </Button>
        )}
      </div>

      {/* Jobs table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Job Postings
            {meta && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({meta.total})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton columns={6} rows={5} />
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-destructive">
                Failed to load jobs. Make sure the backend is running.
              </p>
            </div>
          ) : jobs.length === 0 && debouncedSearch ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-8 w-8 text-muted-foreground mb-3" />
              <h3 className="text-lg font-semibold mb-1">No results found</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                No jobs match &ldquo;{debouncedSearch}&rdquo;. Try a different
                search term.
              </p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Briefcase className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No jobs yet</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                Create your first job posting to start receiving applications
                from candidates.
              </p>
              <CreateJobDialog>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Job
                </Button>
              </CreateJobDialog>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th
                        className="px-4 py-3 text-left font-medium cursor-pointer select-none"
                        onClick={() => toggleSort("title")}
                      >
                        <span className="flex items-center">
                          Title{sortIcon("title")}
                        </span>
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Department
                      </th>
                      <th
                        className="px-4 py-3 text-left font-medium cursor-pointer select-none"
                        onClick={() => toggleSort("status")}
                      >
                        <span className="flex items-center">
                          Status{sortIcon("status")}
                        </span>
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Applications
                      </th>
                      <th
                        className="px-4 py-3 text-left font-medium cursor-pointer select-none"
                        onClick={() => toggleSort("created_at")}
                      >
                        <span className="flex items-center">
                          Posted{sortIcon("created_at")}
                        </span>
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job) => (
                      <tr
                        key={job.id}
                        className="border-b last:border-0 hover:bg-muted/30"
                      >
                        <td className="px-4 py-3 font-medium">
                          <Link
                            href={`/hiring/jobs/${job.id}`}
                            className="hover:underline"
                          >
                            {job.title}
                          </Link>
                          {job.employment_type && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              {job.employment_type.replace(/_/g, " ")}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {job.department || "--"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={statusVariant(job.status)}>
                            {job.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary">
                            {job.application_count || 0}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {job.published_at
                            ? new Date(job.published_at).toLocaleDateString()
                            : job.created_at
                            ? new Date(job.created_at).toLocaleDateString()
                            : "--"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/hiring/jobs/${job.id}`}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                            <ConfirmDialog
                              title="Delete job?"
                              description={`This will permanently delete "${job.title}" and all associated applications.`}
                              actionLabel="Delete"
                              onConfirm={() => {
                                deleteJob.mutate(job.id, {
                                  onSuccess: () =>
                                    toast.success("Job deleted"),
                                  onError: () =>
                                    toast.error("Failed to delete job"),
                                });
                              }}
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                disabled={deleteJob.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </ConfirmDialog>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {meta && (meta.total_pages > 1 || meta.total > 10) && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                      Showing {(meta.page - 1) * meta.per_page + 1}&ndash;
                      {Math.min(meta.page * meta.per_page, meta.total)} of{" "}
                      {meta.total} results
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
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
