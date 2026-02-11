"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Building2,
  FileText,
  Clock,
  Receipt,
  Edit,
  Shield,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClient } from "@/lib/hooks/use-clients";
import { useDocuments } from "@/lib/hooks/use-documents";
import { useTimeEntries } from "@/lib/hooks/use-time-entries";
import { useInvoices } from "@/lib/hooks/use-invoices";
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs";

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: client, isLoading, isError } = useClient(id);
  const { data: docsData } = useDocuments({ client_id: id, per_page: 10 });
  const { data: timeData } = useTimeEntries({ client_id: id, per_page: 10 });
  const { data: invoiceData } = useInvoices({ client_id: id, per_page: 10 });

  const documents = docsData?.data ?? [];
  const timeEntries = timeData?.data ?? [];
  const invoices = invoiceData?.data ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !client) {
    return (
      <div className="space-y-4">
        <Link href="/clients">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clients
          </Button>
        </Link>
        <div className="text-center py-12">
          <p className="text-sm text-destructive">
            Client not found or failed to load.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Clients", href: "/clients" },
          { label: client.name },
        ]}
      />
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{client.name}</h1>
            <Badge variant={client.status === "active" ? "default" : "secondary"}>
              {client.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {client.business_type}
          </p>
        </div>
        <Button variant="outline">
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-muted-foreground">Documents</span>
            </div>
            <p className="text-2xl font-bold">{docsData?.meta?.total ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-medium text-muted-foreground">Time Entries</span>
            </div>
            <p className="text-2xl font-bold">{timeData?.meta?.total ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Receipt className="h-4 w-4 text-green-600" />
              <span className="text-xs font-medium text-muted-foreground">Invoices</span>
            </div>
            <p className="text-2xl font-bold">{invoiceData?.meta?.total ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="h-4 w-4 text-violet-600" />
              <span className="text-xs font-medium text-muted-foreground">Fiscal Year</span>
            </div>
            <p className="text-2xl font-bold">{client.fiscal_year_end || "—"}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="time">Time</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Business Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Business Type</p>
                    <p className="font-medium">{client.business_type || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Fiscal Year End</p>
                    <p className="font-medium">{client.fiscal_year_end || "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Tax ID (last 4)</p>
                    <p className="font-medium">
                      {client.tax_id_last4 ? `***-**-${client.tax_id_last4}` : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Status</p>
                    <p className="font-medium capitalize">{client.status}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Risk & Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Risk Score</p>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{client.risk_score ?? "—"}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Engagement Score</p>
                    <p className="font-medium">{client.engagement_score ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Created</p>
                    <p className="font-medium">
                      {new Date(client.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Last Updated</p>
                    <p className="font-medium">
                      {new Date(client.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Documents ({docsData?.meta?.total ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  No documents for this client yet.
                </p>
              ) : (
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-2 text-left font-medium">Name</th>
                        <th className="px-4 py-2 text-left font-medium">Category</th>
                        <th className="px-4 py-2 text-left font-medium">Status</th>
                        <th className="px-4 py-2 text-left font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((doc) => (
                        <tr key={doc.id} className="border-b last:border-0">
                          <td className="px-4 py-2 font-medium">{doc.name}</td>
                          <td className="px-4 py-2 text-muted-foreground">
                            {doc.ai_category || doc.category || "—"}
                          </td>
                          <td className="px-4 py-2">
                            <Badge variant="secondary">{doc.status}</Badge>
                          </td>
                          <td className="px-4 py-2 text-muted-foreground">
                            {new Date(doc.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="time">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Time Entries ({timeData?.meta?.total ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {timeEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  No time entries for this client yet.
                </p>
              ) : (
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-2 text-left font-medium">Description</th>
                        <th className="px-4 py-2 text-left font-medium">Duration</th>
                        <th className="px-4 py-2 text-left font-medium">Billable</th>
                        <th className="px-4 py-2 text-left font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {timeEntries.map((entry) => (
                        <tr key={entry.id} className="border-b last:border-0">
                          <td className="px-4 py-2">{entry.description || "—"}</td>
                          <td className="px-4 py-2 font-medium">
                            {entry.duration_minutes
                              ? formatDuration(entry.duration_minutes)
                              : "Running..."}
                          </td>
                          <td className="px-4 py-2">
                            <Badge variant={entry.is_billable ? "default" : "outline"}>
                              {entry.is_billable ? "Billable" : "Non-billable"}
                            </Badge>
                          </td>
                          <td className="px-4 py-2 text-muted-foreground">
                            {new Date(entry.date).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Invoices ({invoiceData?.meta?.total ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  No invoices for this client yet.
                </p>
              ) : (
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-2 text-left font-medium">Invoice #</th>
                        <th className="px-4 py-2 text-left font-medium">Amount</th>
                        <th className="px-4 py-2 text-left font-medium">Status</th>
                        <th className="px-4 py-2 text-left font-medium">Due Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="border-b last:border-0">
                          <td className="px-4 py-2 font-medium">
                            {inv.invoice_number || inv.id.slice(0, 8)}
                          </td>
                          <td className="px-4 py-2 font-medium">
                            {formatCents(inv.total_cents)}
                          </td>
                          <td className="px-4 py-2">
                            <Badge
                              variant={
                                inv.status === "paid"
                                  ? "default"
                                  : inv.status === "overdue"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {inv.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-2 text-muted-foreground">
                            {inv.due_date
                              ? new Date(inv.due_date).toLocaleDateString()
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
