"use client";

import { Plus, FolderOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function WorkflowsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Workflows</h1>
          <p className="text-muted-foreground">
            Manage client engagement workflows and task pipelines
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Workflow
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Active Workflows</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}
