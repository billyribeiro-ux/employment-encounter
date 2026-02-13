"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

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
  const [activeTab, setActiveTab] = useState("pl");

  const { data: pl, isLoading: plLoading } = useProfitLoss({ start_date: startDate, end_date: endDate });
  const { data: cashFlow, isLoading: cfLoading } = useCashFlow({ start_date: startDate, end_date: endDate });
  const { data: utilization, isLoading: utilLoading } = useTeamUtilization();

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={fadeUp} className="flex items-center justify-between">
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
      </motion.div>

      <motion.div variants={fadeUp}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="pl">Profit & Loss</TabsTrigger>
            <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
            <TabsTrigger value="utilization">Team Utilization</TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
            >
              <TabsContent value="pl" forceMount={activeTab === "pl" ? true : undefined} className={activeTab !== "pl" ? "hidden" : ""}>
                {plLoading ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
                    <Skeleton className="h-64" />
                  </div>
                ) : pl ? (
                  <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
                    <motion.div variants={stagger} initial="hidden" animate="visible" className="grid gap-4 md:grid-cols-3">
                      <motion.div variants={fadeUp}>
                        <Card className="border-0 shadow-sm">
                          <CardContent className="pt-4">
                            <div className="flex items-center gap-2 mb-1">
                              <ArrowUpRight className="h-4 w-4 text-green-600" />
                              <span className="text-xs font-medium text-muted-foreground">Total Revenue</span>
                            </div>
                            <p className="text-2xl font-bold text-green-700">{formatCents(pl.revenue.total_cents)}</p>
                          </CardContent>
                        </Card>
                      </motion.div>
                      <motion.div variants={fadeUp}>
                        <Card className="border-0 shadow-sm">
                          <CardContent className="pt-4">
                            <div className="flex items-center gap-2 mb-1">
                              <ArrowDownRight className="h-4 w-4 text-red-600" />
                              <span className="text-xs font-medium text-muted-foreground">Total Expenses</span>
                            </div>
                            <p className="text-2xl font-bold text-red-700">{formatCents(pl.expenses.total_cents)}</p>
                          </CardContent>
                        </Card>
                      </motion.div>
                      <motion.div variants={fadeUp}>
                        <Card className="border-0 shadow-sm">
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
                      </motion.div>
                    </motion.div>

                    <motion.div variants={fadeUp} className="grid gap-6 lg:grid-cols-2">
                      <Card className="border-0 shadow-sm">
                        <CardHeader><CardTitle className="flex items-center gap-2 text-base font-semibold"><DollarSign className="h-4 w-4" /> Revenue Breakdown</CardTitle></CardHeader>
                        <CardContent>
                          {pl.revenue.items.length === 0 ? (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                              <p className="text-sm text-muted-foreground py-4 text-center">No revenue data for this period</p>
                            </motion.div>
                          ) : (
                            <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-3">
                              {pl.revenue.items.map((item, i) => (
                                <motion.div key={i} variants={fadeUp} className="flex items-center justify-between">
                                  <span className="text-sm">{item.label}</span>
                                  <span className="text-sm font-medium">{formatCents(item.amount_cents)}</span>
                                </motion.div>
                              ))}
                            </motion.div>
                          )}
                        </CardContent>
                      </Card>
                      <Card className="border-0 shadow-sm">
                        <CardHeader><CardTitle className="flex items-center gap-2 text-base font-semibold"><DollarSign className="h-4 w-4" /> Expense Breakdown</CardTitle></CardHeader>
                        <CardContent>
                          {pl.expenses.items.length === 0 ? (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                              <p className="text-sm text-muted-foreground py-4 text-center">No expense data for this period</p>
                            </motion.div>
                          ) : (
                            <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-3">
                              {pl.expenses.items.map((item, i) => (
                                <motion.div key={i} variants={fadeUp} className="flex items-center justify-between">
                                  <span className="text-sm">{item.label}</span>
                                  <span className="text-sm font-medium text-red-600">{formatCents(item.amount_cents)}</span>
                                </motion.div>
                              ))}
                            </motion.div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  </motion.div>
                ) : null}
              </TabsContent>

              <TabsContent value="cashflow" forceMount={activeTab === "cashflow" ? true : undefined} className={activeTab !== "cashflow" ? "hidden" : ""}>
                {cfLoading ? (
                  <Skeleton className="h-64" />
                ) : cashFlow ? (
                  <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">
                    <motion.div variants={fadeUp}>
                      <Card className="border-0 shadow-sm">
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
                    </motion.div>
                    <motion.div variants={fadeUp} className="grid gap-6 lg:grid-cols-2">
                      <Card className="border-0 shadow-sm">
                        <CardHeader><CardTitle className="text-base font-semibold">Monthly Inflows</CardTitle></CardHeader>
                        <CardContent>
                          {cashFlow.inflows.length === 0 ? (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                              <p className="text-sm text-muted-foreground py-4 text-center">No inflows for this period</p>
                            </motion.div>
                          ) : (
                            <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-2">
                              {cashFlow.inflows.map((entry, i) => (
                                <motion.div key={i} variants={fadeUp} className="flex items-center justify-between">
                                  <span className="text-sm">{entry.month}</span>
                                  <span className="text-sm font-medium text-green-600">{formatCents(entry.amount_cents)}</span>
                                </motion.div>
                              ))}
                            </motion.div>
                          )}
                        </CardContent>
                      </Card>
                      <Card className="border-0 shadow-sm">
                        <CardHeader><CardTitle className="text-base font-semibold">Monthly Outflows</CardTitle></CardHeader>
                        <CardContent>
                          {cashFlow.outflows.length === 0 ? (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                              <p className="text-sm text-muted-foreground py-4 text-center">No outflows for this period</p>
                            </motion.div>
                          ) : (
                            <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-2">
                              {cashFlow.outflows.map((entry, i) => (
                                <motion.div key={i} variants={fadeUp} className="flex items-center justify-between">
                                  <span className="text-sm">{entry.month}</span>
                                  <span className="text-sm font-medium text-red-600">{formatCents(entry.amount_cents)}</span>
                                </motion.div>
                              ))}
                            </motion.div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  </motion.div>
                ) : null}
              </TabsContent>

              <TabsContent value="utilization" forceMount={activeTab === "utilization" ? true : undefined} className={activeTab !== "utilization" ? "hidden" : ""}>
                {utilLoading ? (
                  <Skeleton className="h-64" />
                ) : utilization && utilization.length > 0 ? (
                  <motion.div variants={fadeUp} initial="hidden" animate="visible">
                    <Card className="border-0 shadow-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                          <Users className="h-4 w-4" /> Team Utilization (Current Month)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {utilization.map((member, i) => (
                            <div key={member.user_id} className="flex items-center gap-4">
                              <div className="w-40 text-sm font-medium truncate">{member.name}</div>
                              <div className="flex-1">
                                <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                                  <motion.div
                                    className="h-full rounded-full bg-primary"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(member.utilization_percent, 100)}%` }}
                                    transition={{ delay: 0.3 + i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
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
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                    <Card className="border-0 shadow-sm">
                      <CardContent className="py-12 text-center">
                        <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No time entries found for this month</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
