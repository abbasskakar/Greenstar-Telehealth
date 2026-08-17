-- =====================================================================
-- ONE-TIME BOOTSTRAP — paste into Supabase → SQL Editor → Run.
-- Creates a helper so the app's tooling can apply migrations directly
-- using the service-role key. Restricted to service_role only (which
-- already has full DB access, so this adds convenience, not new risk).
-- =====================================================================
create or replace function public.exec_sql(query text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  -- Try to run it as a query and return rows as JSON…
  execute format('select coalesce(jsonb_agg(t), ''[]''::jsonb) from (%s) t', query)
    into result;
  return result;
exception when others then
  -- …otherwise it's DDL/DML: just execute it.
  execute query;
  return '[]'::jsonb;
end;
$$;

revoke all on function public.exec_sql(text) from public;
grant execute on function public.exec_sql(text) to service_role;
