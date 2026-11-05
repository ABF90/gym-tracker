"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";

export type AuthErrorCode =
  | "invalid_credentials"
  | "email_taken"
  | "weak_password"
  | "rate_limited"
  | "signups_disabled"
  | "email_not_confirmed"
  | "network"
  | "generic";

/** Maps Supabase Auth errors to messages we can show without leaking details. */
export function authErrorCode(error: { code?: string; message?: string; status?: number } | null | undefined): AuthErrorCode {
  if (!error) return "generic";
  const text = `${error.code ?? ""} ${error.message ?? ""}`.toLowerCase();
  if (error.status === 429 || text.includes("rate limit") || text.includes("over_request")) return "rate_limited";
  if (text.includes("invalid_credentials") || text.includes("invalid login")) return "invalid_credentials";
  if (text.includes("user_already_exists") || text.includes("already registered")) return "email_taken";
  if (text.includes("weak_password") || text.includes("password should")) return "weak_password";
  if (text.includes("signup_disabled") || text.includes("signups not allowed")) return "signups_disabled";
  if (text.includes("email_not_confirmed") || text.includes("not confirmed")) return "email_not_confirmed";
  if (text.includes("fetch") || text.includes("network")) return "network";
  return "generic";
}

export type CurrentUser = { email: string | null; name: string | null };

/** The signed-in user's email and display name (name is optional, set at sign-up). */
export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  useEffect(() => {
    const supabase = getSupabase();
    const read = (u: { email?: string; user_metadata?: { name?: string } } | null | undefined) =>
      setUser(u ? { email: u.email ?? null, name: u.user_metadata?.name?.trim() || null } : null);
    void supabase.auth.getUser().then(({ data }) => read(data.user));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => read(session?.user));
    return () => data.subscription.unsubscribe();
  }, []);
  return user;
}
