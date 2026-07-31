import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard-shell";
import { getSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { SessionRecord } from "@/lib/types";

export default async function DashboardPage() {
  const env = getSupabaseEnv();

  if (!env) {
    return (
      <main className="page">
        <div className="shell">
          <section className="panel">
            <div className="eyebrow">Supabase manquant</div>
            <h1 style={{ margin: "10px 0 8px", fontSize: "44px", lineHeight: 1 }}>
              Le dashboard attend encore la config.
            </h1>
            <p>
              Ajoute `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` dans `.env.local`,
              puis recharge l&apos;app.
            </p>
          </section>
        </div>
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .order("date", { ascending: false })
    .limit(12);

  const sessions = ((data as SessionRecord[] | null) ?? []).filter(Boolean);
  const rated = sessions.filter((session) => typeof session.rating === "number");
  const averageRating = rated.length
    ? (rated.reduce((sum, session) => sum + (session.rating ?? 0), 0) / rated.length).toFixed(1)
    : "—";
  const latestSession = sessions[0] ?? null;
  const uniqueSpots = new Set(sessions.map((session) => session.spot).filter(Boolean)).size;
  const topSpot = sessions.reduce<Record<string, number>>((acc, session) => {
    if (session.spot) acc[session.spot] = (acc[session.spot] ?? 0) + 1;
    return acc;
  }, {});
  const favoriteSpot = Object.entries(topSpot).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  return (
    <main className="page">
      <DashboardShell
        userEmail={user.email ?? ""}
        userId={user.id}
        sessions={sessions}
        averageRating={averageRating}
        uniqueSpots={uniqueSpots}
        favoriteSpot={favoriteSpot}
        latestSpot={latestSession ? latestSession.spot : "Pas encore de session"}
        errorMessage={error?.message ?? null}
      />
    </main>
  );
}
