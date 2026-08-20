-- Push fan-out via pg_net (replaces the dashboard Database Webhook, which needs
-- the supabase_functions schema this project lacks). On every notifications
-- INSERT, POST the row to the app's /api/push endpoint, which sends the FCM push.
--
-- The endpoint URL and shared secret live in the app_settings table (locked to
-- the SECURITY DEFINER trigger owner; anon/authenticated have no access), so no
-- secret lives in this committed file. Set them once, out of band:
--   insert into app_settings(key,value) values
--     ('push_url','https://<domain>/api/push'),
--     ('push_secret','<PUSH_WEBHOOK_SECRET>')
--   on conflict (key) do update set value = excluded.value;
create extension if not exists pg_net;

-- Internal key/value config, not exposed to the API (RLS on, no policies, no grants).
create table if not exists app_settings (
  key   text primary key,
  value text not null
);
alter table app_settings enable row level security;
revoke all on table app_settings from anon, authenticated;

create or replace function public.push_on_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  url    text;
  secret text;
begin
  select value into url    from app_settings where key = 'push_url';
  select value into secret from app_settings where key = 'push_secret';
  if url is null or secret is null or url = '' or secret = '' then
    return new;  -- push not configured yet; skip quietly (in-app realtime still works)
  end if;
  perform net.http_post(
    url     := url,
    body    := to_jsonb(new),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', secret
    )
  );
  return new;
end $$;

drop trigger if exists trg_push_notification on notifications;
create trigger trg_push_notification
  after insert on notifications
  for each row execute function public.push_on_notification();
