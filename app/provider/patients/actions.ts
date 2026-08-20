"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cnicSchema } from "@/lib/validation/cnic";
import { encryptCnic, hashCnic } from "@/lib/crypto";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter the patient's name"),
  age: z.number().int().min(0).max(130).nullable().optional(),
  gender: z.string().optional(),
  contact: z.string().trim().optional(),
  allergies: z.string().trim().optional(),
  cnic: z.string().trim().optional(),
  password: z.string().optional(),
});

export type AddPatientResult = {
  ok: boolean;
  error?: string;
  id?: string;
  /** Present when a login account was created for the patient. */
  login?: { cnic: string; password: string };
};

function randomPassword() {
  return "Gs" + Math.floor(100000 + Math.random() * 900000).toString();
}

export async function addPatient(input: {
  full_name: string;
  age?: number | null;
  gender?: string;
  contact?: string;
  allergies?: string;
  cnic?: string;
  password?: string;
}): Promise<AddPatientResult> {
  const { profile } = await requireRole("provider");
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const d = parsed.data;

  // --- With CNIC: also create a login account so the patient can book themselves.
  if (d.cnic && d.cnic.trim()) {
    const cnicParsed = cnicSchema.safeParse(d.cnic);
    if (!cnicParsed.success) return { ok: false, error: cnicParsed.error.issues[0].message };
    const cnic = cnicParsed.data;
    const password = d.password && d.password.length >= 8 ? d.password : randomPassword();
    const email = `cnic+${cnic}@greenstar.local`;
    const admin = createAdminClient();

    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: "public", full_name: d.full_name },
    });
    if (error) {
      return {
        ok: false,
        error: error.message.includes("already")
          ? "This CNIC is already registered — the patient can log in already."
          : error.message,
      };
    }
    const userId = created.user.id;

    const { data: pat, error: pErr } = await admin
      .from("patients")
      .insert({
        full_name: d.full_name,
        age: d.age ?? null,
        gender: d.gender || null,
        contact: d.contact || null,
        allergies: d.allergies || null,
        cnic_hash: hashCnic(cnic),
        cnic_enc: encryptCnic(cnic),
        cnic_last4: cnic.slice(-4),
        owner_id: userId,
        created_by: profile.id,
      })
      .select("id")
      .single();
    if (pErr) return { ok: false, error: pErr.message };

    // Service-role insert → log explicitly (the trigger can't see the actor).
    await logAudit(profile.id, "create", "patients", pat.id, { full_name: d.full_name, with_login: true });
    revalidatePath("/provider/patients");
    return { ok: true, id: pat.id, login: { cnic, password } };
  }

  // --- No CNIC: registry-only patient (no login).
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
