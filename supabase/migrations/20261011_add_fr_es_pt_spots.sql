-- First international Wave Log catalogue. Coordinates are nearshore lookup points
-- used by the marine conditions endpoint, not take-off zone directions.
insert into public.spots (
  slug, name, municipality, region, country_code, latitude, longitude,
  break_type, source_name, source_url, is_curated
)
values
  -- France
  ('fr-la-graviere', 'La Gravière', 'Hossegor', 'Landes', 'FR', 43.6705, -1.4428, 'beach_break', 'Wave Log curated catalogue', null, true),
  ('fr-la-nord', 'La Nord', 'Hossegor', 'Landes', 'FR', 43.6748, -1.4442, 'beach_break', 'Wave Log curated catalogue', null, true),
  ('fr-les-culs-nus', 'Les Culs Nus', 'Seignosse', 'Landes', 'FR', 43.6897, -1.4409, 'beach_break', 'Wave Log curated catalogue', null, true),
  ('fr-les-estagnots', 'Les Estagnots', 'Seignosse', 'Landes', 'FR', 43.7065, -1.4344, 'beach_break', 'Wave Log curated catalogue', null, true),
  ('fr-la-piste', 'La Piste', 'Capbreton', 'Landes', 'FR', 43.6288, -1.4473, 'beach_break', 'Wave Log curated catalogue', null, true),
  ('fr-lacanau-ocean', 'Lacanau Océan', 'Lacanau', 'Gironde', 'FR', 45.0024, -1.2024, 'beach_break', 'Wave Log curated catalogue', null, true),
  ('fr-le-porge', 'Le Porge', 'Le Porge', 'Gironde', 'FR', 44.8724, -1.2297, 'beach_break', 'Wave Log curated catalogue', null, true),
  ('fr-biscarrosse-plage', 'Biscarrosse Plage', 'Biscarrosse', 'Landes', 'FR', 44.4476, -1.2548, 'beach_break', 'Wave Log curated catalogue', null, true),
  ('fr-les-cavaliers', 'Les Cavaliers', 'Anglet', 'Pays basque', 'FR', 43.5271, -1.5248, 'beach_break', 'Wave Log curated catalogue', null, true),
  ('fr-parlementia', 'Parlementia', 'Guéthary', 'Pays basque', 'FR', 43.4319, -1.6128, 'reef_break', 'Wave Log curated catalogue', null, true),
  ('fr-lafitenia', 'Lafitenia', 'Saint-Jean-de-Luz', 'Pays basque', 'FR', 43.4103, -1.6302, 'reef_break', 'Wave Log curated catalogue', null, true),
  ('fr-hendaye', 'Hendaye', 'Hendaye', 'Pays basque', 'FR', 43.3714, -1.7829, 'beach_break', 'Wave Log curated catalogue', null, true),
  ('fr-la-torche', 'La Torche', 'Plomeur', 'Bretagne', 'FR', 47.8369, -4.3530, 'point_break', 'Wave Log curated catalogue', null, true),
  ('fr-la-palue', 'La Palue', 'Crozon', 'Bretagne', 'FR', 48.2172, -4.5539, 'beach_break', 'Wave Log curated catalogue', null, true),
  ('fr-sainte-barbe', 'Sainte-Barbe', 'Plouharnel', 'Bretagne', 'FR', 47.6007, -3.1449, 'beach_break', 'Wave Log curated catalogue', null, true),
  ('fr-guidel', 'Guidel-Plages', 'Guidel', 'Bretagne', 'FR', 47.7602, -3.5381, 'beach_break', 'Wave Log curated catalogue', null, true),
  ('fr-bud-bud', 'Bud Bud', 'Longeville-sur-Mer', 'Vendée', 'FR', 46.3894, -1.5037, 'beach_break', 'Wave Log curated catalogue', null, true),
  ('fr-la-sauzaie', 'La Sauzaie', 'Brétignolles-sur-Mer', 'Vendée', 'FR', 46.6364, -1.8871, 'reef_break', 'Wave Log curated catalogue', null, true),

  -- Spain
  ('es-mundaka', 'Mundaka', 'Mundaka', 'Basque Country', 'ES', 43.4069, -2.6981, 'river_mouth', 'Wave Log curated catalogue', null, true),
  ('es-zarautz', 'Zarautz', 'Zarautz', 'Basque Country', 'ES', 43.2896, -2.1695, 'beach_break', 'Wave Log curated catalogue', null, true),
  ('es-la-zurriola', 'La Zurriola', 'San Sebastián', 'Basque Country', 'ES', 43.3268, -1.9780, 'beach_break', 'Wave Log curated catalogue', null, true),
  ('es-sopelana', 'Sopelana', 'Sopela', 'Basque Country', 'ES', 43.3914, -2.9947, 'beach_break', 'Wave Log curated catalogue', null, true),
  ('es-bakio', 'Bakio', 'Bakio', 'Basque Country', 'ES', 43.4301, -2.8081, 'beach_break', 'Wave Log curated catalogue', null, true),
  ('es-somo', 'Somo', 'Ribamontán al Mar', 'Cantabria', 'ES', 43.4641, -3.7420, 'beach_break', 'Wave Log curated catalogue', null, true),
  ('es-liencres', 'Liencres', 'Piélagos', 'Cantabria', 'ES', 43.4755, -3.9649, 'beach_break', 'Wave Log curated catalogue', null, true),
  ('es-rodiles', 'Rodiles', 'Villaviciosa', 'Asturias', 'ES', 43.5353, -5.3812, 'river_mouth', 'Wave Log curated catalogue', null, true),
  ('es-salinas', 'Salinas', 'Castrillón', 'Asturias', 'ES', 43.5787, -5.9628, 'beach_break', 'Wave Log curated catalogue', null, true),
  ('es-pantin', 'Pantín', 'Valdoviño', 'Galicia', 'ES', 43.6391, -8.1067, 'beach_break', 'Wave Log curated catalogue', null, true),
  ('es-razo', 'Razo', 'Carballo', 'Galicia', 'ES', 43.2878, -8.7091, 'beach_break', 'Wave Log curated catalogue', null, true),
  ('es-patos', 'Patos', 'Nigrán', 'Galicia', 'ES', 42.1557, -8.8250, 'beach_break', 'Wave Log curated catalogue', null, true),
  ('es-famara', 'Famara', 'Teguise', 'Canary Islands', 'ES', 29.1197, -13.5656, 'beach_break', 'Wave Log curated catalogue', null, true),
  ('es-el-quemao', 'El Quemao', 'Tinajo', 'Canary Islands', 'ES', 29.1190, -13.6713, 'reef_break', 'Wave Log curated catalogue', null, true),
  ('es-el-confital', 'El Confital', 'Las Palmas', 'Canary Islands', 'ES', 28.1631, -15.4387, 'reef_break', 'Wave Log curated catalogue', null, true),

  -- Portugal
  ('pt-supertubos', 'Supertubos', 'Peniche', 'Leiria', 'PT', 39.3437, -9.3645, 'beach_break', 'Wave Log curated catalogue', null, true),
  ('pt-baleal', 'Baleal', 'Peniche', 'Leiria', 'PT', 39.3745, -9.3394, 'beach_break', 'Wave Log curated catalogue', null, true),
  ('pt-consolacao', 'Consolação', 'Peniche', 'Leiria', 'PT', 39.3272, -9.3598, 'reef_break', 'Wave Log curated catalogue', null, true),
  ('pt-praia-do-norte', 'Praia do Norte', 'Nazaré', 'Leiria', 'PT', 39.6123, -9.0856, 'beach_break', 'Wave Log curated catalogue', null, true),
  ('pt-ribeira-d-ilhas', 'Ribeira d’Ilhas', 'Ericeira', 'Lisbon', 'PT', 38.9878, -9.4194, 'reef_break', 'Wave Log curated catalogue', null, true),
  ('pt-coxos', 'Coxos', 'Ericeira', 'Lisbon', 'PT', 39.0060, -9.4257, 'reef_break', 'Wave Log curated catalogue', null, true),
  ('pt-foz-do-lizandro', 'Foz do Lizandro', 'Ericeira', 'Lisbon', 'PT', 38.9421, -9.4163, 'river_mouth', 'Wave Log curated catalogue', null, true),
  ('pt-carcavelos', 'Carcavelos', 'Cascais', 'Lisbon', 'PT', 38.6784, -9.3372, 'beach_break', 'Wave Log curated catalogue', null, true),
  ('pt-costa-da-caparica', 'Costa da Caparica', 'Almada', 'Setúbal', 'PT', 38.6412, -9.2380, 'beach_break', 'Wave Log curated catalogue', null, true),
  ('pt-cabedelo-figueira', 'Cabedelo', 'Figueira da Foz', 'Coimbra', 'PT', 40.1381, -8.8678, 'jetty_break', 'Wave Log curated catalogue', null, true),
  ('pt-espinho', 'Espinho', 'Espinho', 'Aveiro', 'PT', 41.0051, -8.6483, 'beach_break', 'Wave Log curated catalogue', null, true),
  ('pt-matosinhos', 'Matosinhos', 'Matosinhos', 'Porto', 'PT', 41.1745, -8.6924, 'beach_break', 'Wave Log curated catalogue', null, true),
  ('pt-afife', 'Afife', 'Viana do Castelo', 'Minho', 'PT', 41.7793, -8.8737, 'beach_break', 'Wave Log curated catalogue', null, true),
  ('pt-arrifana', 'Arrifana', 'Aljezur', 'Algarve', 'PT', 37.2941, -8.8657, 'beach_break', 'Wave Log curated catalogue', null, true),
  ('pt-amado', 'Praia do Amado', 'Aljezur', 'Algarve', 'PT', 37.1693, -8.9023, 'beach_break', 'Wave Log curated catalogue', null, true),
  ('pt-tonel', 'Tonel', 'Vila do Bispo', 'Algarve', 'PT', 37.0067, -8.9473, 'beach_break', 'Wave Log curated catalogue', null, true)
on conflict (slug) do update set
  name = excluded.name,
  municipality = excluded.municipality,
  region = excluded.region,
  country_code = excluded.country_code,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  break_type = excluded.break_type,
  source_name = excluded.source_name,
  source_url = excluded.source_url,
  is_curated = true;
