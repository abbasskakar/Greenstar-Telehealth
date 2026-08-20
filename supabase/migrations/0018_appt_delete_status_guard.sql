-- Tighten the patient self-delete policy: a patient may only delete their own
-- appointment while it is still pending or already cancelled. Claimed/in-consult/
-- completed appointments carry clinical records (prescriptions, labs, notes,
-- vitals) and must be preserved. Defense-in-depth alongside the server action.
drop policy if exists appt_delete_own on appointments;
create policy appt_delete_own on appointments for delete
  using (
    created_by = auth.uid()
    and status in ('pending', 'cancelled')
  );
