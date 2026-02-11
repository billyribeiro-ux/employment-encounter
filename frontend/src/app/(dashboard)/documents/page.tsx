"use client";

import { useState } from "react";
import { Upload, Search, Filter, FileText, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/dashboard/search-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDocuments, useDeleteDocument } from "@/lib/hooks/use-documents";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { UploadDocumentDialog } from "@/components/dashboard/upload-document-dialog";
import { toast } from "sonner";
import { TableSkeleton } from "@/components/dashboard/table-skeleton";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery);
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useDocuments({
    page,
    per_page: 25,
    search: debouncedSearch || undefined,
  });
  const deleteDoc = useDeleteDocument();

  const documents = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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
      </div>

      <div className="flex items-center gap-4">
        <SearchInput
          value={searchQuery}
          onChange={(v) => { setSearchQuery(v); setPage(1); }}
          placeholder="Search documents..."
        />
        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
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
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-destructive">
                Failed to load documents. Make sure the backend is running.
              </p>
            </div>
          ) : documents.length === 0 && debouncedSearch ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-8 w-8 text-muted-foreground mb-3" />
              <h3 className="text-lg font-semibold mb-1">No results found</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                No documents match &ldquo;{debouncedSearch}&rdquo;. Try a different search term.
              </p>
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
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
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full text-sm min-w-[600px]">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium">Name</th>
                      <th className="px-4 py-3 text-left font-medium">Category</th>
                      <th className="px-4 py-3 text-left font-medium">Size</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                      <th className="px-4 py-3 text-left font-medium">Uploaded</th>
                      <th className="px-4 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => (
                      <tr key={doc.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{doc.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {doc.ai_category || doc.category || "Uncategorized"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatBytes(doc.size_bytes)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              doc.status === "processed"
                                ? "default"
                                : doc.status === "pending"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {doc.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <ConfirmDialog
                            title="Delete document?"
                            description={`This will permanently delete "${doc.name}".`}
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
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
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
