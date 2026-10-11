"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { createClient } from "@/lib/supabase/client";

export function SignOutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function signOut() {
    startTransition(async () => {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.replace("/");
      router.refresh();
    });
  }

  if (compact) {
    return (
      <button className="icon-btn" type="button" disabled={pending} onClick={signOut} aria-label="Se déconnecter" title="Se déconnecter">
        <span className="material-symbols-outlined" aria-hidden="true">
          logout
        </span>
      </button>
    );
  }

  return (
    <button className="button-secondary sign-out-btn" type="button" disabled={pending} onClick={signOut}>
      {pending ? "Déconnexion..." : "Se déconnecter"}
    </button>
  );
}
