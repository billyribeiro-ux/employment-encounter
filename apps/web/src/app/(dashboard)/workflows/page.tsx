"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, FolderOpen, CheckCircle2, Circle, ArrowRight, Search, Trash2 } from "lucide-react";

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
import {
  useWorkflowInstances,
  useWorkflowTemplates,
  useAdvanceWorkflowStep,
  useDeleteWorkflowInstance,
} from "@/lib/hooks/use-workflows";
import { CreateWorkflowTemplateDialog } from "@/components/dashboard/create-workflow-template-dialog";
import { CreateWorkflowInstanceDialog } from "@/components/dashboard/create-workflow-instance-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";

function statusVariant(status: string): "default" | "secondary" | "outline" {
  switch (status) {
    case "active": return "default";
    case "completed": return "secondary";
    default: return "outline";
  }
}

export default function WorkflowsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useWorkflowInstances({
    page,
    per_page: 25,
    search: debouncedSearch || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });
  const { data: templates } = useWorkflowTemplates();
  const advanceStep = useAdvanceWorkflowStep();
  const deleteInstance = useDeleteWorkflowInstance();

  const workflows = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Workflows</h1>
          <p className="text-muted-foreground">
            Manage client engagement workflows and task pipelines
          </p>
        </div>
        <div className="flex gap-2">
          <CreateWorkflowTemplateDialog>
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </CreateWorkflowTemplateDialog>
          <CreateWorkflowInstanceDialog>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Start Workflow
            </Button>
          </CreateWorkflowInstanceDialog>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <SearchInput
          value={searchQuery}
          onChange={(v) => { setSearchQuery(v); setPage(1); }}
          placeholder="Search workflows..."
        />
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {templates && templates.length > 0 && (
        <div className="grid gap-3 md:grid-cols-3">
          {templates.map((t) => (
            <Link key={t.id} href={`/workflows/templates/${t.id}`}>
              <Card className="cursor-pointer hover:border-primary/50 transition-colors">
                <CardContent className="pt-4 pb-3">
                  <p className="font-medium text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Array.isArray(t.steps) ? t.steps.length : 0} steps
                    {t.category && ` · ${t.category}`}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Active Workflows
            {meta && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({meta.total})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <Skeleton className="h-4 w-40 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-destructive">
                Failed to load workflows. Make sure the backend is running.
              </p>
            </div>
          ) : workflows.length === 0 && debouncedSearch ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-8 w-8 text-muted-foreground mb-3" />
              <h3 className="text-lg font-semibold mb-1">No results found</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                No workflows match &ldquo;{debouncedSearch}&rdquo;. Try a different search term.
              </p>
            </div>
          ) : workflows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <FolderOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No workflows yet</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                Create a workflow from a template to track client engagements
                through each step.
              </p>
              <CreateWorkflowInstanceDialog>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create from Template
                </Button>
              </CreateWorkflowInstanceDialog>
            </div>
          ) : (
            <div className="space-y-4">
              {workflows.map((wf) => {
                const template = templates?.find((t) => t.id === wf.template_id);
                const totalSteps = template && Array.isArray(template.steps) ? template.steps.length : 0;
                const progress = totalSteps > 0 ? Math.round((wf.current_step_index / totalSteps) * 100) : 0;

                return (
                  <div
                    key={wf.id}
                    className="rounded-lg border p-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <Link href={`/workflows/${wf.id}`} className="font-medium hover:underline">{wf.name}</Link>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {template?.name || "Unknown template"}
                          {wf.due_date && ` · Due ${new Date(wf.due_date).toLocaleDateString()}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={statusVariant(wf.status)}>{wf.status}</Badge>
                        {wf.status === "active" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={advanceStep.isPending}
                            onClick={() =>
                              advanceStep.mutate(
                                { id: wf.id, action: "completed" },
                                {
                                  onSuccess: () => toast.success("Step advanced"),
                                  onError: () => toast.error("Failed to advance step"),
                                }
                              )
                            }
                          >
                            <ArrowRight className="mr-1 h-3 w-3" />
                            Advance
                          </Button>
                        )}
                        <ConfirmDialog
                          title="Delete Workflow"
                          description="Are you sure you want to delete this workflow instance? This cannot be undone."
                          onConfirm={async () => {
                            try {
                              await deleteInstance.mutateAsync(wf.id);
                              toast.success("Workflow deleted");
                            } catch {
                              toast.error("Failed to delete workflow");
                            }
                          }}
                        >
                          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </ConfirmDialog>
                      </div>
                    </div>

                    {totalSteps > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${wf.status === "completed" ? 100 : progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {wf.status === "completed" ? totalSteps : wf.current_step_index}/{totalSteps}
                        </span>
                      </div>
                    )}

                    {template && Array.isArray(template.steps) && totalSteps > 0 && (
                      <div className="flex items-center gap-1 mt-3 overflow-x-auto">
                        {template.steps.map((step, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-1 text-xs whitespace-nowrap"
                          >
                            {i < wf.current_step_index || wf.status === "completed" ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                            ) : (
                              <Circle
                                className={`h-3.5 w-3.5 shrink-0 ${i === wf.current_step_index
                                  ? "text-primary"
                                  : "text-muted-foreground/40"
                                  }`}
                              />
                            )}
                            <span
                              className={
                                i === wf.current_step_index && wf.status === "active"
                                  ? "font-medium text-primary"
                                  : "text-muted-foreground"
                              }
                            >
                              {step.name}
                            </span>
                            {i < totalSteps - 1 && (
                              <span className="text-muted-foreground/30 mx-0.5">→</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {meta && meta.total_pages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {(meta.page - 1) * meta.per_page + 1}–{Math.min(meta.page * meta.per_page, meta.total)} of {meta.total} results
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
