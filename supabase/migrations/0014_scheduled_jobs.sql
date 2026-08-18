-- =====================================================================
-- Greenstar Telehealth — Scheduled jobs via pg_cron (0014)
-- =====================================================================
create extension if not exists pg_cron;

-- Auto-set stale on-duty staff to Off Duty (no heartbeat for >15 min)
select cron.schedule(
  'gs-auto-offline',
  '*/5 * * * *',
  $$update profiles set duty='off_duty'
    where duty='on_duty'
      and (last_active_at is null or last_active_at < now() - interval '15 minutes')$$
);

-- Re-broadcast an emergency if the claiming doctor never started the call
select cron.schedule(
  'gs-rebroadcast',
  '* * * * *',
  $$update appointments
      set status='pending', assigned_doctor_id=null, assigned_doctor_name=null, claimed_at=null
    where type='emergency' and status='claimed'
      and call_started_at is null
      and claimed_at < now() - interval '3 minutes'$$
);
