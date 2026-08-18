"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const vitalsSchema = z.object({
  bp_systolic: z.number().int().nullable().optional(),
  bp_diastolic: z.number().int().nullable().optional(),
  heart_rate: z.number().int().nullable().optional(),
  temperature_f: z.number().nullable().optional(),
  spo2: z.number().int().nullable().optional(),
  hemoglobin: z.number().nullable().optional(),
  blood_sugar: z.number().int().nullable().optional(),
});

const schema = z.object({
  patientId: z.string().uuid().optional(),
  patient: z
    .object({
      full_name: z.string().trim().min(2, "Enter the patient's name"),
      age: z.number().int().min(0).max(130).nullable().optional(),
      gender: z.string().optional(),
      contact: z.string().trim().optional(),
    })
    .optional(),
  type: z.enum(["emergency", "regular"]),
  specialty: z.string().trim().min(1, "Select a specialty"),
  chief_complaint: z.string().trim().optional(),
  camp_id: z.string().uuid().nullable().optional(),
  vitals: vitalsSchema,
  geo: z.object({ lat: z.number(), lng: z.number() }).nullable().optional(),
});

export type CreateAppointmentInput = z.infer<typeof schema>;
export type Result = { ok: boolean; error?: string; appointmentId?: string };

export async function createAppointment(
  input: CreateAppointmentInput,
): Promise<Result> {
  const { profile } = await requireRole("provider");
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const data = parsed.data;

  if (!data.patientId && !data.patient) {
    return { ok: false, error: "Select or add a patient" };
  }

  const supabase = await createClient();

  // 1) Resolve patient (existing or new)
  let patientId = data.patientId;
  if (!patientId && data.patient) {
    const { data: pat, error } = await supabase
      .from("patients")
      .insert({
        full_name: data.patient.full_name,
        age: data.patient.age ?? null,
        gender: data.patient.gender || null,
        contact: data.patient.contact || null,
        created_by: profile.id,
      })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    patientId = pat.id;
  }

  // 2) Create the appointment
  const { data: appt, error: aErr } = await supabase
    .from("appointments")
    .insert({
      patient_id: patientId,
      created_by: profile.id,
      type: data.type,
      specialty: data.specialty,
      chief_complaint: data.chief_complaint || null,
      camp_id: data.camp_id ?? null,
      geo_lat: data.geo?.lat ?? null,
      geo_lng: data.geo?.lng ?? null,
      status: "pending",
    })
    .select("id")
    .single();
  if (aErr) return { ok: false, error: aErr.message };

  // 3) Record vitals if any were entered
  const v = data.vitals;
  const hasVitals = Object.values(v).some((x) => x != null);
  if (hasVitals) {
    const { error: vErr } = await supabase.from("vitals").insert({
      patient_id: patientId,
      appointment_id: appt.id,
      captured_by: profile.id,
      ...v,
    });
    if (vErr) return { ok: false, error: vErr.message };
  }

  revalidatePath("/provider");
  revalidatePath("/provider/patients");
  revalidatePath("/doctor");
  return { ok: true, appointmentId: appt.id };
}
