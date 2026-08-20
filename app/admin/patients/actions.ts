"use server";

import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Vitals } from "@/lib/vitals";
import type { Prescription } from "@/components/rx/prescription-view";

export type PatientDetail = {
  id: string;
  full_name: string;
  age: number | null;
  gender: string | null;
  contact: string | null;
  allergies: string | null;
  mrn: string | null;
  cnic_last4: string | null;
  owner_id: string | null;
  created_at: string;
};
export type PatientAppt = {
  id: string;
  type: string;
  status: string;
  specialty: string | null;
  created_at: string;
  assigned_doctor_name: string | null;
};
export type LabRow = { id: string; tests: string[]; status: string };

export async function getPatientDetail(patientId: string): Promise<{
  ok: boolean;
  patient?: PatientDetail;
  appointments?: PatientAppt[];
  latestVitals?: Vitals | null;
  prescriptions?: Prescription[];
  labs?: LabRow[];
}> {
  await requireRole("admin");
  const admin = createAdminClient();

  const { data: patient } = await admin
    .from("patients")
    .select("id, full_name, age, gender, contact, allergies, mrn, cnic_last4, owner_id, created_at")
    .eq("id", patientId)
    .maybeSingle();
  if (!patient) return { ok: false };

  const [{ data: appts }, { data: vitalRows }] = await Promise.all([
    admin
      .from("appointments")
      .select("id, type, status, specialty, created_at, assigned_doctor_name")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false }),
    admin
      .from("vitals")
      .select("bp_systolic, bp_diastolic, heart_rate, temperature_f, spo2, hemoglobin, blood_sugar, captured_at")
      .eq("patient_id", patientId)
      .order("captured_at", { ascending: false })
      .limit(1),
  ]);

  const apptIds = (appts ?? []).map((a) => a.id);
  const [{ data: rxList }, { data: labList }] = await Promise.all([
    apptIds.length
      ? admin.from("prescriptions").select("*").in("appointment_id", apptIds).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as unknown[] }),
    apptIds.length
      ? admin.from("lab_requests").select("id, tests, status").in("appointment_id", apptIds).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as LabRow[] }),
  ]);

  return {
    ok: true,
    patient: patient as PatientDetail,
    appointments: (appts ?? []) as PatientAppt[],
    latestVitals: ((vitalRows ?? []) as unknown as Vitals[])[0] ?? null,
    prescriptions: (rxList ?? []) as Prescription[],
    labs: (labList ?? []) as LabRow[],
  };
}
