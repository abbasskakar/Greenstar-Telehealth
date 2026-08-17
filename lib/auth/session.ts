import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROLE_HOME, type Role } from "./roles";

export type Profile = {
  id: string;
  role: Role;
  full_name: string;
  username: string | null;
  phone: string | null;
  specialty: string | null;
  duty: "on_duty" | "off_duty";
  language: string;
  is_active: boolean;
};

/** Current user + profile, memoized per request. Null if signed out. */
export const getSessionProfile = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  return { user, profile };
});

/** Require an authenticated user with one of the allowed roles, else redirect. */
export async function requireRole(allowed: Role | Role[]) {
  const session = await getSessionProfile();
  if (!session) redirect("/login");
  const roles = Array.isArray(allowed) ? allowed : [allowed];
  const profile = session.profile;
  if (!profile || !profile.is_active) redirect("/login");
  if (!roles.includes(profile.role)) redirect(ROLE_HOME[profile.role]);
  return { user: session.user, profile };
}
