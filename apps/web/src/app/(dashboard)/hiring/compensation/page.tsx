"use client";

import { useState, useMemo } from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  MapPin,
  Briefcase,
  Building2,
  Award,
  Search,
  Download,
  Calculator,
  ChevronRight,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Info,
  Gem,
  PiggyBank,
  Heart,
  Gift,
  Globe,
  Filter,
  Layers,
  Target,
  Banknote,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ─── Types ──────────────────────────────────────────────────

interface SalaryData {
  id: string;
  title: string;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  yourOffer: number;
  sampleSize: number;
  yoyChange: number;
}

interface TrendPoint {
  year: string;
  p50: number;
  p75: number;
}

interface CostOfLiving {
  location: string;
  index: number; // 100 = national avg
  adjustedSalary?: number;
}

// ─── Simulated Market Data ─────────────────────────────────

const ROLES: SalaryData[] = [
  { id: "r1", title: "Software Engineer", p25: 120000, p50: 145000, p75: 175000, p90: 210000, yourOffer: 155000, sampleSize: 12480, yoyChange: 4.2 },
  { id: "r2", title: "Senior Software Engineer", p25: 155000, p50: 185000, p75: 220000, p90: 265000, yourOffer: 195000, sampleSize: 8920, yoyChange: 5.1 },
  { id: "r3", title: "Staff Engineer", p25: 200000, p50: 245000, p75: 290000, p90: 340000, yourOffer: 250000, sampleSize: 3210, yoyChange: 6.3 },
  { id: "r4", title: "Frontend Developer", p25: 105000, p50: 130000, p75: 160000, p90: 195000, yourOffer: 140000, sampleSize: 9340, yoyChange: 3.8 },
  { id: "r5", title: "Backend Developer", p25: 115000, p50: 140000, p75: 170000, p90: 205000, yourOffer: 150000, sampleSize: 8760, yoyChange: 4.5 },
  { id: "r6", title: "Data Engineer", p25: 125000, p50: 155000, p75: 190000, p90: 230000, yourOffer: 160000, sampleSize: 5430, yoyChange: 7.2 },
  { id: "r7", title: "Product Manager", p25: 130000, p50: 160000, p75: 195000, p90: 240000, yourOffer: 165000, sampleSize: 6870, yoyChange: 3.1 },
  { id: "r8", title: "Engineering Manager", p25: 170000, p50: 210000, p75: 255000, p90: 310000, yourOffer: 215000, sampleSize: 4120, yoyChange: 4.8 },
  { id: "r9", title: "DevOps Engineer", p25: 120000, p50: 150000, p75: 180000, p90: 215000, yourOffer: 155000, sampleSize: 5890, yoyChange: 5.6 },
  { id: "r10", title: "UX Designer", p25: 95000, p50: 120000, p75: 150000, p90: 185000, yourOffer: 125000, sampleSize: 7210, yoyChange: 2.9 },
  { id: "r11", title: "Data Scientist", p25: 130000, p50: 160000, p75: 195000, p90: 240000, yourOffer: 170000, sampleSize: 4560, yoyChange: 6.1 },
  { id: "r12", title: "Customer Support Manager", p25: 65000, p50: 82000, p75: 100000, p90: 120000, yourOffer: 85000, sampleSize: 3890, yoyChange: 2.4 },
];

const TREND_DATA: Record<string, TrendPoint[]> = {
  "Software Engineer": [
    { year: "2021", p50: 125000, p75: 155000 },
    { year: "2022", p50: 132000, p75: 162000 },
    { year: "2023", p50: 135000, p75: 165000 },
    { year: "2024", p50: 139000, p75: 170000 },
    { year: "2025", p50: 145000, p75: 175000 },
  ],
  "Senior Software Engineer": [
    { year: "2021", p50: 158000, p75: 195000 },
    { year: "2022", p50: 165000, p75: 205000 },
    { year: "2023", p50: 172000, p75: 210000 },
    { year: "2024", p50: 178000, p75: 215000 },
    { year: "2025", p50: 185000, p75: 220000 },
  ],
  "Data Engineer": [
    { year: "2021", p50: 120000, p75: 152000 },
    { year: "2022", p50: 130000, p75: 165000 },
    { year: "2023", p50: 140000, p75: 175000 },
    { year: "2024", p50: 148000, p75: 183000 },
    { year: "2025", p50: 155000, p75: 190000 },
  ],
  "Product Manager": [
    { year: "2021", p50: 140000, p75: 175000 },
    { year: "2022", p50: 148000, p75: 182000 },
    { year: "2023", p50: 152000, p75: 188000 },
    { year: "2024", p50: 156000, p75: 192000 },
    { year: "2025", p50: 160000, p75: 195000 },
  ],
};

