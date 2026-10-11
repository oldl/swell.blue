-- Base schema. After running it, apply every file in supabase/migrations/ in name order.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.spots (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  municipality text not null,
  region text not null default 'West-Vlaanderen',
  country_code text not null default 'BE',
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  break_type text not null default 'beach_break',
  source_name text,
  source_url text,
  is_curated boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.spots alter column latitude drop not null;
alter table public.spots alter column longitude drop not null;

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  spot_id uuid references public.spots (id) on delete set null,
  spot text not null,
  date date not null,
  time text,
  hours text,
  wave_size text,
  tide text,
  swell_direction text,
  wind_type text,
  water_temp numeric(4,1),
  wave_shape text,
  current text,
  crowd text,
  suit text,
  session_type text,
  with_who text,
  board text,
  rating integer check (rating between 1 and 10),
  comments text,
  conditions_source text,
  conditions_source_time timestamptz,
  wave_height_m numeric,
  swell_height_m numeric,
  swell_period_s numeric,
  wind_speed_kmh numeric,
  current_speed_kmh numeric,
  sea_level_m numeric,
  created_at timestamptz not null default now()
);

alter table public.sessions
add column if not exists spot_id uuid references public.spots (id) on delete set null;

alter table public.sessions add column if not exists conditions_source text;
alter table public.sessions add column if not exists conditions_source_time timestamptz;
alter table public.sessions add column if not exists wave_height_m numeric;
alter table public.sessions add column if not exists swell_height_m numeric;
alter table public.sessions add column if not exists swell_period_s numeric;
alter table public.sessions add column if not exists wind_speed_kmh numeric;
alter table public.sessions add column if not exists current_speed_kmh numeric;
alter table public.sessions add column if not exists sea_level_m numeric;

create index if not exists sessions_spot_id_idx on public.sessions (spot_id);

alter table public.profiles enable row level security;
alter table public.spots enable row level security;
alter table public.sessions enable row level security;

drop policy if exists "spots are readable by authenticated users" on public.spots;

create policy "spots are readable by authenticated users"
on public.spots
for select
to authenticated
using (true);

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

insert into public.spots (
  slug,
  name,
  municipality,
  latitude,
  longitude,
  break_type,
  source_name,
  source_url
)
values
  ('blankenberge', 'Blankenberge', 'Blankenberge', 51.318818, 3.142200, 'pier_break', 'Belgian Coast surf guides', null),
  ('casino-break', 'Casino Break', 'Knokke-Heist', 51.348659, 3.278608, 'beach_break', 'Belgian Coast surf guides', null),
  ('de-haan', 'De Haan', 'De Haan', 51.282055, 3.038658, 'beach_break', 'Belgian Coast surf guides', null),
  ('li-li-bay', 'Li Li Bay', 'À confirmer', null, null, 'beach_break', 'Catalogue utilisateur', null),
  ('mariakerke', 'Mariakerke', 'Oostende', 51.223697, 2.882830, 'beach_break', 'BreakFinder', 'https://breakfinder.surf/nl/surf_spots/mariakerke'),
  ('middelkerke', 'Middelkerke', 'Middelkerke', 51.189911, 2.806330, 'beach_break', 'BreakFinder', 'https://breakfinder.surf/en/surf_spots/middelkerke'),
  ('nieuwpoort', 'Nieuwpoort', 'Nieuwpoort', 51.140317, 2.685433, 'beach_jetty', 'Wave Safari', 'https://www.wavesafari.com/nieuwpoort/'),
  ('ollies-point', 'Ollies Point', 'Oostende', 51.218650, 2.874650, 'beach_break', 'BreakFinder', 'https://breakfinder.surf/fr/surf_spots/ollie-s-point'),
  ('oostduinkerke', 'Oostduinkerke', 'Koksijde', 51.134000, 2.671400, 'beach_break', 'KitesurfGo', 'https://kitesurfgo.com/spots/oostduinkerke'),
  ('oostende', 'Oostende', 'Oostende', 51.235000, 2.913050, 'beach_break', 'Wave Safari', 'https://www.wavesafari.com/oostende-centrum/'),
  ('surfers-paradise', 'Surfer''s Paradise', 'Knokke-Heist', 51.361226, 3.327319, 'beach_break', 'Surfers Paradise', 'https://www.surfersparadise.be/'),
  ('westende', 'Westende', 'Middelkerke', 51.167825, 2.766235, 'beach_break', 'Surfclub Westende', 'https://www.surfclubwn.be/'),
  ('zeebrugge', 'Zeebrugge', 'Brugge', 51.332133, 3.165750, 'harbour_wall', 'WannaSurf', 'https://www.wannasurf.com/spot/Europe/Belgium/zeebrugge')
on conflict (slug) do update set
  name = excluded.name,
  municipality = excluded.municipality,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  break_type = excluded.break_type,
  source_name = excluded.source_name,
  source_url = excluded.source_url,
  is_curated = true;

update public.spots
set is_curated = false
where country_code = 'BE'
  and slug in (
    'de-panne-side-shore',
    'groenendijk-strand',
    'westende-de-kwinte',
    'mariakerke-ollies-point',
    'oostende-outside',
    'oostende-fort-napoleon',
    'bredene-twins',
    'de-haan-windhaan',
    'blankenberge-pier',
    'knokke-surfers-paradise'
  );

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
