import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

// Only same-origin relative paths: `new URL("//evil.com", origin)` would leave the site.
function safeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const code = requestUrl.searchParams.get("code");
  const next = safeNext(requestUrl.searchParams.get("next"));

  const supabase = await createClient();
  let error: unknown = null;

  if (tokenHash && type) {
    // Custom email template linking here with {{ .TokenHash }}.
    ({ error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as EmailOtpType }));
  } else if (code) {
    // Default template: Supabase verifies the email, then redirects here with a PKCE code.
    ({ error } = await supabase.auth.exchangeCodeForSession(code));
  } else {
    return NextResponse.redirect(new URL("/auth/login?error=missing_token", requestUrl.origin));
  }

  if (error) {
    return NextResponse.redirect(new URL("/auth/login?error=auth_confirm_failed", requestUrl.origin));
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
