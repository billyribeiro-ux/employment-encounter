"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Breadcrumbs } from "@/components/dashboard/breadcrumbs";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Upload,
  Download,
  FileText,
  Users,
  Briefcase,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowRight,
  FileSpreadsheet,
  RotateCcw,
  X,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CANDIDATE_FIELDS = [
  { key: "first_name", label: "First Name", required: true },
  { key: "last_name", label: "Last Name", required: true },
  { key: "email", label: "Email", required: true },
  { key: "phone", label: "Phone", required: false },
  { key: "headline", label: "Headline", required: false },
  { key: "skills", label: "Skills (comma-separated)", required: false },
  { key: "source", label: "Source", required: false },
  { key: "location", label: "Location", required: false },
  { key: "linkedin_url", label: "LinkedIn URL", required: false },
  { key: "years_experience", label: "Years of Experience", required: false },
  { key: "current_company", label: "Current Company", required: false },
  { key: "current_title", label: "Current Title", required: false },
  { key: "notes", label: "Notes", required: false },
];

const JOB_FIELDS = [
  { key: "title", label: "Job Title", required: true },
  { key: "department", label: "Department", required: false },
  { key: "description", label: "Description", required: false },
  { key: "requirements", label: "Requirements", required: false },
  { key: "salary_min", label: "Salary Min", required: false },
  { key: "salary_max", label: "Salary Max", required: false },
  { key: "location", label: "Location", required: false },
  { key: "employment_type", label: "Employment Type", required: false },
  { key: "experience_level", label: "Experience Level", required: false },
  { key: "remote_policy", label: "Remote Policy", required: false },
  { key: "skills_required", label: "Skills Required (comma-separated)", required: false },
];

type ImportStep = "upload" | "mapping" | "preview" | "importing" | "complete";

type DuplicateStrategy = "skip" | "update" | "create";

interface ImportResult {
  imported: number;
  skipped: number;
  errors: number;
  error_details: { row: number; field: string; message: string }[];
}

// ---------------------------------------------------------------------------
// CSV Parser
// ---------------------------------------------------------------------------

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine);
  return { headers, rows };
}

