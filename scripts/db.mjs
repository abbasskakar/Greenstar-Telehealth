/**
 * Greenstar DB tool — runs SQL against Supabase directly via the service-role key
 * and an `exec_sql` RPC (no direct Postgres connection needed).
 *
 * Usage (Node 20+ has built-in --env-file and fetch):
 *   node --env-file=.env.local scripts/db.mjs migrate
 *   node --env-file=.env.local scripts/db.mjs query "select count(*) from profiles"
 *   node --env-file=.env.local scripts/db.mjs file supabase/migrations/0002_x.sql
 *   node --env-file=.env.local scripts/db.mjs ping
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const MIGRATIONS_DIR = join(ROOT, "supabase", "migrations");

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) {
  console.error("✗ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  console.error("  Run with: node --env-file=.env.local scripts/db.mjs ...");
  process.exit(1);
}

/** Run SQL through the exec_sql RPC. Returns rows (for SELECT) or []. */
async function sql(query) {
  const res = await fetch(`${URL}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });
  const text = await res.text();
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error(
        "exec_sql RPC not found. Paste supabase/bootstrap_exec_sql.sql into the Supabase SQL Editor once, then retry.",
      );
    }
    throw new Error(`${res.status} ${text}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    return [];
  }
}

async function ping() {
  const r = await sql("select now() as now, current_database() as db");
  console.log("✓ Connected:", r?.[0] ?? r);
}

async function migrate() {
  await sql(
    "create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now());",
  );
  const rows = await sql("select name from schema_migrations order by name");
  const applied = new Set((rows ?? []).map((r) => r.name));

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  let ran = 0;
  for (const file of files) {
    if (applied.has(file)) {
      console.log(`• skip   ${file}`);
      continue;
    }
    process.stdout.write(`→ apply  ${file} ... `);
    const body = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    await sql(body);
    await sql(
      `insert into schema_migrations(name) values ('${file}') on conflict do nothing;`,
    );
    console.log("✓");
    ran++;
  }
  console.log(ran ? `\n✓ Applied ${ran} migration(s).` : "\n✓ Up to date.");
}

async function runFile(path) {
  await sql(readFileSync(join(ROOT, path), "utf8"));
  console.log(`✓ Ran ${path}`);
}

async function query(q) {
  const rows = await sql(q);
  console.table(rows);
  console.log(`(${Array.isArray(rows) ? rows.length : 0} row(s))`);
}

const [cmd, ...rest] = process.argv.slice(2);
try {
  if (cmd === "ping") await ping();
  else if (cmd === "migrate") await migrate();
  else if (cmd === "file") await runFile(rest[0]);
  else if (cmd === "query") await query(rest.join(" "));
  else {
    console.error("Unknown command. Use: ping | migrate | file <path> | query <sql>");
    process.exit(1);
  }
} catch (e) {
  console.error("✗", e.message);
  process.exit(1);
}
