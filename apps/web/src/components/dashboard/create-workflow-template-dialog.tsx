"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useCreateWorkflowTemplate } from "@/lib/hooks/use-workflows";

const stepSchema = z.object({
  name: z.string().min(1, "Step name required"),
  description: z.string().optional(),
  assignee_role: z.string().optional(),
});

const schema = z.object({
  name: z.string().min(1, "Template name is required"),
  description: z.string().optional(),
  category: z.string().optional(),
  steps: z.array(stepSchema).min(1, "At least one step is required"),
});

type FormValues = z.infer<typeof schema>;

export function CreateWorkflowTemplateDialog({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const createTemplate = useCreateWorkflowTemplate();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      steps: [{ name: "", description: "", assignee_role: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "steps",
  });

  async function onSubmit(values: FormValues) {
    try {
      await createTemplate.mutateAsync({
        name: values.name,
        description: values.description || undefined,
        category: values.category || undefined,
        steps: values.steps.map((s) => ({
          name: s.name,
          description: s.description || undefined,
          assignee_role: s.assignee_role || undefined,
        })),
      });
      toast.success("Workflow template created");
      form.reset();
      setOpen(false);
    } catch {
      toast.error("Failed to create template");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Workflow Template</DialogTitle>
          <DialogDescription>
            Define a reusable workflow with ordered steps.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. New Hire Onboarding" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        {...field}
                      >
                        <option value="">Select...</option>
                        <option value="hiring">Hiring Pipeline</option>
                        <option value="onboarding">Employee Onboarding</option>
                        <option value="offboarding">Offboarding</option>
                        <option value="review">Performance Review</option>
                        <option value="compliance">Compliance</option>
                        <option value="other">Other</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Brief description of this workflow" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium">Steps</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({ name: "", description: "", assignee_role: "" })
                  }
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Add Step
                </Button>
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="rounded-lg border p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        Step {index + 1}
                      </span>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <FormField
                        control={form.control}
                        name={`steps.${index}.name`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Step name" {...f} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`steps.${index}.description`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Description" {...f} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`steps.${index}.assignee_role`}
                        render={({ field: f }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Assignee role" {...f} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createTemplate.isPending}>
                {createTemplate.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Template
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
