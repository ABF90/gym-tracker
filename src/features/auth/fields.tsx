"use client";

import { Check, Eye, EyeOff, X } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { checkPassword, passwordScore, type PasswordProblem } from "@/lib/auth-rules";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n/provider";

export function TextField({
  label,
  hint,
  error,
  icon,
  ...props
}: { label: string; hint?: string; error?: string | null; icon?: ReactNode } & React.ComponentProps<"input">) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm text-steel-300">
        {label}
      </label>
      <div
        className={cn(
          "flex h-14 items-center gap-3 rounded-2xl border bg-ink-900/70 px-4 transition-colors",
          error ? "border-danger/60" : "border-line focus-within:border-lime-400/60",
        )}
      >
        {icon && <span className="shrink-0 text-steel-500 [&_svg]:size-5">{icon}</span>}
        <input
          id={id}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-steel-500"
          {...props}
        />
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-xs text-danger">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="text-xs text-steel-500">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

export function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  error,
  email,
  showRules,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: "current-password" | "new-password";
  error?: string | null;
  email?: string;
  showRules?: boolean;
}) {
  const { t } = useI18n();
  const id = useId();
  const [visible, setVisible] = useState(false);
  const problems = showRules ? checkPassword(value, email ?? "") : [];
  const score = passwordScore(value);

  const rules: Array<{ key: PasswordProblem; label: string }> = [
    { key: "length", label: t.login.pw_length },
    { key: "letters", label: t.login.pw_letters },
    { key: "digits", label: t.login.pw_digits },
    { key: "email", label: t.login.pw_email },
    { key: "common", label: t.login.pw_common },
  ];

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm text-steel-300">
        {label}
      </label>
      <div
        className={cn(
          "flex h-14 items-center gap-2 rounded-2xl border bg-ink-900/70 ps-4 pe-1.5 transition-colors",
          error ? "border-danger/60" : "border-line focus-within:border-lime-400/60",
        )}
      >
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          dir="ltr"
          maxLength={128}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={showRules ? `${id}-rules` : error ? `${id}-error` : undefined}
          className="h-full min-w-0 flex-1 bg-transparent text-base outline-none"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? t.login.hide : t.login.show}
          aria-pressed={visible}
          className="grid size-11 shrink-0 place-items-center rounded-xl text-steel-400 hover:bg-glass hover:text-chalk"
        >
          {visible ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} className="text-xs text-danger">
          {error}
        </p>
      )}
      {showRules && (
        <div id={`${id}-rules`} className="flex flex-col gap-2 pt-1">
          <div className="flex items-center gap-3">
            <div className="flex flex-1 gap-1" aria-hidden>
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-colors",
                    i < score ? (score >= 3 ? "bg-lime-400" : score === 2 ? "bg-lime-500/70" : "bg-danger/70") : "bg-ink-700",
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-steel-400">
              <span className="sr-only">{t.login.strength}: </span>
              {value ? t.login[`strength${score}` as "strength0"] : ""}
            </span>
          </div>
          <ul className="grid grid-cols-1 gap-1 text-xs sm:grid-cols-2">
            {rules.map((rule) => {
              const ok = value.length > 0 && !problems.includes(rule.key);
              return (
                <li key={rule.key} className={cn("flex items-center gap-1.5", ok ? "text-lime-400" : "text-steel-500")}>
                  {ok ? <Check className="size-3.5" aria-hidden /> : <X className="size-3.5" aria-hidden />}
                  {rule.label}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export function AuthCard({ title, subtitle, icon, children }: { title: string; subtitle?: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="w-full max-w-md">
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-5 grid size-16 place-items-center rounded-3xl bg-lime-400 text-ink-950 shadow-lime [&_svg]:size-7">{icon}</div>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-3 text-sm leading-relaxed text-steel-400">{subtitle}</p>}
      </div>
      <div className="glass rounded-4xl p-6 sm:p-7">{children}</div>
    </div>
  );
}
