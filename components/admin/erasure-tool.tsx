"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2, ShieldAlert } from "lucide-react";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { erasePatientByMrn } from "@/app/admin/settings/actions";

export function ErasureTool() {
  const router = useRouter();
  const [mrn, setMrn] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<{ ok: boolean; text: string } | null>(null);

  async function erase() {
    if (!mrn.trim()) return;
    if (!window.confirm(`Permanently erase patient ${mrn} and ALL their records? This cannot be undone.`)) return;
    setBusy(true);
    setMsg(null);
    const res = await erasePatientByMrn(mrn);
    setBusy(false);
    if (res.ok) {
      setMsg({ ok: true, text: `Erased ${res.name} and all linked records.` });
      setMrn("");
      router.refresh();
    } else {
      setMsg({ ok: false, text: res.error ?? "Failed." });
    }
  }

  return (
    <div className="space-y-3">
      <Label htmlFor="mrn">Patient MRN</Label>
      <div className="flex gap-2">
        <Input id="mrn" placeholder="GS-000000" value={mrn} onChange={(e) => setMrn(e.target.value)} />
        <Button variant="emergency" onClick={erase} disabled={busy}>
          <Trash2 size={16} /> {busy ? "Erasing…" : "Erase"}
        </Button>
      </div>
      {msg && (
        <p className={`flex items-center gap-1.5 text-sm font-medium ${msg.ok ? "text-success" : "text-emergency"}`}>
          <ShieldAlert size={15} /> {msg.text}
        </p>
      )}
    </div>
  );
}
