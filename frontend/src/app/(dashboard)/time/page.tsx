"use client";

import { useState } from "react";
import { Play, Plus, Clock, Square, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTimeEntries, useStopTimer, useDeleteTimeEntry } from "@/lib/hooks/use-time-entries";
import { CreateTimeEntryDialog } from "@/components/dashboard/create-time-entry-dialog";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/dashboard/table-skeleton";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function TimePage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useTimeEntries({ page, per_page: 25 });
  const stopTimer = useStopTimer();
  const deleteEntry = useDeleteTimeEntry();

  const entries = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Time Tracking</h1>
          <p className="text-muted-foreground">
            Track billable and non-billable hours
          </p>
        </div>
        <div className="flex gap-2">
          <CreateTimeEntryDialog mode="manual">
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Manual Entry
            </Button>
          </CreateTimeEntryDialog>
          <CreateTimeEntryDialog mode="timer">
            <Button>
              <Play className="mr-2 h-4 w-4" />
              Start Timer
            </Button>
          </CreateTimeEntryDialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Time Entries
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
                Failed to load time entries. Make sure the backend is running.
              </p>
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No time entries yet</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                Start a timer or add a manual entry to begin tracking your time.
              </p>
              <CreateTimeEntryDialog mode="timer">
                <Button>
                  <Play className="mr-2 h-4 w-4" />
                  Start Timer
                </Button>
              </CreateTimeEntryDialog>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium">Description</th>
                      <th className="px-4 py-3 text-left font-medium">Date</th>
                      <th className="px-4 py-3 text-left font-medium">Duration</th>
                      <th className="px-4 py-3 text-left font-medium">Billable</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                      <th className="px-4 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => (
                      <tr key={entry.id} className="border-b last:border-0">
                        <td className="px-4 py-3 font-medium">
                          {entry.description || "No description"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(entry.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          {entry.is_running ? (
                            <span className="text-green-600 font-medium animate-pulse">Running...</span>
                          ) : (
                            formatDuration(entry.duration_minutes)
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={entry.is_billable ? "default" : "secondary"}>
                            {entry.is_billable ? "Billable" : "Non-billable"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {entry.invoice_id ? (
                            <Badge variant="outline">Invoiced</Badge>
                          ) : entry.is_running ? (
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Logged</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {entry.is_running && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600"
                                onClick={() => {
                                  stopTimer.mutate(entry.id, {
                                    onSuccess: () => toast.success("Timer stopped"),
                                    onError: () => toast.error("Failed to stop timer"),
                                  });
                                }}
                              >
                                <Square className="h-4 w-4" />
                              </Button>
                            )}
                            {!entry.invoice_id && !entry.is_running && (
                              <ConfirmDialog
                                title="Delete time entry?"
                                description="This will permanently delete this time entry."
                                actionLabel="Delete"
                                onConfirm={() => {
                                  deleteEntry.mutate(entry.id, {
                                    onSuccess: () => toast.success("Time entry deleted"),
                                    onError: () => toast.error("Failed to delete entry"),
                                  });
                                }}
                              >
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </ConfirmDialog>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {meta && meta.total_pages > 1 && (
                <div className="flex items-center justify-between">
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
