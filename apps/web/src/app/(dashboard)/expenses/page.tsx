"use client";

import { useState, useMemo } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Download,
  Calendar,
  Briefcase,
  Building2,
  Users,
  PieChart,
  Target,
  ArrowUpRight,
} from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface BudgetCategory {
  name: string;
  allocated: number;
  spent: number;
  items: { description: string; amount: number; date: string }[];
}

const BUDGET_DATA: BudgetCategory[] = [
  {
    name: "Job Board Postings",
    allocated: 25000,
    spent: 18500,
    items: [
      { description: "LinkedIn Premium Job Slots (Q1)", amount: 8000, date: "2026-01-15" },
      { description: "Indeed Sponsored Posts", amount: 5500, date: "2026-01-20" },
      { description: "Stack Overflow Jobs", amount: 3000, date: "2026-02-01" },
      { description: "AngelList Posting", amount: 2000, date: "2026-02-05" },
    ],
  },
  {
    name: "Recruiting Agency Fees",
    allocated: 60000,
    spent: 35000,
    items: [
      { description: "TechRecruit Inc. - Senior Engineer", amount: 20000, date: "2026-01-10" },
      { description: "DesignHire - Product Designer", amount: 15000, date: "2026-02-01" },
    ],
  },
  {
    name: "Employer Branding",
    allocated: 15000,
    spent: 8200,
    items: [
      { description: "Career page redesign", amount: 5000, date: "2026-01-05" },
      { description: "Employee testimonial videos", amount: 2200, date: "2026-01-25" },
      { description: "Glassdoor enhanced profile", amount: 1000, date: "2026-02-01" },
    ],
  },
  {
    name: "Tools & Software",
    allocated: 20000,
    spent: 14400,
    items: [
      { description: "Talent OS Platform (Annual)", amount: 9600, date: "2026-01-01" },
      { description: "Background check service", amount: 2400, date: "2026-01-01" },
      { description: "Video interview platform", amount: 2400, date: "2026-01-01" },
    ],
  },
  {
    name: "Events & Campus Recruiting",
    allocated: 30000,
    spent: 12000,
    items: [
      { description: "Tech Conference Booth - SXSW", amount: 8000, date: "2026-03-01" },
      { description: "University career fair - Stanford", amount: 2500, date: "2026-02-15" },
      { description: "Meetup sponsorship", amount: 1500, date: "2026-02-01" },
    ],
  },
  {
    name: "Relocation & Signing Bonuses",
    allocated: 50000,
    spent: 30000,
    items: [
      { description: "Signing bonus - Senior Engineer", amount: 15000, date: "2026-01-20" },
      { description: "Relocation package - Product Manager", amount: 10000, date: "2026-02-01" },
      { description: "Signing bonus - Data Scientist", amount: 5000, date: "2026-02-10" },
    ],
  },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function HiringBudgetPage() {
  const [period, setPeriod] = useState("q1_2026");

  const totalAllocated = BUDGET_DATA.reduce((sum, cat) => sum + cat.allocated, 0);
  const totalSpent = BUDGET_DATA.reduce((sum, cat) => sum + cat.spent, 0);
  const totalRemaining = totalAllocated - totalSpent;
  const utilizationPercent = Math.round((totalSpent / totalAllocated) * 100);

  const allExpenses = BUDGET_DATA.flatMap(cat =>
    cat.items.map(item => ({ ...item, category: cat.name }))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hiring Budget</h1>
          <p className="text-muted-foreground">
            Track recruiting spend, allocations, and cost-per-hire metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <Calendar className="mr-1.5 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="q1_2026">Q1 2026</SelectItem>
              <SelectItem value="q4_2025">Q4 2025</SelectItem>
              <SelectItem value="annual_2026">FY 2026</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="mr-1.5 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Budget</p>
              <p className="text-2xl font-bold">{formatCurrency(totalAllocated)}</p>
              <p className="mt-1 text-xs text-muted-foreground">Annual allocation</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Spent</p>
              <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
              <div className="mt-1 flex items-center gap-1 text-xs text-amber-600">
                <ArrowUpRight className="h-3 w-3" />
                {utilizationPercent}% utilized
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRemaining)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{100 - utilizationPercent}% available</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Cost per Hire</p>
              <p className="text-2xl font-bold">{formatCurrency(totalSpent / 89)}</p>
              <div className="mt-1 flex items-center gap-1 text-xs text-green-600">
                <TrendingDown className="h-3 w-3" />
                12% lower than last quarter
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Tabs defaultValue="breakdown" className="space-y-4">
        <TabsList>
          <TabsTrigger value="breakdown">Budget Breakdown</TabsTrigger>
          <TabsTrigger value="expenses">All Expenses</TabsTrigger>
        </TabsList>

        <TabsContent value="breakdown" className="space-y-4">
          {BUDGET_DATA.map((cat, idx) => {
            const percentUsed = Math.round((cat.spent / cat.allocated) * 100);
            const isOverBudget = cat.spent > cat.allocated;
            return (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{cat.name}</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant={isOverBudget ? "destructive" : percentUsed > 80 ? "secondary" : "outline"}>
                          {percentUsed}% used
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency(cat.spent)} / {formatCurrency(cat.allocated)}
                        </span>
                      </div>
                    </div>
                    <Progress
                      value={Math.min(percentUsed, 100)}
                      className={`h-2 ${isOverBudget ? "[&>div]:bg-destructive" : ""}`}
                    />

                    <div className="mt-3 space-y-1">
                      {cat.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{item.description}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground">{formatDate(item.date)}</span>
                            <span className="font-medium">{formatCurrency(item.amount)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </TabsContent>

        <TabsContent value="expenses">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allExpenses.map((expense, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{expense.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{expense.category}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(expense.date)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(expense.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
