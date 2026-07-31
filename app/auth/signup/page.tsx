import { AuthForm } from "@/components/auth-form";

export default function SignupPage() {
  return (
    <main className="auth-wrap">
      <AuthForm mode="signup" />
    </main>
  );
}
