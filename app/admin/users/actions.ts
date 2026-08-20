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

export type UserDetail = {
  id: string;
  full_name: string;
  role: string;
  specialty: string | null;
  phone: string | null;
  duty: "on_duty" | "off_duty";
  is_active: boolean;
  avatar_url: string | null;
  created_at: string;
};
export type UserAppt = {
  id: string;
  type: string;
  status: string;
  specialty: string | null;
  created_at: string;
  assigned_doctor_name: string | null;
};

/** Full detail for the admin user popup. */
export async function getUserDetail(
  userId: string,
): Promise<{ ok: boolean; user?: UserDetail; appointments?: UserAppt[] }> {
  await requireRole("admin");
  const admin = createAdminClient();
  const { data: user } = await admin
    .from("profiles")
    .select("id, full_name, role, specialty, phone, duty, is_active, avatar_url, created_at")
    .eq("id", userId)
    .maybeSingle();
  if (!user) return { ok: false };

  const isDoctor = user.role === "doctor";
  const { data: appts } = await admin
    .from("appointments")
    .select("id, type, status, specialty, created_at, assigned_doctor_name")
    .or(isDoctor ? `assigned_doctor_id.eq.${userId}` : `created_by.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(30);

  return { ok: true, user: user as UserDetail, appointments: (appts ?? []) as UserAppt[] };
}

/** Permanently delete a user account (cascades their profile). */
export async function deleteStaffUser(userId: string): Promise<ActionResult> {
  const { profile } = await requireRole("admin");
  if (userId === profile.id)
    return { ok: false, error: "You can't delete your own account." };

  const admin = createAdminClient();
  const { data: target } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  if (!target) return { ok: false, error: "User not found." };
  if (target.role === "admin")
    return { ok: false, error: "Admin accounts can't be deleted here." };

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/users");
  return { ok: true };
}
