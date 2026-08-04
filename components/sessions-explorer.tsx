"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import type { SessionRecord } from "@/lib/types";

type Props = {
  sessions: SessionRecord[];
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-BE", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function dateBits(value: string) {
  const date = new Date(value);

  return {
    day: new Intl.DateTimeFormat("en", { day: "2-digit" }).format(date),
    month: new Intl.DateTimeFormat("en", { month: "short" }).format(date).toUpperCase(),
    full: formatDate(value)
  };
}

function ratingColor(rating: number | null) {
  if (!rating) return "#8a8078";
  if (rating >= 9) return "#2b5c6a";
  if (rating >= 7) return "#3a7585";
  if (rating >= 5) return "#b5965e";
  return "#9e3535";
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

function detailField(label: string, value: string | null) {
  if (!value) return null;

  return (
    <div key={label}>
      <div className="det-fl-ui">{label}</div>
      <div className="det-fv-ui">{value}</div>
    </div>
  );
}

export function SessionsExplorer({ sessions }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [pending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string | null>(sessions[0]?.id ?? null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selected = sessions.find((session) => session.id === selectedId) ?? null;
  const [form, setForm] = useState<EditState | null>(selected ? initialState(selected) : null);

  function selectSession(session: SessionRecord) {
    setSelectedId(session.id);
    setEditing(false);
    setError(null);
    setForm(initialState(session));
  }

  function update<K extends keyof EditState>(key: K, value: EditState[K]) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
  }

  async function handleDelete() {
    if (!selected || !window.confirm("Supprimer cette session ?")) {
      return;
    }

    setError(null);
    const { error: deleteError } = await supabase.from("sessions").delete().eq("id", selected.id);

    if (deleteError) {
      setError("Impossible de supprimer la session pour le moment.");
      return;
    }

    setSelectedId(null);
    startTransition(() => {
      router.refresh();
    });
  }

  async function handleSave() {
    if (!selected || !form) return;

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
      .eq("id", selected.id);

    if (updateError) {
      setError("Impossible de modifier la session pour le moment.");
      return;
    }

    setEditing(false);
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <section className="sessions-shell">
      <div className="sess-list-pane-ui">
        <div className="sess-list-header-ui">
          <div className="sess-list-title-ui">Sessions</div>
          <span className="sess-list-count-ui">{sessions.length} logs</span>
        </div>

        <div className="sess-list-scroll-ui">
          {sessions.map((session) => {
            const bits = dateBits(session.date);

            return (
              <button
                key={session.id}
                className={selectedId === session.id ? "sess-row-ui sess-row-ui-active" : "sess-row-ui"}
                type="button"
                onClick={() => selectSession(session)}
              >
                <div className="sess-row-date-ui">
                  <div className="sess-row-month-ui">{bits.month}</div>
                  <div className="sess-row-day-ui">{bits.day}</div>
                </div>
                <div className="sess-row-div-ui" />
                <div className="sess-row-info-ui">
                  <div className="sess-row-spot-ui">{session.spot}</div>
                  <div className="sess-row-meta-ui">
                    <div className="sess-row-chips-ui">
                      {session.wave_size ? <span className="pill">{session.wave_size}</span> : null}
                      {session.wind_type ? <span className="pill">{session.wind_type}</span> : null}
                    </div>
                    {session.hours ? <span>{session.hours}</span> : null}
                  </div>
                  {session.board ? <div className="sess-row-board-ui">{session.board}</div> : null}
                </div>
                {session.rating ? (
                  <div className="rc-sm-ui" style={{ background: ratingColor(session.rating) }}>
                    {session.rating}
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="sess-detail-pane-ui">
        {!selected ? (
          <div className="det-empty-ui">
            <div className="det-empty-icon-ui">🌊</div>
            <div className="det-empty-text-ui">Select a session</div>
          </div>
        ) : (
          <>
            <div className="det-topbar-ui">
              <div className="det-topbar-title-ui">Session detail</div>
              <div className="det-topbar-actions-ui">
                <button className="button-secondary" type="button" onClick={() => setEditing((value) => !value)}>
                  {editing ? "Fermer" : "Éditer"}
                </button>
                <button className="button-secondary" type="button" disabled={pending} onClick={handleDelete}>
                  Supprimer
                </button>
              </div>
            </div>

            <div className="det-inner-ui">
              <div className="det-head-ui">
                <div>
                  <div className="det-spot-ui">{selected.spot}</div>
                  <div className="det-meta-ui">
                    {dateBits(selected.date).full}
                    {selected.time ? ` · ${selected.time}` : ""}
                    {selected.hours ? ` · ${selected.hours}` : ""}
                  </div>
                </div>
                {selected.rating ? (
                  <div className="det-rating-lg-ui" style={{ background: ratingColor(selected.rating) }}>
                    {selected.rating}
                  </div>
                ) : null}
              </div>

              <div className="det-block-ui">
                <div className="det-sec-title-ui">Conditions</div>
                <div className="det-grid-ui">
                  {detailField("Wave Size", selected.wave_size)}
                  {detailField("Tide", selected.tide)}
                  {detailField("Swell", selected.swell_direction)}
                  {detailField("Wind", selected.wind_type)}
                  {detailField("Shape", selected.wave_shape)}
                  {detailField("Current", selected.current)}
                  {detailField("Crowd", selected.crowd)}
                  {detailField("Water Temp", selected.water_temp ? `${selected.water_temp}°C` : null)}
                </div>
              </div>

              <div className="det-block-ui">
                <div className="det-sec-title-ui">Setup</div>
                <div className="det-grid-ui">
                  {detailField("Suit", selected.suit)}
                  {detailField("Board", selected.board)}
                  {detailField("Session", selected.session_type)}
                  {detailField("With", selected.with_who)}
                </div>
              </div>

              <div className="det-block-ui">
                <div className="det-sec-title-ui">Notes</div>
                <div className="det-notes-ui">
                  {selected.comments || "Aucune note pour cette session pour l’instant."}
                </div>
              </div>

              {editing && form ? (
                <div className="session-editor">
                  <div className="det-sec-title-ui">Edit session</div>
                  <div className="session-editor-grid">
                    <input value={form.spot} onChange={(event) => update("spot", event.target.value)} placeholder="Spot" />
                    <input value={form.date} onChange={(event) => update("date", event.target.value)} type="date" />
                    <input value={form.time} onChange={(event) => update("time", event.target.value)} type="time" />
                    <input value={form.hours} onChange={(event) => update("hours", event.target.value)} placeholder="Durée" />
                    <input value={form.waveSize} onChange={(event) => update("waveSize", event.target.value)} placeholder="Taille" />
                    <input value={form.tide} onChange={(event) => update("tide", event.target.value)} placeholder="Marée" />
                    <input value={form.swellDirection} onChange={(event) => update("swellDirection", event.target.value)} placeholder="Swell" />
                    <input value={form.windType} onChange={(event) => update("windType", event.target.value)} placeholder="Vent" />
                    <input value={form.waterTemp} onChange={(event) => update("waterTemp", event.target.value)} placeholder="Eau" type="number" />
                    <input value={form.waveShape} onChange={(event) => update("waveShape", event.target.value)} placeholder="Shape" />
                    <input value={form.current} onChange={(event) => update("current", event.target.value)} placeholder="Courant" />
                    <input value={form.crowd} onChange={(event) => update("crowd", event.target.value)} placeholder="Crowd" />
                    <input value={form.suit} onChange={(event) => update("suit", event.target.value)} placeholder="Combinaison" />
                    <input value={form.sessionType} onChange={(event) => update("sessionType", event.target.value)} placeholder="Session" />
                    <input value={form.withWho} onChange={(event) => update("withWho", event.target.value)} placeholder="Avec qui" />
                    <input value={form.board} onChange={(event) => update("board", event.target.value)} placeholder="Planche" />
                    <input value={form.rating} onChange={(event) => update("rating", event.target.value)} placeholder="Note" type="number" min="1" max="10" />
                  </div>
                  <textarea
                    value={form.comments}
                    onChange={(event) => update("comments", event.target.value)}
                    placeholder="Notes"
                    style={{ minHeight: 110, borderRadius: 12, border: "1px solid var(--border)", padding: 14, marginTop: 12 }}
                  />
                  {error ? <div className="error" style={{ marginTop: 12 }}>{error}</div> : null}
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button className="button" type="button" disabled={pending} onClick={handleSave}>
                      {pending ? "Sauvegarde..." : "Enregistrer"}
                    </button>
                    <button className="button-secondary" type="button" onClick={() => setEditing(false)}>
                      Annuler
                    </button>
                  </div>
                </div>
              ) : error ? (
                <div className="error" style={{ marginTop: 12 }}>{error}</div>
              ) : null}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
