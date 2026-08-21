"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type Result = { ok: boolean; error?: string };

type VitalsInput = {
  bp_systolic?: number | null;
  bp_diastolic?: number | null;
  heart_rate?: number | null;
  temperature_f?: number | null;
  spo2?: number | null;
  hemoglobin?: number | null;
  blood_sugar?: number | null;
};

/** A nurse (provider) records vitals for a case the admin assigned to them. */
export async function recordAssignedVitals(
  appointmentId: string,
  vitals: VitalsInput,
): Promise<Result> {
  const { profile } = await requireRole("provider");
  const supabase = await createClient();

  const { data: appt } = await supabase
    .from("appointments")
    .select("id, patient_id, assigned_nurse_id, assigned_doctor_id, patient:patients ( full_name )")
    .eq("id", appointmentId)
    .maybeSingle();
  if (!appt || appt.assigned_nurse_id !== profile.id)
    return { ok: false, error: "This visit is not assigned to you." };

  const { error } = await supabase.from("vitals").insert({
    appointment_id: appointmentId,
    patient_id: appt.patient_id,
    captured_by: profile.id,
    ...vitals,
  });
  if (error) return { ok: false, error: error.message };

  // Let the assigned doctor know the vitals are ready.
  if (appt.assigned_doctor_id) {
    const patientName =
      (appt.patient as unknown as { full_name: string } | null)?.full_name ?? null;
    await createAdminClient()
      .from("notifications")
      .insert({
        user_id: appt.assigned_doctor_id,
        type: "status",
        title: "Vitals recorded",
        body: patientName ? `${patientName}'s vitals are ready to review.` : "Vitals are ready to review.",
        appointment_id: appointmentId,
        patient_name: patientName,
      });
  }

  revalidatePath("/provider");
  revalidatePath(`/provider/visit/${appointmentId}`);
  return { ok: true };
}
