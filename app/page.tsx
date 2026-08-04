import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/env";

export default async function HomePage() {
  const env = getSupabaseEnv();
  let user = null;

  if (env) {
    const supabase = await createClient();
    const {
      data: { user: currentUser }
    } = await supabase.auth.getUser();
    user = currentUser;
  }

  return (
    <main className="page">
      <div className="shell stack">
        <section className="hero-card">
          <div className="eyebrow">Wave Log</div>
          <h1 className="headline">Ton journal de surf, partout avec toi.</h1>
          <p className="lead">
            Enregistre tes sessions, retrouve tes spots et garde une trace de chaque sortie.
          </p>
          <div className="button-row">
            <Link className="button" href={user ? "/dashboard" : "/auth/signup"}>
              {user ? "Ouvrir le dashboard" : "Créer un compte"}
            </Link>
            <Link className="button-secondary" href={user ? "/dashboard" : "/auth/login"}>
              {user ? "Voir mes sessions" : "Se connecter"}
            </Link>
          </div>
        </section>

        <section className="grid grid-3">
          <article className="panel">
            <div className="metric">01</div>
            <div className="label">Tes sessions</div>
            <p>Note le spot, les conditions, ton matériel et tes impressions.</p>
          </article>
          <article className="panel">
            <div className="metric">02</div>
            <div className="label">Tes repères</div>
            <p>Retrouve facilement les sessions et les spots qui comptent pour toi.</p>
          </article>
          <article className="panel">
            <div className="metric">03</div>
            <div className="label">Tes statistiques</div>
            <p>Suis ta pratique et observe l&apos;évolution de tes sessions au fil du temps.</p>
          </article>
        </section>

        {!env ? (
          <section className="panel">
            <div className="eyebrow">Service indisponible</div>
            <p style={{ marginBottom: 0 }}>
              Wave Log est momentanément indisponible. Réessaie dans quelques instants.
            </p>
          </section>
        ) : null}
      </div>
    </main>
  );
}
