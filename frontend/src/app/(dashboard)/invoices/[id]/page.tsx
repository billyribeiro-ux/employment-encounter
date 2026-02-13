"use client";

import { use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  CheckCircle2,
  Send,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useInvoice, useUpdateInvoiceStatus, useDeleteInvoice } from "@/lib/hooks/use-invoices";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function statusVariant(
  status: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "paid":
      return "default";
    case "sent":
    case "viewed":
      return "secondary";
    case "overdue":
      return "destructive";
    default:
      return "outline";
  }
}

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

export default function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: invoice, isLoading, isError } = useInvoice(id);
  const updateStatus = useUpdateInvoiceStatus();
  const deleteInvoice = useDeleteInvoice();

  const { data: lineItemsData, isLoading: lineItemsLoading } = useQuery({
    queryKey: ["invoice-line-items", id],
    queryFn: async () => {
      try {
        const { data } = await api.get(`/invoices/${id}/line-items`);
        return data?.data ?? data ?? [];
      } catch {
        return [];
      }
    },
    enabled: !!id,
  });

  const lineItems: { id: string; description: string; quantity: number; unit_price_cents: number; total_cents: number }[] = Array.isArray(lineItemsData) ? lineItemsData : lineItemsData?.data ?? [];

  async function handleStatusChange(newStatus: string) {
    try {
      await updateStatus.mutateAsync({ id, status: newStatus });
      toast.success(`Invoice marked as ${newStatus}`);
    } catch {
      toast.error("Failed to update invoice status");
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
            <Skeleton className="h-4 w-32 rounded-lg" />
          </div>
          <Skeleton className="h-9 w-20 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
        <Skeleton className="h-48 rounded-xl" />
      </motion.div>
    );
  }

  if (isError || !invoice) {
    return (
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
      >
        <Link href="/invoices">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Invoices
          </Button>
        </Link>
        <div className="text-center py-12">
          <p className="text-sm text-destructive">
            Invoice not found or failed to load.
          </p>
        </div>
      </motion.div>
    );
  }

  const balanceDue = invoice.total_cents - invoice.amount_paid_cents;

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
            { label: "Invoices", href: "/invoices" },
            { label: invoice.invoice_number || `Invoice ${id.slice(0, 8)}` },
          ]}
        />
      </motion.div>

      <motion.div variants={fadeUp} className="flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              Invoice {invoice.invoice_number || `#${invoice.id.slice(0, 8)}`}
            </h1>
            <Badge variant={statusVariant(invoice.status)}>
              {invoice.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Created {new Date(invoice.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          {invoice.status === "draft" && (
            <Button
              variant="outline"
              className="shadow-sm"
              disabled={updateStatus.isPending}
              onClick={() => handleStatusChange("sent")}
            >
              <Send className="mr-2 h-4 w-4" />
              Send
            </Button>
          )}
          <ConfirmDialog
            title="Delete invoice?"
            description={`This will permanently delete invoice "${invoice.invoice_number || invoice.id.slice(0, 8)}" and all line items.`}
            actionLabel="Delete"
            onConfirm={() => {
              deleteInvoice.mutate(invoice.id, {
                onSuccess: () => {
                  toast.success("Invoice deleted");
                  router.push("/invoices");
                },
                onError: () => toast.error("Failed to delete invoice"),
              });
            }}
          >
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive shadow-sm"
              disabled={deleteInvoice.isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </ConfirmDialog>
          {(invoice.status === "sent" || invoice.status === "viewed") && (
            <Button
              className="shadow-sm"
              disabled={updateStatus.isPending}
              onClick={() => handleStatusChange("paid")}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Mark Paid
            </Button>
          )}
        </div>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Subtotal", value: formatCents(invoice.subtotal_cents), color: "" },
          { label: "Tax", value: formatCents(invoice.tax_cents), color: "" },
          { label: "Total", value: formatCents(invoice.total_cents), color: "" },
          { label: "Balance Due", value: formatCents(balanceDue), color: balanceDue > 0 ? "text-red-600" : "text-green-600" },
        ].map((item, i) => (
          <motion.div key={item.label} variants={fadeUp} custom={i}>
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">{item.label}</p>
                <p className={`text-lg font-bold ${item.color}`}>
                  {item.value}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div variants={fadeUp}>
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Invoice Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-0.5">Invoice Number</p>
                  <p className="font-medium">
                    {invoice.invoice_number || invoice.id.slice(0, 8)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-0.5">Currency</p>
                  <p className="font-medium uppercase">{invoice.currency}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-0.5">Issued Date</p>
                    <p className="font-medium">
                      {invoice.issued_date
                        ? new Date(invoice.issued_date).toLocaleDateString()
                        : "\u2014"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-0.5">Due Date</p>
                    <p className="font-medium">
                      {invoice.due_date
                        ? new Date(invoice.due_date).toLocaleDateString()
                        : "\u2014"}
                    </p>
                  </div>
                </div>
                {invoice.paid_date && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-0.5">Paid Date</p>
                    <p className="font-medium text-green-600">
                      {new Date(invoice.paid_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Payment Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-0.5">Amount Paid</p>
                  <p className="font-medium">
                    {formatCents(invoice.amount_paid_cents)}
                  </p>
                </div>
                {invoice.stripe_payment_intent_id && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-0.5">
                      Stripe Payment Intent
                    </p>
                    <p className="font-mono text-xs">
                      {invoice.stripe_payment_intent_id}
                    </p>
                  </div>
                )}
                {invoice.notes && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Notes</p>
                      <p className="whitespace-pre-wrap">{invoice.notes}</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={fadeUp}>
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              Line Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lineItemsLoading ? (
              <div className="flex items-center justify-center py-6">
                <Skeleton className="h-4 w-48 rounded-lg" />
              </div>
            ) : lineItems.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Description</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Qty</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Unit Price</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item, i) => (
                      <motion.tr
                        key={item.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
                        className="border-b last:border-0 hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-4 py-3">{item.description}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{item.quantity}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{formatCents(item.unit_price_cents)}</td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums">{formatCents(item.total_cents)}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} className="px-4 pt-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Subtotal</td>
                      <td className="px-4 pt-3 text-right font-bold tabular-nums">{formatCents(invoice.subtotal_cents)}</td>
                    </tr>
                    {invoice.tax_cents > 0 && (
                      <tr>
                        <td colSpan={3} className="px-4 pt-1 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Tax</td>
                        <td className="px-4 pt-1 text-right font-bold tabular-nums">{formatCents(invoice.tax_cents)}</td>
                      </tr>
                    )}
                    <tr>
                      <td colSpan={3} className="px-4 pt-1 pb-3 text-right font-medium">Total</td>
                      <td className="px-4 pt-1 pb-3 text-right font-bold text-lg tabular-nums">{formatCents(invoice.total_cents)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6 space-y-2"
              >
                <div className="flex justify-center">
                  <div className="rounded-full bg-muted p-3">
                    <DollarSign className="h-6 w-6 text-muted-foreground" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  No line items available for this invoice.
                </p>
                <div className="rounded-lg border bg-muted/30 p-4 mt-3 max-w-md mx-auto">
                  <p className="text-xs text-muted-foreground">
                    <strong>Invoice Summary:</strong> Subtotal {formatCents(invoice.subtotal_cents)}
                    {invoice.tax_cents > 0 && <> + Tax {formatCents(invoice.tax_cents)}</>}
                    {" = "}<strong>{formatCents(invoice.total_cents)}</strong>
                  </p>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
