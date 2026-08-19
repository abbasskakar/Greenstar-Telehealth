import type { SupabaseClient } from "@supabase/supabase-js";

/** Map of profile id → avatar_url for the given ids (missing/none → null). */
export async function fetchAvatars(
  supabase: SupabaseClient,
  ids: (string | null | undefined)[],
): Promise<Record<string, string | null>> {
  const unique = [...new Set(ids.filter((x): x is string => !!x))];
  if (!unique.length) return {};
  const { data } = await supabase
    .from("profiles")
    .select("id, avatar_url")
    .in("id", unique);
  const map: Record<string, string | null> = {};
  for (const row of data ?? []) map[row.id] = row.avatar_url;
  return map;
}
