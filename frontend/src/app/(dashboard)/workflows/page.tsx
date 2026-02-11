"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, FolderOpen, Loader2, CheckCircle2, Circle, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useWorkflowInstances,
  useWorkflowTemplates,
  useAdvanceWorkflowStep,
} from "@/lib/hooks/use-workflows";
import { CreateWorkflowTemplateDialog } from "@/components/dashboard/create-workflow-template-dialog";
import { CreateWorkflowInstanceDialog } from "@/components/dashboard/create-workflow-instance-dialog";

function statusVariant(status: string): "default" | "secondary" | "outline" {
  switch (status) {
    case "active": return "default";
    case "completed": return "secondary";
    default: return "outline";
  }
}

export default function WorkflowsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useWorkflowInstances({ page, per_page: 25 });
  const { data: templates } = useWorkflowTemplates();
  const advanceStep = useAdvanceWorkflowStep();

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
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-destructive">
                Failed to load workflows. Make sure the backend is running.
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
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create from Template
              </Button>
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
                              advanceStep.mutate({
                                id: wf.id,
                                action: "completed",
                              })
                            }
                          >
                            <ArrowRight className="mr-1 h-3 w-3" />
                            Advance
                          </Button>
                        )}
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
