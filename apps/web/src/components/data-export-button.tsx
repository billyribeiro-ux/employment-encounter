"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileJson, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { downloadBlob } from "@/lib/utils";
import { api } from "@/lib/api";

interface DataExportButtonProps {
  entity: string;
  endpoint: string;
  filename: string;
}

export function DataExportButton({ entity, endpoint, filename }: DataExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport(format: "csv" | "json") {
    setIsExporting(true);
    try {
      const { data } = await api.get(endpoint, {
        params: { format },
        responseType: "blob",
      });
      const ext = format === "csv" ? "csv" : "json";
      const mime = format === "csv" ? "text/csv" : "application/json";
      const blob = new Blob([data], { type: mime });
      downloadBlob(blob, `${filename}.${ext}`);
      toast.success(`${entity} exported as ${format.toUpperCase()}`);
    } catch {
      toast.error(`Failed to export ${entity.toLowerCase()}`);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport("csv")}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("json")}>
          <FileJson className="mr-2 h-4 w-4" />
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
