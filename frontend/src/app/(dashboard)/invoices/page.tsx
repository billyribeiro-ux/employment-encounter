"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Receipt, Search, Trash2, ArrowUpDown, ArrowUp, ArrowDown, RotateCcw } from "lucide-react";

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
import { useInvoices, useDeleteInvoice } from "@/lib/hooks/use-invoices";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { CreateInvoiceDialog } from "@/components/dashboard/create-invoice-dialog";
import { TableSkeleton } from "@/components/dashboard/table-skeleton";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { toast } from "sonner";

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "paid": return "default";
    case "sent":
    case "viewed": return "secondary";
    case "overdue": return "destructive";
    default: return "outline";
  }
}

export default function InvoicesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [perPage, setPerPage] = useState(25);
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useInvoices({
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    sort: sortBy,
    order: sortOrder,
  });
  const deleteInvoice = useDeleteInvoice();

  function toggleSort(col: string) {
    if (sortBy === col) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(col);
      setSortOrder(col === "created_at" ? "desc" : "asc");
    }
    setPage(1);
  }

  function sortIcon(col: string) {
    if (sortBy !== col) return <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground/50" />;
    return sortOrder === "asc" ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />;
  }

  const invoices = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">
            Create, send, and track client invoices
          </p>
        </div>
        <CreateInvoiceDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Invoice
          </Button>
        </CreateInvoiceDialog>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <SearchInput
          value={searchQuery}
          onChange={(v) => { setSearchQuery(v); setPage(1); }}
          placeholder="Search invoices..."
        />
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="viewed">Viewed</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
        {(searchQuery || statusFilter !== "all" || sortBy !== "created_at" || sortOrder !== "desc") && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-muted-foreground"
            onClick={() => { setSearchQuery(""); setStatusFilter("all"); setSortBy("created_at"); setSortOrder("desc"); setPage(1); }}
          >
            <RotateCcw className="mr-1 h-3 w-3" />
            Reset
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            All Invoices
            {meta && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({meta.total})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton columns={5} rows={5} />
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-destructive">
                Failed to load invoices. Make sure the backend is running.
              </p>
            </div>
          ) : invoices.length === 0 && debouncedSearch ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-8 w-8 text-muted-foreground mb-3" />
              <h3 className="text-lg font-semibold mb-1">No results found</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                No invoices match &ldquo;{debouncedSearch}&rdquo;. Try a different search term.
              </p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Receipt className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No invoices yet</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                Create your first invoice from tracked time entries or add line
                items manually.
              </p>
              <CreateInvoiceDialog>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Invoice
                </Button>
              </CreateInvoiceDialog>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium cursor-pointer select-none" onClick={() => toggleSort("invoice_number")}>
                        <span className="flex items-center">Invoice #{sortIcon("invoice_number")}</span>
                      </th>
                      <th className="px-4 py-3 text-left font-medium cursor-pointer select-none" onClick={() => toggleSort("status")}>
                        <span className="flex items-center">Status{sortIcon("status")}</span>
                      </th>
                      <th className="px-4 py-3 text-right font-medium cursor-pointer select-none" onClick={() => toggleSort("total_cents")}>
                        <span className="flex items-center justify-end">Amount{sortIcon("total_cents")}</span>
                      </th>
                      <th className="px-4 py-3 text-left font-medium cursor-pointer select-none" onClick={() => toggleSort("due_date")}>
                        <span className="flex items-center">Due Date{sortIcon("due_date")}</span>
                      </th>
                      <th className="px-4 py-3 text-left font-medium cursor-pointer select-none" onClick={() => toggleSort("created_at")}>
                        <span className="flex items-center">Created{sortIcon("created_at")}</span>
                      </th>
                      <th className="px-4 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="border-b last:border-0 hover:bg-muted/30 cursor-pointer">
                        <td className="px-4 py-3 font-medium">
                          <Link href={`/invoices/${inv.id}`} className="hover:underline">
                            {inv.invoice_number || inv.id.slice(0, 8)}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={statusVariant(inv.status)}>
                            {inv.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatCents(inv.total_cents)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {inv.due_date
                            ? new Date(inv.due_date).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(inv.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <ConfirmDialog
                            title="Delete invoice?"
                            description={`This will permanently delete invoice "${inv.invoice_number || inv.id.slice(0, 8)}".`}
                            actionLabel="Delete"
                            onConfirm={() => {
                              deleteInvoice.mutate(inv.id, {
                                onSuccess: () => toast.success("Invoice deleted"),
                                onError: () => toast.error("Failed to delete invoice"),
                              });
                            }}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              disabled={deleteInvoice.isPending}
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

              {meta && (meta.total_pages > 1 || meta.total > 10) && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                      Showing {(meta.page - 1) * meta.per_page + 1}–{Math.min(meta.page * meta.per_page, meta.total)} of {meta.total} results
                    </p>
                    <Select value={String(perPage)} onValueChange={(v) => { setPerPage(Number(v)); setPage(1); }}>
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
