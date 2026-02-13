"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Plus, Clock, Square, Trash2, Search, ArrowUpDown, ArrowUp, ArrowDown, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/dashboard/search-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTimeEntries, useStopTimer, useDeleteTimeEntry } from "@/lib/hooks/use-time-entries";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { CreateTimeEntryDialog } from "@/components/dashboard/create-time-entry-dialog";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/dashboard/table-skeleton";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

const tableRow = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const } },
};

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function TimePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery);
  const [billableFilter, setBillableFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [perPage, setPerPage] = useState(25);
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useTimeEntries({
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
    is_billable: billableFilter === "all" ? undefined : billableFilter === "billable",
    sort: sortBy,
    order: sortOrder,
  });
  const stopTimer = useStopTimer();
  const deleteEntry = useDeleteTimeEntry();

  function toggleSort(col: string) {
    if (sortBy === col) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(col);
      setSortOrder(col === "date" ? "desc" : "asc");
    }
    setPage(1);
  }

  function sortIcon(col: string) {
    if (sortBy !== col) return <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground/50" />;
    return sortOrder === "asc" ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />;
  }

  const entries = data?.data ?? [];
  const meta = data?.meta;

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={fadeUp} className="flex items-center justify-between">
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
      </motion.div>

      <motion.div variants={fadeUp} className="flex items-center gap-4 flex-wrap">
        <SearchInput
          value={searchQuery}
          onChange={(v) => { setSearchQuery(v); setPage(1); }}
          placeholder="Search time entries..."
        />
        <Select value={billableFilter} onValueChange={(v) => { setBillableFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[140px] bg-muted/50 border-0">
            <SelectValue placeholder="Billable" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entries</SelectItem>
            <SelectItem value="billable">Billable</SelectItem>
            <SelectItem value="non-billable">Non-Billable</SelectItem>
          </SelectContent>
        </Select>
        {(searchQuery || billableFilter !== "all" || sortBy !== "date" || sortOrder !== "desc") && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 text-muted-foreground"
              onClick={() => { setSearchQuery(""); setBillableFilter("all"); setSortBy("date"); setSortOrder("desc"); setPage(1); }}
            >
              <RotateCcw className="mr-1 h-3 w-3" />
              Reset
            </Button>
          </motion.div>
        )}
      </motion.div>

      <motion.div variants={fadeUp}>
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
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
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-destructive">
                  Failed to load time entries. Make sure the backend is running.
                </p>
              </motion.div>
            ) : entries.length === 0 && debouncedSearch ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="h-8 w-8 text-muted-foreground mb-3" />
                <h3 className="text-lg font-semibold mb-1">No results found</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  No time entries match &ldquo;{debouncedSearch}&rdquo;. Try a different search term.
                </p>
              </motion.div>
            ) : entries.length === 0 ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-12 text-center">
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
              </motion.div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-md border overflow-hidden overflow-x-auto">
                  <table className="w-full text-sm min-w-[700px]">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort("description")}>
                          <span className="flex items-center">Description{sortIcon("description")}</span>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort("date")}>
                          <span className="flex items-center">Date{sortIcon("date")}</span>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort("duration_minutes")}>
                          <span className="flex items-center">Duration{sortIcon("duration_minutes")}</span>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort("is_billable")}>
                          <span className="flex items-center">Billable{sortIcon("is_billable")}</span>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <motion.tbody variants={stagger} initial="hidden" animate="visible">
                      {entries.map((entry) => (
                        <motion.tr key={entry.id} variants={tableRow} className="border-b last:border-0 transition-colors group">
                          <td className="px-4 py-3 font-medium">
                            {entry.description || "No description"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {new Date(entry.date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            {entry.is_running ? (
                              <motion.span
                                className="text-green-600 font-medium"
                                animate={{ opacity: [1, 0.5, 1] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                              >
                                Running...
                              </motion.span>
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
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </ConfirmDialog>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </motion.tbody>
                  </table>
                </div>

                {meta && (meta.total_pages > 1 || meta.total > 10) && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">
                        Showing {(meta.page - 1) * meta.per_page + 1}–{Math.min(meta.page * meta.per_page, meta.total)} of {meta.total} results
                      </p>
                      <Select value={String(perPage)} onValueChange={(v) => { setPerPage(Number(v)); setPage(1); }}>
                        <SelectTrigger className="w-[70px] h-8 text-xs bg-muted/50 border-0">
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
      </motion.div>
    </motion.div>
  );
}
