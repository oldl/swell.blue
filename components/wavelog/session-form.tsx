"use client";

import { useId, useMemo, useState, type FormEvent } from "react";

import { createClient } from "@/lib/supabase/client";
import type { SessionRecord, SpotRecord } from "@/lib/types";
import {
  CROWD_OPTIONS,
  CURRENT_OPTIONS,
  DIRECTION_OPTIONS,
  HOURS_OPTIONS,
  SESSION_TYPE_OPTIONS,
  SHAPE_OPTIONS,
  SUIT_OPTIONS,
  TIDE_OPTIONS,
  WIND_OPTIONS,
  fetchMarineConditions,
  sessionWaveHeight,
  sourceLabel,
  todayIso,
  type MarineConditions
} from "@/lib/wavelog";

import { ChipGroup, RatingRow, SegControl } from "./ui";

type Props = {
  userId: string;
  editing: SessionRecord | null;
  spots: SpotRecord[];
  boardSuggestions: string[];
  onSaved: (session: SessionRecord, wasEdit: boolean) => void;
  onClear: () => void;
  toast: (message: string) => void;
};

/** Marine values stored with the session (from Open-Meteo, or kept from the session being edited). */
type AppliedMarine = {
  source: string | null;
  sourceTime: string | null;
  swellHeight: number | null;
  swellPeriod: number | null;
  windSpeed: number | null;
  currentSpeed: number | null;
  seaLevel: number | null;
};

type FormState = {
  spot: string;
  spotId: string;
  date: string;
  time: string;
  hours: string;
  waveHeight: number;
  waveShape: string;
  tide: string;
  swellDirection: string;
  windType: string;
  current: string;
  crowd: string;
  waterTemp: string;
  board: string;
  suit: string;
  sessionType: string;
  withWho: string;
  rating: number | null;
  comments: string;
};

function initialForm(s: SessionRecord | null): FormState {
  return {
    spot: s?.spot ?? "",
    spotId: s?.spot_id ?? "",
    date: s?.date ?? todayIso(),
    time: s?.time ?? "",
    hours: s?.hours ?? "",
    waveHeight: s ? sessionWaveHeight(s) : 0,
    waveShape: s?.wave_shape ?? "",
    tide: s?.tide ?? "",
    swellDirection: s?.swell_direction ?? "",
    windType: s?.wind_type ?? "",
    current: s?.current ?? "",
    crowd: s?.crowd ?? "",
    waterTemp: s?.water_temp != null ? String(s.water_temp) : "",
    board: s?.board ?? "",
    suit: s?.suit ?? SUIT_OPTIONS[0],
    sessionType: s?.session_type ?? "Solo",
    withWho: s?.with_who ?? "",
    rating: s?.rating ?? null,
    comments: s?.comments ?? ""
  };
}

function initialMarine(s: SessionRecord | null): AppliedMarine | null {
  if (!s || !s.conditions_source) return null;
  return {
    source: s.conditions_source,
    sourceTime: s.conditions_source_time,
    swellHeight: s.swell_height_m,
    swellPeriod: s.swell_period_s,
    windSpeed: s.wind_speed_kmh,
    currentSpeed: s.current_speed_kmh,
    seaLevel: s.sea_level_m
  };
}

function round(value: number | null, digits: number) {
  return value === null ? null : Number(value.toFixed(digits));
}

function SpotInput({
  spots,
  value,
  onChange
}: {
  spots: SpotRecord[];
  value: string;
  onChange: (name: string, spot: SpotRecord | null) => void;
}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const query = value.trim().toLowerCase();
  const matches = spots.filter(
    (spot) => !query || spot.name.toLowerCase().includes(query) || spot.municipality.toLowerCase().includes(query)
  );

  function choose(spot: SpotRecord) {
    onChange(spot.name, spot);
    setOpen(false);
    setActive(-1);
  }

  return (
    <div className="spot-autocomplete">
      <input
        className="field-input"
        type="text"
        value={value}
        placeholder="Choose a Belgian spot or enter a name"
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={listId}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onChange={(event) => {
          // Typing keeps the link only while the text still matches a catalogue spot exactly.
          const typed = event.target.value;
          onChange(typed, spots.find((spot) => spot.name.toLowerCase() === typed.trim().toLowerCase()) ?? null);
          setOpen(true);
          setActive(-1);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") return setOpen(false);
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
            setActive((i) => Math.min(i + 1, matches.length - 1));
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          } else if (event.key === "Enter" && open && active >= 0 && matches[active]) {
            event.preventDefault();
            choose(matches[active]);
          }
        }}
      />
      <div className={open ? "spot-suggestions show" : "spot-suggestions"} id={listId} role="listbox">
        {matches.length ? (
          matches.map((spot, i) => (
            <button
              key={spot.id}
              type="button"
              role="option"
              aria-selected={i === active}
              className={i === active ? "spot-suggestion active" : "spot-suggestion"}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(spot)}
            >
              <strong>{spot.name}</strong>
              <span>{spot.municipality}</span>
            </button>
          ))
        ) : (
          <div className="spot-suggestions-empty">No Belgian spot found</div>
        )}
      </div>
    </div>
  );
}

