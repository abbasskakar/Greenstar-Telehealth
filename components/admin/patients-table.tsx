"use client";

import * as React from "react";
import { Search, UserRound, ChevronRight } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { StatusPill } from "@/components/ui/status-pill";
import { PatientDetailModal } from "@/components/admin/patient-detail-modal";

export type AdminPatientRow = {
  id: string;
  full_name: string;
  age: number | null;
  gender: string | null;
  contact: string | null;
  mrn: string | null;
  source: "self" | "provider";
  created_at: string;
};

export function PatientsTable({ patients }: { patients: AdminPatientRow[] }) {
  const [q, setQ] = React.useState("");
  const [openId, setOpenId] = React.useState<string | null>(null);
  const query = q.trim().toLowerCase();
  const shown = query
    ? patients.filter(
        (p) =>
          p.full_name.toLowerCase().includes(query) ||
          (p.mrn ?? "").toLowerCase().includes(query) ||
          (p.contact ?? "").toLowerCase().includes(query),
      )
    : patients;

  return (
    <div className="space-y-4">
      <div className="flex h-11 items-center gap-2.5 rounded-xl border border-border-strong bg-surface px-3.5">
        <Search size={18} className="text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, MRN, or contact…"
          className="min-w-0 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-2/60"
        />
      </div>

      {shown.length ? (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-2">
                <th className="px-5 py-3 font-semibold">Patient</th>
                <th className="px-5 py-3 font-semibold">MRN</th>
                <th className="px-5 py-3 font-semibold">Contact</th>
                <th className="px-5 py-3 font-semibold">Registered</th>
                <th className="px-5 py-3 font-semibold">Source</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => setOpenId(p.id)}
                  className="group cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-surface-2/50"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={p.full_name} size={34} />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground group-hover:text-primary">{p.full_name}</p>
                        <p className="text-xs text-muted-2">
                          {[p.age != null ? `${p.age} yrs` : null, p.gender].filter(Boolean).join(" · ") || "—"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-muted">{p.mrn || "—"}</td>
                  <td className="px-5 py-3.5 text-muted">{p.contact || "—"}</td>
                  <td className="px-5 py-3.5 text-muted">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <StatusPill tone={p.source === "self" ? "info" : "success"} dot={false}>
                        {p.source === "self" ? "Self-registered" : "Provider"}
                      </StatusPill>
                      <ChevronRight size={16} className="text-muted-2 opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border-strong bg-surface-2/40 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-muted-2">
            <UserRound size={22} />
          </span>
          <p className="text-[15px] font-medium text-foreground">No patients found</p>
        </div>
      )}

      {openId && <PatientDetailModal patientId={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}
