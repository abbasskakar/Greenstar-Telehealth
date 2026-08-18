-- =====================================================================
-- Greenstar Telehealth — Video call sessions (0005)
-- =====================================================================

do $$ begin
  create type call_status as enum ('ringing','active','declined','ended','missed');
exception when duplicate_object then null; end $$;

create table if not exists call_sessions (
  id             uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references appointments(id) on delete cascade,
  room_name      text not null,
  doctor_id      uuid references profiles(id) on delete set null,
  provider_id    uuid references profiles(id) on delete set null,
  status         call_status not null default 'ringing',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

drop trigger if exists trg_call_updated on call_sessions;
create trigger trg_call_updated before update on call_sessions
  for each row execute function set_updated_at();

create index if not exists idx_call_provider on call_sessions(provider_id, status);
create index if not exists idx_call_appt     on call_sessions(appointment_id);

alter table call_sessions enable row level security;

drop policy if exists call_select on call_sessions;
create policy call_select on call_sessions for select using (
  doctor_id = auth.uid() or provider_id = auth.uid()
);

drop policy if exists call_insert on call_sessions;
create policy call_insert on call_sessions for insert with check (
  doctor_id = auth.uid()
);

drop policy if exists call_update on call_sessions;
create policy call_update on call_sessions for update using (
  doctor_id = auth.uid() or provider_id = auth.uid()
);

-- Realtime for incoming-call signalling
do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='call_sessions'
  ) then
    alter publication supabase_realtime add table call_sessions;
  end if;
end $$;
