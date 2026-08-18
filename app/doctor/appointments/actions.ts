"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: boolean; error?: string };

/** Claim-and-lock: only the first doctor to accept a pending case wins. */
export async function claimAppointment(id: string): Promise<Result> {
  const { profile } = await requireRole("doctor");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("appointments")
    .update({
      status: "claimed",
      assigned_doctor_id: profile.id,
      assigned_doctor_name: profile.full_name,
    })
    .eq("id", id)
    .eq("status", "pending")
    .select("id");
  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0)
    return { ok: false, error: "This case was already taken by another doctor." };
  revalidatePath("/doctor");
  revalidatePath(`/doctor/appointments/${id}`);
  return { ok: true };
}

export async function updateAppointmentStatus(
  id: string,
  status: "in_consult" | "completed" | "cancelled",
): Promise<Result> {
  await requireRole("doctor");
  const supabase = await createClient();
  const { error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/doctor");
  revalidatePath(`/doctor/appointments/${id}`);
  return { ok: true };
}