function generateSampleCSV(
  fields: { key: string; label: string; required: boolean }[]
): string {
  return fields.map((f) => f.key).join(",") + "\n";
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Drag & Drop Upload
// ---------------------------------------------------------------------------

function FileDropZone({
  onFileSelected,
  accept,
}: {
  onFileSelected: (file: File) => void;
  accept: string;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.name.endsWith(".csv")) {
        onFileSelected(file);
      } else {
        toast.error("Please upload a CSV file");
      }
    },
    [onFileSelected]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFileSelected(file);
    },
    [onFileSelected]
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`relative rounded-lg border-2 border-dashed p-12 text-center cursor-pointer transition-colors ${
        isDragging
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-primary/50"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
      <div className="flex flex-col items-center">
        <div className="rounded-full bg-muted p-3 mb-3">
          <Upload className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium mb-1">
          Drop your CSV file here, or click to browse
        </p>
        <p className="text-xs text-muted-foreground">
          Supports .csv files up to 10MB
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Column Mapper
// ---------------------------------------------------------------------------

function ColumnMapper({
  csvHeaders,
  targetFields,
  mapping,
  onMappingChange,
}: {
  csvHeaders: string[];
  targetFields: { key: string; label: string; required: boolean }[];
  mapping: Record<string, string>;
  onMappingChange: (mapping: Record<string, string>) => void;
}) {
  function handleChange(targetKey: string, csvColumn: string) {
    const updated = { ...mapping };
    if (csvColumn === "__skip__") {
      delete updated[targetKey];
    } else {
      updated[targetKey] = csvColumn;
    }
    onMappingChange(updated);
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Map your CSV columns to the corresponding fields. Required fields are
        marked with an asterisk.
      </p>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Target Field</TableHead>
              <TableHead></TableHead>
              <TableHead>CSV Column</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {targetFields.map((field) => (
              <TableRow key={field.key}>
                <TableCell>
                  <span className="text-sm font-medium">
                    {field.label}
                    {field.required && (
                      <span className="text-destructive ml-1">*</span>
                    )}
                  </span>
                </TableCell>
                <TableCell className="w-8">
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </TableCell>
                <TableCell>
                  <Select
                    value={mapping[field.key] || "__skip__"}
                    onValueChange={(v) => handleChange(field.key, v)}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Skip this field" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__skip__">
                        -- Skip this field --
                      </SelectItem>
                      {csvHeaders.map((header) => (
                        <SelectItem key={header} value={header}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Preview Table
// ---------------------------------------------------------------------------

function PreviewTable({
  headers,
  rows,
  mapping,
  targetFields,
}: {
  headers: string[];
  rows: string[][];
  mapping: Record<string, string>;
  targetFields: { key: string; label: string; required: boolean }[];
}) {
  const mappedFields = targetFields.filter((f) => mapping[f.key]);
  const previewRows = rows.slice(0, 5);

  function getMappedValue(row: string[], targetKey: string): string {
    const csvCol = mapping[targetKey];
    if (!csvCol) return "";
    const colIdx = headers.indexOf(csvCol);
    if (colIdx === -1) return "";
    return row[colIdx] || "";
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Preview of the first {Math.min(5, rows.length)} rows with your column
        mapping applied.
      </p>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              {mappedFields.map((f) => (
                <TableHead key={f.key}>{f.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {previewRows.map((row, i) => (
              <TableRow key={i}>
                <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                {mappedFields.map((f) => (
                  <TableCell key={f.key} className="text-sm">
                    {getMappedValue(row, f.key) || (
                      <span className="text-muted-foreground/40">--</span>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">
        Showing {Math.min(5, rows.length)} of {rows.length} total rows
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Import Tab Component
// ---------------------------------------------------------------------------

function ImportTab({
  type,
  fields,
}: {
  type: "candidates" | "jobs";
  fields: { key: string; label: string; required: boolean }[];
}) {
  const [step, setStep] = useState<ImportStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [duplicateStrategy, setDuplicateStrategy] =
    useState<DuplicateStrategy>("skip");
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  function handleFileSelected(selectedFile: File) {
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers, rows } = parseCSV(text);
      if (headers.length === 0) {
        toast.error("CSV file appears to be empty");
        return;
      }
      setCsvHeaders(headers);
      setCsvRows(rows);

      // Auto-map columns by matching names
      const autoMapping: Record<string, string> = {};
      for (const field of fields) {
        const match = headers.find(
          (h) =>
            h.toLowerCase().replace(/[_\s-]/g, "") ===
            field.key.toLowerCase().replace(/[_\s-]/g, "")
        );
        if (match) autoMapping[field.key] = match;
      }
      setMapping(autoMapping);
      setStep("mapping");
      toast.success(
        `File loaded: ${headers.length} columns, ${rows.length} rows`
      );
    };
    reader.onerror = () => toast.error("Failed to read file");
    reader.readAsText(selectedFile);
  }

  function validateMapping(): boolean {
    const requiredFields = fields.filter((f) => f.required);
    const missing = requiredFields.filter((f) => !mapping[f.key]);
    if (missing.length > 0) {
      toast.error(
        `Required fields not mapped: ${missing.map((f) => f.label).join(", ")}`
      );
      return false;
    }
    return true;
  }

  function handleProceedToPreview() {
    if (!validateMapping()) return;
    setStep("preview");
  }

  async function handleStartImport() {
    setStep("importing");
    setImportProgress(0);

    const endpoint =
      type === "candidates" ? "/import/candidates" : "/import/jobs";

    try {
      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setImportProgress((prev) => Math.min(prev + 10, 90));
      }, 300);

      const payload = {
        headers: csvHeaders,
        rows: csvRows,
        mapping,
        duplicate_strategy: duplicateStrategy,
      };

      const { data } = await api.post<ImportResult>(endpoint, payload);

      clearInterval(progressInterval);
      setImportProgress(100);
      setImportResult(data);
      setStep("complete");

      if (data.errors > 0) {
        toast.warning(
          `Import completed with ${data.errors} error(s). ${data.imported} imported, ${data.skipped} skipped.`
        );
      } else {
        toast.success(
          `Import completed! ${data.imported} ${type} imported successfully.`
        );
      }
    } catch {
      toast.error("Import failed. Please try again.");
      setStep("preview");
    }
  }

  function handleReset() {
    setStep("upload");
    setFile(null);
    setCsvHeaders([]);
    setCsvRows([]);
    setMapping({});
    setDuplicateStrategy("skip");
    setImportProgress(0);
    setImportResult(null);
  }

  function handleDownloadTemplate() {
    const csv = generateSampleCSV(fields);
    downloadCSV(csv, `${type}-import-template.csv`);
    toast.success("Template downloaded");
  }

  function handleDownloadErrorReport() {
    if (!importResult?.error_details?.length) return;
    const headers = ["Row", "Field", "Error"];
    const csv = [
      headers.join(","),
      ...importResult.error_details.map(
        (e) => `${e.row},"${e.field}","${e.message.replace(/"/g, '""')}"`
      ),
    ].join("\n");
    downloadCSV(csv, `${type}-import-errors.csv`);
    toast.success("Error report downloaded");
  }

  // Duplicate detection
  const duplicateCount = useMemo(() => {
    if (type !== "candidates" || !mapping.email) return 0;
    const emailColIdx = csvHeaders.indexOf(mapping.email);
    if (emailColIdx === -1) return 0;
    const emails = csvRows.map((r) => r[emailColIdx]?.toLowerCase()).filter(Boolean);
    const uniqueEmails = new Set(emails);
    return emails.length - uniqueEmails.size;
  }, [csvRows, csvHeaders, mapping, type]);

  return (
    <div className="space-y-6">
      {/* Template download */}
      <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/30">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
          <div>
            <p className="text-sm font-medium">
              Download Sample Template
            </p>
            <p className="text-xs text-muted-foreground">
              CSV template with the correct headers for{" "}
              {type === "candidates" ? "candidate" : "job"} import
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
          <Download className="mr-2 h-3.5 w-3.5" />
          Download CSV
        </Button>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {["Upload", "Map Columns", "Preview", "Import"].map(
          (label, i) => {
            const steps: ImportStep[] = [
              "upload",
              "mapping",
              "preview",
              "importing",
            ];
            const stepIndex = steps.indexOf(step);
            const isComplete =
              i < stepIndex || step === "complete";
            const isCurrent = i === stepIndex;
            return (
              <div key={label} className="flex items-center gap-2">
                {i > 0 && (
                  <div
                    className={`h-px w-8 ${
                      isComplete ? "bg-primary" : "bg-border"
                    }`}
                  />
                )}
                <div className="flex items-center gap-1.5">
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium ${
                      isComplete
                        ? "bg-primary text-primary-foreground"
                        : isCurrent
                        ? "bg-primary/10 text-primary border border-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isComplete ? (
                      <CheckCircle className="h-3.5 w-3.5" />
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      isCurrent ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              </div>
            );
          }
        )}
      </div>

      {/* Step Content */}
      {step === "upload" && (
        <FileDropZone onFileSelected={handleFileSelected} accept=".csv" />
      )}

      {step === "mapping" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Map Columns</h3>
              <p className="text-sm text-muted-foreground">
                File: {file?.name} ({csvRows.length} rows)
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw className="mr-1 h-3 w-3" />
              Start Over
            </Button>
          </div>

          <ColumnMapper
            csvHeaders={csvHeaders}
            targetFields={fields}
            mapping={mapping}
            onMappingChange={setMapping}
          />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setStep("upload")}>
              Back
            </Button>
            <Button onClick={handleProceedToPreview}>
              Continue to Preview
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {step === "preview" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Preview Import</h3>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw className="mr-1 h-3 w-3" />
              Start Over
            </Button>
          </div>

          <PreviewTable
            headers={csvHeaders}
            rows={csvRows}
            mapping={mapping}
            targetFields={fields}
          />

          {duplicateCount > 0 && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  {duplicateCount} potential duplicate
                  {duplicateCount > 1 ? "s" : ""} detected
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  Duplicate emails found in your CSV file. Choose how to handle
                  them below.
                </p>
              </div>
            </div>
          )}

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-4">
                <Label className="shrink-0">Duplicate Handling</Label>
                <Select
                  value={duplicateStrategy}
                  onValueChange={(v) =>
                    setDuplicateStrategy(v as DuplicateStrategy)
                  }
                >
                  <SelectTrigger className="w-[250px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="skip">
                      Skip duplicates (keep existing)
                    </SelectItem>
                    <SelectItem value="update">
                      Update existing records
                    </SelectItem>
                    <SelectItem value="create">
                      Create new records (allow duplicates)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Ready to import <strong>{csvRows.length}</strong>{" "}
              {type === "candidates" ? "candidates" : "jobs"}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("mapping")}>
                Back
              </Button>
              <Button onClick={handleStartImport}>
                <Upload className="mr-2 h-4 w-4" />
                Start Import
              </Button>
            </div>
          </div>
        </div>
      )}

      {step === "importing" && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Importing {type}...
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Processing {csvRows.length} records. Please do not close this
                page.
              </p>
              <div className="w-full max-w-md space-y-2">
                <Progress value={importProgress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  {importProgress}% complete
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "complete" && importResult && (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-6 text-center">
                {importResult.errors === 0 ? (
                  <div className="rounded-full bg-emerald-100 p-3 mb-4">
                    <CheckCircle className="h-8 w-8 text-emerald-600" />
                  </div>
                ) : (
                  <div className="rounded-full bg-amber-100 p-3 mb-4">
                    <AlertTriangle className="h-8 w-8 text-amber-600" />
                  </div>
                )}
                <h3 className="text-lg font-semibold mb-2">
                  Import Complete
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Your {type} import has been processed.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg border p-4 text-center">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{importResult.imported}</p>
                  <p className="text-xs text-muted-foreground">Imported</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{importResult.skipped}</p>
                  <p className="text-xs text-muted-foreground">Skipped</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <XCircle className="h-5 w-5 text-red-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{importResult.errors}</p>
                  <p className="text-xs text-muted-foreground">Errors</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {importResult.error_details.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Error Details</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadErrorReport}
                  >
                    <Download className="mr-2 h-3.5 w-3.5" />
                    Download Error Report
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Row</TableHead>
                        <TableHead>Field</TableHead>
                        <TableHead>Error</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importResult.error_details
                        .slice(0, 20)
                        .map((err, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-mono text-xs">
                              {err.row}
                            </TableCell>
                            <TableCell className="font-medium text-sm">
                              {err.field}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {err.message}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
                {importResult.error_details.length > 20 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Showing 20 of {importResult.error_details.length} errors.
                    Download the full error report for details.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-center">
            <Button onClick={handleReset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Import More
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function BulkImportPage() {
  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Hiring", href: "/hiring" },
          { label: "Bulk Import" },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bulk Import</h1>
          <p className="text-muted-foreground">
            Import candidates and jobs in bulk from CSV files
          </p>
        </div>
      </div>

      <Tabs defaultValue="candidates" className="space-y-6">
        <TabsList>
          <TabsTrigger value="candidates" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Import Candidates
          </TabsTrigger>
          <TabsTrigger value="jobs" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Import Jobs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="candidates">
          <ImportTab type="candidates" fields={CANDIDATE_FIELDS} />
        </TabsContent>

        <TabsContent value="jobs">
          <ImportTab type="jobs" fields={JOB_FIELDS} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
