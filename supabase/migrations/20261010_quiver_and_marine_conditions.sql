-- Brings an existing Wave Log database up to date with the prototype (index.html):
--   * water temperature accepts decimals (Open-Meteo returns e.g. 17.4)
--   * measured / Open-Meteo marine conditions stored on each session
--   * per-user quiver (board profiles) with RLS
-- Safe to run more than once.

-- ── Sessions ──────────────────────────────────────────────
alter table public.sessions
  alter column water_temp type numeric(4,1) using water_temp::numeric;

alter table public.sessions
  add column if not exists wave_height_m          numeric(4,2),
  add column if not exists swell_height_m         numeric(4,2),
  add column if not exists swell_period_s         numeric(4,1),
  add column if not exists wind_speed_kmh         numeric(5,1),
  add column if not exists current_speed_kmh      numeric(5,2),
  add column if not exists sea_level_m            numeric(5,2),
  add column if not exists conditions_source      text,
  add column if not exists conditions_source_time timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'sessions_marine_values_check') then
    alter table public.sessions add constraint sessions_marine_values_check check (
      (wave_height_m     is null or wave_height_m     >= 0) and
      (swell_height_m    is null or swell_height_m    >= 0) and
      (swell_period_s    is null or swell_period_s    >= 0) and
      (wind_speed_kmh    is null or wind_speed_kmh    >= 0) and
      (current_speed_kmh is null or current_speed_kmh >= 0)
    );
  end if;
end $$;

create index if not exists sessions_user_date_idx on public.sessions (user_id, date desc);

-- ── Quiver ────────────────────────────────────────────────
-- sessions.board stays free text; a board profile is matched by (user_id, name).
create table if not exists public.boards (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  name            text not null check (length(btrim(name)) > 0),
  model           text,
  volume_l        numeric(4,1) check (volume_l is null or volume_l > 0),
  dimensions      text,
  status          text check (status in ('Daily driver', 'In rotation', 'Step-up', 'Retired', 'For sale')),
  best_conditions text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, name)
);

alter table public.boards enable row level security;

drop policy if exists "boards are readable by owner" on public.boards;
create policy "boards are readable by owner"
on public.boards for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "boards are insertable by owner" on public.boards;
create policy "boards are insertable by owner"
on public.boards for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "boards are updatable by owner" on public.boards;
create policy "boards are updatable by owner"
on public.boards for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "boards are deletable by owner" on public.boards;
create policy "boards are deletable by owner"
on public.boards for delete to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists boards_set_updated_at on public.boards;
create trigger boards_set_updated_at
  before update on public.boards
  for each row execute procedure public.set_updated_at();

-- Renaming a board in the quiver renames it in the user's sessions in one transaction.
-- security invoker: RLS still applies, so a user can only touch their own rows.
create or replace function public.rename_board(old_name text, new_name text)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new_name is null or length(btrim(new_name)) = 0 then
    raise exception 'Board name cannot be empty';
  end if;

  update public.sessions set board = btrim(new_name)
  where user_id = auth.uid() and board = old_name;

  -- Merge into an existing profile with the target name if there is one.
  if exists (select 1 from public.boards where user_id = auth.uid() and name = btrim(new_name)) then
    delete from public.boards where user_id = auth.uid() and name = old_name;
  else
    update public.boards set name = btrim(new_name)
    where user_id = auth.uid() and name = old_name;
  end if;
end;
$$;
