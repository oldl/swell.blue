"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { SignOutButton } from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/client";
import type { BoardRecord, SessionRecord, SpotRecord } from "@/lib/types";
import { averageRating, countBy, formatAvg, sortSessions, splitSpot, topKey } from "@/lib/wavelog";

import { Overview } from "./overview";
import { SessionForm } from "./session-form";
import { SessionDetailMobile, SessionsView } from "./sessions-view";
import { StatsView } from "./stats-view";
import { Icon, useIsDesktop } from "./ui";

type Screen = "home" | "log" | "sessions" | "detail" | "stats";

type Props = {
  userId: string;
  userEmail: string;
  initialSessions: SessionRecord[];
  initialBoards: BoardRecord[];
  spots: SpotRecord[];
  loadError: string | null;
};

const NAV: Array<{ id: Screen; icon: string; label: string; short: string }> = [
  { id: "home", icon: "grid_view", label: "Overview", short: "Home" },
  { id: "log", icon: "add_circle", label: "Log Session", short: "Log" },
  { id: "sessions", icon: "surfing", label: "Sessions", short: "Sessions" },
  { id: "stats", icon: "monitoring", label: "Stats & Quiver", short: "Stats" }
];

function todayLabel() {
  return new Date().toLocaleString("en", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).toUpperCase();
}

