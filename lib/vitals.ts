export type VitalTone = "normal" | "borderline" | "abnormal" | "unknown";

export type Vitals = {
  bp_systolic?: number | null;
  bp_diastolic?: number | null;
  heart_rate?: number | null;
  temperature_f?: number | null;
  spo2?: number | null;
  hemoglobin?: number | null;
  blood_sugar?: number | null;
};

function band(
  v: number | null | undefined,
  normal: [number, number],
  borderline: [number, number],
): VitalTone {
  if (v == null || Number.isNaN(v)) return "unknown";
  if (v >= normal[0] && v <= normal[1]) return "normal";
  if (v >= borderline[0] && v <= borderline[1]) return "borderline";
  return "abnormal";
}

export function heartRateTone(v?: number | null) {
  return band(v, [60, 100], [50, 120]);
}
export function temperatureTone(v?: number | null) {
  return band(v, [97, 99.5], [95, 101]);
}
export function spo2Tone(v?: number | null): VitalTone {
  if (v == null || Number.isNaN(v)) return "unknown";
  if (v >= 95) return "normal";
  if (v >= 90) return "borderline";
  return "abnormal";
}
export function hemoglobinTone(v?: number | null) {
  return band(v, [12, 17.5], [10, 19]);
}
export function bloodSugarTone(v?: number | null) {
  return band(v, [70, 140], [54, 200]);
}
export function bpTone(s?: number | null, d?: number | null): VitalTone {
  if (s == null || d == null) return "unknown";
  if (s >= 90 && s <= 120 && d >= 60 && d <= 80) return "normal";
  if (s <= 139 && d <= 89) return "borderline";
  return "abnormal";
}

export const toneClasses: Record<VitalTone, string> = {
  normal: "text-success",
  borderline: "text-warning",
  abnormal: "text-emergency",
  unknown: "text-foreground",
};
