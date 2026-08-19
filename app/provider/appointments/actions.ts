"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: boolean; error?: string };

/** Edit a still-pending appointment the provider created. */
export async function updateProviderAppointment(
  id: string,
  patch: { specialty: string; chief_complaint: string; emergency?: boolean },
): Promise<Result> {
  const { profile } = await requireRole("provider");
  if (!patch.specialty?.trim()) return { ok: false, error: "Select a specialty." };

  const supabase = await createClient();
  const { data: appt } = await supabase
    .from("appointments")
    .select("status, created_by")
    .eq("id", id)
    .single();
  if (!appt || appt.created_by !== profile.id)
    return { ok: false, error: "Appointment not found." };
  if (appt.status !== "pending")
    return { ok: false, error: "Only pending appointments can be edited." };

  const { error } = await supabase
    .from("appointments")
    .update({
      specialty: patch.specialty.trim(),
      chief_complaint: patch.chief_complaint?.trim() || null,
      type: patch.emergency ? "emergency" : "regular",
    })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
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
