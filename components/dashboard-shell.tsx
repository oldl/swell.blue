"use client";

import { useState } from "react";

import { SessionForm } from "@/components/session-form";
import { SessionsExplorer } from "@/components/sessions-explorer";
import { SignOutButton } from "@/components/sign-out-button";
import type { SessionRecord } from "@/lib/types";

type Props = {
  userEmail: string;
  userId: string;
  sessions: SessionRecord[];
  averageRating: string;
  uniqueSpots: number;
  favoriteSpot: string;
  latestSpot: string;
  errorMessage: string | null;
};

type ScreenId = "overview" | "log" | "sessions" | "stats";

const SCREENS: Array<{ id: ScreenId; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "log", label: "Log Session" },
  { id: "sessions", label: "Sessions" },
  { id: "stats", label: "Stats" }
];

function screenMetaLabel(screen: ScreenId) {
  if (screen === "log") return "Write";
  if (screen === "sessions") return "Browse";
  if (screen === "stats") return "Numbers";
  return "Home";
}

export function DashboardShell({
  userEmail,
  userId,
  sessions,
  averageRating,
  uniqueSpots,
  favoriteSpot,
  latestSpot,
  errorMessage
}: Props) {
  const [activeScreen, setActiveScreen] = useState<ScreenId>("overview");

  function topbarTitle() {
    if (activeScreen === "log") return "Log a Session";
    if (activeScreen === "sessions") return "Sessions";
    if (activeScreen === "stats") return "Stats";
    return "Overview";
  }

  function topbarMeta() {
    if (activeScreen === "sessions") return `${sessions.length} logs`;
    if (activeScreen === "stats") return "Live from Supabase";
    return userEmail;
  }

  return (
    <div className="shell dashboard-app-shell">
      <aside className="app-sidebar">
        <div className="sidebar-brand-ui">
          <div className="brand">
            Wave
            <br />
            Log
          </div>
          <div className="brand-sub">{userEmail}</div>
        </div>
        <nav className="sidebar-nav-ui">
          {SCREENS.map((screen) => (
            <button
              key={screen.id}
              className={activeScreen === screen.id ? "sidebar-link-ui sidebar-link-ui-active" : "sidebar-link-ui"}
              type="button"
              onClick={() => setActiveScreen(screen.id)}
            >
              <span className="sidebar-link-kicker-ui">{screenMetaLabel(screen.id)}</span>
              <span>{screen.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer-ui">
          <div className="strip-item-ui">
            <span>Sessions</span>
            <strong>{sessions.length}</strong>
          </div>
          <div className="strip-item-ui">
            <span>Avg rating</span>
            <strong>{averageRating}</strong>
          </div>
          <div className="strip-item-ui">
            <span>Top spot</span>
            <strong>{favoriteSpot}</strong>
          </div>
        </div>
      </aside>

      <div className="screens-wrap-ui">
        <div className="topbar topbar-shell-ui">
          <div className="topbar-title-ui">{topbarTitle()}</div>
          <div className="topbar-meta-ui">{topbarMeta()}</div>
          <div className="topbar-actions-ui">
            <SignOutButton />
          </div>
        </div>

          <section className={activeScreen === "overview" ? "screen-section-ui" : "screen-section-ui hidden-screen"}>
          <section className="dashboard-hero panel">
            <div className="dashboard-hero-copy">
              <div className="eyebrow">Your surf logbook</div>
              <h1 className="dashboard-headline">Chaque session devient une page de carnet.</h1>
              <p className="lead" style={{ marginBottom: 0 }}>
                Ton logbook garde maintenant tes spots, tes conditions et tes notes dans une vraie app
                multi-appareils. L’idée est de retrouver le côté journal intime du prototype, sans perdre la structure.
              </p>
            </div>
            <div className="dashboard-hero-side">
              <div className="hero-note">
                <div className="hero-note-label">Dernière mise à l’eau</div>
                <div className="hero-note-value">{latestSpot}</div>
              </div>
              <div className="hero-note">
                <div className="hero-note-label">Spots explorés</div>
                <div className="hero-note-value">{uniqueSpots || "—"}</div>
              </div>
            </div>
          </section>

            <div className="stats-grid-ui">
              <div className="stc-ui">
                <div className="stc-val-ui">{sessions.length}</div>
                <div className="stc-lbl-ui">Sessions</div>
              </div>
            <div className="stc-ui">
              <div className="stc-val-ui">{averageRating}</div>
              <div className="stc-lbl-ui">Avg rating</div>
            </div>
            <div className="stc-ui">
              <div className="stc-val-ui">{uniqueSpots}</div>
              <div className="stc-lbl-ui">Spots surfed</div>
            </div>
              <div className="stc-ui stc-ui-wide">
                <div className="stc-val-ui stc-val-ui-md">{favoriteSpot}</div>
                <div className="stc-lbl-ui">Most surfed spot</div>
              </div>
            </div>

            <div className="overview-strip-ui">
              <div className="overview-strip-card-ui">
                <div className="overview-strip-label-ui">Latest spot</div>
                <div className="overview-strip-value-ui">{latestSpot}</div>
              </div>
              <div className="overview-strip-card-ui">
                <div className="overview-strip-label-ui">Account</div>
                <div className="overview-strip-value-ui">{userEmail}</div>
              </div>
            </div>
          </section>

        <section className={activeScreen === "log" ? "screen-section-ui" : "screen-section-ui hidden-screen"}>
          <SessionForm userId={userId} />
        </section>

        <section className={activeScreen === "sessions" ? "screen-section-ui" : "screen-section-ui hidden-screen"}>
          {errorMessage ? <div className="error">Lecture Supabase impossible pour le moment: {errorMessage}</div> : null}
          {sessions.length ? (
            <SessionsExplorer sessions={sessions} />
          ) : (
            <div className="empty">Aucune session en base pour ce compte. Ajoute ta première session dans Log Session.</div>
          )}
        </section>

        <section className={activeScreen === "stats" ? "screen-section-ui" : "screen-section-ui hidden-screen"}>
          <div className="stats-grid-ui">
            <div className="stc-ui">
              <div className="stc-val-ui">{sessions.length}</div>
              <div className="stc-lbl-ui">Total sessions</div>
            </div>
            <div className="stc-ui">
              <div className="stc-val-ui">{averageRating}</div>
              <div className="stc-lbl-ui">Avg rating</div>
            </div>
            <div className="stc-ui">
              <div className="stc-val-ui">{uniqueSpots}</div>
              <div className="stc-lbl-ui">Spots surfed</div>
            </div>
            <div className="stc-ui stc-ui-wide">
              <div className="stc-val-ui stc-val-ui-md">{latestSpot}</div>
              <div className="stc-lbl-ui">Latest session</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
