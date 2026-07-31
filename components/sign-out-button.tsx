"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      className="button-secondary"
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const supabase = createClient();
          await supabase.auth.signOut();
          router.replace("/");
          router.refresh();
        });
      }}
    >
      {pending ? "Déconnexion..." : "Se déconnecter"}
    </button>
  );
}
