"use client";

import { FileSpreadsheet, FileJson, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ReportRow = {
  date: string;
  type: string;
  status: string;
  specialty: string | null;
};

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportBar({
  rows,
  indicators,
}: {
  rows: ReportRow[];
  indicators: Record<string, number>;
}) {
  function exportCsv() {
    const header = "date,type,status,specialty";
    const body = rows
      .map((r) => [r.date, r.type, r.status, r.specialty ?? ""].join(","))
      .join("\n");
    download("greenstar-appointments.csv", `${header}\n${body}`, "text/csv");
  }

  function exportDhis2() {
    // DHIS2 / FHIR-lite style indicator payload
    const payload = {
      system: "Greenstar Telehealth",
      generatedAt: new Date().toISOString(),
      period: new Date().toISOString().slice(0, 7),
      dataValues: Object.entries(indicators).map(([dataElement, value]) => ({
        dataElement,
        value,
      })),
    };
    download("greenstar-indicators.json", JSON.stringify(payload, null, 2), "application/json");
  }

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      <Button variant="outline" size="sm" onClick={exportCsv}>
        <FileSpreadsheet size={16} /> Export CSV
      </Button>
      <Button variant="outline" size="sm" onClick={exportDhis2}>
        <FileJson size={16} /> DHIS2 / FHIR-lite
      </Button>
      <Button variant="outline" size="sm" onClick={() => window.print()}>
        <Printer size={16} /> Print / PDF
      </Button>
    </div>
  );
}
