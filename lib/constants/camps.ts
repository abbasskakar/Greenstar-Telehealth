export const CAMP_TYPES = [
  { key: "health_camp", label: "Health Camp", counter: "patients_seen", counterLabel: "Patients seen" },
  { key: "blood_donation", label: "Blood Donation", counter: "blood_units", counterLabel: "Blood units collected" },
  { key: "vaccination", label: "Vaccination Drive", counter: "vaccines", counterLabel: "Vaccines administered" },
  { key: "awareness", label: "Awareness Session", counter: "attendees", counterLabel: "Attendees" },
  { key: "other", label: "Other", counter: "people_reached", counterLabel: "People reached" },
] as const;

export type CampType = (typeof CAMP_TYPES)[number]["key"];

export const campMeta = (type: string) =>
  CAMP_TYPES.find((c) => c.key === type) ?? CAMP_TYPES[0];

export const CAMP_TONE: Record<string, string> = {
  health_camp: "bg-info-soft text-info",
  blood_donation: "bg-emergency-soft text-emergency",
  vaccination: "bg-success-soft text-success",
  awareness: "bg-purple-soft text-purple",
  other: "bg-surface-2 text-muted",
};
