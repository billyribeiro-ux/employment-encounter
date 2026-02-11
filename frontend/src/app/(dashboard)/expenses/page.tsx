"use client";

import { useState } from "react";
import { Plus, Wallet, Trash2, Search, ArrowUpDown, ArrowUp, ArrowDown, RotateCcw } from "lucide-react";
import { toast } from "sonner";

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
import { useExpenses, useDeleteExpense } from "@/lib/hooks/use-expenses";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { CreateExpenseDialog } from "@/components/dashboard/create-expense-dialog";
import { TableSkeleton } from "@/components/dashboard/table-skeleton";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export default function ExpensesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [perPage, setPerPage] = useState(25);
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useExpenses({
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    sort: sortBy,
    order: sortOrder,
  });
  const deleteExpense = useDeleteExpense();

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

  const expenses = data?.data ?? [];
  const meta = data?.meta;

  async function handleDelete(id: string) {
    try {
      await deleteExpense.mutateAsync(id);
      toast.success("Expense deleted");
    } catch {
      toast.error("Failed to delete expense");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">
            Track firm and client expenses
          </p>
        </div>
        <CreateExpenseDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Record Expense
          </Button>
        </CreateExpenseDialog>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <SearchInput
          value={searchQuery}
          onChange={(v) => { setSearchQuery(v); setPage(1); }}
          placeholder="Search expenses..."
        />
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="reimbursed">Reimbursed</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        {(searchQuery || statusFilter !== "all" || sortBy !== "date" || sortOrder !== "desc") && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-muted-foreground"
            onClick={() => { setSearchQuery(""); setStatusFilter("all"); setSortBy("date"); setSortOrder("desc"); setPage(1); }}
          >
            <RotateCcw className="mr-1 h-3 w-3" />
            Reset
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            All Expenses
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
            <div className="text-center py-12">
              <p className="text-sm text-destructive">
                Failed to load expenses. Make sure the backend is running.
              </p>
            </div>
          ) : expenses.length === 0 && debouncedSearch ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-8 w-8 text-muted-foreground mb-3" />
              <h3 className="text-lg font-semibold mb-1">No results found</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                No expenses match &ldquo;{debouncedSearch}&rdquo;. Try a different search term.
              </p>
            </div>
          ) : expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Wallet className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No expenses yet</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                Record your first expense to start tracking firm and client costs.
              </p>
              <CreateExpenseDialog>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Record Expense
                </Button>
              </CreateExpenseDialog>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium cursor-pointer select-none" onClick={() => toggleSort("date")}>
                        <span className="flex items-center">Date{sortIcon("date")}</span>
                      </th>
                      <th className="px-4 py-3 text-left font-medium cursor-pointer select-none" onClick={() => toggleSort("category")}>
                        <span className="flex items-center">Category{sortIcon("category")}</span>
                      </th>
                      <th className="px-4 py-3 text-left font-medium cursor-pointer select-none" onClick={() => toggleSort("description")}>
                        <span className="flex items-center">Description{sortIcon("description")}</span>
                      </th>
                      <th className="px-4 py-3 text-right font-medium cursor-pointer select-none" onClick={() => toggleSort("amount_cents")}>
                        <span className="flex items-center justify-end">Amount{sortIcon("amount_cents")}</span>
                      </th>
                      <th className="px-4 py-3 text-left font-medium">Reimbursable</th>
                      <th className="px-4 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((exp) => (
                      <tr
                        key={exp.id}
                        className="border-b last:border-0 hover:bg-muted/30"
                      >
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(exp.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary">{exp.category}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          {exp.description || "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {formatCents(exp.amount_cents)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={exp.is_reimbursable ? "default" : "outline"}
                          >
                            {exp.is_reimbursable ? "Yes" : "No"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <ConfirmDialog
                            title="Delete expense?"
                            description="This will permanently delete this expense entry."
                            actionLabel="Delete"
                            onConfirm={() => handleDelete(exp.id)}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              disabled={deleteExpense.isPending}
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
