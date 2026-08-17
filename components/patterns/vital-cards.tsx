import {
  HeartPulse,
  Activity,
  Thermometer,
  Wind,
  Droplet,
  Droplets,
} from "lucide-react";
import {
  type Vitals,
  bpTone,
  heartRateTone,
  temperatureTone,
  spo2Tone,
  hemoglobinTone,
  bloodSugarTone,
  toneClasses,
} from "@/lib/vitals";
import { cn } from "@/lib/utils";

export function VitalCards({ vitals }: { vitals: Vitals }) {
  const bp =
    vitals.bp_systolic && vitals.bp_diastolic
      ? `${vitals.bp_systolic}/${vitals.bp_diastolic}`
      : "—";

  const items = [
    { label: "Blood Pressure", value: bp, unit: "mmHg", Icon: Activity, tone: bpTone(vitals.bp_systolic, vitals.bp_diastolic) },
    { label: "Heart Rate", value: vitals.heart_rate ?? "—", unit: "bpm", Icon: HeartPulse, tone: heartRateTone(vitals.heart_rate) },
    { label: "Temperature", value: vitals.temperature_f ?? "—", unit: "°F", Icon: Thermometer, tone: temperatureTone(vitals.temperature_f) },
    { label: "SpO₂", value: vitals.spo2 ?? "—", unit: "%", Icon: Wind, tone: spo2Tone(vitals.spo2) },
    { label: "Hemoglobin", value: vitals.hemoglobin ?? "—", unit: "g/dL", Icon: Droplet, tone: hemoglobinTone(vitals.hemoglobin) },
    { label: "Blood Sugar", value: vitals.blood_sugar ?? "—", unit: "mg/dL", Icon: Droplets, tone: bloodSugarTone(vitals.blood_sugar) },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map(({ label, value, unit, Icon, tone }) => (
        <div
          key={label}
          className="rounded-xl border border-border bg-surface p-3.5 text-center shadow-card"
        >
          <Icon size={18} className={cn("mx-auto mb-1.5", toneClasses[tone])} />
          <p className={cn("font-mono text-xl font-bold tabular-nums", toneClasses[tone])}>
            {value}
            {value !== "—" && <span className="ml-0.5 text-xs font-medium text-muted-2">{unit}</span>}
          </p>
          <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-2">
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}

/** Compact one-line vitals summary for list cards (BP · HR · SpO₂). */
export function VitalSummary({ vitals }: { vitals: Vitals }) {
  const parts: { label: string; value: string; tone: ReturnType<typeof heartRateTone> }[] = [];
  if (vitals.bp_systolic && vitals.bp_diastolic)
    parts.push({ label: "BP", value: `${vitals.bp_systolic}/${vitals.bp_diastolic}`, tone: bpTone(vitals.bp_systolic, vitals.bp_diastolic) });
  if (vitals.heart_rate != null)
    parts.push({ label: "HR", value: `${vitals.heart_rate}`, tone: heartRateTone(vitals.heart_rate) });
  if (vitals.spo2 != null)
    parts.push({ label: "SpO₂", value: `${vitals.spo2}%`, tone: spo2Tone(vitals.spo2) });
  if (!parts.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-surface-2/70 px-3 py-2 text-sm">
      {parts.map((p) => (
        <span key={p.label} className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-muted-2">{p.label}</span>
          <span className={cn("font-mono font-semibold tabular-nums", toneClasses[p.tone])}>
            {p.value}
          </span>
        </span>
      ))}
    </div>
  );
}
