"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function erasePatientByMrn(
  mrn: string,
): Promise<{ ok: boolean; error?: string; name?: string }> {
  await requireRole("admin");
  const supabase = await createClient();
  const { data: patient } = await supabase
    .from("patients")
    .select("id, full_name")
    .eq("mrn", mrn.trim())
    .maybeSingle();
  if (!patient) return { ok: false, error: "No patient found with that MRN." };

  const { error } = await supabase.from("patients").delete().eq("id", patient.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/settings");
  return { ok: true, name: patient.full_name };
}
