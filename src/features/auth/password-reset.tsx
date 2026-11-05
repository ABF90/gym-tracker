"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, LifeBuoy, Mail } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { authErrorCode, useCurrentUser } from "@/lib/auth";
import { checkPassword, EMAIL_RE, normalizeEmail } from "@/lib/auth-rules";
import { useI18n } from "@/lib/i18n/provider";
import { getSupabase } from "@/lib/supabase/client";
import { AuthCard, PasswordField, TextField } from "./fields";

export function ForgotPasswordForm() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const address = normalizeEmail(email);
    if (!EMAIL_RE.test(address)) return setError(t.login.err_email);
    setBusy(true);
    setError(null);
    const { error } = await getSupabase().auth.resetPasswordForEmail(address, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setBusy(false);
    // Same message whether or not the email exists, so accounts can't be discovered here.
    if (error && authErrorCode(error) === "rate_limited") return setError(t.authErrors.rate_limited);
    setSent(true);
  }

  return (
    <AuthCard title={t.forgot.title} subtitle={t.forgot.subtitle} icon={<LifeBuoy aria-hidden />}>
      {sent ? (
        <div className="flex flex-col gap-4">
          <p role="status" className="rounded-xl border border-lime-400/30 bg-lime-400/5 px-4 py-3 text-sm leading-relaxed text-lime-400">
            {t.forgot.sent}
          </p>
          <Link href="/login" className="text-center text-sm text-steel-400 hover:text-lime-400">
            {t.forgot.back}
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="flex flex-col gap-4">
          <TextField
            label={t.login.email}
            icon={<Mail aria-hidden />}
            type="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            dir="ltr"
            error={error}
          />
          <Button type="submit" size="lg" block loading={busy}>
            {t.forgot.submit}
          </Button>
          <Link href="/login" className="text-center text-sm text-steel-400 hover:text-lime-400">
            {t.forgot.back}
          </Link>
        </form>
      )}
    </AuthCard>
  );
}

/** Reached from the reset email via /auth/callback, which has already signed the user in. */
export function ResetPasswordForm() {
  const { t } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const user = useCurrentUser();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const valid = !checkPassword(password, user?.email ?? "").length && password === confirm;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    setError(null);
    const { error } = await getSupabase().auth.updateUser({ password });
    setBusy(false);
    if (error) return setError(t.authErrors[authErrorCode(error)]);
    toast(t.reset.success, "success");
    router.replace("/");
    router.refresh();
  }

  return (
    <AuthCard title={t.reset.title} subtitle={t.reset.subtitle} icon={<KeyRound aria-hidden />}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <PasswordField label={t.account.newPassword} value={password} onChange={setPassword} autoComplete="new-password" email={user?.email ?? ""} showRules />
        <PasswordField
          label={t.account.confirmNew}
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
          error={confirm && confirm !== password ? t.login.err_mismatch : null}
        />
        {error && (
          <p role="alert" className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-center text-sm text-danger">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" block loading={busy} disabled={!valid}>
          {t.reset.submit}
        </Button>
      </form>
    </AuthCard>
  );
}
