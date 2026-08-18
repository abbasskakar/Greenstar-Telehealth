"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type RxItem = {
  drug: string;
  dose?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
};

type Result = { ok: boolean; error?: string; id?: string };

export async function createPrescription(
  appointmentId: string,
  items: RxItem[],
  advice: string,
  followUpDate: string | null,
): Promise<Result> {
  const { profile } = await requireRole("doctor");
  const clean = items
    .map((i) => ({
      drug: i.drug?.trim() ?? "",
      dose: i.dose?.trim() || null,
      frequency: i.frequency?.trim() || null,
      duration: i.duration?.trim() || null,
      instructions: i.instructions?.trim() || null,
    }))
    .filter((i) => i.drug);
  if (!clean.length) return { ok: false, error: "Add at least one medicine." };

  const supabase = await createClient();
  const { data: appt } = await supabase
    .from("appointments")
    .select("patient_id, specialty")
    .eq("id", appointmentId)
    .single();

  const { data, error } = await supabase
    .from("prescriptions")
    .insert({
      appointment_id: appointmentId,
      patient_id: appt?.patient_id ?? null,
      doctor_id: profile.id,
      doctor_name: profile.full_name,
      specialty: appt?.specialty ?? profile.specialty ?? null,
      items: clean,
      advice: advice.trim() || null,
      follow_up_date: followUpDate || null,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/doctor/appointments/${appointmentId}`);
  return { ok: true, id: data.id };
}

export async function createLabRequest(
  appointmentId: string,
  tests: string[],
  notes: string,
): Promise<Result> {
  const { profile } = await requireRole("doctor");
  const clean = tests.map((t) => t.trim()).filter(Boolean);
  if (!clean.length) return { ok: false, error: "Add at least one test." };

  const supabase = await createClient();
  const { data: appt } = await supabase
    .from("appointments")
    .select("patient_id")
    .eq("id", appointmentId)
    .single();

  const { error } = await supabase.from("lab_requests").insert({
    appointment_id: appointmentId,
    patient_id: appt?.patient_id ?? null,
    doctor_id: profile.id,
    doctor_name: profile.full_name,
    tests: clean,
    notes: notes.trim() || null,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/doctor/appointments/${appointmentId}`);
  return { ok: true };
}

export async function addLabResult(
  labId: string,
  appointmentId: string,
  resultNote: string,
  filePaths: string[],
): Promise<Result> {
  await requireRole(["provider", "public", "doctor"]);
  const supabase = await createClient();
  const { error } = await supabase
    .from("lab_requests")
    .update({
      result_note: resultNote.trim() || null,
      result_files: filePaths,
      status: "resulted",
    })
    .eq("id", labId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/provider/appointments/${appointmentId}`);
  revalidatePath(`/doctor/appointments/${appointmentId}`);
  return { ok: true };
}
