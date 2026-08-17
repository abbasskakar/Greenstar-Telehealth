-- Field workers capture age (years) rather than date of birth.
alter table patients add column if not exists age int;
