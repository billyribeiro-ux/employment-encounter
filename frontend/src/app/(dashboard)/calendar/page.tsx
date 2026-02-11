"use client";

import { useState } from "react";
import {
  Calendar as CalendarIcon,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useComplianceDeadlines,
  useUpdateDeadline,
  useDeleteDeadline,
} from "@/lib/hooks/use-compliance";
import { CreateDeadlineDialog } from "@/components/dashboard/create-deadline-dialog";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";

function statusIcon(status: string) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case "overdue":
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    default:
      return <Clock className="h-4 w-4 text-amber-600" />;
  }
}

function statusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "completed":
      return "default";
    case "overdue":
      return "destructive";
    case "upcoming":
      return "secondary";
    default:
      return "outline";
  }
}

function daysUntil(dateStr: string): number {
  const due = new Date(dateStr);
  const now = new Date();
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function CalendarPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery);
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useComplianceDeadlines({
    page,
    per_page: 50,
    search: debouncedSearch || undefined,
  });
  const updateDeadline = useUpdateDeadline();
  const deleteDeadline = useDeleteDeadline();

  const deadlines = data?.data ?? [];
  const meta = data?.meta;

  const upcoming = deadlines.filter((d) => d.status === "upcoming");
  const overdue = deadlines.filter((d) => d.status === "overdue");
  const completed = deadlines.filter((d) => d.status === "completed");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Compliance Calendar
          </h1>
          <p className="text-muted-foreground">
            Track tax deadlines, filing dates, and compliance milestones
          </p>
        </div>
        <CreateDeadlineDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Deadline
          </Button>
        </CreateDeadlineDialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search deadlines..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {!isLoading && !isError && deadlines.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">Overdue</span>
              </div>
              <p className="text-2xl font-bold mt-1">{overdue.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium">Upcoming</span>
              </div>
              <p className="text-2xl font-bold mt-1">{upcoming.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Completed</span>
              </div>
              <p className="text-2xl font-bold mt-1">{completed.length}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Deadlines
            {meta && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({meta.total})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 rounded-lg border p-4">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-48 mb-1" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-12">
              <p className="text-sm text-destructive">
                Failed to load deadlines. Make sure the backend is running.
              </p>
            </div>
          ) : deadlines.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <CalendarIcon className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">
                No deadlines yet
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-4">
                Add compliance deadlines to track IRS filing dates, state
                deadlines, and custom reminders for your clients.
              </p>
              <CreateDeadlineDialog>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Deadline
                </Button>
              </CreateDeadlineDialog>
            </div>
          ) : (
            <div className="space-y-3">
              {deadlines.map((dl) => {
                const days = daysUntil(dl.due_date);
                const urgencyClass =
                  dl.status === "completed"
                    ? "border-l-green-500"
                    : days < 0
                      ? "border-l-red-500"
                      : days <= 7
                        ? "border-l-amber-500"
                        : days <= 30
                          ? "border-l-yellow-400"
                          : "border-l-blue-400";

                return (
                  <div
                    key={dl.id}
                    className={`rounded-lg border border-l-4 ${urgencyClass} p-4 hover:bg-muted/30 transition-colors`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {statusIcon(dl.status)}
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm">
                              {dl.filing_type}
                            </h4>
                            <Badge variant={statusVariant(dl.status)}>
                              {dl.status}
                            </Badge>
                            {dl.extension_filed && (
                              <Badge variant="outline">Extended</Badge>
                            )}
                          </div>
                          {dl.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {dl.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            Due:{" "}
                            {new Date(dl.due_date).toLocaleDateString(
                              "en-US",
                              {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                            {dl.extended_due_date &&
                              ` (ext: ${new Date(
                                dl.extended_due_date
                              ).toLocaleDateString()})`}
                            {dl.status !== "completed" && (
                              <span
                                className={
                                  days < 0
                                    ? "text-red-600 font-medium"
                                    : days <= 7
                                      ? "text-amber-600 font-medium"
                                      : ""
                                }
                              >
                                {" "}
                                ·{" "}
                                {days < 0
                                  ? `${Math.abs(days)}d overdue`
                                  : days === 0
                                    ? "Due today"
                                    : `${days}d remaining`}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {dl.status !== "completed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={updateDeadline.isPending}
                            onClick={() =>
                              updateDeadline.mutate(
                                { id: dl.id, status: "completed" },
                                {
                                  onSuccess: () => toast.success("Deadline marked complete"),
                                  onError: () => toast.error("Failed to update deadline"),
                                }
                              )
                            }
                          >
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Complete
                          </Button>
                        )}
                        <ConfirmDialog
                          title="Delete Deadline"
                          description="Are you sure you want to delete this deadline? This cannot be undone."
                          onConfirm={async () => {
                            try {
                              await deleteDeadline.mutateAsync(dl.id);
                              toast.success("Deadline deleted");
                            } catch {
                              toast.error("Failed to delete deadline");
                            }
                          }}
                        >
                          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </ConfirmDialog>
                      </div>
                    </div>
                  </div>
                );
              })}

              {meta && meta.total_pages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-sm text-muted-foreground">
                    Page {meta.page} of {meta.total_pages}
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
