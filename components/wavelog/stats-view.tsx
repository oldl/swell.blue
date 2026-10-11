"use client";

import { useState } from "react";

import type { BoardRecord, SessionRecord } from "@/lib/types";
import { H_MAP, averageRating, countBy, parseDate, sessionWaveHeight, splitSpot, totalHours } from "@/lib/wavelog";

import { Quiver } from "./quiver";
import { Icon } from "./ui";

type Period = "month" | "year" | "all";

type Props = {
  userId: string;
  sessions: SessionRecord[];
  boards: BoardRecord[];
  onQuiverSaved: (boards: BoardRecord[], renames: Record<string, string>) => void;
  toast: (message: string) => void;
};

type BoardStat = { name: string; count: number; ratingTotal: number; ratingCount: number };

function top(counts: Record<string, number>) {
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0] ?? null;
}

function periodSessions(sessions: SessionRecord[], period: Period) {
  if (period === "all") return sessions;
  const now = new Date();
  return sessions.filter((s) => {
    const d = parseDate(s.date);
    return d.getFullYear() === now.getFullYear() && (period === "year" || d.getMonth() === now.getMonth());
  });
}

function formatDuration(hours: number) {
  const minutes = Math.round(hours * 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return (h ? `${h}h ` : "") + (m ? `${m}min` : h ? "" : "0min");
}

function avgOf(stat: { ratingTotal: number; ratingCount: number }) {
  return stat.ratingCount ? stat.ratingTotal / stat.ratingCount : null;
}

function Kpi({ label, value, unit, note, icon, tone }: { label: string; value: string; unit?: string; note: string; icon: string; tone: string }) {
  return (
    <div className={`stats-kpi ${tone}`}>
      <div className="stats-kpi-head">
        <span>{label}</span>
        <Icon name={icon} />
      </div>
      <div>
        <div className="stats-kpi-number">
          {value}
          {unit ? <small>{unit}</small> : null}
        </div>
        <div className="stats-kpi-note">{note}</div>
      </div>
    </div>
  );
}

function Insight({ label, icon, value, copy, foot, tone }: { label: string; icon: string; value: string; copy: string; foot: string; tone: string }) {
  return (
    <div className={`stats-insight ${tone}`}>
      <div>
        <div className="stats-insight-label">
          <span>{label}</span>
          <Icon name={icon} />
        </div>
        <div className="stats-insight-value">{value}</div>
        <div className="stats-insight-copy">{copy}</div>
      </div>
      <div className="stats-insight-foot">{foot}</div>
    </div>
  );
}

export function StatsView({ userId, sessions, boards, onQuiverSaved, toast }: Props) {
  const [period, setPeriod] = useState<Period>("all");

  const data = periodSessions(sessions, period);
  const periodName = period === "month" ? "This Month" : period === "year" ? "This Year" : "All Time";

  const header = (
    <section className="stats-editorial">
      <div>
        <div className="stats-eyebrow">
          Hydrographic Log<span className="dot" />
          <span>{periodName}</span>
        </div>
        <h1 className="stats-title">Your Surf Story</h1>
        <p className="stats-subtitle">A considered synthesis of ocean hours, optimal swell conditions and equipment performance.</p>
      </div>
      <div className="stats-filters">
        {(
          [
            ["month", "This Month"],
            ["year", "This Year"],
            ["all", `All Time · ${sessions.length}`]
          ] as Array<[Period, string]>
        ).map(([value, label]) => (
          <button key={value} type="button" className={period === value ? "stats-filter active" : "stats-filter"} onClick={() => setPeriod(value)}>
            {label}
          </button>
        ))}
      </div>
    </section>
  );

  const quiver = (
    <Quiver userId={userId} sessions={sessions} periodSessions={data} boards={boards} onSaved={onQuiverSaved} toast={toast} />
  );

  if (!data.length) {
    return (
      <>
        {header}
        <section className="stats-section stats-empty">
          <Icon name="monitoring" style={{ fontSize: 34 }} />
          <h3>No sessions for {periodName.toLowerCase()}</h3>
          <p>Choose another period or log a new session.</p>
        </section>
        {quiver}
      </>
    );
  }

  const rated = data.filter((s) => s.rating);
  const avg = averageRating(data);
  const hours = totalHours(data);
  const uniqueSpots = new Set(data.map((s) => s.spot).filter(Boolean)).size;
  const best = rated.slice().sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0] ?? null;
  const timed = data.filter((s) => /^\d{2}:\d{2}/.test(s.time ?? ""));
  const morningPct = timed.length ? Math.round((timed.filter((s) => Number(s.time!.slice(0, 2)) < 12).length / timed.length) * 100) : 0;

  // Activity: six months ending with the latest session of the period
  const latest = data.reduce<SessionRecord | null>((acc, s) => (!acc || s.date > acc.date ? s : acc), null);
  const end = latest ? parseDate(latest.date) : new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(end.getFullYear(), end.getMonth() - (5 - i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const list = data.filter((s) => s.date.startsWith(key));
    return { key, label: d.toLocaleString("en", { month: "short" }).toUpperCase(), hours: list.reduce((sum, s) => sum + (H_MAP[s.hours ?? ""] ?? 0), 0), count: list.length };
  });
  const maxHours = Math.max(1, ...months.map((m) => m.hours));
  const peak = months.reduce((a, b) => (b.hours > a.hours ? b : a), months[0]);

  const windTop = top(countBy(data, (s) => s.wind_type));
  const tideTop = top(countBy(data, (s) => s.tide));
  const crowdTop = top(countBy(data, (s) => s.crowd));
  const waves = data.map(sessionWaveHeight).filter((v) => Number.isFinite(v) && v > 0);
  const avgWave = waves.length ? waves.reduce((a, b) => a + b, 0) / waves.length : null;

  const spots = Object.values(
    data.reduce<Record<string, BoardStat>>((acc, s) => {
      if (!s.spot) return acc;
      const e = (acc[s.spot] ??= { name: s.spot, count: 0, ratingTotal: 0, ratingCount: 0 });
      e.count++;
      if (s.rating) {
        e.ratingTotal += s.rating;
        e.ratingCount++;
      }
      return acc;
    }, {})
  )
    .sort((a, b) => b.count - a.count || (avgOf(b) ?? 0) - (avgOf(a) ?? 0))
    .slice(0, 5);
  const maxSpot = spots[0]?.count ?? 1;

  return (
    <>
      {header}
      {data.length ? (
        <>
          <section className="stats-kpis">
            <Kpi label="Total Sessions" value={String(data.length)} note="logged in the water" icon="water" tone="tone-mist" />
            <Kpi label="Hours Surfed" value={hours.toFixed(hours % 1 ? 1 : 0)} unit="h" note="total water time" icon="schedule" tone="tone-paper" />
            <Kpi
              label="Avg Session Rating"
              value={avg === null ? "—" : avg.toFixed(1)}
              unit={avg === null ? undefined : "/10"}
              note={best ? `Peak ${best.rating} at ${splitSpot(best.spot)[0]}` : "No rated session"}
              icon="star"
              tone="tone-mint"
            />
            <Kpi label="Spots Surfed" value={String(uniqueSpots)} note={uniqueSpots === 1 ? "coastal break" : "coastal breaks"} icon="explore" tone="tone-paper" />
          </section>

          <section className="stats-section">
            <div className="stats-section-head">
              <div>
                <h2 className="stats-section-title">Your Surf Activity</h2>
                <p className="stats-section-copy">Monthly duration and frequency across your latest logged swells.</p>
              </div>
              <div className="stats-highlight">
                {peak.label} · {peak.hours.toFixed(1)}h peak
              </div>
            </div>
            <div className="stats-chart">
              {months.map((m) => (
                <div key={m.key} className="stats-bar-item">
                  <div className="stats-bar-value">
                    {m.count} · {m.hours.toFixed(1)}h
                  </div>
                  <div className={m === peak ? "stats-bar peak" : "stats-bar"} style={{ height: `${Math.max(2, Math.round((m.hours / maxHours) * 82))}%` }} />
                  <div className="stats-bar-label">{m.label}</div>
                </div>
              ))}
            </div>
            <div className="stats-cadence">
              <div>
                <Icon name="schedule" />
                <span>
                  Average session: <strong>{formatDuration(hours / data.length)}</strong>
                </span>
              </div>
              <div>
                <Icon name="wb_twilight" />
                <span>
                  <strong>{morningPct}%</strong> morning sessions
                </span>
              </div>
            </div>
          </section>

          <section className="stats-sweet-wrap">
            <div className="stats-sweet-head">
              <div>
                <div className="stats-eyebrow">Predictive Correlation</div>
                <h2 className="stats-section-title">Your Sweet Spot</h2>
              </div>
              <div className="stats-highlight">
                {[windTop?.[0], tideTop ? `${tideTop[0]} tide` : null].filter(Boolean).join(" · ") || "More sessions needed"}
              </div>
            </div>
            <div className="stats-sweet-grid">
              <Insight
                label="Wave profile"
                icon="waves"
                value={avgWave === null ? "—" : `${avgWave.toFixed(1)} m`}
                copy="Average recorded wave height"
                foot={`${waves.length} measured session${waves.length === 1 ? "" : "s"}`}
                tone="tone-paper"
              />
              <Insight
                label="Atmospheric dynamics"
                icon="air"
                value={windTop?.[0] ?? "—"}
                copy="Your most frequently logged wind"
                foot={tideTop ? `Preferred tide · ${tideTop[0]}` : "No tide preference yet"}
                tone="tone-mist"
              />
              <Insight
                label="Lineup density"
                icon="group"
                value={crowdTop?.[0] ?? "—"}
                copy="Your most common crowd level"
                foot={best ? `${best.rating}/10 at ${splitSpot(best.spot)[0]}` : "No best session yet"}
                tone="tone-peach"
              />
            </div>
          </section>

          <section className="stats-section">
            <div className="stats-section-head">
              <div>
                <h2 className="stats-section-title">Your Local Breaks</h2>
                <p className="stats-section-copy">Ranked by frequency and average session quality.</p>
              </div>
              <div className="pill pill-outline">Session Count</div>
            </div>
            <div className="stats-spot-list">
              {spots.map((spot, index) => {
                const [name, region] = splitSpot(spot.name);
                const spotAvg = avgOf(spot);
                return (
                  <div key={spot.name} className="stats-spot-row">
                    <div className="stats-rank">{String(index + 1).padStart(2, "0")}</div>
                    <div>
                      <div className="stats-spot-name">{name}</div>
                      <div className="stats-spot-meta">
                        {region || "Recorded surf spot"} · {spot.count} session{spot.count === 1 ? "" : "s"}
                      </div>
                    </div>
                    <div className="stats-progress">
                      <div className="stats-progress-track">
                        <div className="stats-progress-fill" style={{ width: `${Math.round((spot.count / maxSpot) * 100)}%` }} />
                      </div>
                      <span>
                        {spot.count} / {data.length}
                      </span>
                    </div>
                    <div className="stats-score">{spotAvg === null ? "—" : `${spotAvg.toFixed(1)} ★`}</div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      ) : null}

      {quiver}
    </>
  );
}
