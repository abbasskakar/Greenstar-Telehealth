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
    .update({
      duty: status,
      last_active_at: status === "on_duty" ? new Date().toISOString() : null,
    })
    .eq("id", profile.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/doctor");
  revalidatePath("/provider");
  return { ok: true };
}

/** Heartbeat: keeps an on-duty user "effective online" so the auto-offline
 *  job doesn't flip them. Called periodically from the dashboard. */
export async function touchActivity(): Promise<void> {
  const session = await requireRole(["doctor", "provider"]).catch(() => null);
  if (!session) return;
  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({ last_active_at: new Date().toISOString() })
    .eq("id", session.profile.id)
    .eq("duty", "on_duty");
}
