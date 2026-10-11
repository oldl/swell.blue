-- Run after 20261011_add_fr_es_pt_spots.sql. Safe to run more than once.

-- ── Spot orientation ──────────────────────────────────────
-- Compass bearing the beach faces (towards the sea), in degrees. Wind blowing FROM this
-- bearing is onshore, from the opposite bearing offshore. Approximate values per spot.
alter table public.spots
  add column if not exists facing_deg smallint;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'spots_facing_deg_check') then
    alter table public.spots add constraint spots_facing_deg_check
      check (facing_deg is null or facing_deg between 0 and 359);
  end if;
end $$;

update public.spots as s
set facing_deg = v.facing_deg
from (values
  -- Belgium: the whole coast faces north-west
  ('blankenberge', 315), ('casino-break', 320), ('de-haan', 315), ('li-li-bay', 315),
  ('mariakerke', 315), ('middelkerke', 315), ('nieuwpoort', 315), ('ollies-point', 315),
  ('oostduinkerke', 315), ('oostende', 315), ('surfers-paradise', 320), ('westende', 315),
  ('zeebrugge', 320),
  -- France
  ('fr-la-graviere', 270), ('fr-la-nord', 270), ('fr-les-culs-nus', 270), ('fr-les-estagnots', 270),
  ('fr-la-piste', 270), ('fr-lacanau-ocean', 270), ('fr-le-porge', 270), ('fr-biscarrosse-plage', 270),
  ('fr-les-cavaliers', 300), ('fr-parlementia', 315), ('fr-lafitenia', 330), ('fr-hendaye', 340),
  ('fr-la-torche', 250), ('fr-la-palue', 270), ('fr-sainte-barbe', 240), ('fr-guidel', 225),
  ('fr-bud-bud', 240), ('fr-la-sauzaie', 260),
  -- Spain: the Cantabrian coast faces north, Galicia and the Canaries vary
  ('es-mundaka', 0), ('es-zarautz', 350), ('es-la-zurriola', 15), ('es-sopelana', 315),
  ('es-bakio', 340), ('es-somo', 350), ('es-liencres', 330), ('es-rodiles', 0), ('es-salinas', 340),
  ('es-pantin', 300), ('es-razo', 300), ('es-patos', 260),
  ('es-famara', 310), ('es-el-quemao', 330), ('es-el-confital', 315),
  -- Portugal: mostly west-facing, with south-facing exceptions (Carcavelos, Algarve corner)
  ('pt-supertubos', 230), ('pt-baleal', 10), ('pt-consolacao', 250), ('pt-praia-do-norte', 290),
  ('pt-ribeira-d-ilhas', 275), ('pt-coxos', 300), ('pt-foz-do-lizandro', 260), ('pt-carcavelos', 190),
  ('pt-costa-da-caparica', 260), ('pt-cabedelo-figueira', 250), ('pt-espinho', 270), ('pt-matosinhos', 250),
  ('pt-afife', 270), ('pt-arrifana', 300), ('pt-amado', 250), ('pt-tonel', 240)
) as v(slug, facing_deg)
where s.slug = v.slug;

-- ── Favorite spots, per user ──────────────────────────────
create table if not exists public.favorite_spots (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  spot_id    uuid not null references public.spots (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, spot_id)
);

alter table public.favorite_spots enable row level security;

drop policy if exists "favorite spots are readable by owner" on public.favorite_spots;
create policy "favorite spots are readable by owner"
on public.favorite_spots for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "favorite spots are insertable by owner" on public.favorite_spots;
create policy "favorite spots are insertable by owner"
on public.favorite_spots for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "favorite spots are deletable by owner" on public.favorite_spots;
create policy "favorite spots are deletable by owner"
on public.favorite_spots for delete to authenticated
using ((select auth.uid()) = user_id);
