/**
 * Seed (or reset) an admin account via the service-role key.
 *   node --env-file=.env.local scripts/seed-admin.mjs [email] [password] [full name]
 * Defaults: admin@greenstar.health / Greenstar@123 / System Administrator
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("✗ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const email = process.argv[2] || "admin@greenstar.health";
const password = process.argv[3] || "Greenstar@123";
const fullName = process.argv[4] || "System Administrator";

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUserByEmail(email) {
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;
    if (data.users.length < 200) return null;
    page++;
  }
}

async function main() {
  let userId;
  const existing = await findUserByEmail(email);

  if (existing) {
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { role: "admin", full_name: fullName },
    });
    if (error) throw error;
    userId = existing.id;
    console.log("↻ Updated existing admin:", email);
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: "admin", full_name: fullName },
    });
    if (error) throw error;
    userId = data.user.id;
    console.log("✓ Created admin:", email);
  }

  // Guarantee the profile row reflects admin role (bypasses RLS via service key).
  const { error: pErr } = await admin
    .from("profiles")
    .upsert({ id: userId, role: "admin", full_name: fullName, is_active: true });
  if (pErr) throw pErr;

  console.log("\n  Email:   ", email);
  console.log("  Password:", password);
  console.log("  Role:    ", "admin");
  console.log("\n✓ Admin ready. Change the password after first login.");
}

main().catch((e) => {
  console.error("✗", e.message ?? e);
  process.exit(1);
});
