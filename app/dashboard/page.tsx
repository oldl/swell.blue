import { redirect } from "next/navigation";

import { WaveLogApp } from "@/components/wavelog/wavelog-app";
import { getSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { BoardRecord, SessionRecord, SpotRecord } from "@/lib/types";

const BATCH_SIZE = 1000;

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

  // Overview and stats work on the whole logbook, so every session is loaded (PostgREST caps a page at 1000 rows).
  async function loadAllSessions() {
    const rows: SessionRecord[] = [];
    for (let from = 0; ; from += BATCH_SIZE) {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .range(from, from + BATCH_SIZE - 1);
      if (error) return { rows, error };
      const batch = (data as SessionRecord[] | null) ?? [];
      rows.push(...batch);
      if (batch.length < BATCH_SIZE) return { rows, error: null };
    }
  }

  const [sessionsResult, boardsResult, spotsResult, favoritesResult] = await Promise.all([
    loadAllSessions(),
    supabase.from("boards").select("*").order("name"),
    supabase.from("spots").select("*").in("country_code", ["BE", "FR", "ES", "PT"]).eq("is_curated", true).order("country_code").order("name"),
    supabase.from("favorite_spots").select("spot_id").order("created_at", { ascending: false })
  ]);

  const errors = [
    sessionsResult.error?.message,
    // boards / spots missing usually means a migration in supabase/migrations hasn't been applied yet.
    boardsResult.error ? `boards: ${boardsResult.error.message}` : null,
    spotsResult.error ? `spots: ${spotsResult.error.message}` : null,
    favoritesResult.error ? `favorite_spots: ${favoritesResult.error.message}` : null
  ].filter(Boolean);

  return (
    <WaveLogApp
      userId={user.id}
      userEmail={user.email ?? ""}
      initialSessions={sessionsResult.rows}
      initialBoards={(boardsResult.data as BoardRecord[] | null) ?? []}
      spots={(spotsResult.data as SpotRecord[] | null) ?? []}
      initialFavoriteSpotIds={((favoritesResult.data as Array<{ spot_id: string }> | null) ?? []).map((f) => f.spot_id)}
      loadError={errors.length ? errors.join(" · ") : null}
    />
  );
}
