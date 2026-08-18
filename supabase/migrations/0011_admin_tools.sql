-- =====================================================================
-- Greenstar Telehealth — Admin tools (0011)
-- =====================================================================

-- Admins can delete appointments (e.g. completed/cancelled cleanup)
drop policy if exists appt_delete on appointments;
create policy appt_delete on appointments for delete using (auth_role() = 'admin');

-- Realtime on profiles for the live duty roster
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='profiles') then
    alter publication supabase_realtime add table profiles;
  end if;
end $$;
