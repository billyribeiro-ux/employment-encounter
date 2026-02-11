"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { useCreateTimeEntry } from "@/lib/hooks/use-time-entries";

const createTimeEntrySchema = z.object({
  client_id: z.string().uuid("Select a client"),
  description: z.string().max(1000).optional(),
  duration_minutes: z.number().min(0).optional(),
  rate_cents: z.number().min(0).optional(),
  is_billable: z.boolean(),
  start_timer: z.boolean(),
});

type CreateTimeEntryForm = z.infer<typeof createTimeEntrySchema>;

export function CreateTimeEntryDialog({
  children,
  mode = "manual",
}: {
  children: React.ReactNode;
  mode?: "manual" | "timer";
}) {
  const [open, setOpen] = useState(false);
  const createEntry = useCreateTimeEntry();

  const form = useForm<CreateTimeEntryForm>({
    resolver: zodResolver(createTimeEntrySchema),
    defaultValues: {
      client_id: "",
      description: "",
      duration_minutes: 0,
      rate_cents: 0,
      is_billable: true,
      start_timer: mode === "timer",
    },
  });

  async function onSubmit(values: CreateTimeEntryForm) {
    try {
      await createEntry.mutateAsync({
        client_id: values.client_id,
        description: values.description || undefined,
        duration_minutes: values.start_timer ? undefined : values.duration_minutes,
        rate_cents: values.rate_cents || undefined,
        is_billable: values.is_billable,
        start_timer: values.start_timer,
      });
      toast.success(
        values.start_timer ? "Timer started" : "Time entry created"
      );
      form.reset();
      setOpen(false);
    } catch {
      toast.error("Failed to create time entry");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "timer" ? "Start Timer" : "Add Time Entry"}
          </DialogTitle>
          <DialogDescription>
            {mode === "timer"
              ? "Start tracking time for a client."
              : "Log a manual time entry."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <Input
                      placeholder="What are you working on?"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!form.watch("start_timer") && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="duration_minutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rate_cents"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rate (cents/hr)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <FormField
                control={form.control}
                name="is_billable"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Billable</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="start_timer"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Start Timer</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createEntry.isPending}>
                {createEntry.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {form.watch("start_timer") ? "Start Timer" : "Log Entry"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
