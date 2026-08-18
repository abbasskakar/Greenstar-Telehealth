import {
  type Vitals,
  heartRateTone,
  temperatureTone,
  spo2Tone,
  hemoglobinTone,
  bloodSugarTone,
  bpTone,
  toneClasses,
} from "@/lib/vitals";
import { Card, CardBody } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function Spark({ values, className }: { values: (number | null | undefined)[]; className?: string }) {
  const vals = values.filter((v): v is number => v != null && !Number.isNaN(v));
  if (vals.length < 2) return <span className="text-xs text-muted-2">—</span>;
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const pts = vals
    .map((v, i) => `${(i / (vals.length - 1)) * 100},${29 - ((v - min) / range) * 26}`)
    .join(" ");
  const last = vals[vals.length - 1];
  const lastX = 100;
  const lastY = 29 - ((last - min) / range) * 26;
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className={cn("h-8 w-full", className)}>
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="2.5" fill="currentColor" />
    </svg>
  );
}

export function VitalTrends({ series }: { series: Vitals[] }) {
  // series: oldest → newest
  if (series.length < 2) return null;

  const rows = [
    { label: "Blood Pressure (sys)", values: series.map((v) => v.bp_systolic), tone: bpTone(series.at(-1)?.bp_systolic, series.at(-1)?.bp_diastolic) },
    { label: "Heart Rate", values: series.map((v) => v.heart_rate), tone: heartRateTone(series.at(-1)?.heart_rate) },
    { label: "Temperature", values: series.map((v) => v.temperature_f), tone: temperatureTone(series.at(-1)?.temperature_f) },
    { label: "SpO₂", values: series.map((v) => v.spo2), tone: spo2Tone(series.at(-1)?.spo2) },
    { label: "Hemoglobin", values: series.map((v) => v.hemoglobin), tone: hemoglobinTone(series.at(-1)?.hemoglobin) },
    { label: "Blood Sugar", values: series.map((v) => v.blood_sugar), tone: bloodSugarTone(series.at(-1)?.blood_sugar) },
  ];

  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-foreground">Vital trends</p>
          <span className="text-xs text-muted-2">{series.length} visits</span>
        </div>
        <div className="space-y-2.5">
          {rows.map((r) => (
            <div key={r.label} className="grid grid-cols-[1fr_auto] items-center gap-3">
              <div className="flex items-center gap-3">
                <span className="w-36 shrink-0 text-sm text-muted">{r.label}</span>
                <div className={cn("min-w-0 flex-1", toneClasses[r.tone])}>
                  <Spark values={r.values} />
                </div>
              </div>
              <span className={cn("w-12 text-right font-mono text-sm font-semibold tabular-nums", toneClasses[r.tone])}>
                {r.values.at(-1) ?? "—"}
              </span>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
