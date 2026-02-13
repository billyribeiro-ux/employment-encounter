"use client";

import { use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  FileText,
  Clock,
  Receipt,
  Edit,
  Shield,
  Trash2,
  DollarSign,
  MessageSquare,
  Activity,
  TrendingUp,
  AlertCircle,
  Send,
  Upload,
  CheckCircle2,
  UserPlus,
  Timer,
  Eye,
} from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClient, useDeleteClient, useClientTimeline } from "@/lib/hooks/use-clients";
import { useDocuments } from "@/lib/hooks/use-documents";
import { useTimeEntries } from "@/lib/hooks/use-time-entries";
import { useInvoices } from "@/lib/hooks/use-invoices";
import { useMessages } from "@/lib/hooks/use-messages";
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

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

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const timelineIcons: Record<string, { icon: typeof Activity; color: string; bg: string }> = {
  invoice_created: { icon: Receipt, color: "text-blue-600", bg: "bg-blue-500/10" },
  invoice_sent: { icon: Send, color: "text-indigo-600", bg: "bg-indigo-500/10" },
  invoice_paid: { icon: DollarSign, color: "text-green-600", bg: "bg-green-500/10" },
  document_uploaded: { icon: Upload, color: "text-amber-600", bg: "bg-amber-500/10" },
  document_viewed: { icon: Eye, color: "text-slate-600", bg: "bg-slate-500/10" },
  time_logged: { icon: Timer, color: "text-cyan-600", bg: "bg-cyan-500/10" },
  message_sent: { icon: MessageSquare, color: "text-purple-600", bg: "bg-purple-500/10" },
  client_created: { icon: UserPlus, color: "text-violet-600", bg: "bg-violet-500/10" },
  client_updated: { icon: Edit, color: "text-orange-600", bg: "bg-orange-500/10" },
  task_completed: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-500/10" },
  default: { icon: Activity, color: "text-muted-foreground", bg: "bg-muted" },
};

