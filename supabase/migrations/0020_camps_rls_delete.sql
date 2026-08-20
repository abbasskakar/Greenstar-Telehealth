-- Tighten camps write access to admin + program_manager (provider has no camps
-- UI, so the earlier provider grant was latent over-permission), and add a
-- delete policy so camps can be removed from the UI.
drop policy if exists camps_insert on camps;
create policy camps_insert on camps for insert with check (
  auth_role() in ('admin','program_manager')
);

drop policy if exists camps_update on camps;
create policy camps_update on camps for update using (
  auth_role() in ('admin','program_manager')
);

drop policy if exists camps_delete on camps;
create policy camps_delete on camps for delete using (
  auth_role() in ('admin','program_manager')
);
