"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, Mail, User, UserPlus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/layout/app-shell";
import { authErrorCode } from "@/lib/auth";
import { checkPassword, EMAIL_RE, normalizeEmail } from "@/lib/auth-rules";
import { fmt } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/provider";
import { getSupabase } from "@/lib/supabase/client";
import { AuthCard, PasswordField, TextField } from "./fields";

export function AuthScreen({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <main className="relative grid min-h-dvh place-items-center px-4 py-16">
      <div className="absolute inset-x-4 top-[max(1rem,env(safe-area-inset-top))] flex items-center justify-between">
        <Link href="/" className="text-sm text-steel-400 hover:text-chalk">
          {t.login.backHome}
        </Link>
        <LanguageToggle compact />
      </div>
      {children}
    </main>
  );
}

export function LoginForm({ initialMode = "signin" }: { initialMode?: "signin" | "signup" }) {
  const { t } = useI18n();
  const router = useRouter();
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const signUp = mode === "signup";
  const emailError = touched && !EMAIL_RE.test(normalizeEmail(email)) ? t.login.err_email : null;
  const mismatch = signUp && confirm.length > 0 && confirm !== password;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    setError(null);
    setNotice(null);
    const address = normalizeEmail(email);
    if (!EMAIL_RE.test(address)) return;
    if (signUp && (checkPassword(password, address).length || confirm !== password)) return;
    if (!signUp && !password) return;

    setBusy(true);
    const supabase = getSupabase();
    const result = signUp
      ? await supabase.auth.signUp({
          email: address,
          password,
          options: { data: name.trim() ? { name: name.trim() } : undefined, emailRedirectTo: `${window.location.origin}/auth/callback` },
        })
      : await supabase.auth.signInWithPassword({ email: address, password });
    setBusy(false);

    if (result.error) {
      setError(t.authErrors[authErrorCode(result.error)]);
      return;
    }
    // Email confirmation still on in Supabase: the account exists but has no session yet.
    if (signUp && !result.data.session) {
      setNotice(fmt(t.login.checkEmail, { email: address }));
      setMode("signin");
      setPassword("");
      setConfirm("");
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <AuthCard
      title={signUp ? t.login.titleSignUp : t.login.titleSignIn}
      subtitle={t.login.subtitle}
      icon={signUp ? <UserPlus aria-hidden /> : <KeyRound aria-hidden />}
    >
      <div role="tablist" aria-label={t.login.titleSignIn} className="mb-6 grid grid-cols-2 gap-1 rounded-2xl bg-ink-900/70 p-1">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => {
              setMode(m);
              setError(null);
              setTouched(false);
            }}
            className={
              mode === m
                ? "h-11 rounded-xl bg-lime-400 text-sm font-medium text-ink-950"
                : "h-11 rounded-xl text-sm text-steel-400 hover:text-chalk"
            }
          >
            {m === "signin" ? t.login.titleSignIn : t.login.titleSignUp}
          </button>
        ))}
      </div>

      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        {signUp && (
          <TextField
            label={`${t.login.name} (${t.common.optional})`}
            hint={t.login.nameHint}
            icon={<User aria-hidden />}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            maxLength={40}
          />
        )}
        <TextField
          label={t.login.email}
          error={emailError}
          icon={<Mail aria-hidden />}
          type="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => email && setTouched(true)}
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          dir="ltr"
          maxLength={254}
          placeholder="you@example.com"
        />
        <PasswordField
          label={t.login.password}
          value={password}
          onChange={setPassword}
          autoComplete={signUp ? "new-password" : "current-password"}
          email={email}
          showRules={signUp}
        />
        {signUp && (
          <PasswordField
            label={t.login.confirmPassword}
            value={confirm}
            onChange={setConfirm}
            autoComplete="new-password"
            error={mismatch ? t.login.err_mismatch : null}
          />
        )}

        {notice && (
          <p role="status" className="rounded-xl border border-lime-400/30 bg-lime-400/5 px-4 py-3 text-center text-sm text-lime-400">
            {notice}
          </p>
        )}
        {error && (
          <p role="alert" className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-center text-sm text-danger">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" block loading={busy} className="mt-1">
          {busy ? t.login.working : signUp ? t.login.submitSignUp : t.login.submitSignIn}
        </Button>

        {!signUp && (
          <Link href="/forgot" className="text-center text-sm text-steel-400 hover:text-lime-400">
            {t.login.forgot}
          </Link>
        )}
      </form>
    </AuthCard>
  );
}
