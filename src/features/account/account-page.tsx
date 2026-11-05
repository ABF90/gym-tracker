"use client";

import { KeyRound, UserRound } from "lucide-react";
import { useState } from "react";
import { PageTitle } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { authErrorCode, useCurrentUser } from "@/lib/auth";
import { checkPassword } from "@/lib/auth-rules";
import { useI18n } from "@/lib/i18n/provider";
import { getSupabase } from "@/lib/supabase/client";
import { PasswordField } from "@/features/auth/fields";

function ChangePasswordForm({ email }: { email: string }) {
  const { t } = useI18n();
  const toast = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const valid = current && !checkPassword(next, email).length && next === confirm && next !== current;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    setError(null);
    const supabase = getSupabase();
    // Re-check the current password so an unattended, signed-in device can't change it.
    const check = await supabase.auth.signInWithPassword({ email, password: current });
    if (check.error) {
      setBusy(false);
      return setError(t.authErrors[authErrorCode(check.error)]);
    }
    const { error } = await supabase.auth.updateUser({ password: next });
    setBusy(false);
    if (error) return setError(t.authErrors[authErrorCode(error)]);
    setCurrent("");
    setNext("");
    setConfirm("");
    toast(t.account.saved, "success");
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <PasswordField label={t.account.current} value={current} onChange={setCurrent} autoComplete="current-password" />
      <PasswordField label={t.account.newPassword} value={next} onChange={setNext} autoComplete="new-password" email={email} showRules />
      <PasswordField
        label={t.account.confirmNew}
        value={confirm}
        onChange={setConfirm}
        autoComplete="new-password"
        error={confirm && confirm !== next ? t.login.err_mismatch : null}
      />
      {error && (
        <p role="alert" className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" block loading={busy} disabled={!valid}>
        {t.account.save}
      </Button>
    </form>
  );
}

export function AccountPage() {
  const { t } = useI18n();
  const user = useCurrentUser();

  return (
    <div className="max-w-3xl">
      <PageTitle title={t.account.title} />
      <div className="flex flex-col gap-6">
        <GlassCard className="flex items-center gap-4 p-6">
          <span className="grid size-12 place-items-center rounded-2xl bg-lime-400/10 text-lime-400">
            <UserRound className="size-6" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            {user?.name && <div className="truncate text-lg font-medium">{user.name}</div>}
            <div className="text-xs text-steel-500">{t.account.email}</div>
            <div className="truncate text-steel-300" dir="ltr">
              {user?.email ?? "…"}
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold">
            <KeyRound className="size-5 text-lime-400" aria-hidden />
            {t.account.changePassword}
          </h2>
          {user?.email && <ChangePasswordForm email={user.email} />}
        </GlassCard>
      </div>
    </div>
  );
}
