"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Circle, Play } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  useWorkflowTemplates,
  useCreateWorkflowInstance,
} from "@/lib/hooks/use-workflows";
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs";

export default function WorkflowTemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: templates, isLoading } = useWorkflowTemplates();
  const createInstance = useCreateWorkflowInstance();

  const template = templates?.find((t) => t.id === id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!template) {
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
            Template not found or failed to load.
          </p>
        </div>
      </div>
    );
  }

  const steps = Array.isArray(template.steps) ? template.steps : [];

  async function handleStartInstance() {
    try {
      await createInstance.mutateAsync({
        template_id: template!.id,
        name: `${template!.name} - ${new Date().toLocaleDateString()}`,
      });
      toast.success("Workflow instance started");
    } catch {
      toast.error("Failed to start workflow instance");
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Breadcrumbs
        items={[
          { label: "Workflows", href: "/workflows" },
          { label: template.name },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              {template.name}
            </h1>
            <Badge variant={template.is_active ? "default" : "secondary"}>
              {template.is_active ? "Active" : "Inactive"}
            </Badge>
            {template.category && (
              <Badge variant="outline">{template.category}</Badge>
            )}
          </div>
          {template.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {template.description}
            </p>
          )}
        </div>
        <Button onClick={handleStartInstance} disabled={createInstance.isPending}>
          <Play className="mr-2 h-4 w-4" />
          Start Instance
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Workflow Steps ({steps.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {steps.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No steps defined for this template.
            </p>
          ) : (
            <div className="space-y-0">
              {steps.map((step, idx) => (
                <div key={idx}>
                  {idx > 0 && <Separator className="my-0" />}
                  <div className="flex items-start gap-4 py-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-muted bg-muted text-sm font-medium">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Circle className="h-3 w-3 text-muted-foreground" />
                        <h4 className="text-sm font-medium">{step.name}</h4>
                      </div>
                      {step.description && (
                        <p className="text-xs text-muted-foreground mt-1 ml-5">
                          {step.description}
                        </p>
                      )}
                      {step.assignee_role && (
                        <Badge variant="outline" className="mt-1 ml-5 text-xs">
                          {step.assignee_role}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Template Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Created</dt>
              <dd className="font-medium">
                {new Date(template.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Last Updated</dt>
              <dd className="font-medium">
                {new Date(template.updated_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Category</dt>
              <dd className="font-medium">{template.category || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Steps</dt>
              <dd className="font-medium">{steps.length}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
