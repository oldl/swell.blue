"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup";

type Props = {
  mode: AuthMode;
  message?: string | null;
};

export function AuthForm({ mode, message }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(message ?? null);

  async function onSubmit(formData: FormData) {
    const email = String(formData.get("email") || "").trim();
    // Passwords are sent as typed: leading/trailing spaces are part of the password.
    const password = String(formData.get("password") || "");

    if (!email || !password) {
      setError("Email et mot de passe requis.");
      return;
    }

    const supabase = createClient();
    setError(null);
    setSuccess(null);

    if (mode === "login") {
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (loginError) {
        setError("Connexion impossible. Vérifie ton email et ton mot de passe.");
        return;
      }
    } else {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // The "Confirm signup" email template builds the link itself:
          // {{ .RedirectTo }}/auth/confirm?token_hash=...&type=email&next=/dashboard (see README),
          // so RedirectTo must be the bare site origin.
          emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined
        }
      });

      if (signUpError) {
        setError("Impossible de créer le compte. Vérifie les informations saisies.");
        return;
      }

      setSuccess("Compte créé. Vérifie ton email pour activer l’accès.");
      startTransition(() => {
        router.replace("/auth/login?message=check_email");
      });
      return;
    }

    startTransition(() => {
      router.replace("/dashboard");
      router.refresh();
    });
  }

  return (
    <div className="auth-card">
      <div className="eyebrow">Wave Log</div>
      <h1>{mode === "login" ? "Connexion" : "Créer un compte"}</h1>
      <p className="muted">
        {mode === "login"
          ? "Retrouve ton journal de sessions et tes spots favoris."
          : "Active ton espace perso pour sauvegarder tes sessions sur tous tes appareils."}
      </p>

      <form
        action={(formData) => {
          startTransition(async () => {
            await onSubmit(formData);
          });
        }}
        className="stack"
      >
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" name="email" type="email" placeholder="toi@exemple.com" required />
        </div>

        <div className="field">
          <label htmlFor="password">Mot de passe</label>
          <input
            id="password"
            name="password"
            type="password"
            minLength={8}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
          />
        </div>

        {success ? <div className="notice">{success}</div> : null}
        {error ? <div className="error">{error}</div> : null}

        <button className="button" type="submit" disabled={pending}>
          {pending ? "Chargement..." : mode === "login" ? "Se connecter" : "Créer mon compte"}
        </button>
      </form>

      <p className="muted">
        {mode === "login" ? "Pas encore de compte ? " : "Déjà inscrit ? "}
        <Link href={mode === "login" ? "/auth/signup" : "/auth/login"} style={{ color: "var(--ocean)" }}>
          {mode === "login" ? "Créer un compte" : "Se connecter"}
        </Link>
      </p>
    </div>
  );
}
