export type SessionRecord = {
  id: string;
  user_id: string;
  spot_id: string | null;
  spot: string;
  date: string;
  time: string | null;
  hours: string | null;
  wave_size: string | null;
  tide: string | null;
  swell_direction: string | null;
  wind_type: string | null;
  water_temp: number | null;
  wave_shape: string | null;
  current: string | null;
  crowd: string | null;
  suit: string | null;
  session_type: string | null;
  with_who: string | null;
  board: string | null;
  rating: number | null;
  comments: string | null;
  conditions_source: string | null;
  conditions_source_time: string | null;
  wave_height_m: number | null;
  swell_height_m: number | null;
  swell_period_s: number | null;
  wind_speed_kmh: number | null;
  current_speed_kmh: number | null;
  sea_level_m: number | null;
  created_at: string;
};

export type SpotRecord = {
  id: string;
  slug: string;
  name: string;
  municipality: string;
  region: string;
  country_code: string;
  latitude: number | null;
  longitude: number | null;
  break_type: string;
  facing_deg: number | null;
  source_name: string | null;
  source_url: string | null;
  is_curated: boolean;
  created_at: string;
};

import type { BoardType } from "@/lib/board-types";

export const BOARD_STATUSES = ["Daily driver", "In rotation", "Step-up", "Retired", "For sale"] as const;

export type BoardStatus = (typeof BOARD_STATUSES)[number];

export type BoardRecord = {
  id: string;
  user_id: string;
  name: string;
  model: string | null;
  volume_l: number | null;
  dimensions: string | null;
  status: BoardStatus | null;
  board_type: BoardType | null;
  best_conditions: string | null;
  created_at: string;
  updated_at: string;
};
