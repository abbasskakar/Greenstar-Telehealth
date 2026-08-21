"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { X, Stethoscope, HeartPulse, Loader2, AlertTriangle, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { assignCase } from "@/app/admin/appointments/actions";

export type StaffOption = { id: string; full_name: string; specialty?: string | null };

export type AssignTarget = {
  id: string;
  patient_name: string | null;
  specialty: string | null;
  chief_complaint: string | null;
  type: "emergency" | "regular";
  assigned_doctor_name: string | null;
  assigned_nurse_name: string | null;
};

export function AssignModal({
  appt,
  doctors,
  nurses,
  onClose,
}: {
  appt: AssignTarget;
  doctors: StaffOption[];
  nurses: StaffOption[];
  onClose: () => void;
}) {
  const router = useRouter();
  // Doctors whose specialty matches the case come first.
  const sortedDoctors = React.useMemo(() => {
    const spec = (appt.specialty ?? "").toLowerCase();
    return [...doctors].sort((a, b) => {
      const am = (a.specialty ?? "").toLowerCase() === spec ? 0 : 1;
      const bm = (b.specialty ?? "").toLowerCase() === spec ? 0 : 1;
      return am - bm;
    });
  }, [doctors, appt.specialty]);

  const firstMatch = sortedDoctors.find(
    (d) => (d.specialty ?? "").toLowerCase() === (appt.specialty ?? "").toLowerCase(),
  );

  const [doctorId, setDoctorId] = React.useState<string>(firstMatch?.id ?? "");
  const [nurseId, setNurseId] = React.useState<string>("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submit() {
    if (!doctorId && !nurseId) {
      setError("Choose a doctor or a nurse to assign.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await assignCase(appt.id, {
      doctorId: doctorId || null,
      nurseId: nurseId || null,
    });
    setBusy(false);
    if (!res.ok) setError(res.error ?? "Could not assign.");
    else {
      onClose();
      router.refresh();
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-float"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="text-lg font-bold text-foreground">Assign case</h3>
          <button onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface-2">
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {/* Case summary */}
          <div className="rounded-xl bg-surface-2/60 p-3.5">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-foreground">{appt.patient_name ?? "Unknown patient"}</p>
              {appt.type === "emergency" ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emergency">
                  <AlertTriangle size={12} /> Emergency
                </span>
              ) : (
                <StatusPill tone="neutral" dot={false}>Regular</StatusPill>
              )}
            </div>
            {appt.specialty && <p className="mt-1 text-sm font-medium text-primary">{appt.specialty}</p>}
            {appt.chief_complaint && <p className="mt-1 text-sm text-muted">{appt.chief_complaint}</p>}
          </div>

          {/* Doctor */}
          <div className="mt-5">
            <label className="mb-1.5 flex items-center gap-2 text-sm font-bold text-foreground">
              <Stethoscope size={16} className="text-primary" /> Assign doctor
            </label>
            <select
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
              className="h-11 w-full rounded-xl border border-border-strong bg-surface px-3 text-[15px] text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/25"
            >
              <option value="">— None —</option>
              {sortedDoctors.map((d) => {
                const match = (d.specialty ?? "").toLowerCase() === (appt.specialty ?? "").toLowerCase();
                return (
                  <option key={d.id} value={d.id}>
                    {d.full_name}{d.specialty ? ` — ${d.specialty}` : ""}{match ? "  ✓ match" : ""}
                  </option>
                );
              })}
            </select>
            {appt.specialty && !firstMatch && (
              <p className="mt-1.5 text-xs text-warning">No doctor matches “{appt.specialty}” — pick the closest.</p>
            )}
          </div>

          {/* Nurse (optional) */}
          <div className="mt-4">
            <label className="mb-1.5 flex items-center gap-2 text-sm font-bold text-foreground">
              <HeartPulse size={16} className="text-primary" /> Assign nurse for vitals <span className="font-normal text-muted-2">(optional)</span>
            </label>
            <select
              value={nurseId}
              onChange={(e) => setNurseId(e.target.value)}
              className="h-11 w-full rounded-xl border border-border-strong bg-surface px-3 text-[15px] text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/25"
            >
              <option value="">— None —</option>
              {nurses.map((n) => (
                <option key={n.id} value={n.id}>{n.full_name}</option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-muted">A nurse visits the patient and records BP, temperature, and other vitals before the consult.</p>
          </div>

          {error && (
            <p className="mt-4 rounded-lg bg-emergency-soft px-3.5 py-2.5 text-sm font-medium text-emergency">{error}</p>
          )}
        </div>

        <div className="border-t border-border p-4">
          <Button className="w-full" disabled={busy} onClick={submit}>
            {busy ? <Loader2 size={18} className="animate-spin" /> : <UserCheck size={18} />}
            {busy ? "Assigning…" : "Assign case"}
          </Button>
        </div>
      </div>
    </div>
  );
}
