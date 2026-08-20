"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

  // If a call for this appointment is already live, rejoin it instead of
  // spawning a second ringing session (and a duplicate provider notification).
  const { data: existing } = await supabase
    .from("call_sessions")
    .select("id, room_name")
    .eq("appointment_id", appointmentId)
    .in("status", ["ringing", "active"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing) {
    return { ok: true, sessionId: existing.id, roomName: existing.room_name };
  }

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

  // Notify the provider of the incoming call (green). The realtime overlay
  // handles the live ringing; this leaves a record in their Calls tab.
  if (appt.created_by) {
    await createAdminClient()
      .from("notifications")
      .insert({
        user_id: appt.created_by,
        type: "call",
        title: `Incoming video call from ${profile.full_name}`,
        body: "A doctor is calling for this appointment.",
        appointment_id: appointmentId,
        patient_name: patientName,
      });
  }

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
