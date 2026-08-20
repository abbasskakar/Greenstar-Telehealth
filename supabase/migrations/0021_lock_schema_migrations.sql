-- Harden the internal migrations bookkeeping table. It holds no app/patient
-- data, but with RLS off and anon/authenticated grants it was readable/writable
-- through the public REST API. Lock it down: revoke API-role access and enable
-- RLS with no policies (deny-all). The service_role client (db.mjs) bypasses RLS,
-- so migrations keep working.
revoke all on table public.schema_migrations from anon, authenticated;
alter table public.schema_migrations enable row level security;
