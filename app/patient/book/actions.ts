"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter the patient's name"),
  age: z.number().int().min(0).max(120).nullable().optional(),
  gender: z.string().trim().optional(),
  specialty: z.string().trim().min(1, "Select a specialty"),
  chief_complaint: z.string().trim().min(3, "Describe your concern"),
  emergency: z.boolean().optional(),
});

export async function createPublicAppointment(input: {
  full_name: string;
  age?: number | null;
  gender?: string;
  specialty: string;
  chief_complaint: string;
  emergency?: boolean;
}): Promise<{ ok: boolean; error?: string; id?: string }> {
  const { profile } = await requireRole("public");
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: patient } = await supabase
    .from("patients")
    .select("id")
    .eq("owner_id", profile.id)
    .maybeSingle();
  if (!patient) return { ok: false, error: "Your patient profile was not found." };

  // Keep the patient record in sync with what was entered at booking.
  await supabase
    .from("patients")
    .update({
      full_name: parsed.data.full_name,
      age: parsed.data.age ?? null,
      gender: parsed.data.gender || null,
    })
    .eq("id", patient.id);

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      patient_id: patient.id,
      created_by: profile.id,
      type: parsed.data.emergency ? "emergency" : "regular",
      specialty: parsed.data.specialty,
      chief_complaint: parsed.data.chief_complaint,
      status: "pending",
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  revalidatePath("/patient");
  return { ok: true, id: data.id };
}
