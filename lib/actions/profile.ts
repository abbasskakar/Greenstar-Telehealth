"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: boolean; error?: string };

const STAFF = ["provider", "doctor", "admin", "program_manager"] as const;

/** Update the signed-in user's own name + phone (RLS restricts to self). */
export async function updateMyBasicProfile(input: {
  full_name: string;
  phone?: string;
}): Promise<Result> {
  const { profile } = await requireRole([...STAFF]);
  if (!input.full_name?.trim()) return { ok: false, error: "Enter your name." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: input.full_name.trim(),
      phone: input.phone?.trim() || null,
    })
    .eq("id", profile.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/provider/profile");
  revalidatePath("/doctor/profile");
  return { ok: true };
}

/** Change the signed-in staff user's own password. */
export async function changeMyStaffPassword(newPassword: string): Promise<Result> {
  await requireRole([...STAFF]);
  if (!newPassword || newPassword.length < 8)
    return { ok: false, error: "Password must be at least 8 characters." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
