"use client";

import type { ReactNode } from "react";

import type { SessionRecord } from "@/lib/types";
import { formatSourceTime, longDate, parseDate, ratingStyle, sourceLabel } from "@/lib/wavelog";

type Field = [label: string, value: string | null | undefined];

function monthDay(iso: string) {
  const d = parseDate(iso);
  return { month: d.toLocaleString("en", { month: "short" }).toUpperCase(), day: d.getDate() };
}

function num(value: number | null, digits: number, unit: string) {
  return value === null ? null : `${value.toFixed(digits)} ${unit}`;
}

function Grid({ title, fields }: { title: string; fields: Field[] }) {
  const shown = fields.filter(([, value]) => value);
  if (!shown.length) return null;
  return (
    <>
      <div className="det-sec-title">{title}</div>
      <div className="det-grid">
        {shown.map(([label, value]) => (
          <div key={label}>
            <div className="det-fl">{label}</div>
            <div className="det-fv">{value}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function sections(s: SessionRecord) {
  const conditions: Field[] = [
    ["Wave Size", s.wave_size],
    ["Tide", s.tide],
    ["Swell", s.swell_direction],
    ["Wind", s.wind_type],
    ["Shape", s.wave_shape],
    ["Current", s.current],
    ["Crowd", s.crowd],
    ["Water Temp", s.water_temp != null ? `${s.water_temp}°C` : null]
  ];
  const measured: Field[] = [
    ["Swell height", num(s.swell_height_m, 1, "m")],
    ["Swell period", num(s.swell_period_s, 1, "s")],
    ["Wind speed", num(s.wind_speed_kmh, 0, "km/h")],
    ["Current speed", num(s.current_speed_kmh, 1, "km/h")],
    ["Sea level", num(s.sea_level_m, 2, "m")]
  ];
  const setup: Field[] = [
    ["Suit", s.suit],
    ["Board", s.board],
    ["Session", s.session_type],
    ["With", s.with_who],
    ["Duration", s.hours]
  ];
  return { conditions, measured, setup };
}

function headerMeta(s: SessionRecord) {
  return longDate(s.date) + (s.time ? ` · ${s.time}` : "") + (s.hours ? ` · ${s.hours}` : "");
}

/** Desktop list + slide-over panel and mobile list. The mobile detail is a separate screen (SessionDetailMobile). */
export function SessionsView({
  sessions,
  selectedId,
  paneOpen,
  onSelect,
  onClosePane,
  onEdit,
  onDelete
}: {
  sessions: SessionRecord[];
  selectedId: string | null;
  paneOpen: boolean;
  onSelect: (id: string) => void;
  onClosePane: () => void;
  onEdit: (session: SessionRecord) => void;
  onDelete: (session: SessionRecord) => void;
}) {
  const selected = sessions.find((s) => s.id === selectedId) ?? null;
  const count = `${sessions.length} log${sessions.length !== 1 ? "s" : ""}`;
  const empty = (
    <div className="empty-state">
      <div className="empty-icon">📋</div>
      <div className="empty-title">No sessions yet</div>
      <div className="empty-sub">Your logbook is empty.</div>
    </div>
  );

  return (
    <>
      <div className="screen-header">
        <div style={{ minWidth: 44 }} />
        <h2>Sessions</h2>
        <span id="sessions-count">{count}</span>
      </div>

      <div className="sess-list-pane">
        <div className="sess-list-header">
          <div className="sess-list-title">Sessions</div>
          <span id="sess-count-dt">{count}</span>
        </div>
        <div className="sess-list-scroll">
          {sessions.length
            ? sessions.map((s) => {
                const { month, day } = monthDay(s.date);
                return (
                  <button
                    key={s.id}
                    type="button"
                    className={paneOpen && s.id === selectedId ? "sess-row sel" : "sess-row"}
                    onClick={() => onSelect(s.id)}
                  >
                    <div className="sess-row-date">
                      <div className="sess-row-month">{month}</div>
                      <div className="sess-row-day">{day}</div>
                    </div>
                    <div className="sess-row-div" />
                    <div className="sess-row-info">
                      <div className="sess-row-spot">{s.spot || "—"}</div>
                      <div className="sess-row-meta">
                        {s.wave_size ? <span className="badge">{s.wave_size}</span> : null}
                        {s.wind_type ? <span className="badge badge-sand">{s.wind_type}</span> : null}
                        {s.hours ? <span>{s.hours}</span> : null}
                        {s.tide ? <span>{s.tide} tide</span> : null}
                      </div>
                      {s.board ? <div className="sess-row-board">{s.board}</div> : null}
                    </div>
                    {s.rating ? (
                      <div className="rc-sm" style={ratingStyle(s.rating)}>
                        {s.rating}
                      </div>
                    ) : null}
                  </button>
                );
              })
            : empty}
        </div>
      </div>

      <div className={paneOpen ? "sess-backdrop show" : "sess-backdrop"} onClick={onClosePane} />
      <aside className={paneOpen && selected ? "sess-detail-pane open" : "sess-detail-pane"} aria-hidden={!paneOpen}>
        {selected ? (
          <>
            <div className="det-topbar">
              <div className="det-topbar-left">
                <button className="det-close-btn" type="button" aria-label="Close detail" onClick={onClosePane}>
                  ✕
                </button>
                <div className="det-topbar-title">Session detail</div>
              </div>
              <div className="det-topbar-actions">
                <button className="btn-edit-sm" type="button" onClick={() => onEdit(selected)}>
                  Edit
                </button>
                <button className="btn-danger-sm" type="button" onClick={() => onDelete(selected)}>
                  Delete
                </button>
              </div>
            </div>
            <div className="det-inner">
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14, marginBottom: 6 }}>
                <div>
                  <div className="det-spot">{selected.spot || "Unknown spot"}</div>
                  <div className="det-meta">{headerMeta(selected)}</div>
                </div>
                {selected.rating ? (
                  <div className="det-rating-lg" style={ratingStyle(selected.rating)}>
                    {selected.rating}
                  </div>
                ) : null}
              </div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", margin: "8px 0 18px" }}>
                {[selected.wave_size, selected.wind_type, selected.wave_shape, selected.tide]
                  .filter(Boolean)
                  .map((value, i) => (
                    <span key={`${i}-${value}`} className={i === 1 ? "badge badge-sand" : "badge"}>
                      {value}
                    </span>
                  ))}
              </div>
              <DetailSections session={selected} wrap={(children, key) => <div key={key} style={{ marginBottom: 18 }}>{children}</div>} />
            </div>
          </>
        ) : null}
      </aside>

      <div className="screen-body" id="sessions-list-mob">
        {sessions.length
          ? sessions.map((s) => {
              const { month, day } = monthDay(s.date);
              return (
                <button key={s.id} type="button" className="card card-tap" onClick={() => onSelect(s.id)}>
                  <div className="session-card">
                    <div className="s-date-block">
                      <div className="s-date-month">{month}</div>
                      <div className="s-date-day">{day}</div>
                    </div>
                    <div className="s-divider" />
                    <div className="s-info">
                      <div className="s-spot">{s.spot || "—"}</div>
                      <div className="s-meta">
                        {s.wave_size ? <span className="badge">{s.wave_size}</span> : null}
                        {s.wind_type ? <span className="badge badge-sand">{s.wind_type}</span> : null}
                        {s.hours ? <span>{s.hours}</span> : null}
                      </div>
                      {s.board ? <div className="s-board">{s.board}</div> : null}
                    </div>
                    {s.rating ? (
                      <div className="rating-circle" style={ratingStyle(s.rating)}>
                        {s.rating}
                      </div>
                    ) : null}
                  </div>
                </button>
              );
            })
          : empty}
      </div>
    </>
  );
}

function DetailSections({
  session,
  wrap
}: {
  session: SessionRecord;
  wrap: (children: ReactNode, key: string) => ReactNode;
}) {
  const { conditions, measured, setup } = sections(session);
  const hasMeasured = measured.some(([, v]) => v);
  return (
    <>
      {conditions.some(([, v]) => v) ? wrap(<Grid title="Conditions" fields={conditions} />, "conditions") : null}
      {hasMeasured
        ? wrap(
            <>
              <Grid title="Measured" fields={measured} />
              {session.conditions_source ? (
                <div className="det-meta" style={{ marginTop: 10 }}>
                  {sourceLabel(session.conditions_source)}
                  {session.conditions_source_time ? ` · ${formatSourceTime(session.conditions_source_time)}` : ""}
                </div>
              ) : null}
            </>,
            "measured"
          )
        : null}
      {setup.some(([, v]) => v) ? wrap(<Grid title="Setup" fields={setup} />, "setup") : null}
      {session.comments
        ? wrap(
            <>
              <div className="det-sec-title">Notes</div>
              <div className="det-notes">“{session.comments}”</div>
            </>,
            "notes"
          )
        : null}
    </>
  );
}

export function SessionDetailMobile({
  session,
  onBack,
  onEdit,
  onDelete
}: {
  session: SessionRecord | null;
  onBack: () => void;
  onEdit: (session: SessionRecord) => void;
  onDelete: (session: SessionRecord) => void;
}) {
  return (
    <>
      <div className="screen-header">
        <button className="hdr-btn" type="button" onClick={onBack}>
          ← Back
        </button>
        <h2>Session</h2>
        {session ? (
          <button className="hdr-btn danger right" type="button" onClick={() => onDelete(session)}>
            Delete
          </button>
        ) : (
          <div style={{ minWidth: 44 }} />
        )}
      </div>
      <div className="screen-body">
        {session ? (
          <>
            <div className="card">
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 5 }}>
                <div className="det-spot">{session.spot || "Unknown spot"}</div>
                {session.rating ? (
                  <div className="det-rating-lg" style={ratingStyle(session.rating)}>
                    {session.rating}
                  </div>
                ) : null}
              </div>
              <div className="det-meta">{headerMeta(session)}</div>
            </div>
            <DetailSections session={session} wrap={(children, key) => <div key={key} className="card">{children}</div>} />
            <div className="delete-zone">
              <button className="btn-primary" type="button" onClick={() => onEdit(session)} style={{ marginBottom: 10 }}>
                Edit this session
              </button>
              <button className="btn-danger" type="button" onClick={() => onDelete(session)}>
                Delete this session
              </button>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
