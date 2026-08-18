"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: boolean; error?: string; id?: string };
const ROLES = ["admin", "program_manager", "provider"] as const;

export async function createCamp(input: {
  type: string;
  title: string;
  date_start: string;
  date_end?: string | null;
  location?: string;
  team?: string;
  expected_turnout?: number | null;
  notes?: string;
  geo?: { lat: number; lng: number } | null;
}): Promise<Result> {
  const { profile } = await requireRole([...ROLES]);
  if (!input.title?.trim()) return { ok: false, error: "Enter a title." };
  if (!input.date_start) return { ok: false, error: "Pick a start date." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("camps")
    .insert({
      type: input.type,
      title: input.title.trim(),
      date_start: input.date_start,
      date_end: input.date_end || null,
      location: input.location?.trim() || null,
      team: input.team?.trim() || null,
      expected_turnout: input.expected_turnout ?? null,
      notes: input.notes?.trim() || null,
      geo_lat: input.geo?.lat ?? null,
      geo_lng: input.geo?.lng ?? null,
      created_by: profile.id,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/program/camps");
  return { ok: true, id: data.id };
}

export async function updateCamp(
  id: string,
  patch: {
    actual_turnout?: number | null;
    counters?: Record<string, number>;
    status?: string;
    photos?: string[];
    stock?: Record<string, { available: number; used: number }>;
  },
): Promise<Result> {
  await requireRole([...ROLES]);
  const supabase = await createClient();
  const { error } = await supabase.from("camps").update(patch).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/program/camps/${id}`);
  revalidatePath("/program/camps");
  return { ok: true };
}
