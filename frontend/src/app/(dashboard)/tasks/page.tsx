"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  CheckSquare,
  GripVertical,
  Trash2,
  Calendar,
  Search,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
} from "@/lib/hooks/use-tasks";
import { CreateTaskDialog } from "@/components/dashboard/create-task-dialog";

const COLUMNS = [
  { id: "todo", label: "To Do", color: "bg-slate-100" },
  { id: "in_progress", label: "In Progress", color: "bg-blue-50" },
  { id: "review", label: "Review", color: "bg-amber-50" },
  { id: "done", label: "Done", color: "bg-green-50" },
];

function priorityColor(priority: string) {
  switch (priority) {
    case "high":
      return "text-red-600 bg-red-50";
    case "medium":
      return "text-amber-600 bg-amber-50";
    case "low":
      return "text-blue-600 bg-blue-50";
    default:
      return "text-muted-foreground bg-muted";
  }
}

export default function TasksPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [addingToColumn, setAddingToColumn] = useState<string | null>(null);
  const { data, isLoading, isError } = useTasks({
    per_page: 200,
    search: searchQuery || undefined,
  });
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const tasks = data?.data ?? [];

  function getColumnTasks(status: string) {
    return tasks.filter((t) => t.status === status);
  }

  async function handleAddTask(columnId: string) {
    if (!newTaskTitle.trim()) return;
    try {
      const task = await createTask.mutateAsync({
        title: newTaskTitle.trim(),
        priority: "medium",
      });
      if (columnId !== "todo") {
        await updateTask.mutateAsync({ id: task.id, status: columnId });
      }
      setNewTaskTitle("");
      setAddingToColumn(null);
      toast.success("Task created");
    } catch {
      toast.error("Failed to create task");
    }
  }

  async function handleMoveTask(taskId: string, newStatus: string) {
    try {
      await updateTask.mutateAsync({ id: taskId, status: newStatus });
    } catch {
      toast.error("Failed to move task");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            Manage tasks across your firm with Kanban board
          </p>
        </div>
        <CreateTaskDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        </CreateTaskDialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {COLUMNS.map((col) => (
            <div key={col.id} className={`rounded-lg p-3 ${col.color}`}>
              <Skeleton className="h-5 w-24 mb-3" />
              <div className="space-y-2">
                <Skeleton className="h-20 rounded-md" />
                <Skeleton className="h-20 rounded-md" />
                <Skeleton className="h-20 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-12">
          <p className="text-sm text-destructive">
            Failed to load tasks. Make sure the backend is running.
          </p>
        </div>
      ) : tasks.length === 0 && !addingToColumn ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <CheckSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No tasks yet</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                Create your first task to start organizing work across your
                firm.
              </p>
              <Button onClick={() => setAddingToColumn("todo")}>
                <Plus className="mr-2 h-4 w-4" />
                Create Task
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-4 gap-4 min-h-[60vh]">
          {COLUMNS.map((col) => {
            const columnTasks = getColumnTasks(col.id);
            return (
              <div key={col.id} className="flex flex-col">
                <div
                  className={`rounded-t-lg px-3 py-2 ${col.color} border border-b-0`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">{col.label}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {columnTasks.length}
                    </Badge>
                  </div>
                </div>

                <div
                  className="flex-1 rounded-b-lg border bg-card p-2 space-y-2 min-h-[200px]"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add("bg-accent/50");
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.classList.remove("bg-accent/50");
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove("bg-accent/50");
                    const taskId = e.dataTransfer.getData("text/plain");
                    if (taskId) handleMoveTask(taskId, col.id);
                  }}
                >
                  {columnTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) =>
                        e.dataTransfer.setData("text/plain", task.id)
                      }
                      className="rounded-lg border bg-background p-3 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing group"
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground/40 mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex-1 min-w-0">
                          <Link href={`/tasks/${task.id}`} className="text-sm font-medium leading-tight hover:underline">
                            {task.title}
                          </Link>
                          {task.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span
                              className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${priorityColor(
                                task.priority
                              )}`}
                            >
                              {task.priority}
                            </span>
                            {task.due_date && (
                              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                <Calendar className="h-2.5 w-2.5" />
                                {new Date(task.due_date).toLocaleDateString(
                                  "en-US",
                                  { month: "short", day: "numeric" }
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                          onClick={() => deleteTask.mutate(task.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {addingToColumn === col.id ? (
                    <div className="rounded-lg border bg-background p-3">
                      <Input
                        autoFocus
                        placeholder="Task title..."
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddTask(col.id);
                          if (e.key === "Escape") {
                            setAddingToColumn(null);
                            setNewTaskTitle("");
                          }
                        }}
                        className="text-sm mb-2"
                      />
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          className="h-7 text-xs"
                          disabled={createTask.isPending}
                          onClick={() => handleAddTask(col.id)}
                        >
                          Add
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => {
                            setAddingToColumn(null);
                            setNewTaskTitle("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="w-full rounded-lg border border-dashed p-2 text-xs text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground transition-colors"
                      onClick={() => setAddingToColumn(col.id)}
                    >
                      <Plus className="h-3 w-3 inline mr-1" />
                      Add task
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
