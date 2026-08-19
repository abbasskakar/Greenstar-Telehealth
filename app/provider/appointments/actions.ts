"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: boolean; error?: string };

export type Vitals6 = {
  bp_systolic?: number | null;
  bp_diastolic?: number | null;
  heart_rate?: number | null;
  temperature_f?: number | null;
  spo2?: number | null;
  hemoglobin?: number | null;
  blood_sugar?: number | null;
};

/** Edit a still-pending appointment the provider created — patient, request, and vitals. */
export async function updateProviderAppointment(
  id: string,
  patch: {
    patient: { full_name: string; age: number | null; gender: string; contact: string };
    specialty: string;
    chief_complaint: string;
    emergency?: boolean;
    vitals: Vitals6;
  },
): Promise<Result> {
  const { profile } = await requireRole("provider");
  if (!patch.specialty?.trim()) return { ok: false, error: "Select a specialty." };
  if (!patch.patient.full_name?.trim()) return { ok: false, error: "Enter the patient's name." };

  const supabase = await createClient();
  const { data: appt } = await supabase
    .from("appointments")
    .select("status, created_by, patient_id")
    .eq("id", id)
    .single();
  if (!appt || appt.created_by !== profile.id)
    return { ok: false, error: "Appointment not found." };
  if (appt.status !== "pending")
    return { ok: false, error: "Only pending appointments can be edited." };

  // 1) Patient
  const { error: pErr } = await supabase
    .from("patients")
    .update({
      full_name: patch.patient.full_name.trim(),
      age: patch.patient.age ?? null,
      gender: patch.patient.gender || null,
      contact: patch.patient.contact || null,
    })
    .eq("id", appt.patient_id);
  if (pErr) return { ok: false, error: pErr.message };

  // 2) Appointment
  const { error: aErr } = await supabase
    .from("appointments")
    .update({
      specialty: patch.specialty.trim(),
      chief_complaint: patch.chief_complaint?.trim() || null,
      type: patch.emergency ? "emergency" : "regular",
    })
    .eq("id", id);
  if (aErr) return { ok: false, error: aErr.message };

  // 3) Vitals — update existing row or insert if any value was entered
  const hasVitals = Object.values(patch.vitals).some((x) => x != null);
  const { data: existingV } = await supabase
    .from("vitals")
    .select("id")
    .eq("appointment_id", id)
    .maybeSingle();
  if (existingV) {
    await supabase.from("vitals").update({ ...patch.vitals }).eq("id", existingV.id);
  } else if (hasVitals) {
    await supabase.from("vitals").insert({
      patient_id: appt.patient_id,
      appointment_id: id,
      captured_by: profile.id,
      ...patch.vitals,
    });
  }

  revalidatePath("/provider");
  revalidatePath(`/provider/appointments/${id}`);
  return { ok: true };
}

/** Delete an appointment the provider created. */
export async function deleteProviderAppointment(id: string): Promise<Result> {
  const { profile } = await requireRole("provider");
  const supabase = await createClient();
  const { data: appt } = await supabase
    .from("appointments")
    .select("created_by")
    .eq("id", id)
    .single();
  if (!appt || appt.created_by !== profile.id)
    return { ok: false, error: "Appointment not found." };

  const { error } = await supabase.from("appointments").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/provider");
  return { ok: true };
}
