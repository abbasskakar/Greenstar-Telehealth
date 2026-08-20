"use client";

import * as React from "react";
import { X, Loader2, ShieldAlert, IdCard, CalendarDays, Pill, FlaskConical, Activity } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { StatusPill } from "@/components/ui/status-pill";
import { VitalCards } from "@/components/patterns/vital-cards";
import {
  getPatientDetail,
  type PatientDetail,
  type PatientAppt,
  type LabRow,
} from "@/app/admin/patients/actions";
import type { Vitals } from "@/lib/vitals";
import type { Prescription } from "@/components/rx/prescription-view";

const statusTone: Record<string, "warning" | "info" | "success" | "neutral"> = {
  pending: "warning",
  claimed: "info",
  in_consult: "info",
  completed: "success",
  cancelled: "neutral",
};

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

export function PatientDetailModal({ patientId, onClose }: { patientId: string; onClose: () => void }) {
  const [p, setP] = React.useState<PatientDetail | null>(null);
  const [appts, setAppts] = React.useState<PatientAppt[]>([]);
  const [vitals, setVitals] = React.useState<Vitals | null>(null);
  const [rx, setRx] = React.useState<Prescription[]>([]);
  const [labs, setLabs] = React.useState<LabRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await getPatientDetail(patientId);
      if (cancelled) return;
      if (res.ok && res.patient) {
        setP(res.patient);
        setAppts(res.appointments ?? []);
        setVitals(res.latestVitals ?? null);
        setRx(res.prescriptions ?? []);
        setLabs(res.labs ?? []);
      } else setError("Could not load patient.");
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [patientId]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-float"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative shrink-0">
          <div className="gs-brand-gradient h-16" />
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/30"
          >
            <X size={18} />
          </button>
          {p && (
            <div className="absolute -bottom-8 left-5">
              <Avatar name={p.full_name} size={72} className="border-4 border-surface" />
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-10">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted">
              <Loader2 size={24} className="animate-spin" />
            </div>
          ) : !p ? (
            <p className="py-10 text-center text-sm text-emergency">{error ?? "Not found."}</p>
          ) : (
            <>
              <p className="text-lg font-bold text-foreground">{p.full_name}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <StatusPill tone={p.owner_id ? "info" : "success"} dot={false}>
                  {p.owner_id ? "Self-registered" : "Provider-added"}
                </StatusPill>
                {(p.age != null || p.gender) && (
                  <span className="text-sm text-muted">
                    {[p.age != null ? `${p.age} yrs` : null, p.gender].filter(Boolean).join(" · ")}
                  </span>
                )}
              </div>

              <div className="mt-4 space-y-2.5 border-t border-border pt-4">
                <Row label="MRN" value={p.mrn || "—"} />
                {p.contact && <Row label="Contact" value={p.contact} />}
                {p.cnic_last4 && (
                  <Row
                    label={<span className="flex items-center gap-1.5"><IdCard size={14} /> CNIC</span>}
                    value={`••••• ••••${p.cnic_last4}`}
                  />
                )}
                <Row label="Registered" value={new Date(p.created_at).toLocaleDateString()} />
              </div>

              {p.allergies && (
                <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-emergency-soft px-3 py-2 text-sm font-medium text-emergency">
                  <ShieldAlert size={15} /> Allergies: {p.allergies}
                </p>
              )}

              {vitals && (
                <div className="mt-4 border-t border-border pt-4">
                  <p className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
                    <Activity size={15} className="text-primary" /> Latest vitals
                  </p>
                  <VitalCards vitals={vitals} />
                </div>
              )}

              <div className="mt-4 border-t border-border pt-4">
                <p className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
                  <CalendarDays size={15} className="text-primary" /> Appointments ({appts.length})
                </p>
                {appts.length ? (
                  <ul className="space-y-1.5">
                    {appts.slice(0, 12).map((a) => (
                      <li key={a.id} className="flex items-center justify-between gap-3 rounded-lg bg-surface-2/50 px-3 py-2 text-sm">
                        <span className="min-w-0 truncate">
                          {a.specialty}
                          {a.type === "emergency" && <span className="ml-1 text-xs font-bold text-emergency">· EMG</span>}
                          <span className="ml-1 text-xs text-muted-2">{new Date(a.created_at).toLocaleDateString()}</span>
                        </span>
                        <StatusPill tone={statusTone[a.status] ?? "neutral"}>{a.status}</StatusPill>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted">No appointments.</p>
                )}
              </div>

              {rx.length > 0 && (
                <div className="mt-4 border-t border-border pt-4">
                  <p className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
                    <Pill size={15} className="text-primary" /> Prescriptions ({rx.length})
                  </p>
                  <ul className="space-y-1">
                    {rx.slice(0, 5).map((r) => (
                      <li key={r.id} className="rounded-lg bg-surface-2/50 px-3 py-2 text-sm text-foreground">
                        {(r.items ?? []).map((i) => i.drug).filter(Boolean).join(", ") || "Prescription"}
                        <span className="ml-1 text-xs text-muted-2">· {r.doctor_name ?? ""}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {labs.length > 0 && (
                <div className="mt-4 border-t border-border pt-4">
                  <p className="mb-2 flex items-center gap-2 text-sm font-bold text-foreground">
                    <FlaskConical size={15} className="text-primary" /> Lab &amp; diagnostics ({labs.length})
                  </p>
                  <ul className="space-y-1.5">
                    {labs.slice(0, 8).map((l) => (
                      <li key={l.id} className="flex items-center justify-between gap-3 rounded-lg bg-surface-2/50 px-3 py-2 text-sm">
                        <span className="min-w-0 truncate">{(l.tests ?? []).join(", ") || "Lab test"}</span>
                        <StatusPill tone={l.status === "resulted" ? "success" : "warning"}>
                          {l.status === "resulted" ? "Resulted" : "Requested"}
                        </StatusPill>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {error && <p className="mt-3 text-sm font-medium text-emergency">{error}</p>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
