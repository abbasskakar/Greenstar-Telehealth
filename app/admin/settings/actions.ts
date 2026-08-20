"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export async function erasePatientByMrn(
  mrn: string,
): Promise<{ ok: boolean; error?: string; name?: string }> {
  await requireRole("admin");
  const admin = createAdminClient();

  const { data: patient } = await admin
    .from("patients")
    .select("id, full_name, owner_id")
    .eq("mrn", mrn.trim())
    .maybeSingle();
  if (!patient) return { ok: false, error: "No patient found with that MRN." };

  // Delete the clinical record (appointments, vitals, etc. cascade).
  const { error } = await admin.from("patients").delete().eq("id", patient.id);
  if (error) return { ok: false, error: error.message };

  // Also remove the linked login, if the patient self-registered.
  if (patient.owner_id) {
    await admin.auth.admin.deleteUser(patient.owner_id).catch(() => {});
  }

  revalidatePath("/admin/settings");
  return { ok: true, name: patient.full_name };
}
