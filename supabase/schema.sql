create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  spot text not null,
  date date not null,
  time text,
  hours text,
  wave_size text,
  tide text,
  swell_direction text,
  wind_type text,
  water_temp integer,
  wave_shape text,
  current text,
  crowd text,
  suit text,
  session_type text,
  with_who text,
  board text,
  rating integer check (rating between 1 and 10),
  comments text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.sessions enable row level security;

create policy "profiles are readable by owner"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "profiles are insertable by owner"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

create policy "profiles are updatable by owner"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "sessions are readable by owner"
on public.sessions
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "sessions are insertable by owner"
on public.sessions
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "sessions are updatable by owner"
on public.sessions
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "sessions are deletable by owner"
on public.sessions
for delete
to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
