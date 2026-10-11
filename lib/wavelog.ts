import type { CSSProperties } from "react";

import type { SessionRecord } from "@/lib/types";

/* ── Options ── */
export const HOURS_OPTIONS = ["0.5h", "1h", "1.5h", "2h", "2.5h", "3h", "3h+"];
export const SHAPE_OPTIONS = ["Hollow", "Punchy", "Mushy", "Fat", "Crumbly"];
export const TIDE_OPTIONS = ["Low", "Mid", "High", "Dropping", "Rising"];
export const DIRECTION_OPTIONS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
export const WIND_OPTIONS = ["Glassy", "Offshore", "Cross-off", "Cross-on", "Onshore"];
export const CURRENT_OPTIONS = ["None", "Light", "Strong"];
export const CROWD_OPTIONS = ["Empty", "Quiet", "Busy", "Packed"];
export const SUIT_OPTIONS = ["2/2", "3/2", "4/3", "5/4", "6/4"];
export const SESSION_TYPE_OPTIONS = ["Solo", "With others"];

export const H_MAP: Record<string, number> = { "0.5h": 0.5, "1h": 1, "1.5h": 1.5, "2h": 2, "2.5h": 2.5, "3h": 3, "3h+": 3.5 };
export const DIR_DEG: Record<string, number> = { N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315 };

/* ── Helpers ── */
export function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function parseDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function shortDate(iso: string) {
  return parseDate(iso).toLocaleString("en", { month: "short", day: "numeric", year: "numeric" });
}

export function longDate(iso: string) {
  return parseDate(iso).toLocaleString("en", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export function sortSessions(list: SessionRecord[]) {
  return list
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date) || (b.time ?? "").localeCompare(a.time ?? "") || b.created_at.localeCompare(a.created_at));
}

export function countBy<T>(list: T[], pick: (item: T) => string | null | undefined) {
  const counts: Record<string, number> = {};
  list.forEach((item) => {
    const value = pick(item);
    if (value) counts[value] = (counts[value] ?? 0) + 1;
  });
  return counts;
}

export function topKey(counts: Record<string, number>) {
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
}

export function averageRating(list: SessionRecord[]) {
  const rated = list.filter((s) => s.rating);
  return rated.length ? rated.reduce((sum, s) => sum + (s.rating ?? 0), 0) / rated.length : null;
}

export function formatAvg(value: number | null) {
  return value === null ? "—" : value.toFixed(1);
}

export function totalHours(list: SessionRecord[]) {
  return list.reduce((sum, s) => sum + (H_MAP[s.hours ?? ""] ?? 0), 0);
}

export function splitSpot(spot: string | null) {
  const value = spot ?? "";
  const i = value.indexOf(",");
  return i < 0 ? [value || "—", ""] : [value.slice(0, i).trim(), value.slice(i + 1).trim()];
}

export function ratingStyle(rating: number | null): CSSProperties {
  if (rating && rating >= 8) return { background: "#cce8d5", color: "#133826" };
  if (rating && rating >= 6) return { background: "#c5dcf5", color: "#1e3a5f" };
  return { background: "#fcd9c7", color: "#5c2d1f" };
}

export function waveHeightFromLegacy(value: string | null) {
  const numeric = parseFloat(value ?? "");
  if (!Number.isNaN(numeric)) return numeric;
  const legacy: Record<string, number> = { XS: 0.2, S: 0.6, "S-M": 0.9, M: 1.15, "M-L": 1.45, L: 1.8, XL: 2.5, XXL: 3.5 };
  return legacy[value ?? ""] ?? 0;
}

export function sessionWaveHeight(s: SessionRecord) {
  return s.wave_height_m ?? waveHeightFromLegacy(s.wave_size);
}

/* ── Marine conditions ── */
// Served by app/api/marine-conditions: OD Nature official wave forecast when available, Open-Meteo otherwise.
export type MarineConditions = {
  source: string;
  sourceTime: string;
  officialStation: { id: string; name: string } | null;
  raw: {
    waveHeight: number | null;
    swellHeight: number | null;
    swellDirection: number | null;
    swellPeriod: number | null;
    waterTemperature: number | null;
    seaLevel: number | null;
    currentSpeed: number | null;
    windSpeed: number | null;
    windDirection: number | null;
  };
  suggestions: { waveSize: string; tide: string; swellDirection: string; windType: string; waterTemp: string; current: string };
};

export async function fetchMarineConditions(spotId: string, date: string, time: string): Promise<MarineConditions> {
  const params = new URLSearchParams({ spotId, date: date || todayIso() });
  if (time) params.set("time", time);
  const response = await fetch(`/api/marine-conditions?${params}`);
  const body = (await response.json().catch(() => null)) as (MarineConditions & { error?: string }) | null;
  if (!response.ok || !body) throw new Error(body?.error ?? "Impossible de charger les conditions marines.");
  return body;
}

export function sourceLabel(source: string | null) {
  if (source === "od-nature+open-meteo") return "OD Nature + Open-Meteo";
  if (source === "open-meteo") return "Open-Meteo";
  return source ?? "";
}

export function formatSourceTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.replace("T", " ");
  return date.toLocaleString("en-GB", { timeZone: "Europe/Brussels", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}
