"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  User,
  Flag,
  Edit,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTask, useUpdateTask, useDeleteTask } from "@/lib/hooks/use-tasks";
import { useRouter } from "next/navigation";
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";

function priorityVariant(
  priority: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (priority) {
    case "high":
      return "destructive";
    case "medium":
      return "secondary";
    default:
      return "outline";
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "todo":
      return "To Do";
    case "in_progress":
      return "In Progress";
    case "review":
      return "Review";
    case "done":
      return "Done";
    default:
      return status;
  }
}

export default function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: task, isLoading, isError } = useTask(id);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  async function handleStatusChange(newStatus: string) {
    try {
      await updateTask.mutateAsync({ id, status: newStatus });
      toast.success(`Task moved to ${statusLabel(newStatus)}`);
    } catch {
      toast.error("Failed to update task");
    }
  }

  async function handleDelete() {
    try {
      await deleteTask.mutateAsync(id);
      toast.success("Task deleted");
      router.push("/tasks");
    } catch {
      toast.error("Failed to delete task");
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Skeleton className="h-4 w-48" />
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (isError || !task) {
    return (
      <div className="space-y-4">
        <Link href="/tasks">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tasks
          </Button>
        </Link>
        <div className="text-center py-12">
          <p className="text-sm text-destructive">
            Task not found or failed to load.
          </p>
        </div>
      </div>
    );
  }

  const statuses = ["todo", "in_progress", "review", "done"];

  return (
    <div className="space-y-6 max-w-3xl">
      <Breadcrumbs
        items={[
          { label: "Tasks", href: "/tasks" },
          { label: task.title },
        ]}
      />
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{task.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={priorityVariant(task.priority)}>
              {task.priority} priority
            </Badge>
            <Badge variant="outline">{statusLabel(task.status)}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Edit className="mr-1 h-3 w-3" />
            Edit
          </Button>
          <ConfirmDialog
            title="Delete task?"
            description={`This will permanently delete "${task.title}".`}
            actionLabel="Delete"
            onConfirm={handleDelete}
          >
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              disabled={deleteTask.isPending}
            >
              <Trash2 className="mr-1 h-3 w-3" />
              Delete
            </Button>
          </ConfirmDialog>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Description</CardTitle>
            </CardHeader>
            <CardContent>
              {task.description ? (
                <p className="text-sm whitespace-pre-wrap">{task.description}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No description provided.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Move Task</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {statuses.map((s) => (
                  <Button
                    key={s}
                    variant={task.status === s ? "default" : "outline"}
                    size="sm"
                    disabled={task.status === s || updateTask.isPending}
                    onClick={() => handleStatusChange(s)}
                  >
                    {statusLabel(s)}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Flag className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Priority</p>
                  <p className="font-medium capitalize">{task.priority}</p>
                </div>
              </div>
              <Separator />
              {task.due_date && (
                <>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Due Date</p>
                      <p className="font-medium">
                        {new Date(task.due_date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <Separator />
                </>
              )}
              {task.assigned_to && (
                <>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Assigned To</p>
                      <p className="font-mono text-xs">{task.assigned_to}</p>
                    </div>
                  </div>
                  <Separator />
                </>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="font-medium">
                  {new Date(task.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last Updated</p>
                <p className="font-medium">
                  {new Date(task.updated_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