const LOCATIONS: CostOfLiving[] = [
  { location: "San Francisco, CA", index: 180 },
  { location: "New York, NY", index: 165 },
  { location: "Seattle, WA", index: 150 },
  { location: "Austin, TX", index: 110 },
  { location: "Denver, CO", index: 115 },
  { location: "Chicago, IL", index: 105 },
  { location: "Atlanta, GA", index: 100 },
  { location: "Portland, OR", index: 120 },
  { location: "Remote (National Avg)", index: 100 },
  { location: "Raleigh, NC", index: 95 },
];

const EXPERIENCE_MULTIPLIERS: Record<string, number> = {
  "0-2 years": 0.82,
  "2-5 years": 0.95,
  "5-8 years": 1.0,
  "8-12 years": 1.12,
  "12+ years": 1.25,
};

const COMPANY_SIZES = [
  "Startup (1-50)",
  "Small (51-200)",
  "Medium (201-1000)",
  "Large (1001-5000)",
  "Enterprise (5000+)",
];

const INDUSTRIES = [
  "Technology",
  "Finance",
  "Healthcare",
  "E-Commerce",
  "SaaS",
  "AI/ML",
  "Gaming",
  "Consulting",
];

// ─── Utility ──────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function positionLabel(yourOffer: number, p50: number) {
  const ratio = yourOffer / p50;
  if (ratio >= 1.1) return { label: "Above Market", color: "text-emerald-600", bg: "bg-emerald-100" };
  if (ratio >= 0.95) return { label: "Competitive", color: "text-blue-600", bg: "bg-blue-100" };
  if (ratio >= 0.85) return { label: "Below Market", color: "text-amber-600", bg: "bg-amber-100" };
  return { label: "Significantly Below", color: "text-red-600", bg: "bg-red-100" };
}

// ─── Components ──────────────────────────────────────────────

