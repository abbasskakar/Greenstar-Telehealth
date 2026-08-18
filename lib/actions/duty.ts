"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function setDuty(
  status: "on_duty" | "off_duty",
): Promise<{ ok: boolean; error?: string }> {
  const { profile } = await requireRole(["doctor", "provider"]);
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ duty: status })
    .eq("id", profile.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/doctor");
  revalidatePath("/provider");
  return { ok: true };
}