export function WaveLogApp({ userId, userEmail, initialSessions, initialBoards, spots, loadError }: Props) {
  const supabase = useMemo(() => createClient(), []);
  const isDesktop = useIsDesktop();
  const [sessions, setSessions] = useState(() => sortSessions(initialSessions));
  const [boards, setBoards] = useState(initialBoards);
  const [screen, setScreen] = useState<Screen>("home");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [paneOpen, setPaneOpen] = useState(false);
  const [detailBack, setDetailBack] = useState<Screen>("sessions");
  const [editing, setEditing] = useState<SessionRecord | null>(null);
  // Bumping the key remounts the form: fresh draft after save/clear, or prefilled when editing.
  const [formKey, setFormKey] = useState(0);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef<number | undefined>(undefined);

  const toast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastVisible(false), 2400);
  }, []);

  const selected = sessions.find((s) => s.id === selectedId) ?? null;
  const avg = formatAvg(averageRating(sessions));
  const topSpot = splitSpot(topKey(countBy(sessions, (s) => s.spot)))[0];
  const boardSuggestions = useMemo(
    () => Array.from(new Set([...boards.map((b) => b.name), ...sessions.map((s) => s.board).filter((b): b is string => Boolean(b))])).sort(),
    [boards, sessions]
  );

  function go(next: Screen) {
    if (next !== "sessions") setPaneOpen(false);
    setScreen(next);
  }

  function openSession(id: string, from: Screen) {
    setSelectedId(id);
    if (isDesktop) {
      setScreen("sessions");
      setPaneOpen(true);
    } else {
      setDetailBack(from);
      setScreen("detail");
    }
  }

  function resetForm() {
    setEditing(null);
    setFormKey((k) => k + 1);
  }

  function startEdit(session: SessionRecord) {
    setEditing(session);
    setFormKey((k) => k + 1);
    setPaneOpen(false);
    setScreen("log");
  }

  function handleSaved(record: SessionRecord, wasEdit: boolean) {
    setSessions((current) => sortSessions(wasEdit ? current.map((s) => (s.id === record.id ? record : s)) : [record, ...current]));
    toast(wasEdit ? "Session updated ✓" : "Session saved ✓");
    resetForm();
    go(wasEdit ? "sessions" : "home");
    if (wasEdit) {
      setSelectedId(record.id);
      if (isDesktop) setPaneOpen(true);
      else setScreen("detail");
    }
  }

  async function deleteSession(session: SessionRecord) {
    if (!window.confirm("Delete this session?")) return;
    const { error } = await supabase.from("sessions").delete().eq("id", session.id);
    if (error) {
      toast(`Delete failed: ${error.message}`);
      return;
    }
    setSessions((current) => current.filter((s) => s.id !== session.id));
    if (editing?.id === session.id) resetForm();
    setSelectedId(null);
    setPaneOpen(false);
    if (screen === "detail") setScreen(detailBack);
    toast("Session deleted");
  }

  function quiverSaved(fresh: BoardRecord[], renames: Record<string, string>) {
    setBoards(fresh);
    if (Object.keys(renames).length) {
      setSessions((current) => current.map((s) => (s.board && renames[s.board] ? { ...s, board: renames[s.board] } : s)));
    }
  }

  const navActive = (id: Screen) => screen === id || (id === "sessions" && screen === "detail");
  const screenClass = (id: Screen) => (screen === id ? "screen active" : "screen");

  return (
    <div id="app">
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <div className="brand-mark">
              <Icon name="tsunami" />
            </div>
            <div>
              <div className="brand-title">Wave Log</div>
              <div className="brand-sub">swell.blue</div>
            </div>
          </div>
          <button className="sidebar-cta" type="button" onClick={() => go("log")}>
            <Icon name="add" />
            <span>Log Session</span>
          </button>
          <nav className="sidebar-nav">
            {NAV.filter((n) => n.id !== "log").map((n) => (
              <button key={n.id} type="button" className={navActive(n.id) ? "nav-btn active" : "nav-btn"} onClick={() => go(n.id)}>
                <span className="nav-icon">
                  <Icon name={n.icon} />
                </span>
                <span className="nav-label">{n.label}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className="sidebar-footer">
          {sessions.length ? (
            <div id="sidebar-stats">
              <div className="strip-item">
                <span className="strip-lbl">Sessions</span>
                <span className="strip-val">{sessions.length}</span>
              </div>
              <div className="strip-item">
                <span className="strip-lbl">Avg rating</span>
                <span className="strip-val">{avg}</span>
              </div>
              <div className="strip-item">
                <span className="strip-lbl">Top spot</span>
                <span className="strip-val strip-ellipsis">{topSpot}</span>
              </div>
            </div>
          ) : null}
          <div className="sidebar-account">
            <span className="sidebar-email" title={userEmail}>
              {userEmail}
            </span>
            <SignOutButton />
          </div>
        </div>
      </aside>

      <div className="screens-wrap">
        {loadError ? <div className="load-error">Supabase read failed: {loadError}</div> : null}

        <div className={screenClass("home")} id="screen-home">
          <div className="topbar">
            <div className="topbar-title">Overview</div>
            <div className="topbar-meta" suppressHydrationWarning>
              {todayLabel()}
            </div>
            <div className="topbar-actions">
              <button className="topbar-btn topbar-btn-primary" type="button" onClick={() => go("log")}>
                + Log a Session
              </button>
            </div>
          </div>
          <div className="home-header">
            <div className="home-header-row">
              <div className="home-app-title">Wave Log</div>
              <SignOutButton compact />
            </div>
            <div className="home-sub">swell.blue · surf notebook</div>
            <div className="home-date" suppressHydrationWarning>
              {todayLabel()}
            </div>
          </div>
          <div className="screen-body">
            <div id="mobile-home-cta" style={{ marginBottom: 16 }}>
              <button className="btn-primary" type="button" onClick={() => go("log")}>
                <Icon name="add" />
                Log a Session
              </button>
            </div>
            <Overview sessions={sessions} onLog={() => go("log")} onOpen={(id) => openSession(id, "home")} onViewAll={() => go("sessions")} />
          </div>
        </div>

        <div className={screenClass("log")} id="screen-log">
          <SessionForm
            key={formKey}
            userId={userId}
            editing={editing}
            spots={spots}
            boardSuggestions={boardSuggestions}
            onSaved={handleSaved}
            onClear={() => {
              const wasEditing = editing;
              resetForm();
              if (wasEditing) openSession(wasEditing.id, "sessions");
            }}
            toast={toast}
          />
        </div>

        <div className={screenClass("sessions")} id="screen-sessions">
          <SessionsView
            sessions={sessions}
            selectedId={selectedId}
            paneOpen={paneOpen}
            onSelect={(id) => openSession(id, "sessions")}
            onClosePane={() => setPaneOpen(false)}
            onEdit={startEdit}
            onDelete={deleteSession}
          />
        </div>

        <div className={screenClass("detail")} id="screen-detail">
          <SessionDetailMobile session={selected} onBack={() => go(detailBack)} onEdit={startEdit} onDelete={deleteSession} />
        </div>

        <div className={screenClass("stats")} id="screen-stats">
          <div className="topbar">
            <div className="topbar-title">Stats</div>
            <div className="topbar-meta">{sessions.length} sessions analysed</div>
            <div />
          </div>
          <div className="screen-header">
            <div style={{ minWidth: 44 }} />
            <h2>Stats</h2>
            <div style={{ minWidth: 44 }} />
          </div>
          <div className="screen-body">
            <div className="stats-page">
              <StatsView userId={userId} sessions={sessions} boards={boards} onQuiverSaved={quiverSaved} toast={toast} />
            </div>
          </div>
        </div>
      </div>

      <nav className="bottom-nav">
        {NAV.map((n) => (
          <button key={n.id} type="button" className={navActive(n.id) ? "nav-btn active" : "nav-btn"} onClick={() => go(n.id)}>
            <span className="nav-icon">
              <Icon name={n.icon} />
            </span>
            <span>{n.short}</span>
          </button>
        ))}
      </nav>

      <div className={toastVisible ? "toast show" : "toast"} role="status" aria-live="polite">
        {toastMessage}
      </div>
    </div>
  );
}
