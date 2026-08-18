"use server";

import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: boolean; error?: string };

const ROLES = ["doctor", "provider", "public"] as const;

export async function addTextNote(
  appointmentId: string,
  body: string,
): Promise<Result> {
  const { profile } = await requireRole([...ROLES]);
  const text = body.trim();
  if (!text) return { ok: false, error: "Note is empty" };
  if (text.length > 1000) return { ok: false, error: "Notes are limited to 1000 characters" };

  const supabase = await createClient();
  const { error } = await supabase.from("notes").insert({
    appointment_id: appointmentId,
    author_id: profile.id,
    author_name: profile.full_name,
    author_role: profile.role,
    kind: "text",
    body: text,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function addVoiceNote(
  appointmentId: string,
  audioPath: string,
  durationSec: number,
): Promise<Result> {
  const { profile } = await requireRole([...ROLES]);
  const supabase = await createClient();
  const { error } = await supabase.from("notes").insert({
    appointment_id: appointmentId,
    author_id: profile.id,
    author_name: profile.full_name,
    author_role: profile.role,
    kind: "voice",
    audio_path: audioPath,
    duration_sec: Math.round(durationSec),
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function captureConsent(
  appointmentId: string,
  patientId: string | null,
  method: string,
): Promise<Result> {
  const { profile } = await requireRole([...ROLES]);
  const supabase = await createClient();
  const { error } = await supabase.from("consents").insert({
    appointment_id: appointmentId,
    patient_id: patientId,
    granted_by: profile.id,
    granted_by_name: profile.full_name,
    method,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
