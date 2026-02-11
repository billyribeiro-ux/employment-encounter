"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Circle,
  ArrowRight,
  SkipForward,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  useWorkflowInstance,
  useWorkflowTemplates,
  useAdvanceWorkflowStep,
  useWorkflowStepLogs,
} from "@/lib/hooks/use-workflows";

export default function WorkflowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: instance, isLoading, isError } = useWorkflowInstance(id);
  const { data: templates } = useWorkflowTemplates();
  const { data: logs } = useWorkflowStepLogs(id);
  const advanceStep = useAdvanceWorkflowStep();

  const template = templates?.find((t) => t.id === instance?.template_id);
  const steps =
    template && Array.isArray(template.steps) ? template.steps : [];

  async function handleAdvance(action: string) {
    try {
      await advanceStep.mutateAsync({ id, action });
      toast.success(
        action === "completed"
          ? "Step completed"
          : action === "skipped"
          ? "Step skipped"
          : "Step returned"
      );
    } catch {
      toast.error("Failed to advance workflow");
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !instance) {
    return (
      <div className="space-y-4">
        <Link href="/workflows">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Workflows
          </Button>
        </Link>
        <div className="text-center py-12">
          <p className="text-sm text-destructive">
            Workflow not found or failed to load.
          </p>
        </div>
      </div>
    );
  }

  const progress =
    steps.length > 0
      ? Math.round((instance.current_step_index / steps.length) * 100)
      : 0;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/workflows">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {instance.name}
            </h1>
            <Badge
              variant={
                instance.status === "completed" ? "secondary" : "default"
              }
            >
              {instance.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {template?.name || "Unknown template"}
            {instance.due_date &&
              ` · Due ${new Date(instance.due_date).toLocaleDateString()}`}
          </p>
        </div>
      </div>

      {steps.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Progress</CardTitle>
              <span className="text-sm text-muted-foreground">
                {instance.status === "completed"
                  ? steps.length
                  : instance.current_step_index}
                /{steps.length} steps
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-3 bg-muted rounded-full overflow-hidden mb-4">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{
                  width: `${instance.status === "completed" ? 100 : progress}%`,
                }}
              />
            </div>

            <div className="space-y-3">
              {steps.map((step, i) => {
                const isCompleted =
                  i < instance.current_step_index ||
                  instance.status === "completed";
                const isCurrent =
                  i === instance.current_step_index &&
                  instance.status === "active";

                return (
                  <div
                    key={i}
                    className={`flex items-start gap-3 rounded-lg p-3 ${
                      isCurrent
                        ? "bg-primary/5 border border-primary/20"
                        : "border border-transparent"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                    ) : (
                      <Circle
                        className={`h-5 w-5 mt-0.5 shrink-0 ${
                          isCurrent
                            ? "text-primary"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    )}
                    <div className="flex-1">
                      <p
                        className={`text-sm font-medium ${
                          isCompleted
                            ? "text-muted-foreground line-through"
                            : isCurrent
                            ? "text-primary"
                            : ""
                        }`}
                      >
                        Step {i + 1}: {step.name}
                      </p>
                      {step.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {step.description}
                        </p>
                      )}
                      {step.assignee_role && (
                        <Badge variant="outline" className="mt-1 text-[10px]">
                          {step.assignee_role}
                        </Badge>
                      )}
                    </div>
                    {isCurrent && (
                      <div className="flex gap-1">
                        {instance.current_step_index > 0 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            disabled={advanceStep.isPending}
                            onClick={() => handleAdvance("returned")}
                          >
                            <RotateCcw className="mr-1 h-3 w-3" />
                            Return
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          disabled={advanceStep.isPending}
                          onClick={() => handleAdvance("skipped")}
                        >
                          <SkipForward className="mr-1 h-3 w-3" />
                          Skip
                        </Button>
                        <Button
                          size="sm"
                          className="h-7 text-xs"
                          disabled={advanceStep.isPending}
                          onClick={() => handleAdvance("completed")}
                        >
                          <ArrowRight className="mr-1 h-3 w-3" />
                          Complete
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {logs && logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activity Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {logs.map((log, i) => (
                <div key={log.id}>
                  {i > 0 && <Separator className="mb-3" />}
                  <div className="flex items-start gap-3">
                    <div
                      className={`h-2 w-2 rounded-full mt-2 shrink-0 ${
                        log.action === "completed"
                          ? "bg-green-500"
                          : log.action === "started"
                          ? "bg-blue-500"
                          : log.action === "skipped"
                          ? "bg-amber-500"
                          : log.action === "returned"
                          ? "bg-red-500"
                          : "bg-muted-foreground"
                      }`}
                    />
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{log.step_name}</span>
                        <span className="text-muted-foreground">
                          {" "}
                          — {log.action}
                        </span>
                      </p>
                      {log.notes && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {log.notes}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