export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: client, isLoading, isError } = useClient(id);
  const deleteClient = useDeleteClient();
  const { data: docsData } = useDocuments({ client_id: id, per_page: 10 });
  const { data: timeData } = useTimeEntries({ client_id: id, per_page: 10 });
  const { data: invoiceData } = useInvoices({ client_id: id, per_page: 10 });
  const { data: messagesData } = useMessages(id, { per_page: 20 });
  const { data: timelineData } = useClientTimeline(id, { per_page: 15 });

  const documents = docsData?.data ?? [];
  const timeEntries = timeData?.data ?? [];
  const invoices = invoiceData?.data ?? [];
  const messages = messagesData?.data ?? [];
  const timeline = (timelineData as { data?: { id: string; type: string; title: string; body?: string; created_at: string }[] })?.data ?? [];

  // Compute stats
  const totalBilled = invoices.reduce((sum: number, inv: { total_cents: number }) => sum + inv.total_cents, 0);
  const totalPaid = invoices
    .filter((inv: { status: string }) => inv.status === "paid")
    .reduce((sum: number, inv: { total_cents: number }) => sum + inv.total_cents, 0);
  const outstanding = totalBilled - totalPaid;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-4 w-48" />
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Skeleton className="h-8 w-56 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>
        <div className="grid gap-4 md:grid-cols-5">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64" />
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
    <motion.div
      className="space-y-6"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={fadeUp}>
        <Breadcrumbs
          items={[
            { label: "Clients", href: "/clients" },
            { label: client.name },
          ]}
        />
      </motion.div>

      <motion.div variants={fadeUp} className="flex items-center gap-4">
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
        <div className="flex gap-2">
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <ConfirmDialog
            title="Delete client?"
            description={`This will permanently delete "${client.name}" and all associated data.`}
            actionLabel="Delete"
            onConfirm={() => {
              deleteClient.mutate(client.id, {
                onSuccess: () => {
                  toast.success("Client deleted");
                  router.push("/clients");
                },
                onError: () => toast.error("Failed to delete client"),
              });
            }}
          >
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              disabled={deleteClient.isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </ConfirmDialog>
        </div>
      </motion.div>

      {/* Quick Stat Cards */}
      <motion.div variants={fadeUp}>
        <div className="grid gap-4 md:grid-cols-5">
          <Card className="border-0 shadow-sm card-hover">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="rounded-lg p-1.5 bg-green-500/10">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">Total Billed</span>
              </div>
              <p className="text-2xl font-bold">{formatCents(totalBilled)}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm card-hover">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="rounded-lg p-1.5 bg-rose-500/10">
                  <AlertCircle className="h-4 w-4 text-rose-600" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">Outstanding</span>
              </div>
              <p className="text-2xl font-bold">{formatCents(outstanding)}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm card-hover">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="rounded-lg p-1.5 bg-blue-500/10">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">Documents</span>
              </div>
              <p className="text-2xl font-bold">{docsData?.meta?.total ?? 0}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm card-hover">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="rounded-lg p-1.5 bg-amber-500/10">
                  <Clock className="h-4 w-4 text-amber-600" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">Time Entries</span>
              </div>
              <p className="text-2xl font-bold">{timeData?.meta?.total ?? 0}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm card-hover">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="rounded-lg p-1.5 bg-violet-500/10">
                  <Receipt className="h-4 w-4 text-violet-600" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">Invoices</span>
              </div>
              <p className="text-2xl font-bold">{invoiceData?.meta?.total ?? 0}</p>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div variants={fadeUp}>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="overview">
              <Building2 className="mr-1.5 h-3.5 w-3.5" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="mr-1.5 h-3.5 w-3.5" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="invoices">
              <Receipt className="mr-1.5 h-3.5 w-3.5" />
              Invoices
            </TabsTrigger>
            <TabsTrigger value="time">
              <Clock className="mr-1.5 h-3.5 w-3.5" />
              Time
            </TabsTrigger>
            <TabsTrigger value="messages">
              <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
              Messages
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-0 shadow-sm">
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

                <Card className="border-0 shadow-sm">
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
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium">{client.engagement_score ?? "—"}</p>
                        </div>
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

              {/* Activity Timeline Sidebar */}
              <div>
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Activity Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {timeline.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="rounded-full bg-muted p-3 mb-3">
                          <Activity className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">No activity yet</p>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />
                        <div className="space-y-1">
                          {timeline.slice(0, 10).map((item: { id: string; type: string; title: string; body?: string; created_at: string }, idx: number) => {
                            const config = timelineIcons[item.type] || timelineIcons.default;
                            const IconComponent = config.icon;
                            return (
                              <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{
                                  delay: idx * 0.05,
                                  duration: 0.4,
                                  ease: [0.16, 1, 0.3, 1] as const,
                                }}
                                className="relative flex items-start gap-3 py-2 pl-1 group"
                              >
                                <div className={`relative z-10 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full ${config.bg} ring-2 ring-background transition-transform duration-200 group-hover:scale-110`}>
                                  <IconComponent className={`h-3.5 w-3.5 ${config.color}`} />
                                </div>
                                <div className="flex-1 min-w-0 pt-0.5">
                                  <p className="text-sm font-medium leading-tight truncate">
                                    {item.title}
                                  </p>
                                  {item.body && (
                                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                                      {item.body}
                                    </p>
                                  )}
                                  <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                                    {timeAgo(item.created_at)}
                                  </p>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="documents">
            <Card className="border-0 shadow-sm">
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
                            <td className="px-4 py-2 font-medium">{doc.filename}</td>
                            <td className="px-4 py-2 text-muted-foreground">
                              {doc.category || "—"}
                            </td>
                            <td className="px-4 py-2">
                              <Badge variant="secondary">{doc.verification_status}</Badge>
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

          <TabsContent value="invoices">
            <Card className="border-0 shadow-sm">
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

          <TabsContent value="time">
            <Card className="border-0 shadow-sm">
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

          <TabsContent value="messages">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">
                  Messages ({messagesData?.meta?.total ?? 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="rounded-full bg-muted p-3 mb-3">
                      <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">No messages yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Start a conversation with this client
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg: { id: string; content: string; is_internal: boolean; is_read: boolean; created_at: string; sender_id: string }, idx: number) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: idx * 0.04,
                          duration: 0.4,
                          ease: [0.16, 1, 0.3, 1] as const,
                        }}
                        className="rounded-lg border p-3 card-hover"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {msg.is_internal && (
                                <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-400">
                                  Internal
                                </Badge>
                              )}
                              {!msg.is_read && (
                                <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-700 dark:text-blue-400">
                                  Unread
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm">{msg.content}</p>
                          </div>
                          <p className="text-[10px] text-muted-foreground shrink-0">
                            {timeAgo(msg.created_at)}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
