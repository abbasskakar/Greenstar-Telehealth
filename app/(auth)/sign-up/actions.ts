"use server";

import { createHash } from "node:crypto";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { cnicSchema } from "@/lib/validation/cnic";

const schema = z.object({
  cnic: cnicSchema,
  username: z.string().trim().min(2, "Choose a username"),
  full_name: z.string().trim().min(2, "Enter your full name"),
  age: z.number().int().min(0).max(130).nullable().optional(),
  gender: z.string().optional(),
  contact: z.string().trim().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type SignUpInput = z.input<typeof schema>;
export type Result = { ok: boolean; error?: string; email?: string };

export async function signUpPublic(input: SignUpInput): Promise<Result> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const d = parsed.data;

  const email = `cnic+${d.cnic}@greenstar.local`;
  const admin = createAdminClient();

  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password: d.password,
    email_confirm: true,
    user_metadata: { role: "public", full_name: d.full_name, username: d.username },
  });
  if (error) {
    return {
      ok: false,
      error: error.message.includes("already")
        ? "This CNIC is already registered. Please log in."
        : error.message,
    };
  }

  const userId = created.user.id;
  const cnicHash = createHash("sha256").update(d.cnic).digest("hex");

  const { error: pErr } = await admin.from("patients").insert({
    full_name: d.full_name,
    age: d.age ?? null,
    gender: d.gender || null,
    contact: d.contact || null,
    cnic_hash: cnicHash,
    owner_id: userId,
    created_by: userId,
  });
  if (pErr) return { ok: false, error: pErr.message };

  return { ok: true, email };
}
