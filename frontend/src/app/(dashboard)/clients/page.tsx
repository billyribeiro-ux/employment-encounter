"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Users, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

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

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<string>("asc");
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useClients({
    page,
    per_page: 25,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">
            Manage your firm&apos;s client relationships
          </p>
        </div>
        <CreateClientDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </CreateClientDialog>
      </div>

      <div className="flex items-center gap-4">
        <SearchInput
          value={searchQuery}
          onChange={(v) => { setSearchQuery(v); setPage(1); }}
          placeholder="Search clients..."
        />
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
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
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-8 w-8 text-muted-foreground mb-3" />
              <h3 className="text-lg font-semibold mb-1">No results found</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                No clients match &ldquo;{debouncedSearch}&rdquo;. Try a different search term.
              </p>
            </div>
          ) : clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No clients yet</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                Add your first client to get started. You can also import
                clients from a CSV file or sync from QuickBooks.
              </p>
              <div className="flex gap-2">
                <CreateClientDialog>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Client
                  </Button>
                </CreateClientDialog>
                <Button variant="outline">Import CSV</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium cursor-pointer select-none" onClick={() => toggleSort("name")}>
                        <span className="flex items-center">Name{sortIcon("name")}</span>
                      </th>
                      <th className="px-4 py-3 text-left font-medium cursor-pointer select-none" onClick={() => toggleSort("business_type")}>
                        <span className="flex items-center">Type{sortIcon("business_type")}</span>
                      </th>
                      <th className="px-4 py-3 text-left font-medium cursor-pointer select-none" onClick={() => toggleSort("status")}>
                        <span className="flex items-center">Status{sortIcon("status")}</span>
                      </th>
                      <th className="px-4 py-3 text-left font-medium">Fiscal Year</th>
                      <th className="px-4 py-3 text-left font-medium cursor-pointer select-none" onClick={() => toggleSort("created_at")}>
                        <span className="flex items-center">Created{sortIcon("created_at")}</span>
                      </th>
                      <th className="px-4 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((client) => (
                      <tr key={client.id} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer">
                        <td className="px-4 py-3 font-medium">
                          <Link href={`/clients/${client.id}`} className="hover:underline">
                            {client.name}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{client.business_type}</td>
                        <td className="px-4 py-3">
                          <Badge variant={client.status === "active" ? "default" : "secondary"}>
                            {client.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{client.fiscal_year_end}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(client.created_at).toLocaleDateString()}
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
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              disabled={deleteClient.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </ConfirmDialog>
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
