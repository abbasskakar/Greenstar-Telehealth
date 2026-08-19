"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter the patient's name"),
  age: z.number().int().min(0).max(130).nullable().optional(),
  gender: z.string().optional(),
  contact: z.string().trim().optional(),
  allergies: z.string().trim().optional(),
});

export async function addPatient(input: {
  full_name: string;
  age?: number | null;
  gender?: string;
  contact?: string;
  allergies?: string;
}): Promise<{ ok: boolean; error?: string; id?: string }> {
  const { profile } = await requireRole("provider");
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const d = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patients")
    .insert({
      full_name: d.full_name,
      age: d.age ?? null,
      gender: d.gender || null,
      contact: d.contact || null,
      allergies: d.allergies || null,
      created_by: profile.id,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  revalidatePath("/provider/patients");
  return { ok: true, id: data.id };
}
