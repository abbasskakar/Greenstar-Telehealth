"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: boolean; error?: string };

/** Patient withdraws their own request while it is still pending/accepted. */
export async function cancelMyAppointment(id: string): Promise<Result> {
  const { profile } = await requireRole("public");
  const supabase = await createClient();

  const { data: appt } = await supabase
    .from("appointments")
    .select("id, status, created_by")
    .eq("id", id)
    .single();
  if (!appt || appt.created_by !== profile.id)
    return { ok: false, error: "Appointment not found." };
  if (["completed", "cancelled"].includes(appt.status))
    return { ok: false, error: "This appointment can no longer be cancelled." };
  if (appt.status === "in_consult")
    return { ok: false, error: "A consultation is already in progress." };

  const { error } = await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/patient");
  revalidatePath(`/patient/appointments/${id}`);
  return { ok: true };
}

/** Edit a still-pending request (specialty, concern, urgency). */
export async function updateMyAppointment(
  id: string,
  patch: { specialty: string; chief_complaint: string; emergency?: boolean },
): Promise<Result> {
  const { profile } = await requireRole("public");
  if (!patch.specialty?.trim()) return { ok: false, error: "Select a specialty." };
  if ((patch.chief_complaint?.trim().length ?? 0) < 3)
    return { ok: false, error: "Describe your concern." };

  const supabase = await createClient();
  const { data: appt } = await supabase
    .from("appointments")
    .select("status, created_by")
    .eq("id", id)
    .single();
  if (!appt || appt.created_by !== profile.id)
    return { ok: false, error: "Appointment not found." };
  if (appt.status !== "pending")
    return { ok: false, error: "Only pending requests can be edited." };

  const { error } = await supabase
    .from("appointments")
    .update({
      specialty: patch.specialty.trim(),
      chief_complaint: patch.chief_complaint.trim(),
      type: patch.emergency ? "emergency" : "regular",
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/patient");
  revalidatePath(`/patient/appointments/${id}`);
  return { ok: true };
}

/** Permanently delete the patient's own appointment.
 *  Only pending or cancelled requests can be removed — a claimed/in-consult/
 *  completed appointment carries clinical records (prescriptions, labs, notes,
 *  vitals) that must be preserved, so deletion is blocked there. */
export async function deleteMyAppointment(id: string): Promise<Result> {
  const { profile } = await requireRole("public");
  const supabase = await createClient();
  const { data: appt } = await supabase
    .from("appointments")
    .select("status, created_by")
    .eq("id", id)
    .single();
  if (!appt || appt.created_by !== profile.id)
    return { ok: false, error: "Appointment not found." };
  if (!["pending", "cancelled"].includes(appt.status))
    return {
      ok: false,
      error: "This appointment has clinical records and can’t be deleted. Cancel it instead.",
    };

  const { error } = await supabase.from("appointments").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/patient");
  return { ok: true };
}

const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your name"),
  phone: z
    .string()
    .trim()
    .max(20)
    .optional()
    .or(z.literal("")),
});

export async function updateMyProfile(input: {
  full_name: string;
  phone?: string;
}): Promise<Result> {
  const { profile } = await requireRole("public");
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      phone: parsed.data.phone?.trim() || null,
    })
    .eq("id", profile.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/patient/profile");
  return { ok: true };
}

export async function changeMyPassword(newPassword: string): Promise<Result> {
  await requireRole("public");
  if (!newPassword || newPassword.length < 8)
    return { ok: false, error: "Password must be at least 8 characters." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
