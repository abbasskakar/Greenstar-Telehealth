"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function deleteAppointment(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase.from("appointments").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/appointments");
  return { ok: true };
}

/**
 * Admin triage: assign a doctor (by specialty) and/or a nurse (a provider who
 * records vitals) to a pending appointment. Assigning a doctor moves the case
 * to `claimed`; the nurse assignment is tracked separately.
 */
export async function assignCase(
  appointmentId: string,
  opts: { doctorId?: string | null; nurseId?: string | null },
): Promise<{ ok: boolean; error?: string }> {
  await requireRole("admin");
  const supabase = await createClient();
  const admin = createAdminClient();

  const patch: Record<string, unknown> = {};

  if (opts.doctorId) {
    const { data: doc } = await admin
      .from("profiles")
      .select("full_name, role, is_active")
      .eq("id", opts.doctorId)
      .maybeSingle();
    if (!doc || doc.role !== "doctor") return { ok: false, error: "Select a valid doctor." };
    patch.assigned_doctor_id = opts.doctorId;
    patch.assigned_doctor_name = doc.full_name;
    patch.status = "claimed";
  }
  if (opts.nurseId) {
    const { data: nur } = await admin
      .from("profiles")
      .select("full_name, role, is_active")
      .eq("id", opts.nurseId)
      .maybeSingle();
    if (!nur || nur.role !== "provider")
      return { ok: false, error: "Select a valid nurse (field worker)." };
    patch.assigned_nurse_id = opts.nurseId;
    patch.assigned_nurse_name = nur.full_name;
  }
  if (Object.keys(patch).length === 0)
    return { ok: false, error: "Choose a doctor or a nurse to assign." };

  // Update via the admin's own session so the change is audit-logged.
  const { data: appt, error } = await supabase
    .from("appointments")
    .update(patch)
    .eq("id", appointmentId)
    .select("id, specialty, patient:patients ( full_name )")
    .single();
  if (error) return { ok: false, error: error.message };

  const patientName =
    (appt.patient as unknown as { full_name: string } | null)?.full_name ?? null;

  const notifs: Record<string, unknown>[] = [];
  if (opts.doctorId)
    notifs.push({
      user_id: opts.doctorId,
      type: "status",
      title: `New case assigned${appt.specialty ? ` · ${appt.specialty}` : ""}`,
      body: patientName ? `Patient: ${patientName}` : "A case has been assigned to you.",
      appointment_id: appointmentId,
      patient_name: patientName,
    });
  if (opts.nurseId)
    notifs.push({
      user_id: opts.nurseId,
      type: "status",
      title: "Vitals visit assigned",
      body: patientName ? `Record vitals for ${patientName}` : "Record vitals for a patient.",
      appointment_id: appointmentId,
      patient_name: patientName,
    });
  if (notifs.length) await admin.from("notifications").insert(notifs);

  revalidatePath("/admin/appointments");
  return { ok: true };
}
