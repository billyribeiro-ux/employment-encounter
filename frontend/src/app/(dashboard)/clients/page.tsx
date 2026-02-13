"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, Search, Users, Trash2, ArrowUpDown, ArrowUp, ArrowDown, RotateCcw } from "lucide-react";

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
import { useClients, useDeleteClient } from "@/lib/hooks/use-clients";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { CreateClientDialog } from "@/components/dashboard/create-client-dialog";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/dashboard/table-skeleton";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const tableRow = {
  hidden: { opacity: 0, x: -8 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const },
  },
};

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<string>("asc");
  const [perPage, setPerPage] = useState(25);
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useClients({
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    sort: sortBy,
    order: sortOrder,
  });

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
    if (sortBy !== col) return <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground/50" />;
    return sortOrder === "asc" ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />;
  }
  const deleteClient = useDeleteClient();

  const clients = data?.data ?? [];
  const meta = data?.meta;

  const statusColors: Record<string, string> = {
    active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
    inactive: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
    archived: "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20",
  };

  return (
    <motion.div
      className="space-y-6"
      variants={stagger}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground">
            Manage your firm&apos;s client relationships
          </p>
        </div>
        <CreateClientDialog>
          <Button className="shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </CreateClientDialog>
      </motion.div>

      <motion.div variants={fadeUp} className="flex items-center gap-4 flex-wrap">
        <SearchInput
          value={searchQuery}
          onChange={(v) => { setSearchQuery(v); setPage(1); }}
          placeholder="Search clients..."
        />
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[140px] bg-muted/50 border-0">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        {(searchQuery || statusFilter !== "all" || sortBy !== "name" || sortOrder !== "asc") && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <Button
              variant="ghost"
              size="sm"
              className="h-9 text-muted-foreground"
              onClick={() => { setSearchQuery(""); setStatusFilter("all"); setSortBy("name"); setSortOrder("asc"); setPage(1); }}
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
              All Clients
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
                  Failed to load clients. Make sure the backend is running.
                </p>
              </div>
            ) : clients.length === 0 && debouncedSearch ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <div className="rounded-full bg-muted p-3 mb-3">
                  <Search className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-1">No results found</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  No clients match &ldquo;{debouncedSearch}&rdquo;. Try a different search term.
                </p>
              </motion.div>
            ) : clients.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-1">No clients yet</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                  Add your first client to get started with practice management.
                </p>
                <div className="flex gap-2">
                  <CreateClientDialog>
                    <Button className="shadow-sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Client
                    </Button>
                  </CreateClientDialog>
                  <Button variant="outline">Import CSV</Button>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border overflow-x-auto">
                  <table className="w-full text-sm min-w-[600px]">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort("name")}>
                          <span className="flex items-center">Name{sortIcon("name")}</span>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort("business_type")}>
                          <span className="flex items-center">Type{sortIcon("business_type")}</span>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort("status")}>
                          <span className="flex items-center">Status{sortIcon("status")}</span>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Fiscal Year</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort("created_at")}>
                          <span className="flex items-center">Created{sortIcon("created_at")}</span>
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <motion.tbody variants={stagger} initial="hidden" animate="visible">
                      {clients.map((client) => (
                        <motion.tr
                          key={client.id}
                          variants={tableRow}
                          className="border-b last:border-0 hover:bg-muted/20 transition-colors cursor-pointer group"
                        >
                          <td className="px-4 py-3">
                            <Link href={`/clients/${client.id}`} className="font-medium text-foreground group-hover:text-primary transition-colors">
                              {client.name}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{client.business_type}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={statusColors[client.status] || ""}>
                              {client.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{client.fiscal_year_end}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {new Date(client.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <ConfirmDialog
                              title="Delete client?"
                              description={`This will permanently delete "${client.name}" and all associated data.`}
                              actionLabel="Delete"
                              onConfirm={() => {
                                deleteClient.mutate(client.id, {
                                  onSuccess: () => toast.success("Client deleted"),
                                  onError: () => toast.error("Failed to delete client"),
                                });
                              }}
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                disabled={deleteClient.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </ConfirmDialog>
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
                        Showing {(meta.page - 1) * meta.per_page + 1}–{Math.min(meta.page * meta.per_page, meta.total)} of {meta.total}
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
                      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                        Previous
                      </Button>
                      <Button variant="outline" size="sm" disabled={page >= meta.total_pages} onClick={() => setPage((p) => p + 1)}>
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
