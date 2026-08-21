"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Activity, HeartPulse, Thermometer, Wind, Droplet, Droplets, CheckCircle2, Loader2 } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { recordAssignedVitals } from "@/app/provider/visit/actions";

const FIELDS = [
  { key: "heart_rate", label: "Heart rate", unit: "bpm", Icon: HeartPulse },
  { key: "temperature_f", label: "Temperature", unit: "°F", Icon: Thermometer },
  { key: "spo2", label: "SpO2", unit: "%", Icon: Wind },
  { key: "hemoglobin", label: "Hemoglobin", unit: "g/dL", Icon: Droplet },
  { key: "blood_sugar", label: "Blood sugar", unit: "mg/dL", Icon: Droplets },
] as const;

function num(s: string): number | null {
  if (s.trim() === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function VitalsForm({ appointmentId }: { appointmentId: string }) {
  const router = useRouter();
  const [bpSys, setBpSys] = React.useState("");
  const [bpDia, setBpDia] = React.useState("");
  const [v, setV] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);

  async function submit() {
    setLoading(true);
    setError(null);
    const res = await recordAssignedVitals(appointmentId, {
      bp_systolic: num(bpSys),
      bp_diastolic: num(bpDia),
      heart_rate: num(v.heart_rate ?? ""),
      temperature_f: num(v.temperature_f ?? ""),
      spo2: num(v.spo2 ?? ""),
      hemoglobin: num(v.hemoglobin ?? ""),
      blood_sugar: num(v.blood_sugar ?? ""),
    });
    setLoading(false);
    if (!res.ok) setError(res.error ?? "Could not save vitals.");
    else setDone(true);
  }

  if (done) {
    return (
      <Card>
        <CardBody className="flex flex-col items-center gap-3 py-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success-soft text-success">
            <CheckCircle2 size={26} />
          </span>
          <p className="text-lg font-bold text-foreground">Vitals recorded</p>
          <p className="max-w-xs text-sm text-muted">The assigned doctor has been notified and can now review the case.</p>
          <Button className="mt-1" onClick={() => router.push("/provider")}>Back home</Button>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody className="space-y-4">
        <p className="flex items-center gap-2 font-bold text-foreground">
          <Activity size={18} className="text-primary" /> Record vitals
        </p>

        <div>
          <Label htmlFor="bp">Blood pressure (mmHg)</Label>
          <div className="flex items-center gap-2">
            <Input id="bp" inputMode="numeric" placeholder="Systolic" value={bpSys} onChange={(e) => setBpSys(e.target.value.replace(/\D/g, ""))} className="min-w-0 flex-1" />
            <span className="text-muted-2">/</span>
            <Input inputMode="numeric" placeholder="Diastolic" value={bpDia} onChange={(e) => setBpDia(e.target.value.replace(/\D/g, ""))} className="min-w-0 flex-1" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {FIELDS.map(({ key, label, unit, Icon }) => (
            <div key={key}>
              <Label htmlFor={key}>{label} <span className="text-muted-2">({unit})</span></Label>
              <Input
                id={key}
                inputMode="numeric"
                value={v[key] ?? ""}
                onChange={(e) => setV((p) => ({ ...p, [key]: e.target.value.replace(/[^\d.]/g, "") }))}
                icon={<Icon size={16} />}
              />
            </div>
          ))}
        </div>

        {error && (
          <p className="rounded-lg bg-emergency-soft px-3.5 py-2.5 text-sm font-medium text-emergency">{error}</p>
        )}
        <Button className="w-full" disabled={loading} onClick={submit}>
          {loading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
          {loading ? "Saving…" : "Save vitals"}
        </Button>
      </CardBody>
    </Card>
  );
}