export function SessionForm({ userId, editing, spots, boardSuggestions, onSaved, onClear, toast }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const boardListId = useId();
  const [form, setForm] = useState<FormState>(() => initialForm(editing));
  const [applied, setApplied] = useState<AppliedMarine | null>(() => initialMarine(editing));
  const [conditions, setConditions] = useState<MarineConditions | null>(null);
  const [marineError, setMarineError] = useState<string | null>(null);
  const [marineLoading, setMarineLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function loadConditions() {
    setConditions(null);
    setMarineError(null);
    if (!form.spotId) {
      setMarineError("Choose a Belgian spot from the list first.");
      return;
    }
    setMarineLoading(true);
    try {
      setConditions(await fetchMarineConditions(form.spotId, form.date, form.time));
    } catch (error) {
      setMarineError(error instanceof Error ? error.message : "Unable to load marine conditions.");
    } finally {
      setMarineLoading(false);
    }
  }

  function applyConditions() {
    if (!conditions) return;
    const { raw, suggestions } = conditions;
    setForm((current) => ({
      ...current,
      waveHeight: raw.waveHeight === null ? current.waveHeight : Math.min(5, Math.max(0, Number(raw.waveHeight.toFixed(1)))),
      tide: suggestions.tide || current.tide,
      swellDirection: suggestions.swellDirection || current.swellDirection,
      windType: suggestions.windType || current.windType,
      current: suggestions.current || current.current,
      waterTemp: raw.waterTemperature !== null ? raw.waterTemperature.toFixed(1) : current.waterTemp
    }));
    setApplied({
      source: conditions.source,
      sourceTime: conditions.sourceTime,
      swellHeight: raw.swellHeight,
      swellPeriod: raw.swellPeriod,
      windSpeed: raw.windSpeed,
      currentSpeed: raw.currentSpeed,
      seaLevel: raw.seaLevel
    });
    toast("Marine conditions applied — you can still edit them");
  }

  async function save(event?: FormEvent) {
    event?.preventDefault();
    if (saving) return;
    const spot = form.spot.trim();
    if (!spot) {
      toast("Please enter a spot name");
      return;
    }
    const temp = form.waterTemp.trim() ? Number(form.waterTemp) : null;
    if (temp !== null && !Number.isFinite(temp)) {
      toast("Water temperature must be a number");
      return;
    }

    const height = form.waveHeight > 0 ? Number(form.waveHeight.toFixed(1)) : null;
    const payload = {
      spot,
      spot_id: form.spotId || null,
      date: form.date || todayIso(),
      time: form.time || null,
      hours: form.hours || null,
      wave_size: height === null ? null : `${height.toFixed(1)} m`,
      wave_height_m: height,
      wave_shape: form.waveShape || null,
      tide: form.tide || null,
      swell_direction: form.swellDirection || null,
      wind_type: form.windType || null,
      current: form.current || null,
      crowd: form.crowd || null,
      water_temp: temp,
      board: form.board.trim() || null,
      suit: form.suit || null,
      session_type: form.sessionType || null,
      with_who: form.sessionType === "With others" ? form.withWho.trim() || null : null,
      rating: form.rating,
      comments: form.comments.trim() || null,
      conditions_source: applied?.source ?? null,
      conditions_source_time: applied?.sourceTime ?? null,
      swell_height_m: round(applied?.swellHeight ?? null, 2),
      swell_period_s: round(applied?.swellPeriod ?? null, 1),
      wind_speed_kmh: round(applied?.windSpeed ?? null, 1),
      current_speed_kmh: round(applied?.currentSpeed ?? null, 2),
      sea_level_m: round(applied?.seaLevel ?? null, 2)
    };

    setSaving(true);
    const query = editing
      ? supabase.from("sessions").update(payload).eq("id", editing.id)
      : supabase.from("sessions").insert({ ...payload, user_id: userId });
    const { data, error } = await query.select().single();
    setSaving(false);

    if (error || !data) {
      toast(`Save failed: ${error?.message ?? "unknown error"}`);
      return;
    }
    onSaved(data as SessionRecord, Boolean(editing));
  }

  const raw = conditions?.raw;
  const cell = (label: string, value: string) => (
    <div className="marine-cell" key={label}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
  const fmt = (value: number | null | undefined, digits: number, unit: string) =>
    value === null || value === undefined ? "—" : `${value.toFixed(digits)} ${unit}`;

  const saveLabel = saving ? "Saving…" : editing ? "Update Session" : "Save Session";
  const title = editing ? "Edit Session" : "Log a Session";

  return (
    <form onSubmit={save} style={{ display: "contents" }} noValidate>
      <div className="topbar">
        <div className="topbar-title">{title}</div>
        <div className="topbar-meta">{editing ? editing.spot : ""}</div>
        <div className="topbar-actions">
          <button className="topbar-btn topbar-btn-secondary" type="button" onClick={onClear}>
            {editing ? "Cancel" : "Clear"}
          </button>
          <button className="topbar-btn topbar-btn-primary" type="submit" disabled={saving}>
            {saveLabel}
          </button>
        </div>
      </div>
      <div className="screen-header">
        <button className="hdr-btn" type="button" onClick={onClear}>
          {editing ? "Cancel" : "Clear"}
        </button>
        <h2>{editing ? "Edit Session" : "Log Session"}</h2>
        <div style={{ minWidth: 44 }} />
      </div>

      <div className="log-main-area">
        <div className="log-center">
          <div className="form-section-dt">
            <div className="fsec-title">📍 Where &amp; When</div>
            <div className="form-cols four" style={{ alignItems: "end" }}>
              <div className="field-group span-2">
                <label className="field-label">Spot *</label>
                <SpotInput
                  spots={spots}
                  value={form.spot}
                  onChange={(name, spot) => setForm((current) => ({ ...current, spot: name, spotId: spot?.id ?? "" }))}
                />
              </div>
              <div className="field-group">
                <label className="field-label">Date</label>
                <input className="field-input" type="date" value={form.date} onChange={(e) => update("date", e.target.value)} />
              </div>
              <div className="field-group">
                <label className="field-label">Time</label>
                <input className="field-input" type="time" value={form.time} onChange={(e) => update("time", e.target.value)} />
              </div>
            </div>
            <div className="marine-controls">
              <button className="marine-btn" type="button" disabled={marineLoading} onClick={loadConditions}>
                {marineLoading ? "Loading conditions…" : "Get marine conditions"}
              </button>
              <span className="marine-hint">Uses 12:00 when no time is selected</span>
            </div>
            <div className={conditions || marineError ? "marine-result show" : "marine-result"}>
              {marineError ? <div className="marine-error">{marineError}</div> : null}
              {conditions && raw ? (
                <>
                  <div className="marine-result-head">
                    <div>
                      <div className="marine-result-title">Suggested conditions</div>
                      <div className="marine-result-source">
                        {conditions.officialStation ? (
                          <>
                            <a
                              href="https://odnature.naturalsciences.be/marine-forecasting-centre/en/forecasts"
                              target="_blank"
                              rel="noreferrer"
                            >
                              OD Nature
                            </a>{" "}
                            waves ({conditions.officialStation.name}) · Open-Meteo for the rest
                          </>
                        ) : (
                          sourceLabel(conditions.source)
                        )}
                      </div>
                    </div>
                    <button className="marine-apply" type="button" onClick={applyConditions}>
                      Use conditions
                    </button>
                  </div>
                  <div className="marine-grid">
                    {cell("Waves", fmt(raw.waveHeight, 1, "m"))}
                    {cell("Swell", fmt(raw.swellHeight, 1, "m"))}
                    {cell("Period", fmt(raw.swellPeriod, 1, "s"))}
                    {cell("Direction", conditions.suggestions.swellDirection || "—")}
                    {cell("Wind", fmt(raw.windSpeed, 0, "km/h"))}
                    {cell("Water", fmt(raw.waterTemperature, 1, "°C"))}
                    {cell("Tide", conditions.suggestions.tide || "—")}
                    {cell("Current", conditions.suggestions.current || "—")}
                  </div>
                </>
              ) : null}
            </div>
            <div className="field-group" style={{ marginTop: 14 }}>
              <label className="field-label">Duration</label>
              <ChipGroup options={HOURS_OPTIONS} value={form.hours} onChange={(v) => update("hours", v)} />
            </div>
          </div>

          <div className="form-cols" style={{ alignItems: "start" }}>
            <div className="form-section-dt">
              <div className="fsec-title">🌊 Waves</div>
              <div className="field-group">
                <label className="field-label">Wave Size</label>
                <div className="wave-slider-row">
                  <div>
                    <input
                      className="wave-slider"
                      type="range"
                      min="0"
                      max="5"
                      step="0.1"
                      value={form.waveHeight}
                      aria-label="Wave height in metres"
                      onChange={(e) => update("waveHeight", Number(e.target.value))}
                    />
                    <div className="wave-slider-scale">
                      <span>0 m</span>
                      <span>5 m</span>
                    </div>
                  </div>
                  <output className="wave-slider-value">{form.waveHeight.toFixed(1)} m</output>
                </div>
              </div>
              <div className="field-group">
                <label className="field-label">Wave Shape</label>
                <ChipGroup options={SHAPE_OPTIONS} value={form.waveShape} onChange={(v) => update("waveShape", v)} />
              </div>
              <div className="field-group">
                <label className="field-label">Tide</label>
                <ChipGroup options={TIDE_OPTIONS} value={form.tide} onChange={(v) => update("tide", v)} />
              </div>
              <div className="field-group">
                <label className="field-label">Swell Direction</label>
                <ChipGroup options={DIRECTION_OPTIONS} value={form.swellDirection} onChange={(v) => update("swellDirection", v)} />
              </div>
            </div>
            <div className="form-section-dt">
              <div className="fsec-title">🌬 Elements</div>
              <div className="field-group">
                <label className="field-label">Wind</label>
                <ChipGroup options={WIND_OPTIONS} value={form.windType} onChange={(v) => update("windType", v)} />
              </div>
              <div className="field-group">
                <label className="field-label">Current</label>
                <ChipGroup options={CURRENT_OPTIONS} value={form.current} onChange={(v) => update("current", v)} />
              </div>
              <div className="field-group">
                <label className="field-label">Crowd</label>
                <ChipGroup options={CROWD_OPTIONS} value={form.crowd} onChange={(v) => update("crowd", v)} />
              </div>
            </div>
          </div>

          <div className="form-cols" style={{ alignItems: "start" }}>
            <div className="form-section-dt">
              <div className="fsec-title">🏄 Setup</div>
              <div className="form-cols" style={{ gap: 12 }}>
                <div className="field-group">
                  <label className="field-label">Water Temp (°C)</label>
                  <input
                    className="field-input"
                    type="number"
                    placeholder="18"
                    min="0"
                    max="35"
                    step="0.1"
                    inputMode="decimal"
                    value={form.waterTemp}
                    onChange={(e) => update("waterTemp", e.target.value)}
                  />
                </div>
                <div className="field-group">
                  <label className="field-label">Board</label>
                  <input
                    className="field-input"
                    type="text"
                    placeholder={'6\'2" thruster…'}
                    autoComplete="off"
                    list={boardListId}
                    value={form.board}
                    onChange={(e) => update("board", e.target.value)}
                  />
                  <datalist id={boardListId}>
                    {boardSuggestions.map((name) => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>
                </div>
              </div>
              <div className="field-group" style={{ marginTop: 12 }}>
                <label className="field-label">Wetsuit</label>
                <SegControl options={SUIT_OPTIONS} value={form.suit} onChange={(v) => update("suit", v)} />
              </div>
              <div className="field-group">
                <label className="field-label">Session</label>
                <SegControl options={SESSION_TYPE_OPTIONS} value={form.sessionType} onChange={(v) => update("sessionType", v)} />
              </div>
              {form.sessionType === "With others" ? (
                <div className="field-group" style={{ marginTop: 12 }}>
                  <label className="field-label">Who with?</label>
                  <input
                    className="field-input"
                    type="text"
                    placeholder="Friends, crew…"
                    autoComplete="off"
                    value={form.withWho}
                    onChange={(e) => update("withWho", e.target.value)}
                  />
                </div>
              ) : null}
            </div>
            <div className="form-section-dt">
              <div className="fsec-title">⭐ Reflection</div>
              <div className="field-group">
                <label className="field-label">Rating</label>
                <RatingRow value={form.rating} onChange={(v) => update("rating", v)} />
              </div>
              <div className="field-group">
                <label className="field-label">Notes</label>
                <textarea
                  className="field-input"
                  placeholder="How was it? Any memorable waves…"
                  style={{ minHeight: 130 }}
                  value={form.comments}
                  onChange={(e) => update("comments", e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="log-dt-save-bar">
        <button className="topbar-btn topbar-btn-secondary" type="button" onClick={onClear}>
          {editing ? "Cancel" : "Clear"}
        </button>
        <button className="topbar-btn topbar-btn-primary" type="submit" disabled={saving}>
          {saveLabel}
        </button>
      </div>
      <div className="log-save-bar">
        <button className="btn-primary" type="submit" disabled={saving}>
          {saveLabel}
        </button>
      </div>
    </form>
  );
}
