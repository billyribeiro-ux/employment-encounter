"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileSignature,
  Plus,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Calendar,
  User,
  MoreHorizontal,
  Eye,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface Offer {
  id: string;
  application_id: string;
  job_id: string;
  candidate_id: string;
  status: string;
  title: string;
  base_salary_cents: number | null;
  salary_currency: string;
  equity_pct: number | null;
  signing_bonus_cents: number | null;
  start_date: string | null;
  expiry_date: string | null;
  benefits_summary: string | null;
  custom_terms: string | null;
  sent_at: string | null;
  viewed_at: string | null;
  accepted_at: string | null;
  declined_at: string | null;
  decline_reason: string | null;
  candidate_name?: string;
  job_title?: string;
  created_at: string;
  updated_at: string;
}

function useOffers(params?: { status?: string }) {
  return useQuery({
    queryKey: ["offers", params],
    queryFn: async () => {
      const { data } = await api.get<{ data: Offer[]; meta: object }>("/offers", { params });
      return data;
    },
  });
}

function useSendOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<Offer>(`/offers/${id}/send`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers"] });
    },
  });
}

function formatCents(cents: number | null): string {
  if (!cents) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function statusVariant(status: string) {
  switch (status) {
    case "accepted":
      return "default" as const;
    case "sent":
      return "secondary" as const;
    case "declined":
      return "destructive" as const;
    case "expired":
      return "outline" as const;
    case "draft":
      return "outline" as const;
    default:
      return "secondary" as const;
  }
}

function statusIcon(status: string) {
  switch (status) {
    case "accepted":
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case "sent":
      return <Send className="h-4 w-4 text-blue-500" />;
    case "declined":
      return <XCircle className="h-4 w-4 text-destructive" />;
    case "draft":
      return <Clock className="h-4 w-4 text-muted-foreground" />;
    default:
      return <FileSignature className="h-4 w-4 text-muted-foreground" />;
  }
}

export default function OffersPage() {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const { data: offersData, isLoading } = useOffers(
    tab !== "all" ? { status: tab } : undefined
  );
  const sendOffer = useSendOffer();

  const offers = offersData?.data ?? [];
  const filtered = search
    ? offers.filter(
        (o) =>
          o.title.toLowerCase().includes(search.toLowerCase()) ||
          o.candidate_name?.toLowerCase().includes(search.toLowerCase()) ||
          o.job_title?.toLowerCase().includes(search.toLowerCase())
      )
    : offers;

  const stats = {
    total: offers.length,
    draft: offers.filter((o) => o.status === "draft").length,
    sent: offers.filter((o) => o.status === "sent").length,
    accepted: offers.filter((o) => o.status === "accepted").length,
    declined: offers.filter((o) => o.status === "declined").length,
  };

  function handleSend(id: string) {
    sendOffer.mutate(id, {
      onSuccess: () => toast.success("Offer sent successfully"),
      onError: () => toast.error("Failed to send offer"),
    });
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Hiring", href: "/hiring" }, { label: "Offers" }]} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Offer Management</h1>
          <p className="text-muted-foreground">
            Create, track, and manage candidate offers
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Offers</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileSignature className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{stats.sent}</p>
              </div>
              <Send className="h-8 w-8 text-blue-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Accepted</p>
                <p className="text-2xl font-bold">{stats.accepted}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Declined</p>
                <p className="text-2xl font-bold">{stats.declined}</p>
              </div>
              <XCircle className="h-8 w-8 text-destructive/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search + Tabs */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search offers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
          <TabsTrigger value="declined">Declined</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <Skeleton className="h-8 w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center text-center">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <FileSignature className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1">No offers yet</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Create offers from the candidate evaluation page when you
                    find the right fit.
                  </p>
                  <Link href="/hiring/evaluate">
                    <Button className="mt-4" variant="outline">
                      Go to Evaluation Center
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((offer) => (
                <Card key={offer.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted shrink-0">
                        {statusIcon(offer.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold truncate">
                            {offer.title}
                          </p>
                          <Badge variant={statusVariant(offer.status)} className="text-[10px]">
                            {offer.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          {offer.candidate_name && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {offer.candidate_name}
                            </span>
                          )}
                          {offer.base_salary_cents && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {formatCents(offer.base_salary_cents)}
                            </span>
                          )}
                          {offer.start_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Start: {new Date(offer.start_date).toLocaleDateString()}
                            </span>
                          )}
                          {offer.expiry_date && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Expires: {new Date(offer.expiry_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {offer.status === "draft" && (
                          <Button
                            size="sm"
                            onClick={() => handleSend(offer.id)}
                            disabled={sendOffer.isPending}
                          >
                            <Send className="mr-1 h-3 w-3" />
                            Send
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {offer.status === "draft" && (
                              <DropdownMenuItem onClick={() => handleSend(offer.id)}>
                                <Send className="mr-2 h-4 w-4" />
                                Send Offer
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
