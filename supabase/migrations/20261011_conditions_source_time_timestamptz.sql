-- Databases where 20261010_quiver_and_marine_conditions ran before 20261010_add_belgian_spots
-- got sessions.conditions_source_time as text. Align it with schema.sql (timestamptz).
-- No-op when the column is already timestamptz. Safe to run more than once.
alter table public.sessions
  alter column conditions_source_time type timestamptz
  using nullif(conditions_source_time::text, '')::timestamptz;
