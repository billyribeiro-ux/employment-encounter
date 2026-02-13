"use client";

import { useState } from "react";
import {
  Users,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Globe,
  Heart,
  Shield,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Info,
  Download,
  Calendar,
  Target,
  Eye,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs";
import { toast } from "sonner";

// Simulated diversity analytics data
const OVERVIEW_STATS = {
  totalApplicants: 1247,
  totalHires: 89,
  diversityScore: 72,
  diversityScoreChange: 5,
  genderParity: 0.85,
  ethnicDiversity: 0.68,
};

const GENDER_DATA = [
  { label: "Male", count: 524, percent: 42, color: "bg-blue-500" },
  { label: "Female", count: 561, percent: 45, color: "bg-pink-500" },
  { label: "Non-binary", count: 87, percent: 7, color: "bg-purple-500" },
  { label: "Prefer not to say", count: 75, percent: 6, color: "bg-gray-400" },
];

const ETHNICITY_DATA = [
  { label: "White", count: 412, percent: 33, color: "bg-blue-400" },
  { label: "Asian", count: 287, percent: 23, color: "bg-emerald-400" },
  { label: "Hispanic/Latino", count: 199, percent: 16, color: "bg-amber-400" },
  { label: "Black/African American", count: 187, percent: 15, color: "bg-violet-400" },
  { label: "Multi-racial", count: 87, percent: 7, color: "bg-rose-400" },
  { label: "Other/Prefer not to say", count: 75, percent: 6, color: "bg-gray-400" },
];

const PIPELINE_STAGES = [
  {
    stage: "applied", label: "Applied", total: 1247,
    groups: [
      { label: "Group A", count: 524, percent: 42, color: "bg-blue-500" },
      { label: "Group B", count: 561, percent: 45, color: "bg-pink-500" },
      { label: "Group C", count: 87, percent: 7, color: "bg-purple-500" },
      { label: "Other", count: 75, percent: 6, color: "bg-gray-400" },
    ],
  },
  {
    stage: "screened", label: "Screened", total: 687,
    groups: [
      { label: "Group A", count: 295, percent: 43, color: "bg-blue-500" },
      { label: "Group B", count: 296, percent: 43, color: "bg-pink-500" },
      { label: "Group C", count: 55, percent: 8, color: "bg-purple-500" },
      { label: "Other", count: 41, percent: 6, color: "bg-gray-400" },
    ],
  },
  {
    stage: "interview", label: "Interview", total: 312,
    groups: [
      { label: "Group A", count: 140, percent: 45, color: "bg-blue-500" },
      { label: "Group B", count: 128, percent: 41, color: "bg-pink-500" },
      { label: "Group C", count: 25, percent: 8, color: "bg-purple-500" },
      { label: "Other", count: 19, percent: 6, color: "bg-gray-400" },
    ],
  },
  {
    stage: "offer", label: "Offer", total: 112,
    groups: [
      { label: "Group A", count: 52, percent: 46, color: "bg-blue-500" },
      { label: "Group B", count: 45, percent: 40, color: "bg-pink-500" },
      { label: "Group C", count: 10, percent: 9, color: "bg-purple-500" },
      { label: "Other", count: 5, percent: 5, color: "bg-gray-400" },
    ],
  },
  {
    stage: "hired", label: "Hired", total: 89,
    groups: [
      { label: "Group A", count: 40, percent: 45, color: "bg-blue-500" },
      { label: "Group B", count: 37, percent: 42, color: "bg-pink-500" },
      { label: "Group C", count: 8, percent: 9, color: "bg-purple-500" },
      { label: "Other", count: 4, percent: 4, color: "bg-gray-400" },
    ],
  },
];

const DROP_OFF_ANALYSIS = [
  {
    from: "Applied", to: "Screened",
    overall: 45,
    groups: [
      { label: "Group A", dropOff: 44 },
      { label: "Group B", dropOff: 47 },
      { label: "Group C", dropOff: 37 },
      { label: "Other", dropOff: 45 },
    ],
  },
  {
    from: "Screened", to: "Interview",
    overall: 55,
    groups: [
      { label: "Group A", dropOff: 53 },
      { label: "Group B", dropOff: 57 },
      { label: "Group C", dropOff: 55 },
      { label: "Other", dropOff: 54 },
    ],
  },
  {
    from: "Interview", to: "Offer",
    overall: 64,
    groups: [
      { label: "Group A", dropOff: 63 },
      { label: "Group B", dropOff: 65 },
      { label: "Group C", dropOff: 60 },
      { label: "Other", dropOff: 74 },
    ],
  },
  {
    from: "Offer", to: "Hired",
    overall: 21,
    groups: [
      { label: "Group A", dropOff: 23 },
      { label: "Group B", dropOff: 18 },
      { label: "Group C", dropOff: 20 },
      { label: "Other", dropOff: 20 },
    ],
  },
];

const GOALS = [
  { id: "g1", metric: "Gender Parity Index", current: 85, target: 90, deadline: "Q2 2026", department: "All" },
  { id: "g2", metric: "Underrepresented Group Hires", current: 38, target: 45, deadline: "Q4 2026", department: "Engineering" },
  { id: "g3", metric: "Leadership Diversity", current: 28, target: 40, deadline: "Q1 2027", department: "All" },
  { id: "g4", metric: "Equal Pay Index", current: 92, target: 98, deadline: "Q3 2026", department: "All" },
];

const BIAS_ALERTS = [
  {
    id: "b1",
    severity: "high" as const,
    message: "Group B has a significantly higher drop-off rate at the Interview to Offer transition",
    stage: "Interview",
    detail: "Group B candidates are 5 percentage points more likely to be screened out at this stage. Review interview scoring calibration and consider blind evaluations.",
  },
  {
    id: "b2",
    severity: "medium" as const,
    message: "Other/Undisclosed group shows elevated drop-off at late pipeline stages",
    stage: "Offer",
    detail: "Candidates who did not disclose demographics show a 74% drop-off from Interview to Offer, significantly above the 64% average. Monitor for potential bias.",
  },
  {
    id: "b3",
    severity: "low" as const,
    message: "Group A representation slightly increases through pipeline (42% to 45%)",
    stage: "Full Pipeline",
    detail: "While within normal variance, Group A gains 3 percentage points of representation from application to hire. This is a common pattern but worth monitoring.",
  },
];

const DEPARTMENT_DATA = [
  { name: "Engineering", score: 68, trend: "up" as const, hires: 34, diverseHires: 21 },
  { name: "Design", score: 78, trend: "up" as const, hires: 12, diverseHires: 9 },
  { name: "Marketing", score: 82, trend: "stable" as const, hires: 15, diverseHires: 12 },
  { name: "Sales", score: 61, trend: "down" as const, hires: 18, diverseHires: 10 },
  { name: "Operations", score: 74, trend: "up" as const, hires: 10, diverseHires: 7 },
];

const INDUSTRY_BENCHMARKS = [
  { label: "Gender Parity", company: 85, industry: 72 },
  { label: "Ethnic Diversity", company: 68, industry: 62 },
  { label: "Age Distribution", company: 74, industry: 65 },
  { label: "Leadership Diversity", company: 28, industry: 24 },
];

function severityColor(severity: string) {
  switch (severity) {
    case "high": return "border-red-200 bg-red-50";
    case "medium": return "border-amber-200 bg-amber-50";
    case "low": return "border-blue-200 bg-blue-50";
    default: return "";
  }
}

function severityBadge(severity: string) {
  switch (severity) {
    case "high": return <Badge className="text-[10px] bg-red-100 text-red-700 hover:bg-red-100">High</Badge>;
    case "medium": return <Badge className="text-[10px] bg-amber-100 text-amber-700 hover:bg-amber-100">Medium</Badge>;
    case "low": return <Badge className="text-[10px] bg-blue-100 text-blue-700 hover:bg-blue-100">Low</Badge>;
    default: return null;
  }
}

function TrendIcon({ trend }: { trend: "up" | "down" | "stable" }) {
  if (trend === "up") return <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />;
  if (trend === "down") return <ArrowDownRight className="h-3.5 w-3.5 text-red-600" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
}

export default function DiversityDashboardPage() {
  const [dateRange, setDateRange] = useState("90d");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Hiring", href: "/hiring" },
          { label: "Diversity & Inclusion" },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Heart className="h-6 w-6 text-pink-600" />
            Diversity & Inclusion Dashboard
          </h1>
          <p className="text-muted-foreground">
            Track diversity metrics, pipeline equity, and inclusion goals
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="engineering">Engineering</SelectItem>
              <SelectItem value="design">Design</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
              <SelectItem value="sales">Sales</SelectItem>
              <SelectItem value="operations">Operations</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="180d">Last 6 months</SelectItem>
              <SelectItem value="365d">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => toast.success("Report export started")}
          >
            <Download className="mr-1.5 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Compliance Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">
                Data Privacy & Compliance
              </p>
              <p className="text-xs text-blue-700 mt-0.5">
                All diversity data is self-reported and collected with candidate consent.
                Data is aggregated and anonymized to prevent individual identification.
                This dashboard uses sample/placeholder data for demonstration purposes.
                In production, demographic data collection requires legal compliance review
                specific to your jurisdiction (EEOC, GDPR, etc.).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Heart className="h-4 w-4 text-pink-600" />
              <span className="text-xs font-medium text-muted-foreground">
                Diversity Score
              </span>
            </div>
            <p className="text-2xl font-bold">{OVERVIEW_STATS.diversityScore}/100</p>
            <p className="text-xs text-emerald-600 mt-0.5 flex items-center gap-0.5">
              <ArrowUpRight className="h-3 w-3" />
              +{OVERVIEW_STATS.diversityScoreChange} from last quarter
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-muted-foreground">
                Gender Parity
              </span>
            </div>
            <p className="text-2xl font-bold">{Math.round(OVERVIEW_STATS.genderParity * 100)}%</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Balanced representation index
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <Globe className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-medium text-muted-foreground">
                Ethnic Diversity
              </span>
            </div>
            <p className="text-2xl font-bold">{Math.round(OVERVIEW_STATS.ethnicDiversity * 100)}%</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Representation index
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-medium text-muted-foreground">
                Bias Alerts
              </span>
            </div>
            <p className="text-2xl font-bold">{BIAS_ALERTS.length}</p>
            <p className="text-xs text-amber-600 mt-0.5">
              {BIAS_ALERTS.filter((a) => a.severity === "high").length} high severity
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="demographics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline Equity</TabsTrigger>
          <TabsTrigger value="dropoff">Drop-off Analysis</TabsTrigger>
          <TabsTrigger value="goals">Goals & Targets</TabsTrigger>
          <TabsTrigger value="bias">Bias Alerts</TabsTrigger>
          <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
        </TabsList>

        {/* Demographics */}
        <TabsContent value="demographics" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Gender Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex h-6 w-full overflow-hidden rounded-full">
                  {GENDER_DATA.map((item) => (
                    <div
                      key={item.label}
                      className={`${item.color} transition-all duration-500 relative`}
                      style={{ width: `${item.percent}%` }}
                      title={`${item.label}: ${item.count} (${item.percent}%)`}
                    >
                      {item.percent >= 10 && (
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-white">
                          {item.percent}%
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {GENDER_DATA.map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${item.color}`} />
                      <span className="text-xs">{item.label}</span>
                      <span className="ml-auto text-xs font-medium">{item.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Ethnicity Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {ETHNICITY_DATA.map((item) => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <div className="flex items-center gap-2">
                          <div className={`h-3 w-3 rounded-full ${item.color}`} />
                          <span className="text-xs">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold">{item.percent}%</span>
                          <span className="text-[10px] text-muted-foreground">({item.count})</span>
                        </div>
                      </div>
                      <div className="h-3 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.color} transition-all duration-500`}
                          style={{ width: `${item.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Department Diversity Scores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {DEPARTMENT_DATA.map((dept) => (
                    <div key={dept.name} className="rounded-lg border p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold">{dept.name}</h4>
                        <div className="flex items-center gap-1">
                          <TrendIcon trend={dept.trend} />
                          <Badge
                            variant={
                              dept.score >= 75 ? "default" : dept.score >= 60 ? "secondary" : "destructive"
                            }
                            className="text-[10px]"
                          >
                            {dept.score}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between text-muted-foreground">
                          <span>Total Hires</span>
                          <span className="font-medium">{dept.hires}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                          <span>Diverse Hires</span>
                          <span className="font-medium">
                            {dept.diverseHires} ({Math.round((dept.diverseHires / dept.hires) * 100)}%)
                          </span>
                        </div>
                      </div>
                      <Progress value={dept.score} className="mt-2 h-1.5" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Pipeline Equity */}
        <TabsContent value="pipeline">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowRight className="h-4 w-4" />
                Pipeline Representation by Stage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {PIPELINE_STAGES.map((stage) => (
                  <div key={stage.stage}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="font-medium">{stage.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {stage.total} candidates
                      </span>
                    </div>
                    <div className="flex h-6 rounded-full overflow-hidden">
                      {stage.groups.map((group) => (
                        <div
                          key={group.label}
                          className={`${group.color} transition-all duration-500 relative`}
                          style={{ width: `${group.percent}%` }}
                          title={`${group.label}: ${group.percent}% (${group.count})`}
                        >
                          {group.percent >= 10 && (
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-white">
                              {group.percent}%
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {/* Legend */}
                <div className="flex items-center gap-4 pt-2 flex-wrap">
                  {PIPELINE_STAGES[0].groups.map((g) => (
                    <div key={g.label} className="flex items-center gap-1.5">
                      <div className={`h-2.5 w-2.5 rounded-full ${g.color}`} />
                      <span className="text-[10px] text-muted-foreground">{g.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="my-6" />

              <div className="rounded-lg bg-muted/50 p-4">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Pipeline Analysis</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Diversity representation remains relatively consistent across all pipeline
                      stages (42-45% for Group A, 40-45% for Group B). The slight shifts are
                      within normal variance. Monitor for emerging patterns over longer periods.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Drop-off Analysis */}
        <TabsContent value="dropoff">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Drop-off Analysis by Demographic Group
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-4">
                Higher drop-off rates indicate where candidates leave the pipeline.
                Red highlighting indicates a group drops off more than average; green indicates less.
              </p>
              <div className="space-y-6">
                {DROP_OFF_ANALYSIS.map((transition) => (
                  <div key={`${transition.from}-${transition.to}`}>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="font-medium">
                        {transition.from} → {transition.to}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Average drop-off: {transition.overall}%
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {transition.groups.map((g) => {
                        const aboveAvg = g.dropOff > transition.overall + 3;
                        const belowAvg = g.dropOff < transition.overall - 3;
                        return (
                          <div
                            key={g.label}
                            className={`rounded-md border p-3 text-center ${
                              aboveAvg
                                ? "border-red-200 bg-red-50"
                                : belowAvg
                                ? "border-emerald-200 bg-emerald-50"
                                : ""
                            }`}
                          >
                            <p className="text-[10px] text-muted-foreground">{g.label}</p>
                            <p
                              className={`text-lg font-bold ${
                                aboveAvg ? "text-red-600" : belowAvg ? "text-emerald-600" : ""
                              }`}
                            >
                              {g.dropOff}%
                            </p>
                            {aboveAvg && (
                              <p className="text-[10px] text-red-500">Above avg</p>
                            )}
                            {belowAvg && (
                              <p className="text-[10px] text-emerald-500">Below avg</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Goals & Targets */}
        <TabsContent value="goals">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4" />
                D&I Goals Tracker
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {GOALS.map((goal) => {
                  const pct = Math.round((goal.current / goal.target) * 100);
                  const isMet = goal.current >= goal.target;
                  const isOnTrack = pct >= 80;
                  return (
                    <div key={goal.id}>
                      <div className="flex items-start justify-between mb-1.5">
                        <div>
                          <p className="text-sm font-medium">{goal.metric}</p>
                          <p className="text-[10px] text-muted-foreground">
                            Target: {goal.target}% by {goal.deadline}
                            {goal.department !== "All" && ` (${goal.department})`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {isMet ? (
                            <Badge className="text-[10px] bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                              <CheckCircle2 className="mr-0.5 h-2.5 w-2.5" /> Met
                            </Badge>
                          ) : isOnTrack ? (
                            <Badge className="text-[10px] bg-blue-100 text-blue-700 hover:bg-blue-100">
                              On Track
                            </Badge>
                          ) : (
                            <Badge className="text-[10px] bg-amber-100 text-amber-700 hover:bg-amber-100">
                              Needs Attention
                            </Badge>
                          )}
                          <span className="text-sm font-bold">{goal.current}%</span>
                        </div>
                      </div>
                      <div className="relative">
                        <Progress value={goal.current} className="h-3" />
                        <div
                          className="absolute top-0 h-3 w-0.5 bg-foreground/60"
                          style={{ left: `${goal.target}%` }}
                        />
                      </div>
                      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                        <span>0%</span>
                        <span>Current: {goal.current}% / Target: {goal.target}%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Separator className="my-4" />

              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => toast.success("Goal editor opened")}
              >
                <Target className="mr-1 h-3 w-3" />
                Set New Goal
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bias Alerts */}
        <TabsContent value="bias">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Automated alerts flagged when rejection rates or drop-off patterns differ
              significantly across demographic groups.
            </p>
            {BIAS_ALERTS.map((alert) => (
              <Card key={alert.id} className={severityColor(alert.severity)}>
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle
                      className={`h-5 w-5 shrink-0 mt-0.5 ${
                        alert.severity === "high"
                          ? "text-red-500"
                          : alert.severity === "medium"
                          ? "text-amber-500"
                          : "text-blue-500"
                      }`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {severityBadge(alert.severity)}
                        <Badge variant="outline" className="text-[10px]">
                          {alert.stage}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {alert.detail}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[10px] shrink-0"
                      onClick={() => toast.success("Investigation started")}
                    >
                      <Eye className="mr-1 h-3 w-3" />
                      Investigate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Benchmarks */}
        <TabsContent value="benchmarks">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Representation vs Industry Benchmarks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {INDUSTRY_BENCHMARKS.map((item) => {
                  const diff = item.company - item.industry;
                  return (
                    <div key={item.label}>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="font-medium">{item.label}</span>
                        <div className="flex items-center gap-2">
                          {diff > 0 ? (
                            <span className="text-xs text-emerald-600 flex items-center gap-0.5">
                              <TrendingUp className="h-3 w-3" /> +{diff}pp above
                            </span>
                          ) : diff < 0 ? (
                            <span className="text-xs text-red-500 flex items-center gap-0.5">
                              <TrendingDown className="h-3 w-3" /> {diff}pp below
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              At benchmark
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-1">
                            Your Company
                          </p>
                          <div className="h-4 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all duration-500"
                              style={{ width: `${item.company}%` }}
                            />
                          </div>
                          <p className="text-xs font-medium mt-0.5">{item.company}%</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-1">
                            Industry Average
                          </p>
                          <div className="h-4 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-slate-400 transition-all duration-500"
                              style={{ width: `${item.industry}%` }}
                            />
                          </div>
                          <p className="text-xs font-medium mt-0.5">{item.industry}%</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
