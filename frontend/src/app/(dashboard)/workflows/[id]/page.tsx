"use client";

import { use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  ArrowRight,
  SkipForward,
  RotateCcw,
  Trash2,
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
  useDeleteWorkflowInstance,
} from "@/lib/hooks/use-workflows";
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

export default function WorkflowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: instance, isLoading, isError } = useWorkflowInstance(id);
  const deleteInstance = useDeleteWorkflowInstance();
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
      <motion.div
        className="space-y-6 max-w-4xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Skeleton className="h-4 w-48 rounded-lg" />
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Skeleton className="h-8 w-56 mb-2 rounded-lg" />
            <Skeleton className="h-4 w-40 rounded-lg" />
          </div>
          <Skeleton className="h-9 w-20 rounded-lg" />
        </div>
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </motion.div>
    );
  }

  if (isError || !instance) {
    return (
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
      >
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
      </motion.div>
    );
  }

  const progress =
    steps.length > 0
      ? Math.round((instance.current_step_index / steps.length) * 100)
      : 0;

  return (
    <motion.div
      className="space-y-6 max-w-4xl"
      variants={stagger}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={fadeUp}>
        <Breadcrumbs
          items={[
            { label: "Workflows", href: "/workflows" },
            { label: instance.name },
          ]}
        />
      </motion.div>

      <motion.div variants={fadeUp} className="flex items-center gap-4">
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
              ` \u00B7 Due ${new Date(instance.due_date).toLocaleDateString()}`}
          </p>
        </div>
        <ConfirmDialog
          title="Delete workflow?"
          description={`This will permanently delete "${instance.name}".`}
          actionLabel="Delete"
          onConfirm={() => {
            deleteInstance.mutate(instance.id, {
              onSuccess: () => {
                toast.success("Workflow deleted");
                router.push("/workflows");
              },
              onError: () => toast.error("Failed to delete workflow"),
            });
          }}
        >
          <Button
            variant="outline"
            className="text-destructive hover:text-destructive shadow-sm"
            disabled={deleteInstance.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </ConfirmDialog>
      </motion.div>

      {steps.length > 0 && (
        <motion.div variants={fadeUp}>
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Progress</CardTitle>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {instance.status === "completed"
                    ? steps.length
                    : instance.current_step_index}
                  /{steps.length} steps
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-3 bg-muted rounded-full overflow-hidden mb-4">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${instance.status === "completed" ? 100 : progress}%` }}
                  transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
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
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
                      className={`flex items-start gap-3 rounded-lg p-3 transition-colors ${isCurrent
                        ? "bg-primary/5 border border-primary/20"
                        : "border border-transparent"
                        }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                      ) : (
                        <Circle
                          className={`h-5 w-5 mt-0.5 shrink-0 ${isCurrent
                            ? "text-primary"
                            : "text-muted-foreground/30"
                            }`}
                        />
                      )}
                      <div className="flex-1">
                        <p
                          className={`text-sm font-medium ${isCompleted
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
                            className="h-7 text-xs shadow-sm"
                            disabled={advanceStep.isPending}
                            onClick={() => handleAdvance("completed")}
                          >
                            <ArrowRight className="mr-1 h-3 w-3" />
                            Complete
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {logs && logs.length > 0 && (
        <motion.div variants={fadeUp}>
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {logs.map((log, i) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
                  >
                    {i > 0 && <Separator className="mb-3" />}
                    <div className="flex items-start gap-3">
                      <div
                        className={`h-2 w-2 rounded-full mt-2 shrink-0 ${log.action === "completed"
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
                            \u2014 {log.action}
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
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
