"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createClient } from "@/lib/supabase/client";
import type { SessionRecord } from "@/lib/types";

type Props = {
  session: SessionRecord;
};

type EditState = {
  spot: string;
  date: string;
  time: string;
  hours: string;
  waveSize: string;
  tide: string;
  swellDirection: string;
  windType: string;
  waterTemp: string;
  waveShape: string;
  current: string;
  crowd: string;
  suit: string;
  sessionType: string;
  withWho: string;
  board: string;
  rating: string;
  comments: string;
};

function field(label: string, value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return (
    <div className="session-cell" key={label}>
      <div className="session-cell-label">{label}</div>
      <div className="session-cell-value">{value}</div>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-BE", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function dayBlock(value: string) {
  const date = new Date(value);

  return {
    day: new Intl.DateTimeFormat("en", { day: "2-digit" }).format(date),
    month: new Intl.DateTimeFormat("en", { month: "short" }).format(date).toUpperCase()
  };
}

function initialState(session: SessionRecord): EditState {
  return {
    spot: session.spot,
    date: session.date,
    time: session.time ?? "",
    hours: session.hours ?? "",
    waveSize: session.wave_size ?? "",
    tide: session.tide ?? "",
    swellDirection: session.swell_direction ?? "",
    windType: session.wind_type ?? "",
    waterTemp: session.water_temp ? String(session.water_temp) : "",
    waveShape: session.wave_shape ?? "",
    current: session.current ?? "",
    crowd: session.crowd ?? "",
    suit: session.suit ?? "",
    sessionType: session.session_type ?? "Solo",
    withWho: session.with_who ?? "",
    board: session.board ?? "",
    rating: session.rating ? String(session.rating) : "",
    comments: session.comments ?? ""
  };
}

export function SessionCard({ session }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<EditState>(() => initialState(session));
  const supabase = createClient();
  const dateBlock = dayBlock(session.date);

  function update<K extends keyof EditState>(key: K, value: EditState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleDelete() {
    if (!window.confirm("Supprimer cette session ?")) {
      return;
    }

    setError(null);
    const { error: deleteError } = await supabase.from("sessions").delete().eq("id", session.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }

  async function handleSave() {
    if (!form.spot.trim()) {
      setError("Le spot est obligatoire.");
      return;
    }

    setError(null);

    const { error: updateError } = await supabase
      .from("sessions")
      .update({
        spot: form.spot.trim(),
        date: form.date,
        time: form.time || null,
        hours: form.hours || null,
        wave_size: form.waveSize || null,
        tide: form.tide || null,
        swell_direction: form.swellDirection || null,
        wind_type: form.windType || null,
        water_temp: form.waterTemp ? Number(form.waterTemp) : null,
        wave_shape: form.waveShape || null,
        current: form.current || null,
        crowd: form.crowd || null,
        suit: form.suit || null,
        session_type: form.sessionType || null,
        with_who: form.sessionType === "With others" ? form.withWho || null : null,
        board: form.board || null,
        rating: form.rating ? Number(form.rating) : null,
        comments: form.comments || null
      })
      .eq("id", session.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setEditing(false);
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <article className="session-item">
      <div className="session-top">
        <div className="session-heading">
          <div className="date-block">
            <div className="date-block-month">{dateBlock.month}</div>
            <div className="date-block-day">{dateBlock.day}</div>
          </div>
          <div className="session-heading-copy">
            <div className="session-title">
              <strong>{session.spot}</strong>
            </div>
            <div className="session-meta">
              {formatDate(session.date)}
              {session.time ? ` · ${session.time}` : ""}
              {session.hours ? ` · ${session.hours}` : ""}
            </div>
          </div>
        </div>
        <div className="session-actions">
          {session.rating ? <span className="pill">{session.rating}/10</span> : null}
          <button className="button-secondary" type="button" onClick={() => setEditing((value) => !value)}>
            {editing ? "Fermer" : "Éditer"}
          </button>
          <button className="button-secondary" type="button" disabled={pending} onClick={handleDelete}>
            Supprimer
          </button>
        </div>
      </div>

      <div className="session-tags">
        {session.wave_size ? <span className="pill">{session.wave_size}</span> : null}
        {session.wind_type ? <span className="pill">{session.wind_type}</span> : null}
        {session.tide ? <span className="pill">{session.tide}</span> : null}
        {session.wave_shape ? <span className="pill">{session.wave_shape}</span> : null}
        {session.crowd ? <span className="pill">{session.crowd}</span> : null}
      </div>

      <div className="session-grid">
        {field("Swell", session.swell_direction)}
        {field("Combinaison", session.suit)}
        {field("Planche", session.board)}
        {field("Session", session.session_type)}
        {field("Avec", session.with_who)}
        {field("Courant", session.current)}
        {field("Eau", session.water_temp ? `${session.water_temp}°C` : null)}
      </div>

      <div className="session-notes">
        <div className="session-cell-label">Notes</div>
        <p className="muted" style={{ marginBottom: 0 }}>
          {session.comments || "Aucune note pour cette session pour l’instant."}
        </p>
      </div>

      {editing ? (
        <div className="session-editor">
          <div className="session-editor-grid">
            <input value={form.spot} onChange={(event) => update("spot", event.target.value)} placeholder="Spot" />
            <input value={form.date} onChange={(event) => update("date", event.target.value)} type="date" />
            <input value={form.time} onChange={(event) => update("time", event.target.value)} type="time" />
            <input value={form.hours} onChange={(event) => update("hours", event.target.value)} placeholder="Durée" />
            <input value={form.waveSize} onChange={(event) => update("waveSize", event.target.value)} placeholder="Taille" />
            <input value={form.tide} onChange={(event) => update("tide", event.target.value)} placeholder="Marée" />
            <input
              value={form.swellDirection}
              onChange={(event) => update("swellDirection", event.target.value)}
              placeholder="Swell"
            />
            <input value={form.windType} onChange={(event) => update("windType", event.target.value)} placeholder="Vent" />
            <input
              value={form.waterTemp}
              onChange={(event) => update("waterTemp", event.target.value)}
              placeholder="Temp eau"
              type="number"
            />
            <input value={form.waveShape} onChange={(event) => update("waveShape", event.target.value)} placeholder="Shape" />
            <input value={form.current} onChange={(event) => update("current", event.target.value)} placeholder="Courant" />
            <input value={form.crowd} onChange={(event) => update("crowd", event.target.value)} placeholder="Crowd" />
            <input value={form.suit} onChange={(event) => update("suit", event.target.value)} placeholder="Combinaison" />
            <input
              value={form.sessionType}
              onChange={(event) => update("sessionType", event.target.value)}
              placeholder="Session"
            />
            <input value={form.withWho} onChange={(event) => update("withWho", event.target.value)} placeholder="Avec qui" />
            <input value={form.board} onChange={(event) => update("board", event.target.value)} placeholder="Planche" />
            <input
              value={form.rating}
              onChange={(event) => update("rating", event.target.value)}
              placeholder="Note"
              type="number"
              min="1"
              max="10"
            />
          </div>
          <textarea
            value={form.comments}
            onChange={(event) => update("comments", event.target.value)}
            placeholder="Notes"
            style={{ minHeight: 100, borderRadius: 12, border: "1px solid var(--border)", padding: 14, marginTop: 12 }}
          />
          {error ? <div className="error" style={{ marginTop: 12 }}>{error}</div> : null}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button className="button" type="button" disabled={pending} onClick={handleSave}>
              {pending ? "Sauvegarde..." : "Enregistrer les changements"}
            </button>
            <button className="button-secondary" type="button" onClick={() => setEditing(false)}>
              Annuler
            </button>
          </div>
        </div>
      ) : error ? (
        <div className="error" style={{ marginTop: 12 }}>{error}</div>
      ) : null}
    </article>
  );
}
