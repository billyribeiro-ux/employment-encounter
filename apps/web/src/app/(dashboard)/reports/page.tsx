"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Users,
} from "lucide-react";
import { useProfitLoss, useCashFlow, useTeamUtilization } from "@/lib/hooks/use-reports";

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default function ReportsPage() {
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState("2026-12-31");

  const { data: pl, isLoading: plLoading } = useProfitLoss({ start_date: startDate, end_date: endDate });
  const { data: cashFlow, isLoading: cfLoading } = useCashFlow({ start_date: startDate, end_date: endDate });
  const { data: utilization, isLoading: utilLoading } = useTeamUtilization();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">Financial reports and team analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="space-y-1">
            <Label className="text-xs">From</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-40" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">To</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-40" />
          </div>
        </div>
      </div>

      <Tabs defaultValue="pl" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pl">Profit & Loss</TabsTrigger>
          <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
          <TabsTrigger value="utilization">Team Utilization</TabsTrigger>
        </TabsList>

        <TabsContent value="pl">
          {plLoading ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
              <Skeleton className="h-64" />
            </div>
          ) : pl ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-1">
                      <ArrowUpRight className="h-4 w-4 text-green-600" />
                      <span className="text-xs font-medium text-muted-foreground">Total Revenue</span>
                    </div>
                    <p className="text-2xl font-bold text-green-700">{formatCents(pl.revenue.total_cents)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-1">
                      <ArrowDownRight className="h-4 w-4 text-red-600" />
                      <span className="text-xs font-medium text-muted-foreground">Total Expenses</span>
                    </div>
                    <p className="text-2xl font-bold text-red-700">{formatCents(pl.expenses.total_cents)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-1">
                      {pl.net_income_cents >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                      <span className="text-xs font-medium text-muted-foreground">Net Income</span>
                    </div>
                    <p className={`text-2xl font-bold ${pl.net_income_cents >= 0 ? "text-green-700" : "text-red-700"}`}>
                      {formatCents(pl.net_income_cents)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> Revenue Breakdown</CardTitle></CardHeader>
                  <CardContent>
                    {pl.revenue.items.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">No revenue data for this period</p>
                    ) : (
                      <div className="space-y-3">
                        {pl.revenue.items.map((item, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-sm">{item.label}</span>
                            <span className="text-sm font-medium">{formatCents(item.amount_cents)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> Expense Breakdown</CardTitle></CardHeader>
                  <CardContent>
                    {pl.expenses.items.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">No expense data for this period</p>
                    ) : (
                      <div className="space-y-3">
                        {pl.expenses.items.map((item, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-sm">{item.label}</span>
                            <span className="text-sm font-medium text-red-600">{formatCents(item.amount_cents)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="cashflow">
          {cfLoading ? (
            <Skeleton className="h-64" />
          ) : cashFlow ? (
            <div className="space-y-6">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-medium text-muted-foreground">Net Cash Flow</span>
                  </div>
                  <p className={`text-2xl font-bold ${cashFlow.net_cash_flow_cents >= 0 ? "text-green-700" : "text-red-700"}`}>
                    {formatCents(cashFlow.net_cash_flow_cents)}
                  </p>
                </CardContent>
              </Card>
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle>Monthly Inflows</CardTitle></CardHeader>
                  <CardContent>
                    {cashFlow.inflows.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">No inflows for this period</p>
                    ) : (
                      <div className="space-y-2">
                        {cashFlow.inflows.map((entry, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-sm">{entry.month}</span>
                            <span className="text-sm font-medium text-green-600">{formatCents(entry.amount_cents)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Monthly Outflows</CardTitle></CardHeader>
                  <CardContent>
                    {cashFlow.outflows.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">No outflows for this period</p>
                    ) : (
                      <div className="space-y-2">
                        {cashFlow.outflows.map((entry, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-sm">{entry.month}</span>
                            <span className="text-sm font-medium text-red-600">{formatCents(entry.amount_cents)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : null}
        </TabsContent>

        <TabsContent value="utilization">
          {utilLoading ? (
            <Skeleton className="h-64" />
          ) : utilization && utilization.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" /> Team Utilization (Current Month)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {utilization.map((member) => (
                    <div key={member.user_id} className="flex items-center gap-4">
                      <div className="w-40 text-sm font-medium truncate">{member.name}</div>
                      <div className="flex-1">
                        <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${Math.min(member.utilization_percent, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-16 text-right">
                        <Badge variant={member.utilization_percent >= 70 ? "default" : "secondary"}>
                          {member.utilization_percent}%
                        </Badge>
                      </div>
                      <div className="w-32 text-right text-xs text-muted-foreground">
                        {(member.billable_minutes / 60).toFixed(1)}h / {(member.total_minutes / 60).toFixed(1)}h
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No time entries found for this month</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
