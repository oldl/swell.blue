import { AuthForm } from "@/components/auth-form";
import type { LoginSearchParams } from "@/app/auth/login/search-params";

export default async function LoginPage({
  searchParams
}: {
  searchParams: LoginSearchParams;
}) {
  const params = await searchParams;
  const message =
    params.message === "check_email"
      ? "Vérifie ton email pour confirmer ton compte, puis connecte-toi."
      : params.error === "auth_confirm_failed"
        ? "Le lien de confirmation est invalide ou expiré."
        : params.error === "missing_token"
          ? "Le lien de confirmation est incomplet."
          : null;

  return (
    <main className="auth-wrap">
      <AuthForm mode="login" message={message} />
    </main>
  );
}
