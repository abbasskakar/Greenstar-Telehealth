-- Let a patient delete their own appointment request (adds to the admin policy).
drop policy if exists appt_delete_own on appointments;
create policy appt_delete_own on appointments for delete
  using (created_by = auth.uid());
