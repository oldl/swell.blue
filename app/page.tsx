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
          <div className="eyebrow">Wave Log · Next.js + Supabase</div>
          <h1 className="headline">Ton carnet de surf devient une vraie app.</h1>
          <p className="lead">
            Tu pars d&apos;une single page locale et on pose une base propre pour l&apos;authentification,
            les données par utilisateur et un dashboard prêt à évoluer.
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
            <div className="metric">1</div>
            <div className="label">Projet full-stack unifié</div>
            <p>Next.js gère le rendu, les routes et la protection d&apos;accès dans le même repo.</p>
          </article>
          <article className="panel">
            <div className="metric">100%</div>
            <div className="label">Sessions isolées par user</div>
            <p>Supabase Auth + RLS garantissent que chacun ne voit que ses propres données.</p>
          </article>
          <article className="panel">
            <div className="metric">v1</div>
            <div className="label">Migration progressive</div>
            <p>Le prototype HTML reste disponible dans le repo pendant qu&apos;on remonte l&apos;UI proprement.</p>
          </article>
        </section>

        {!env ? (
          <section className="panel">
            <div className="eyebrow">Configuration requise</div>
            <p style={{ marginBottom: 0 }}>
              Ajoute `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` dans `.env.local`
              pour activer l&apos;authentification réelle.
            </p>
          </section>
        ) : null}
      </div>
    </main>
  );
}
