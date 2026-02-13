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
import { useCreateExpense } from "@/lib/hooks/use-expenses";

const schema = z.object({
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  amount_cents: z.number().min(1, "Amount must be > 0"),
  date: z.string().min(1, "Date is required"),
  client_id: z.string().optional(),
  is_reimbursable: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export function CreateExpenseDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const createExpense = useCreateExpense();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: "",
      description: "",
      amount_cents: 0,
      date: new Date().toISOString().split("T")[0],
      client_id: "",
      is_reimbursable: false,
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      await createExpense.mutateAsync({
        category: values.category,
        description: values.description || undefined,
        amount_cents: values.amount_cents,
        date: values.date,
        client_id: values.client_id || undefined,
        is_reimbursable: values.is_reimbursable,
      });
      toast.success("Expense recorded");
      form.reset();
      setOpen(false);
    } catch {
      toast.error("Failed to create expense");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Expense</DialogTitle>
          <DialogDescription>
            Log a firm or client expense.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        {...field}
                      >
                        <option value="">Select...</option>
                        <option value="Software">Software</option>
                        <option value="Office Supplies">Office Supplies</option>
                        <option value="Travel">Travel</option>
                        <option value="Meals">Meals</option>
                        <option value="Professional Development">Professional Development</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Insurance">Insurance</option>
                        <option value="Other">Other</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
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
              name="amount_cents"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (cents)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      placeholder="e.g. 5000 for $50.00"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
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
                    <Input placeholder="What was this expense for?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="client_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client ID (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Client UUID if billable to client" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_reimbursable"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4 rounded border-input"
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">Reimbursable</FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createExpense.isPending}>
                {createExpense.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Plus className="mr-2 h-4 w-4" />
                Record Expense
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