function PercentileBar({
  role,
  maxSalary,
  index,
}: {
  role: SalaryData;
  maxSalary: number;
  index: number;
}) {
  const pos = positionLabel(role.yourOffer, role.p50);
  const left25 = (role.p25 / maxSalary) * 100;
  const left50 = (role.p50 / maxSalary) * 100;
  const left75 = (role.p75 / maxSalary) * 100;
  const left90 = (role.p90 / maxSalary) * 100;
  const leftOffer = (role.yourOffer / maxSalary) * 100;
  const barStart = left25;
  const barWidth = left90 - left25;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="space-y-2"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{role.title}</span>
          <Badge className={`${pos.bg} ${pos.color} text-[10px]`} variant="outline">
            {pos.label}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{role.sampleSize.toLocaleString()} samples</span>
          <span
            className={`flex items-center gap-0.5 font-medium ${
              role.yoyChange > 0 ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {role.yoyChange > 0 ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {role.yoyChange}% YoY
          </span>
        </div>
      </div>

      {/* Salary range visualization */}
      <div className="relative h-8">
        {/* Background track */}
        <div className="absolute inset-y-0 left-0 right-0 flex items-center">
          <div className="h-2 w-full rounded-full bg-muted" />
        </div>

        {/* Range bar (p25 to p90) */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 h-3 rounded-full bg-gradient-to-r from-blue-200 via-blue-400 to-blue-600"
          initial={{ width: 0, left: `${barStart}%` }}
          animate={{ width: `${barWidth}%`, left: `${barStart}%` }}
          transition={{ duration: 0.8, delay: index * 0.05 + 0.2 }}
        />

        {/* Percentile markers */}
        {[
          { pct: left25, label: "P25", val: role.p25 },
          { pct: left50, label: "P50", val: role.p50 },
          { pct: left75, label: "P75", val: role.p75 },
          { pct: left90, label: "P90", val: role.p90 },
        ].map((m) => (
          <div
            key={m.label}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
            style={{ left: `${m.pct}%` }}
          >
            <div className="h-4 w-0.5 bg-blue-800/40 rounded-full" />
          </div>
        ))}

        {/* Your offer marker */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
          style={{ left: `${leftOffer}%` }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: index * 0.05 + 0.6 }}
        >
          <div className="relative">
            <div className="h-6 w-1 bg-emerald-500 rounded-full shadow-md" />
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded">
                You
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Labels */}
      <div className="flex justify-between text-[10px] text-muted-foreground px-1">
        <span>{fmt(role.p25)}</span>
        <span>{fmt(role.p50)} (median)</span>
        <span>{fmt(role.p75)}</span>
        <span>{fmt(role.p90)}</span>
      </div>
    </motion.div>
  );
}

function TrendChart({
  title,
  data,
}: {
  title: string;
  data: TrendPoint[];
}) {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data.map((d) => d.p75));
  const minVal = Math.min(...data.map((d) => d.p50)) * 0.9;
  const range = maxVal - minVal;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-blue-600" />
          {title} - Salary Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative h-40">
          {/* Y-axis grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
            const val = minVal + range * (1 - pct);
            return (
              <div
                key={pct}
                className="absolute left-0 right-0 flex items-center"
                style={{ top: `${pct * 100}%` }}
              >
                <span className="text-[9px] text-muted-foreground w-14 text-right pr-2 shrink-0">
                  {fmt(val)}
                </span>
                <div className="flex-1 border-t border-dashed border-muted" />
              </div>
            );
          })}

          {/* Bars */}
          <div className="absolute left-16 right-0 bottom-0 top-0 flex items-end gap-3 px-2">
            {data.map((d, i) => {
              const h50 = ((d.p50 - minVal) / range) * 100;
              const h75 = ((d.p75 - minVal) / range) * 100;
              return (
                <div
                  key={d.year}
                  className="flex-1 flex flex-col items-center gap-0.5"
                >
                  <div className="relative w-full flex justify-center gap-1" style={{ height: "140px" }}>
                    <motion.div
                      className="w-5 bg-blue-400 rounded-t-sm self-end"
                      initial={{ height: 0 }}
                      animate={{ height: `${h50}%` }}
                      transition={{ duration: 0.5, delay: i * 0.1 }}
                    />
                    <motion.div
                      className="w-5 bg-blue-600 rounded-t-sm self-end"
                      initial={{ height: 0 }}
                      animate={{ height: `${h75}%` }}
                      transition={{ duration: 0.5, delay: i * 0.1 + 0.1 }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1">
                    {d.year}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-4 mt-3 justify-center">
          <div className="flex items-center gap-1.5 text-xs">
            <div className="h-2.5 w-2.5 rounded-sm bg-blue-400" />
            <span className="text-muted-foreground">P50 (Median)</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <div className="h-2.5 w-2.5 rounded-sm bg-blue-600" />
            <span className="text-muted-foreground">P75</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SalaryCalculator() {
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [experience, setExperience] = useState("");
  const [skillsPremium, setSkillsPremium] = useState(0);

  const roleData = ROLES.find((r) => r.title === role);
  const locData = LOCATIONS.find((l) => l.location === location);
  const expMultiplier = EXPERIENCE_MULTIPLIERS[experience] ?? 1.0;

  const calculated = useMemo(() => {
    if (!roleData || !locData) return null;
    const base = roleData.p50;
    const locAdjusted = base * (locData.index / 100);
    const expAdjusted = locAdjusted * expMultiplier;
    const final = expAdjusted * (1 + skillsPremium / 100);
    return {
      base,
      locAdjusted: Math.round(locAdjusted),
      expAdjusted: Math.round(expAdjusted),
      final: Math.round(final),
      bonus: Math.round(final * 0.15),
      equity: Math.round(final * 0.2),
      benefits: 18500,
      total: Math.round(final + final * 0.15 + final * 0.2 + 18500),
    };
  }, [roleData, locData, expMultiplier, skillsPremium]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="grid gap-2">
          <Label>Role</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r.id} value={r.title}>
                  {r.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Location</Label>
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger>
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              {LOCATIONS.map((l) => (
                <SelectItem key={l.location} value={l.location}>
                  {l.location} ({l.index}%)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Experience</Label>
          <Select value={experience} onValueChange={setExperience}>
            <SelectTrigger>
              <SelectValue placeholder="Select experience" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(EXPERIENCE_MULTIPLIERS).map((exp) => (
                <SelectItem key={exp} value={exp}>
                  {exp}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Skills Premium (%)</Label>
          <Input
            type="number"
            value={skillsPremium}
            onChange={(e) => setSkillsPremium(Number(e.target.value))}
            min={-20}
            max={40}
            placeholder="0"
          />
        </div>
      </div>

      <AnimatePresence>
        {calculated && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="space-y-4"
          >
            {/* Adjustment breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-blue-600" />
                  Salary Calculation Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    {
                      label: "Market Median (P50)",
                      value: calculated.base,
                      icon: BarChart3,
                      desc: `Base rate for ${role}`,
                    },
                    {
                      label: "Location Adjusted",
                      value: calculated.locAdjusted,
                      icon: MapPin,
                      desc: `${location} (${locData?.index}% CoL index)`,
                    },
                    {
                      label: "Experience Adjusted",
                      value: calculated.expAdjusted,
                      icon: Briefcase,
                      desc: `${experience} (${expMultiplier}x multiplier)`,
                    },
                    {
                      label: "Skills Premium Applied",
                      value: calculated.final,
                      icon: Award,
                      desc: `${skillsPremium >= 0 ? "+" : ""}${skillsPremium}% premium`,
                    },
                  ].map((step, i) => (
                    <motion.div
                      key={step.label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-3 rounded-lg border p-3"
                    >
                      <step.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{step.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {step.desc}
                        </p>
                      </div>
                      <span className="font-bold text-sm">{fmt(step.value)}</span>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Total Comp Breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Layers className="h-4 w-4 text-emerald-600" />
                  Total Compensation Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-4 mb-4">
                  {[
                    { label: "Base Salary", value: calculated.final, icon: Banknote, color: "text-blue-600" },
                    { label: "Annual Bonus (15%)", value: calculated.bonus, icon: Gift, color: "text-amber-600" },
                    { label: "Equity/RSU (20%)", value: calculated.equity, icon: Gem, color: "text-violet-600" },
                    { label: "Benefits Value", value: calculated.benefits, icon: Heart, color: "text-pink-600" },
                  ].map((comp, i) => (
                    <motion.div
                      key={comp.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                    >
                      <Card>
                        <CardContent className="pt-3 pb-3">
                          <div className="flex items-center gap-1.5 mb-1">
                            <comp.icon className={`h-3.5 w-3.5 ${comp.color}`} />
                            <span className="text-[11px] text-muted-foreground">
                              {comp.label}
                            </span>
                          </div>
                          <p className="text-lg font-bold">{fmt(comp.value)}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
                <Separator className="mb-3" />
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total Compensation</span>
                  <motion.span
                    className="text-2xl font-bold text-emerald-600"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    {fmt(calculated.total)}
                  </motion.span>
                </div>

                {/* Visual composition bar */}
                <div className="mt-4">
                  <div className="h-4 rounded-full overflow-hidden flex">
                    <motion.div
                      className="bg-blue-500"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(calculated.final / calculated.total) * 100}%`,
                      }}
                      transition={{ duration: 0.6 }}
                    />
                    <motion.div
                      className="bg-amber-500"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(calculated.bonus / calculated.total) * 100}%`,
                      }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                    />
                    <motion.div
                      className="bg-violet-500"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(calculated.equity / calculated.total) * 100}%`,
                      }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                    />
                    <motion.div
                      className="bg-pink-500"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(calculated.benefits / calculated.total) * 100}%`,
                      }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                    />
                  </div>
                  <div className="flex gap-4 mt-2 flex-wrap">
                    {[
                      { label: "Base", color: "bg-blue-500", pct: Math.round((calculated.final / calculated.total) * 100) },
                      { label: "Bonus", color: "bg-amber-500", pct: Math.round((calculated.bonus / calculated.total) * 100) },
                      { label: "Equity", color: "bg-violet-500", pct: Math.round((calculated.equity / calculated.total) * 100) },
                      { label: "Benefits", color: "bg-pink-500", pct: Math.round((calculated.benefits / calculated.total) * 100) },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-1.5 text-xs">
                        <div className={`h-2.5 w-2.5 rounded-sm ${item.color}`} />
                        <span className="text-muted-foreground">
                          {item.label} ({item.pct}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Equity Valuation Helper */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Gem className="h-4 w-4 text-violet-600" />
                  Equity / Stock Option Valuation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border p-3 space-y-1">
                    <p className="text-xs text-muted-foreground">Annual RSU Grant</p>
                    <p className="text-lg font-bold">{fmt(calculated.equity)}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Based on 20% of base salary
                    </p>
                  </div>
                  <div className="rounded-lg border p-3 space-y-1">
                    <p className="text-xs text-muted-foreground">4-Year Vest Value</p>
                    <p className="text-lg font-bold">{fmt(calculated.equity * 4)}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Standard 4-year vesting schedule
                    </p>
                  </div>
                  <div className="rounded-lg border p-3 space-y-1">
                    <p className="text-xs text-muted-foreground">
                      With 25% Growth Scenario
                    </p>
                    <p className="text-lg font-bold text-emerald-600">
                      {fmt(Math.round(calculated.equity * 4 * 1.25))}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Projected value with stock appreciation
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {!calculated && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Calculator className="h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="text-lg font-semibold mb-1">Configure your parameters</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Select a role, location, and experience level above to calculate a
            competitive compensation package.
          </p>
        </div>
      )}
    </div>
  );
}

function CompanyComparison() {
  const aboveMarket = ROLES.filter((r) => r.yourOffer >= r.p50).length;
  const belowMarket = ROLES.filter((r) => r.yourOffer < r.p50).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-medium text-muted-foreground">
                  Above Market
                </span>
              </div>
              <p className="text-2xl font-bold text-emerald-600">{aboveMarket}</p>
              <p className="text-xs text-muted-foreground">
                roles at or above median
              </p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-xs font-medium text-muted-foreground">
                  Below Market
                </span>
              </div>
              <p className="text-2xl font-bold text-red-600">{belowMarket}</p>
              <p className="text-xs text-muted-foreground">
                roles below median
              </p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
        >
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-medium text-muted-foreground">
                  Avg Market Position
                </span>
              </div>
              <p className="text-2xl font-bold">
                {Math.round(
                  (ROLES.reduce((s, r) => s + r.yourOffer / r.p50, 0) /
                    ROLES.length) *
                    100
                )}
                %
              </p>
              <p className="text-xs text-muted-foreground">of market median</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Your Offers vs Market Rates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Your Offer</TableHead>
                  <TableHead>Market P50</TableHead>
                  <TableHead>Market P75</TableHead>
                  <TableHead>Difference</TableHead>
                  <TableHead>Position</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ROLES.map((r, idx) => {
                  const diff = r.yourOffer - r.p50;
                  const diffPct = Math.round((diff / r.p50) * 100);
                  const pos = positionLabel(r.yourOffer, r.p50);
                  return (
                    <motion.tr
                      key={r.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.03 }}
                      className="border-b last:border-0 hover:bg-muted/30"
                    >
                      <TableCell className="font-medium">{r.title}</TableCell>
                      <TableCell className="font-semibold">
                        {fmt(r.yourOffer)}
                      </TableCell>
                      <TableCell>{fmt(r.p50)}</TableCell>
                      <TableCell>{fmt(r.p75)}</TableCell>
                      <TableCell>
                        <span
                          className={`flex items-center gap-1 text-sm font-medium ${
                            diff >= 0 ? "text-emerald-600" : "text-red-600"
                          }`}
                        >
                          {diff >= 0 ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3" />
                          )}
                          {fmt(Math.abs(diff))} ({diffPct > 0 ? "+" : ""}
                          {diffPct}%)
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${pos.bg} ${pos.color} text-[10px]`}
                          variant="outline"
                        >
                          {pos.label}
                        </Badge>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────

