"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CloudUpload, Dumbbell, History, House, Languages, LogOut, Trophy, UserRound, WifiOff } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { fmt } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/provider";
import { useCurrentUser } from "@/lib/auth";
import { setActiveSession } from "@/lib/active-session";
import { useToast } from "@/components/ui/toast";
import { getSupabase } from "@/lib/supabase/client";
import { useSync } from "@/lib/sync/provider";

const items = [
  { href: "/", icon: House, key: "home" },
  { href: "/train", icon: Dumbbell, key: "train" },
  { href: "/history", icon: History, key: "history" },
  { href: "/records", icon: Trophy, key: "records" },
] as const;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-7xl">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-e border-line px-4 py-6 lg:flex">
        <Brand />
        <nav aria-label={t.app.name} className="mt-10 flex flex-col gap-1">
          {items.map(({ href, icon: Icon, key }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-12 items-center gap-3 rounded-2xl px-4 text-base transition-colors",
                  active ? "bg-lime-400/10 text-lime-400" : "text-steel-400 hover:bg-glass hover:text-chalk",
                )}
              >
                <Icon className="size-5" aria-hidden />
                {t.nav[key]}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto flex flex-col gap-2">
          <SyncStatus />
          <AccountLink />
          <LanguageToggle />
          <SignOutButton />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-ink-950/80 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-xl lg:hidden">
          <Brand />
          <div className="flex items-center gap-1">
            <SyncStatus compact />
            <AccountLink compact />
            <LanguageToggle compact />
            <SignOutButton compact />
          </div>
        </header>

        <main className="flex-1 px-4 pb-32 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">{children}</main>

        <nav
          aria-label={t.app.name}
          className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ink-950/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
        >
          <div className="mx-auto grid max-w-md grid-cols-4">
            {items.map(({ href, icon: Icon, key }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-16 flex-col items-center justify-center gap-1 text-[11px] transition-colors",
                    active ? "text-lime-400" : "text-steel-500 hover:text-chalk",
                  )}
                >
                  <Icon className="size-[22px]" aria-hidden />
                  {t.nav[key]}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label="Gym Tracker">
      <span className="grid size-9 place-items-center rounded-xl bg-lime-400 text-ink-950 shadow-lime">
        <Dumbbell className="size-5" aria-hidden />
      </span>
      <span className="text-lg font-semibold tracking-tight" dir="ltr">
        Gym<span className="text-lime-400">Tracker</span>
      </span>
    </Link>
  );
}

export function LanguageToggle({ compact }: { compact?: boolean }) {
  const { t, locale, setLocale } = useI18n();
  return (
    <button
      type="button"
      onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
      aria-label={t.nav.languageLabel}
      className={cn(
        "flex items-center gap-2 rounded-2xl text-steel-300 transition-colors hover:bg-glass hover:text-chalk",
        compact ? "h-10 px-3 text-sm" : "h-11 px-4",
      )}
    >
      <Languages className="size-[18px]" aria-hidden />
      <span>{t.nav.language}</span>
    </button>
  );
}

function SignOutButton({ compact }: { compact?: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const { pending, flush } = useSync();
  return (
    <button
      type="button"
      onClick={async () => {
        // Unsynced rows have no owner yet; never let them be sent under the next person's session.
        if (pending > 0 && !(await flush()).ok) {
          toast(fmt(t.sync.pending, { n: pending }), "error");
          return;
        }
        setActiveSession(null);
        await getSupabase().auth.signOut();
        router.replace("/");
        router.refresh();
      }}
      aria-label={t.nav.signOut}
      title={t.nav.signOut}
      className={cn(
        "flex items-center gap-2 rounded-2xl text-steel-400 transition-colors hover:bg-glass hover:text-chalk",
        compact ? "size-10 justify-center" : "h-11 px-4",
      )}
    >
      <LogOut className="size-[18px]" aria-hidden />
      {!compact && <span>{t.nav.signOut}</span>}
    </button>
  );
}

function AccountLink({ compact }: { compact?: boolean }) {
  const { t } = useI18n();
  const user = useCurrentUser();
  return (
    <Link
      href="/account"
      aria-label={t.account.menu}
      title={t.account.menu}
      className={cn(
        "flex items-center gap-2 rounded-2xl text-steel-300 transition-colors hover:bg-glass hover:text-chalk",
        compact ? "size-10 justify-center" : "h-11 px-4",
      )}
    >
      <UserRound className="size-[18px]" aria-hidden />
      {!compact && (
        <span className="truncate" dir="auto">
          {user?.name ?? user?.email ?? t.account.menu}
        </span>
      )}
    </Link>
  );
}

export function SyncStatus({ compact }: { compact?: boolean }) {
  const { pending, online } = useSync();
  const { t } = useI18n();
  if (online && pending === 0) return null;
  const label = !online ? t.sync.offline : fmt(t.sync.pending, { n: pending });
  return (
    <div
      role="status"
      title={label}
      className={cn(
        "flex items-center gap-2 rounded-2xl border border-line bg-glass text-xs text-steel-300",
        compact ? "h-10 px-3" : "px-4 py-3",
      )}
    >
      {online ? <CloudUpload className="size-4 text-lime-400" aria-hidden /> : <WifiOff className="size-4 text-danger" aria-hidden />}
      <span className={cn(compact && "sr-only")}>{label}</span>
      {compact && pending > 0 && <span className="tabular">{pending}</span>}
    </div>
  );
}

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 text-steel-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
