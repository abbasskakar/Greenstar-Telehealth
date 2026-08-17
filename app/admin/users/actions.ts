"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

const createSchema = z.object({
  full_name: z.string().trim().min(2, "Enter a full name"),
  email: z.string().trim().email("Enter a valid email"),
  role: z.enum(["doctor", "provider", "program_manager"]),
  specialty: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type CreateStaffInput = z.infer<typeof createSchema>;
export type ActionResult = { ok: boolean; error?: string };

export async function createStaffUser(input: CreateStaffInput): Promise<ActionResult> {
  const { profile } = await requireRole("admin");
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const { full_name, email, role, specialty, phone, password } = parsed.data;

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role, full_name, phone },
  });
  if (error) {
    return {
      ok: false,
      error: error.message.includes("already")
        ? "A user with this email already exists."
        : error.message,
    };
  }

  // Trigger creates the base profile; set the fields it doesn't carry.
  const { error: pErr } = await admin
    .from("profiles")
    .update({
      full_name,
      role,
      phone: phone || null,
      specialty: role === "doctor" ? specialty || null : null,
      created_by: profile.id,
      is_active: true,
    })
    .eq("id", data.user.id);
  if (pErr) return { ok: false, error: pErr.message };

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function setUserActive(
  userId: string,
  isActive: boolean,
): Promise<ActionResult> {
  await requireRole("admin");
  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", userId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function resetUserPassword(
  userId: string,
  password: string,
): Promise<ActionResult> {
  await requireRole("admin");
  if (password.length < 8)
    return { ok: false, error: "Password must be at least 8 characters" };
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
