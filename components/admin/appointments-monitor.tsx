"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle } from "lucide-react";
import { StatusPill } from "@/components/ui/status-pill";
import { deleteAppointment } from "@/app/admin/appointments/actions";

export type MonitorRow = {
  id: string;
  type: "emergency" | "regular";
  status: string;
  specialty: string | null;
  created_at: string;
  patient: { full_name: string } | null;
};

const statusTone = {
  pending: "warning",
  claimed: "info",
  in_consult: "info",
  completed: "success",
  cancelled: "neutral",
} as const;

export function AppointmentsMonitor({ rows }: { rows: MonitorRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);

  async function remove(id: string) {
    setBusy(id);
    await deleteAppointment(id);
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-2">
            <th className="px-5 py-3 font-semibold">Patient</th>
            <th className="px-5 py-3 font-semibold">Specialty</th>
            <th className="px-5 py-3 font-semibold">Type</th>
            <th className="px-5 py-3 font-semibold">Status</th>
            <th className="px-5 py-3 font-semibold">Date</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-border last:border-0">
              <td className="px-5 py-3.5 font-medium text-foreground">
                {r.patient?.full_name ?? "—"}
              </td>
              <td className="px-5 py-3.5 text-muted">{r.specialty ?? "—"}</td>
              <td className="px-5 py-3.5">
                {r.type === "emergency" ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emergency">
                    <AlertTriangle size={12} /> Emergency
                  </span>
                ) : (
                  <span className="text-xs text-muted">Regular</span>
                )}
              </td>
              <td className="px-5 py-3.5">
                <StatusPill tone={statusTone[r.status as keyof typeof statusTone]}>
                  {r.status.replace("_", " ")}
                </StatusPill>
              </td>
              <td className="px-5 py-3.5 tabular-nums text-muted">
                {r.created_at.slice(0, 10)}
              </td>
              <td className="px-5 py-3.5 text-right">
                {(r.status === "completed" || r.status === "cancelled") && (
                  <button
                    onClick={() => remove(r.id)}
                    disabled={busy === r.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-emergency disabled:opacity-50"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
