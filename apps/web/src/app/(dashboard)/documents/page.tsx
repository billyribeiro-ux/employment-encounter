"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, Search, FileText, Trash2, ArrowUpDown, ArrowUp, ArrowDown, RotateCcw } from "lucide-react";

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
import { useDocuments, useDeleteDocument } from "@/lib/hooks/use-documents";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { UploadDocumentDialog } from "@/components/dashboard/upload-document-dialog";
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

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [perPage, setPerPage] = useState(25);
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useDocuments({
    page,
    per_page: perPage,
    search: debouncedSearch || undefined,
    category: categoryFilter !== "all" ? categoryFilter : undefined,
    sort: sortBy,
    order: sortOrder,
  });
  const deleteDoc = useDeleteDocument();

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

  const documents = data?.data ?? [];
  const meta = data?.meta;

  return (
    <motion.div className="space-y-6" variants={stagger} initial="hidden" animate="visible">
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground">
            Upload, organize, and search firm documents
          </p>
        </div>
        <UploadDocumentDialog>
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Button>
        </UploadDocumentDialog>
      </motion.div>

      <motion.div variants={fadeUp} className="flex items-center gap-4 flex-wrap">
        <SearchInput
          value={searchQuery}
          onChange={(v) => { setSearchQuery(v); setPage(1); }}
          placeholder="Search documents..."
        />
        <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[150px] bg-muted/50 border-0">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="resume">Resume / CV</SelectItem>
            <SelectItem value="offer_letter">Offer Letter</SelectItem>
            <SelectItem value="contract">Contract</SelectItem>
            <SelectItem value="contract">Contract</SelectItem>
            <SelectItem value="correspondence">Correspondence</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        {(searchQuery || categoryFilter !== "all" || sortBy !== "created_at" || sortOrder !== "desc") && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-muted-foreground"
            onClick={() => { setSearchQuery(""); setCategoryFilter("all"); setSortBy("created_at"); setSortOrder("desc"); setPage(1); }}
          >
            <RotateCcw className="mr-1 h-3 w-3" />
            Reset
          </Button>
        )}
      </motion.div>

      <motion.div variants={fadeUp}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              All Documents
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
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-destructive">
                  Failed to load documents. Make sure the backend is running.
                </p>
              </motion.div>
            ) : documents.length === 0 && debouncedSearch ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="h-8 w-8 text-muted-foreground mb-3" />
                <h3 className="text-lg font-semibold mb-1">No results found</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  No documents match &ldquo;{debouncedSearch}&rdquo;. Try a different search term.
                </p>
              </motion.div>
            ) : documents.length === 0 ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-1">No documents yet</h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                  Upload your first document. AI will automatically categorize and
                  extract key information.
                </p>
                <UploadDocumentDialog>
                  <Button>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Document
                  </Button>
                </UploadDocumentDialog>
              </motion.div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-md border overflow-hidden overflow-x-auto">
                  <table className="w-full text-sm min-w-[600px]">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort("name")}>
                          <span className="flex items-center">Name{sortIcon("name")}</span>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort("category")}>
                          <span className="flex items-center">Category{sortIcon("category")}</span>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort("size_bytes")}>
                          <span className="flex items-center">Size{sortIcon("size_bytes")}</span>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground cursor-pointer select-none" onClick={() => toggleSort("created_at")}>
                          <span className="flex items-center">Uploaded{sortIcon("created_at")}</span>
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <motion.tbody variants={stagger} initial="hidden" animate="visible">
                      {documents.map((doc) => (
                        <motion.tr key={doc.id} variants={tableRow} className="border-b last:border-0 hover:bg-muted/30 transition-colors group">
                          <td className="px-4 py-3 font-medium">{doc.filename}</td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {doc.category || "Uncategorized"}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {formatBytes(doc.size_bytes)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              variant={
                                doc.verification_status === "verified"
                                  ? "default"
                                  : doc.verification_status === "pending"
                                    ? "secondary"
                                    : "outline"
                              }
                            >
                              {doc.verification_status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {new Date(doc.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <ConfirmDialog
                              title="Delete document?"
                              description={`This will permanently delete "${doc.filename}".`}
                              actionLabel="Delete"
                              onConfirm={() => {
                                deleteDoc.mutate(doc.id, {
                                  onSuccess: () => toast.success("Document deleted"),
                                  onError: () => toast.error("Failed to delete document"),
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
                          </td>
                        </motion.tr>
                      ))}
                    </motion.tbody>
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
      </motion.div>
    </motion.div>
  );
}
