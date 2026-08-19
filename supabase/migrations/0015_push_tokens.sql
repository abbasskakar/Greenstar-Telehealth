-- Device push tokens (FCM) per user, for app-closed notifications.
create table if not exists push_tokens (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  token      text not null unique,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table push_tokens enable row level security;

drop policy if exists push_tokens_own on push_tokens;
create policy push_tokens_own on push_tokens for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create index if not exists idx_push_tokens_user on push_tokens(user_id);