export default function CompensationPage() {
  const [activeTab, setActiveTab] = useState("benchmarks");
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [experienceFilter, setExperienceFilter] = useState("all");
  const [selectedTrend, setSelectedTrend] = useState<string>("Software Engineer");

  const maxSalary = Math.max(...ROLES.map((r) => r.p90)) * 1.05;

  const filteredRoles = useMemo(() => {
    return ROLES.filter((r) => {
      if (
        searchQuery &&
        !r.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      return true;
    });
  }, [searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Compensation Benchmarking
          </h1>
          <p className="text-muted-foreground">
            Salary data, market comparison, and compensation planning tools
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            toast.success("Compensation report exported", {
              description:
                "Your compensation benchmarking report has been downloaded.",
            });
          }}
        >
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </motion.div>

      {/* Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          {
            label: "Roles Tracked",
            value: ROLES.length,
            icon: Briefcase,
            color: "text-blue-600",
          },
          {
            label: "Avg Market Salary",
            value: fmt(
              Math.round(ROLES.reduce((s, r) => s + r.p50, 0) / ROLES.length)
            ),
            icon: DollarSign,
            color: "text-emerald-600",
          },
          {
            label: "Your Avg Offer",
            value: fmt(
              Math.round(
                ROLES.reduce((s, r) => s + r.yourOffer, 0) / ROLES.length
              )
            ),
            icon: Banknote,
            color: "text-violet-600",
          },
          {
            label: "Avg YoY Change",
            value: `+${(ROLES.reduce((s, r) => s + r.yoyChange, 0) / ROLES.length).toFixed(1)}%`,
            icon: TrendingUp,
            color: "text-amber-600",
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
          >
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  <span className="text-xs font-medium text-muted-foreground">
                    {stat.label}
                  </span>
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="benchmarks">
            <BarChart3 className="h-4 w-4 mr-2" />
            Market Benchmarks
          </TabsTrigger>
          <TabsTrigger value="calculator">
            <Calculator className="h-4 w-4 mr-2" />
            Salary Calculator
          </TabsTrigger>
          <TabsTrigger value="comparison">
            <Target className="h-4 w-4 mr-2" />
            Your vs Market
          </TabsTrigger>
          <TabsTrigger value="trends">
            <TrendingUp className="h-4 w-4 mr-2" />
            Trends
          </TabsTrigger>
        </TabsList>

        {/* ─── Benchmarks Tab ─── */}
        <TabsContent value="benchmarks" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search roles..."
                className="pl-9"
              />
            </div>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Salary Ranges by Role
                <Badge variant="secondary" className="text-xs ml-2">
                  {filteredRoles.length} roles
                </Badge>
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                P25 to P90 salary ranges with your company&apos;s offers marked in green
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {filteredRoles.map((role, index) => (
                  <PercentileBar
                    key={role.id}
                    role={role}
                    maxSalary={maxSalary}
                    index={index}
                  />
                ))}
              </div>
              {filteredRoles.length === 0 && (
                <div className="flex flex-col items-center py-8 text-center">
                  <Search className="h-8 w-8 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No roles match your search.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-600" />
                Compensation Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {ROLES.filter((r) => r.yourOffer < r.p50).map((r) => {
                  const gap = r.p50 - r.yourOffer;
                  return (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50/50 p-3"
                    >
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {r.title} is {fmt(gap)} below market median
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Consider increasing to at least {fmt(r.p50)} to remain
                          competitive. Current offer percentile: P
                          {Math.round(
                            ((r.yourOffer - r.p25) / (r.p75 - r.p25)) * 50 + 25
                          )}
                          .
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
                {ROLES.filter((r) => r.yourOffer < r.p50).length === 0 && (
                  <div className="flex items-center gap-2 text-sm text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                    All roles are at or above market median. Great job!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Calculator Tab ─── */}
        <TabsContent value="calculator">
          <SalaryCalculator />
        </TabsContent>

        {/* ─── Comparison Tab ─── */}
        <TabsContent value="comparison">
          <CompanyComparison />
        </TabsContent>

        {/* ─── Trends Tab ─── */}
        <TabsContent value="trends" className="space-y-4">
          <div className="flex items-center gap-3">
            <Label className="text-sm">Select Role:</Label>
            <Select value={selectedTrend} onValueChange={setSelectedTrend}>
              <SelectTrigger className="w-[250px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(TREND_DATA).map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {TREND_DATA[selectedTrend] && (
            <TrendChart
              title={selectedTrend}
              data={TREND_DATA[selectedTrend]}
            />
          )}

          {/* YoY Change Summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Year-over-Year Salary Changes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[...ROLES]
                  .sort((a, b) => b.yoyChange - a.yoyChange)
                  .map((r, i) => (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-3 rounded-lg border p-3"
                    >
                      <span className="text-xs text-muted-foreground font-mono w-5">
                        #{i + 1}
                      </span>
                      <span className="flex-1 text-sm font-medium">
                        {r.title}
                      </span>
                      <div className="w-32">
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${
                              r.yoyChange >= 5
                                ? "bg-emerald-500"
                                : r.yoyChange >= 3
                                ? "bg-blue-500"
                                : "bg-amber-500"
                            }`}
                            initial={{ width: 0 }}
                            animate={{
                              width: `${(r.yoyChange / 8) * 100}%`,
                            }}
                            transition={{ duration: 0.6, delay: i * 0.04 }}
                          />
                        </div>
                      </div>
                      <span
                        className={`text-sm font-semibold w-16 text-right ${
                          r.yoyChange >= 5
                            ? "text-emerald-600"
                            : r.yoyChange >= 3
                            ? "text-blue-600"
                            : "text-amber-600"
                        }`}
                      >
                        +{r.yoyChange}%
                      </span>
                    </motion.div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
