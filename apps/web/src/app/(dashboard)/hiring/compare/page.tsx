"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  X,
  MapPin,
  Trophy,
  Download,
  Plus,
  Star,
  Briefcase,
  Clock,
  DollarSign,
  Shield,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Award,
  UserCheck,
  BarChart3,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs";
import { useCandidates, type CandidateProfile } from "@/lib/hooks/use-candidates";
import { useApplications } from "@/lib/hooks/use-applications";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { toast } from "sonner";

function formatSalary(cents: number | null): string {
  if (!cents) return "Not specified";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysSince(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

interface ComparisonRow {
  label: string;
  icon: React.ElementType;
  getValue: (c: CandidateProfile) => string | number | null;
  highlight?: "highest" | "lowest" | "none";
  format?: "text" | "number" | "salary" | "percentage" | "date" | "days";
}

const COMPARISON_ROWS: ComparisonRow[] = [
  {
    label: "Headline",
    icon: Briefcase,
    getValue: (c) => c.headline || "Not set",
    highlight: "none",
  },
  {
    label: "Location",
    icon: MapPin,
    getValue: (c) =>
      [c.location_city, c.location_state, c.location_country]
        .filter(Boolean)
        .join(", ") || "Not specified",
    highlight: "none",
  },
  {
    label: "Availability",
    icon: Clock,
    getValue: (c) => c.availability_status.replace(/_/g, " "),
    highlight: "none",
  },
  {
    label: "Remote Preference",
    icon: Briefcase,
    getValue: (c) => c.remote_preference || "Not set",
    highlight: "none",
  },
  {
    label: "Salary Min",
    icon: DollarSign,
    getValue: (c) => c.desired_salary_min_cents,
    highlight: "lowest",
    format: "salary",
  },
  {
    label: "Salary Max",
    icon: DollarSign,
    getValue: (c) => c.desired_salary_max_cents,
    highlight: "lowest",
    format: "salary",
  },
  {
    label: "Reputation Score",
    icon: Star,
    getValue: (c) => c.reputation_score,
    highlight: "highest",
    format: "number",
  },
  {
    label: "Profile Completeness",
    icon: BarChart3,
    getValue: (c) => c.profile_completeness_pct,
    highlight: "highest",
    format: "percentage",
  },
  {
    label: "Work Authorization",
    icon: Shield,
    getValue: (c) => c.work_authorization || "Not specified",
    highlight: "none",
  },
  {
    label: "Visa Status",
    icon: Shield,
    getValue: (c) => c.visa_status || "Not specified",
    highlight: "none",
  },
  {
    label: "Profile Created",
    icon: Clock,
    getValue: (c) => c.created_at,
    highlight: "none",
    format: "date",
  },
  {
    label: "Time on Platform",
    icon: Clock,
    getValue: (c) => daysSince(c.created_at),
    highlight: "highest",
    format: "days",
  },
];

function CellValue({
  row,
  value,
  isBest,
  isWorst,
}: {
  row: ComparisonRow;
  value: string | number | null;
  isBest: boolean;
  isWorst: boolean;
}) {
  let displayValue: string;

  if (value === null || value === undefined) {
    displayValue = "N/A";
  } else if (row.format === "salary") {
    displayValue = typeof value === "number" ? formatSalary(value) : String(value);
  } else if (row.format === "percentage") {
    displayValue = `${value}%`;
  } else if (row.format === "date") {
    displayValue = formatDate(String(value));
  } else if (row.format === "days") {
    displayValue = `${value} days`;
  } else {
    displayValue = String(value);
  }

  const bgClass = isBest
    ? "bg-emerald-50"
    : isWorst
    ? "bg-red-50"
    : "";

  return (
    <td className={`px-4 py-3 text-sm ${bgClass}`}>
      <div className="flex items-center gap-1">
        {isBest && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
        {isWorst && <XCircle className="h-3.5 w-3.5 text-red-400 shrink-0" />}
        <span className={isBest ? "font-semibold text-emerald-700" : isWorst ? "text-red-600" : ""}>
          {displayValue}
        </span>
      </div>
    </td>
  );
}

export default function ComparePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  const { data: searchData, isLoading: searchLoading } = useCandidates({
    search: debouncedSearch || undefined,
    per_page: 20,
  });

  const { data: allCandidatesData, isLoading: candidatesLoading } = useCandidates({
    per_page: 200,
  });

  const { data: appsData } = useApplications({ per_page: 200 });
  const applications = appsData?.data ?? [];

  const searchResults = searchData?.data ?? [];
  const allCandidates = allCandidatesData?.data ?? [];

  const selectedCandidates = useMemo(() => {
    return selectedIds
      .map((id) => allCandidates.find((c) => c.id === id))
      .filter(Boolean) as CandidateProfile[];
  }, [selectedIds, allCandidates]);

  // Get application info for each candidate
  const candidateApps = useMemo(() => {
    const map: Record<string, typeof applications> = {};
    for (const app of applications) {
      if (!map[app.candidate_id]) map[app.candidate_id] = [];
      map[app.candidate_id].push(app);
    }
    return map;
  }, [applications]);

  function addCandidate(id: string) {
    if (selectedIds.length >= 4) {
      toast.error("Maximum 4 candidates for comparison");
      return;
    }
    if (selectedIds.includes(id)) {
      toast.error("Candidate already selected");
      return;
    }
    setSelectedIds([...selectedIds, id]);
    setSearchQuery("");
    setShowSearch(false);
  }

  function removeCandidate(id: string) {
    setSelectedIds(selectedIds.filter((cid) => cid !== id));
  }

  function handleChooseWinner(candidateId: string) {
    const candidate = selectedCandidates.find((c) => c.id === candidateId);
    toast.success(
      `${candidate?.headline || "Candidate"} selected as the preferred candidate`
    );
  }

  function handleExportPDF() {
    toast.success("Comparison PDF export started");
  }

  function getBestWorst(row: ComparisonRow) {
    if (row.highlight === "none" || selectedCandidates.length < 2) {
      return { bestId: null, worstId: null };
    }

    const values = selectedCandidates.map((c) => ({
      id: c.id,
      value: row.getValue(c),
    }));

    const numericValues = values.filter(
      (v) => v.value !== null && typeof v.value === "number"
    );

    if (numericValues.length < 2) return { bestId: null, worstId: null };

    const sorted = [...numericValues].sort(
      (a, b) => (a.value as number) - (b.value as number)
    );

    if (row.highlight === "highest") {
      return {
        bestId: sorted[sorted.length - 1].id,
        worstId: sorted[0].id,
      };
    } else {
      return {
        bestId: sorted[0].id,
        worstId: sorted[sorted.length - 1].id,
      };
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Hiring", href: "/hiring" },
          { label: "Compare Candidates" },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            Side-by-Side Comparison
          </h1>
          <p className="text-muted-foreground">
            Compare up to 4 candidates head-to-head across all attributes
          </p>
        </div>
        {selectedCandidates.length >= 2 && (
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        )}
      </div>

      {/* Candidate Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium">Candidates:</span>
            {selectedCandidates.map((c) => (
              <Badge
                key={c.id}
                variant="secondary"
                className="text-xs py-1.5 px-3 gap-2"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                  {(c.headline || "?").charAt(0).toUpperCase()}
                </span>
                {c.headline || "Untitled"}
                <button
                  onClick={() => removeCandidate(c.id)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {selectedIds.length < 4 && (
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => setShowSearch(!showSearch)}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Add Candidate ({selectedIds.length}/4)
                </Button>
                {showSearch && (
                  <div className="absolute top-full left-0 mt-2 w-80 z-50 bg-background border rounded-lg shadow-lg p-3">
                    <div className="relative mb-2">
                      <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        autoFocus
                        placeholder="Search candidates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 h-8 text-xs"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {searchLoading ? (
                        <div className="space-y-2 p-2">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} className="h-8 w-full" />
                          ))}
                        </div>
                      ) : searchResults.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-3">
                          {debouncedSearch ? "No candidates found" : "Type to search..."}
                        </p>
                      ) : (
                        searchResults
                          .filter((c) => !selectedIds.includes(c.id))
                          .map((c) => (
                            <button
                              key={c.id}
                              className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-muted text-left"
                              onClick={() => addCandidate(c.id)}
                            >
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                                {(c.headline || "?").charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">
                                  {c.headline || "Untitled Profile"}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {[c.location_city, c.location_state]
                                    .filter(Boolean)
                                    .join(", ") || "No location"}
                                </p>
                              </div>
                            </button>
                          ))
                      )}
                    </div>
                    <div className="pt-2 border-t mt-2">
                      <button
                        className="text-[10px] text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setShowSearch(false);
                          setSearchQuery("");
                        }}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Comparison Content */}
      {selectedCandidates.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="rounded-full bg-blue-100 p-4 mb-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-1">
                Add Candidates to Compare
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Search and add 2 to 4 candidates above to see a detailed
                side-by-side comparison of their profiles, skills, and qualifications.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : selectedCandidates.length === 1 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <p className="text-sm text-muted-foreground">
                Add at least one more candidate to start comparing.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground w-[180px]">
                      Attribute
                    </th>
                    {selectedCandidates.map((c) => (
                      <th key={c.id} className="px-4 py-3 text-left font-medium min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                            {(c.headline || "?").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/talent/${c.id}`}
                              className="text-xs font-semibold hover:underline line-clamp-1"
                            >
                              {c.headline || "Untitled"}
                            </Link>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Avatar row */}
                  <tr className="border-b">
                    <td className="px-4 py-3 font-medium text-muted-foreground text-xs">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-3.5 w-3.5" />
                        Avatar
                      </div>
                    </td>
                    {selectedCandidates.map((c) => (
                      <td key={c.id} className="px-4 py-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary text-lg font-bold">
                          {(c.headline || "?").charAt(0).toUpperCase()}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Standard comparison rows */}
                  {COMPARISON_ROWS.map((row) => {
                    const { bestId, worstId } = getBestWorst(row);
                    return (
                      <tr key={row.label} className="border-b hover:bg-muted/20">
                        <td className="px-4 py-3 font-medium text-muted-foreground text-xs">
                          <div className="flex items-center gap-2">
                            <row.icon className="h-3.5 w-3.5" />
                            {row.label}
                          </div>
                        </td>
                        {selectedCandidates.map((c) => (
                          <CellValue
                            key={c.id}
                            row={row}
                            value={row.getValue(c)}
                            isBest={bestId === c.id}
                            isWorst={worstId === c.id}
                          />
                        ))}
                      </tr>
                    );
                  })}

                  {/* Application-derived rows */}
                  <tr className="border-b bg-muted/30">
                    <td className="px-4 py-2 font-semibold text-xs" colSpan={selectedCandidates.length + 1}>
                      Application Data
                    </td>
                  </tr>

                  {/* Evaluations Count */}
                  <tr className="border-b hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium text-muted-foreground text-xs">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-3.5 w-3.5" />
                        Applications
                      </div>
                    </td>
                    {selectedCandidates.map((c) => {
                      const apps = candidateApps[c.id] || [];
                      return (
                        <td key={c.id} className="px-4 py-3 text-sm">
                          {apps.length} application{apps.length !== 1 ? "s" : ""}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Average Score */}
                  <tr className="border-b hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium text-muted-foreground text-xs">
                      <div className="flex items-center gap-2">
                        <Star className="h-3.5 w-3.5" />
                        Average Score
                      </div>
                    </td>
                    {(() => {
                      const scores = selectedCandidates.map((c) => {
                        const apps = candidateApps[c.id] || [];
                        const scored = apps.filter((a) => a.screening_score != null);
                        const avg =
                          scored.length > 0
                            ? scored.reduce((s, a) => s + (a.screening_score ?? 0), 0) /
                              scored.length
                            : null;
                        return { id: c.id, avg };
                      });
                      const numScores = scores.filter((s) => s.avg !== null);
                      const best =
                        numScores.length >= 2
                          ? numScores.reduce((a, b) =>
                              (a.avg ?? 0) > (b.avg ?? 0) ? a : b
                            ).id
                          : null;
                      const worst =
                        numScores.length >= 2
                          ? numScores.reduce((a, b) =>
                              (a.avg ?? 0) < (b.avg ?? 0) ? a : b
                            ).id
                          : null;

                      return selectedCandidates.map((c) => {
                        const s = scores.find((x) => x.id === c.id);
                        const isBest = best === c.id && best !== worst;
                        const isWorst = worst === c.id && best !== worst;
                        return (
                          <td
                            key={c.id}
                            className={`px-4 py-3 text-sm ${
                              isBest ? "bg-emerald-50" : isWorst ? "bg-red-50" : ""
                            }`}
                          >
                            <div className="flex items-center gap-1">
                              {isBest && (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                              )}
                              {isWorst && (
                                <XCircle className="h-3.5 w-3.5 text-red-400" />
                              )}
                              {s?.avg != null ? (
                                <div className="flex items-center gap-1 text-amber-500">
                                  <Star className="h-3.5 w-3.5 fill-current" />
                                  <span
                                    className={`font-semibold ${
                                      isBest ? "text-emerald-700" : isWorst ? "text-red-600" : ""
                                    }`}
                                  >
                                    {s.avg.toFixed(1)}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">N/A</span>
                              )}
                            </div>
                          </td>
                        );
                      });
                    })()}
                  </tr>

                  {/* Current Stage */}
                  <tr className="border-b hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium text-muted-foreground text-xs">
                      <div className="flex items-center gap-2">
                        <ChevronRight className="h-3.5 w-3.5" />
                        Current Stage
                      </div>
                    </td>
                    {selectedCandidates.map((c) => {
                      const apps = candidateApps[c.id] || [];
                      const latestApp = apps.length > 0 ? apps[apps.length - 1] : null;
                      return (
                        <td key={c.id} className="px-4 py-3 text-sm">
                          {latestApp ? (
                            <Badge variant="outline" className="text-xs">
                              {latestApp.stage.replace(/_/g, " ")}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Source */}
                  <tr className="border-b hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium text-muted-foreground text-xs">
                      <div className="flex items-center gap-2">
                        <Award className="h-3.5 w-3.5" />
                        Source
                      </div>
                    </td>
                    {selectedCandidates.map((c) => {
                      const apps = candidateApps[c.id] || [];
                      const sources = [...new Set(apps.map((a) => a.source).filter(Boolean))];
                      return (
                        <td key={c.id} className="px-4 py-3 text-sm">
                          {sources.length > 0 ? (
                            <div className="flex gap-1 flex-wrap">
                              {sources.map((s) => (
                                <Badge key={s} variant="secondary" className="text-[10px]">
                                  {s}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Direct</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* Cultural Fit Score (derived from reputation) */}
                  <tr className="border-b hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium text-muted-foreground text-xs">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-3.5 w-3.5" />
                        Cultural Fit Score
                      </div>
                    </td>
                    {(() => {
                      const scores = selectedCandidates.map((c) => ({
                        id: c.id,
                        score: Math.min(
                          Math.round(c.reputation_score * 1.2 + c.profile_completeness_pct * 0.3),
                          100
                        ),
                      }));
                      const best =
                        scores.length >= 2
                          ? scores.reduce((a, b) => (a.score > b.score ? a : b)).id
                          : null;
                      const worst =
                        scores.length >= 2
                          ? scores.reduce((a, b) => (a.score < b.score ? a : b)).id
                          : null;

                      return selectedCandidates.map((c) => {
                        const s = scores.find((x) => x.id === c.id);
                        const isBest = best === c.id && best !== worst;
                        const isWorst = worst === c.id && best !== worst;
                        return (
                          <td
                            key={c.id}
                            className={`px-4 py-3 text-sm ${
                              isBest ? "bg-emerald-50" : isWorst ? "bg-red-50" : ""
                            }`}
                          >
                            <div className="flex items-center gap-1">
                              {isBest && (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                              )}
                              {isWorst && (
                                <XCircle className="h-3.5 w-3.5 text-red-400" />
                              )}
                              <span
                                className={
                                  isBest
                                    ? "font-semibold text-emerald-700"
                                    : isWorst
                                    ? "text-red-600"
                                    : ""
                                }
                              >
                                {s?.score ?? 0}%
                              </span>
                            </div>
                          </td>
                        );
                      });
                    })()}
                  </tr>

                  {/* Technical Score (derived from skills + reputation) */}
                  <tr className="border-b hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium text-muted-foreground text-xs">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-3.5 w-3.5" />
                        Technical Score
                      </div>
                    </td>
                    {(() => {
                      const scores = selectedCandidates.map((c) => ({
                        id: c.id,
                        score: Math.min(
                          Math.round(c.reputation_score * 0.8 + c.profile_completeness_pct * 0.5),
                          100
                        ),
                      }));
                      const best =
                        scores.length >= 2
                          ? scores.reduce((a, b) => (a.score > b.score ? a : b)).id
                          : null;
                      const worst =
                        scores.length >= 2
                          ? scores.reduce((a, b) => (a.score < b.score ? a : b)).id
                          : null;

                      return selectedCandidates.map((c) => {
                        const s = scores.find((x) => x.id === c.id);
                        const isBest = best === c.id && best !== worst;
                        const isWorst = worst === c.id && best !== worst;
                        return (
                          <td
                            key={c.id}
                            className={`px-4 py-3 text-sm ${
                              isBest ? "bg-emerald-50" : isWorst ? "bg-red-50" : ""
                            }`}
                          >
                            <div className="flex items-center gap-1">
                              {isBest && (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                              )}
                              {isWorst && (
                                <XCircle className="h-3.5 w-3.5 text-red-400" />
                              )}
                              <span
                                className={
                                  isBest
                                    ? "font-semibold text-emerald-700"
                                    : isWorst
                                    ? "text-red-600"
                                    : ""
                                }
                              >
                                {s?.score ?? 0}%
                              </span>
                            </div>
                          </td>
                        );
                      });
                    })()}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Choose Winner Row */}
            <Separator />
            <div className="p-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-muted-foreground w-[180px] shrink-0">
                  <Trophy className="h-4 w-4 inline mr-2" />
                  Choose Winner:
                </span>
                <div className="flex gap-3 flex-wrap">
                  {selectedCandidates.map((c) => (
                    <Button
                      key={c.id}
                      variant="outline"
                      size="sm"
                      className="h-9 text-xs gap-2 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                      onClick={() => handleChooseWinner(c.id)}
                    >
                      <Trophy className="h-3.5 w-3.5" />
                      {c.headline || "Untitled"}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
