"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function deleteAppointment(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase.from("appointments").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/appointments");
  return { ok: true };
}
