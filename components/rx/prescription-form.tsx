"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pill, Plus, Trash2, X, AlertTriangle } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { createPrescription, type RxItem } from "@/app/rx/actions";

const COMMON_DRUGS = [
  "Paracetamol", "Amoxicillin", "Ibuprofen", "Metformin", "Amlodipine",
  "Omeprazole", "Azithromycin", "Cetirizine", "ORS", "Aspirin",
];

export function PrescriptionForm({
  appointmentId,
  allergies,
}: {
  appointmentId: string;
  allergies?: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState<RxItem[]>([{ drug: "" }]);
  const [advice, setAdvice] = React.useState("");
  const [followUp, setFollowUp] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function update(i: number, field: keyof RxItem, val: string) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [field]: val } : it)));
  }

  function addDrug(name: string) {
    setItems((prev) => {
      const empty = prev.findIndex((it) => !it.drug.trim());
      if (empty >= 0) return prev.map((it, i) => (i === empty ? { ...it, drug: name } : it));
      return [...prev, { drug: name }];
    });
  }

  async function submit() {
    setLoading(true);
    setError(null);
    const res = await createPrescription(appointmentId, items, advice, followUp || null);
    setLoading(false);
    if (!res.ok) setError(res.error ?? "Could not save.");
    else {
      setOpen(false);
      setItems([{ drug: "" }]);
      setAdvice("");
      setFollowUp("");
      router.refresh();
    }
  }

  if (!open) {
    return (
      <Button variant="outline" className="w-full" onClick={() => setOpen(true)}>
        <Pill size={18} /> Write prescription
      </Button>
    );
  }

  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 font-semibold text-foreground">
            <Pill size={18} className="text-purple" /> New prescription
          </span>
          <button onClick={() => setOpen(false)} className="text-muted-2 hover:text-foreground">
            <X size={18} />
          </button>
        </div>

        {allergies && allergies.trim() && (
          <div className="flex items-start gap-2 rounded-xl border border-emergency/30 bg-emergency-soft px-3.5 py-2.5 text-sm text-emergency">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span><span className="font-semibold">Allergies:</span> {allergies} — check before prescribing.</span>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          {COMMON_DRUGS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => addDrug(d)}
              className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted hover:border-primary hover:text-primary"
            >
              + {d}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {items.map((it, i) => (
            <div key={i} className="space-y-2 rounded-xl border border-border p-3">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Medicine name"
                  value={it.drug}
                  onChange={(e) => update(i, "drug", e.target.value)}
                />
                {items.length > 1 && (
                  <button
                    onClick={() => setItems((p) => p.filter((_, idx) => idx !== i))}
                    className="shrink-0 text-muted-2 hover:text-emergency"
                    aria-label="Remove"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Input placeholder="Dose" value={it.dose ?? ""} onChange={(e) => update(i, "dose", e.target.value)} />
                <Input placeholder="Frequency" value={it.frequency ?? ""} onChange={(e) => update(i, "frequency", e.target.value)} />
                <Input placeholder="Duration" value={it.duration ?? ""} onChange={(e) => update(i, "duration", e.target.value)} />
              </div>
              <Input
                placeholder="Instructions (optional)"
                value={it.instructions ?? ""}
                onChange={(e) => update(i, "instructions", e.target.value)}
              />
            </div>
          ))}
          <button
            onClick={() => setItems((p) => [...p, { drug: "" }])}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
          >
            <Plus size={16} /> Add medicine
          </button>
        </div>

        <div>
          <Label htmlFor="advice">Advice (optional)</Label>
          <textarea
            id="advice"
            rows={2}
            value={advice}
            onChange={(e) => setAdvice(e.target.value)}
            placeholder="General advice…"
            className="w-full rounded-lg border border-border bg-surface-2/60 px-3.5 py-2.5 text-[15px] text-foreground outline-none focus:border-primary focus:bg-surface"
          />
        </div>
        <div>
          <Label htmlFor="followup">Follow-up date (optional)</Label>
          <Input id="followup" type="date" value={followUp} onChange={(e) => setFollowUp(e.target.value)} />
        </div>

        {error && (
          <p className="rounded-lg bg-emergency-soft px-3.5 py-2.5 text-sm font-medium text-emergency">
            {error}
          </p>
        )}
        <Button className="w-full" disabled={loading} onClick={submit}>
          {loading ? "Saving…" : "Save prescription"}
        </Button>
      </CardBody>
    </Card>
  );
}
