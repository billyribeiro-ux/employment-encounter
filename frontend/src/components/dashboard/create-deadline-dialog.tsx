"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus } from "lucide-react";
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
import { useCreateDeadline } from "@/lib/hooks/use-compliance";

const schema = z.object({
  client_id: z.string().uuid("Valid client UUID required"),
  filing_type: z.string().min(1, "Filing type is required"),
  description: z.string().optional(),
  due_date: z.string().min(1, "Due date is required"),
  assigned_to: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function CreateDeadlineDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const createDeadline = useCreateDeadline();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      client_id: "",
      filing_type: "",
      description: "",
      due_date: "",
      assigned_to: "",
      notes: "",
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      await createDeadline.mutateAsync({
        client_id: values.client_id,
        filing_type: values.filing_type,
        description: values.description || undefined,
        due_date: values.due_date,
        assigned_to: values.assigned_to || undefined,
        notes: values.notes || undefined,
      });
      toast.success("Deadline created");
      form.reset();
      setOpen(false);
    } catch {
      toast.error("Failed to create deadline");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Compliance Deadline</DialogTitle>
          <DialogDescription>
            Track a filing deadline for a client.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="filing_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Filing Type</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        {...field}
                      >
                        <option value="">Select type...</option>
                        <option value="1040">1040 - Individual</option>
                        <option value="1120-S">1120-S - S Corp</option>
                        <option value="1065">1065 - Partnership</option>
                        <option value="1120">1120 - C Corp</option>
                        <option value="990">990 - Nonprofit</option>
                        <option value="941">941 - Payroll</option>
                        <option value="State">State Filing</option>
                        <option value="Other">Other</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Client UUID" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Input placeholder="Internal notes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createDeadline.isPending}>
                {createDeadline.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Plus className="mr-2 h-4 w-4" />
                Add Deadline
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
