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
import { useCreateInvoice } from "@/lib/hooks/use-invoices";
import { useClients } from "@/lib/hooks/use-clients";

const lineItemSchema = z.object({
  description: z.string().min(1, "Description required"),
  quantity: z.number().min(0.01, "Must be > 0"),
  unit_price_cents: z.number().min(0, "Must be >= 0"),
});

const createInvoiceSchema = z.object({
  client_id: z.string().uuid("Select a client"),
  due_date: z.string().optional(),
  notes: z.string().optional(),
  line_items: z.array(lineItemSchema).min(1, "At least one line item required"),
});

type CreateInvoiceForm = z.infer<typeof createInvoiceSchema>;

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function CreateInvoiceDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const createInvoice = useCreateInvoice();
  const { data: clientsData } = useClients({ per_page: 100 });
  const clients = clientsData?.data ?? [];

  const form = useForm<CreateInvoiceForm>({
    resolver: zodResolver(createInvoiceSchema),
    defaultValues: {
      client_id: "",
      due_date: "",
      notes: "",
      line_items: [{ description: "", quantity: 1, unit_price_cents: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "line_items",
  });

  const watchedItems = form.watch("line_items");
  const subtotal = watchedItems.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.unit_price_cents || 0),
    0
  );

  async function onSubmit(values: CreateInvoiceForm) {
    try {
      await createInvoice.mutateAsync({
        client_id: values.client_id,
        due_date: values.due_date || undefined,
        notes: values.notes || undefined,
        line_items: values.line_items.map((li) => ({
          description: li.description,
          quantity: li.quantity,
          unit_price_cents: li.unit_price_cents,
        })),
      });
      toast.success("Invoice created successfully");
      form.reset();
      setOpen(false);
    } catch {
      toast.error("Failed to create invoice");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Invoice</DialogTitle>
          <DialogDescription>
            Create a new invoice with line items.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value)}
                      >
                        <option value="">Select a client</option>
                        {clients.map((c: { id: string; name: string }) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional notes for the client" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium">Line Items</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({ description: "", quantity: 1, unit_price_cents: 0 })
                  }
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5">
                      <FormField
                        control={form.control}
                        name={`line_items.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            {index === 0 && <FormLabel>Description</FormLabel>}
                            <FormControl>
                              <Input placeholder="Service description" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-2">
                      <FormField
                        control={form.control}
                        name={`line_items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            {index === 0 && <FormLabel>Qty</FormLabel>}
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-3">
                      <FormField
                        control={form.control}
                        name={`line_items.${index}.unit_price_cents`}
                        render={({ field }) => (
                          <FormItem>
                            {index === 0 && <FormLabel>Price (cents)</FormLabel>}
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="col-span-2 flex justify-end">
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-muted-foreground hover:text-destructive"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end mt-4 pt-3 border-t">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Subtotal</p>
                  <p className="text-lg font-bold">{formatCents(subtotal)}</p>
                </div>
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
              <Button type="submit" disabled={createInvoice.isPending}>
                {createInvoice.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Invoice
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
