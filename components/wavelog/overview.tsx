"use client";

import type { SessionRecord } from "@/lib/types";
import {
  DIR_DEG,
  averageRating,
  countBy,
  formatAvg,
  parseDate,
  ratingStyle,
  shortDate,
  splitSpot,
  topKey,
  totalHours
} from "@/lib/wavelog";

import { Icon } from "./ui";

type Props = {
  sessions: SessionRecord[]; // sorted newest first
  onLog: () => void;
  onOpen: (id: string) => void;
  onViewAll: () => void;
};

function verdict(rating: number | null) {
  if (!rating) return "Unrated";
  if (rating >= 8) return "Firing";
  if (rating >= 6) return "Fun session";
  return "Average";
}

function Metric({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div>
      <div className="cap">{label}</div>
      <div className="metric-val">
        {value}
        {unit ? <small>{unit}</small> : null}
      </div>
    </div>
  );
}

export function Overview({ sessions, onLog, onOpen, onViewAll }: Props) {
  if (!sessions.length) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🌊</div>
        <div className="empty-title">No sessions yet</div>
        <div className="empty-sub">Your logbook is empty.</div>
        <button className="btn-primary empty-cta" type="button" onClick={onLog}>
          + Log a Session
        </button>
      </div>
    );
  }

  const last = sessions[0];
  const hours = totalHours(sessions);
  const topSpot = splitSpot(topKey(countBy(sessions, (s) => s.spot)))[0];
  const uniqueSpots = new Set(sessions.map((s) => s.spot).filter(Boolean)).size;
  // Rating cadence: last 13 sessions, oldest → newest
  const cadence = sessions.slice(0, 13).reverse();

  const board = topKey(countBy(sessions, (s) => s.board));
  const boardSessions = sessions.filter((s) => s.board === board);
  let best = sessions.filter((s) => (s.rating ?? 0) >= 8);
  if (!best.length) best = sessions.filter((s) => s.rating).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 3);
  const sweet = [topKey(countBy(best, (s) => s.wind_type)), topKey(countBy(best, (s) => s.wave_shape))].filter(Boolean).join(" / ") || "—";
  const sweetChips = [
    ["Tide", topKey(countBy(best, (s) => s.tide))],
    ["Swell", topKey(countBy(best, (s) => s.swell_direction))],
    ["Crowd", topKey(countBy(best, (s) => s.crowd))]
  ].filter(([, v]) => v);
  const temps = sessions.map((s) => s.water_temp).filter((t): t is number => typeof t === "number");
  const avgTemp = temps.length ? Math.round(temps.reduce((a, b) => a + b, 0) / temps.length) : null;
  const recent = sessions.slice(0, 4);

  return (
    <>
      <div className="bento-row">
        <div className="bento hero tone tone-mist">
          <div className="card-head">
            <div className="pill-row">
              <span className="pill pill-solid">
                <span className="dot dot-ping" />
                Season {parseDate(last.date).getFullYear()}
              </span>
              <span className="pill pill-soft">
                {uniqueSpots} spot{uniqueSpots !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
          <div className="hero-mid">
            <div>
              <div className="cap">Ocean cadence</div>
              <h1 className="hero-num">
                {sessions.length} session{sessions.length !== 1 ? "s" : ""}
              </h1>
              <div className="hero-sub">in the water so far</div>
            </div>
            <div className="eq" aria-hidden="true">
              {cadence.map((s) => {
                const r = s.rating || 1;
                return (
                  <span
                    key={s.id}
                    title={`${s.spot} · ${s.rating ?? "—"}`}
                    style={{ height: Math.round(12 + r * 6.8), opacity: 0.3 + r * 0.07 }}
                  />
                );
              })}
            </div>
          </div>
          <div className="metrics rule">
            <Metric label="Avg rating" value={formatAvg(averageRating(sessions))} unit="/10" />
            <Metric label="Hours surfed" value={hours > 0 ? `${hours}h` : "—"} />
            <div>
              <div className="cap">Top spot</div>
              <div className="metric-val sm">{topSpot}</div>
            </div>
          </div>
        </div>

        <div className="bento last tone tone-paper">
          <div>
            <div className="card-head">
              <div className="pill-row">
                <span className="dot dot-live" />
                <span className="cap strong">Last session</span>
              </div>
              <span className="pill pill-outline">{shortDate(last.date)}</span>
            </div>
            <div className="last-spot">{splitSpot(last.spot)[0]}</div>
            <div className="last-nums">
              <div>
                <div className="cap">Wave size</div>
                <div className="big-val">{last.wave_size || "—"}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="cap">Rating</div>
                <div className="metric-val">
                  {last.rating ?? "—"}
                  <small>/10</small>
                </div>
              </div>
            </div>
            <div className="dial">
              <div className="dial-item">
                <Icon name="navigation" style={{ transform: `rotate(${DIR_DEG[last.swell_direction ?? ""] ?? 0}deg)` }} />
                <div>
                  <div className="cap">Swell</div>
                  <div className="dial-val">{last.swell_direction || "—"}</div>
                </div>
              </div>
              <div className="dial-item">
                <Icon name="air" />
                <div>
                  <div className="cap">Wind</div>
                  <div className="dial-val">{last.wind_type || "—"}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="card-foot">
            <span className="pill pill-mint">{verdict(last.rating)}</span>
            <button className="icon-btn" type="button" aria-label="Open last session" onClick={() => onOpen(last.id)}>
              <Icon name="arrow_forward" />
            </button>
          </div>
        </div>
      </div>

      <div className="bento-row">
        <div className="bento third tone tone-peach">
          <div className="card-head">
            <span className="pill pill-solid">Favorite board</span>
            <Icon name="surfing" />
          </div>
          <div>
            <div className="card-title">{board || "—"}</div>
            <div className="card-sub">Most ridden board</div>
          </div>
          <div className="card-foot rule">
            <div className="pill-row">
              <span className="metric-val xs">{formatAvg(averageRating(boardSessions))}</span>
              <span className="cap">Avg score</span>
            </div>
            <span className="pill pill-soft">
              {boardSessions.length} session{boardSessions.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="bento third tone tone-mint">
          <div className="card-head">
            <span className="pill pill-solid">Sweet spot</span>
            <Icon name="auto_awesome" />
          </div>
          <div>
            <div className="card-title">{sweet}</div>
            <div className="card-sub">Conditions of your best-rated sessions</div>
          </div>
          <div className="pill-row wrap">
            {sweetChips.map(([label, value]) => (
              <span key={label} className="pill pill-soft">
                {label}: {value}
              </span>
            ))}
          </div>
        </div>

        <div className="bento third wide-md tone tone-sky">
          <div className="card-head">
            <span className="pill pill-solid">Water &amp; wave size</span>
            <Icon name="thermostat" />
          </div>
          <div className="two-col">
            <div>
              <div className="cap">Water temp</div>
              <div className="card-title">
                {avgTemp !== null ? (
                  <>
                    {avgTemp}°<small>C</small>
                  </>
                ) : (
                  "—"
                )}
              </div>
              <div className="cap">{topKey(countBy(sessions, (s) => s.suit)) || "—"} suit</div>
            </div>
            <div>
              <div className="cap">Wave bracket</div>
              <div className="card-title">{topKey(countBy(sessions, (s) => s.wave_size)) || "—"}</div>
              <div className="cap">Most surfed size</div>
            </div>
          </div>
          <div className="card-foot rule">
            <span className="cap">Spots surfed</span>
            <span className="pill pill-solid">{uniqueSpots}</span>
          </div>
        </div>
      </div>

      <div className="recent-head">
        <div className="pill-row">
          <span className="section-title">Recent sessions</span>
          <span className="pill pill-outline">{recent.length} latest</span>
        </div>
        <button className="link-btn" type="button" onClick={onViewAll}>
          View all <Icon name="arrow_forward" />
        </button>
      </div>
      <div className="recent-grid">
        {recent.map((s) => {
          const [name, region] = splitSpot(s.spot);
          const tags = [s.wave_size, s.wind_type, s.hours].filter(Boolean) as string[];
          return (
            <button key={s.id} className="rcard" type="button" onClick={() => onOpen(s.id)}>
              <div>
                <div className="card-head">
                  <span className="cap">{shortDate(s.date)}</span>
                  {s.rating ? (
                    <span className="rpill" style={ratingStyle(s.rating)}>
                      {s.rating}
                    </span>
                  ) : null}
                </div>
                <div className="rc-title">{name}</div>
                <div className="rc-region">{region || " "}</div>
                {s.comments ? <div className="rc-notes">{s.comments}</div> : <div className="rc-notes empty">No notes</div>}
              </div>
              <div className="rc-foot">
                <div className="pill-row wrap">
                  {tags.map((tag, i) => (
                    <span key={`${i}-${tag}`} className={i === 0 ? "tag strong" : "tag"}>
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="rc-meta">{[s.board, s.crowd].filter(Boolean).join(" • ") || " "}</div>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}
