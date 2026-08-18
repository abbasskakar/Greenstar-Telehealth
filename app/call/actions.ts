"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

type StartResult =
  | { ok: true; sessionId: string; roomName: string }
  | { ok: false; error: string };

/** Doctor initiates a video call for an appointment. */
export async function startCall(appointmentId: string): Promise<StartResult> {
  const { profile } = await requireRole("doctor");
  const supabase = await createClient();

  const { data: appt, error: aErr } = await supabase
    .from("appointments")
    .select("id, created_by, status, patient:patients ( full_name )")
    .eq("id", appointmentId)
    .single();
  if (aErr || !appt) return { ok: false, error: "Appointment not found." };

  const roomName = `greenstar-${appointmentId}`;
  const patientName =
    (appt.patient as unknown as { full_name: string } | null)?.full_name ?? null;

  await supabase
    .from("appointments")
    .update({ status: "in_consult" })
    .eq("id", appointmentId);

  const { data: session, error } = await supabase
    .from("call_sessions")
    .insert({
      appointment_id: appointmentId,
      room_name: roomName,
      doctor_id: profile.id,
      provider_id: appt.created_by,
      doctor_name: profile.full_name,
      patient_name: patientName,
      status: "ringing",
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/doctor/appointments/${appointmentId}`);
  return { ok: true, sessionId: session.id, roomName };
}

export async function acceptCall(
  sessionId: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireRole(["provider", "public"]);
  const supabase = await createClient();
  const { error } = await supabase
    .from("call_sessions")
    .update({ status: "active" })
    .eq("id", sessionId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function declineCall(
  sessionId: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireRole(["provider", "public"]);
  const supabase = await createClient();
  const { error } = await supabase
    .from("call_sessions")
    .update({ status: "declined" })
    .eq("id", sessionId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function endCall(
  sessionId: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireRole(["doctor", "provider", "public"]);
  const supabase = await createClient();
  const { error } = await supabase
    .from("call_sessions")
    .update({ status: "ended" })
    .eq("id", sessionId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
