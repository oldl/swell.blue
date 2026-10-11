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

alter table public.spots enable row level security;

drop policy if exists "spots are readable by authenticated users" on public.spots;

create policy "spots are readable by authenticated users"
on public.spots
for select
to authenticated
using (true);

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
