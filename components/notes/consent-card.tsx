"use client";

import * as React from "react";
import { ShieldCheck, ShieldQuestion } from "lucide-react";
import { captureConsent } from "@/app/notes/actions";

export function ConsentCard({
  appointmentId,
  patientId,
  existing,
}: {
  appointmentId: string;
  patientId: string | null;
  existing: { granted_by_name: string | null; created_at: string } | null;
}) {
  const [done, setDone] = React.useState(existing);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function record() {
    setBusy(true);
    setError(null);
    const res = await captureConsent(appointmentId, patientId, "verbal");
    setBusy(false);
    if (res.ok)
      setDone({ granted_by_name: "you", created_at: new Date().toISOString() });
    else setError(res.error ?? "Could not record consent. Try again.");
  }

  if (done) {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-success/30 bg-success-soft px-4 py-3 text-sm text-success">
        <ShieldCheck size={18} />
        <span className="font-medium">
          Consent captured{done.granted_by_name ? ` by ${done.granted_by_name}` : ""}.
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3">
        <div className="flex items-center gap-2.5 text-sm text-warning">
          <ShieldQuestion size={18} />
          <span className="font-medium">Patient consent not yet recorded.</span>
        </div>
        <button
          onClick={record}
          disabled={busy}
          className="shrink-0 rounded-lg bg-warning px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
        >
          {busy ? "Saving…" : "Record consent"}
        </button>
      </div>
      {error && <p className="px-1 text-sm font-medium text-emergency">{error}</p>}
    </div>
  );
}
