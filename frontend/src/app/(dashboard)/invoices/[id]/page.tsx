"use client";

import { use } from "react";
import Link from "next/link";
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
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-4 w-48" />
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Skeleton className="h-8 w-56 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (isError || !invoice) {
    return (
      <div className="space-y-4">
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
      </div>
    );
  }

  const balanceDue = invoice.total_cents - invoice.amount_paid_cents;

  return (
    <div className="space-y-6 max-w-4xl">
      <Breadcrumbs
        items={[
          { label: "Invoices", href: "/invoices" },
          { label: invoice.invoice_number || `Invoice ${id.slice(0, 8)}` },
        ]}
      />
      <div className="flex items-center gap-4">
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
              className="text-destructive hover:text-destructive"
              disabled={deleteInvoice.isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </ConfirmDialog>
          {(invoice.status === "sent" || invoice.status === "viewed") && (
            <Button
              disabled={updateStatus.isPending}
              onClick={() => handleStatusChange("paid")}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Mark Paid
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground mb-1">Subtotal</p>
            <p className="text-lg font-bold">
              {formatCents(invoice.subtotal_cents)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground mb-1">Tax</p>
            <p className="text-lg font-bold">
              {formatCents(invoice.tax_cents)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground mb-1">Total</p>
            <p className="text-lg font-bold">
              {formatCents(invoice.total_cents)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground mb-1">Balance Due</p>
            <p
              className={`text-lg font-bold ${balanceDue > 0 ? "text-red-600" : "text-green-600"
                }`}
            >
              {formatCents(balanceDue)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invoice Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Invoice Number</p>
                <p className="font-medium">
                  {invoice.invoice_number || invoice.id.slice(0, 8)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Currency</p>
                <p className="font-medium uppercase">{invoice.currency}</p>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">Issued Date</p>
                  <p className="font-medium">
                    {invoice.issued_date
                      ? new Date(invoice.issued_date).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground text-xs">Due Date</p>
                  <p className="font-medium">
                    {invoice.due_date
                      ? new Date(invoice.due_date).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
              </div>
              {invoice.paid_date && (
                <div>
                  <p className="text-muted-foreground text-xs">Paid Date</p>
                  <p className="font-medium text-green-600">
                    {new Date(invoice.paid_date).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Amount Paid</p>
                <p className="font-medium">
                  {formatCents(invoice.amount_paid_cents)}
                </p>
              </div>
              {invoice.stripe_payment_intent_id && (
                <div>
                  <p className="text-muted-foreground text-xs">
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
                    <p className="text-muted-foreground text-xs mb-1">Notes</p>
                    <p className="whitespace-pre-wrap">{invoice.notes}</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Line Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">
            Line items will be displayed here once the backend returns them with
            the invoice detail endpoint.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
