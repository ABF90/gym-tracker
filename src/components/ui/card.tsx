import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function GlassCard({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("glass rounded-3xl", className)} {...props} />;
}

export function SectionHeader({
  title,
  action,
  className,
}: {
  title: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-3 flex items-center justify-between gap-3", className)}>
      <h2 className="text-sm font-medium uppercase tracking-[0.14em] text-steel-400">{title}</h2>
      {action}
    </div>
  );
}

export function Stat({
  label,
  value,
  unit,
  hint,
  accent,
  className,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  hint?: string;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="text-xs text-steel-400">{label}</div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span
          className={cn("tabular text-3xl font-semibold tracking-tight", accent ? "text-lime-400" : "text-chalk")}
          dir="auto"
        >
          {value}
        </span>
        {unit && <span className="text-sm text-steel-400">{unit}</span>}
      </div>
      {hint && <div className="mt-0.5 text-xs text-steel-500">{hint}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-shimmer rounded-2xl bg-[linear-gradient(90deg,var(--color-ink-800)_0%,var(--color-ink-700)_50%,var(--color-ink-800)_100%)] bg-[length:200%_100%]",
        className,
      )}
    />
  );
}

export function EmptyState({
  icon,
  title,
  action,
  className,
}: {
  icon: ReactNode;
  title: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-line-strong px-6 py-10 text-center",
        className,
      )}
    >
      <div className="grid size-14 place-items-center rounded-2xl bg-glass text-steel-400 [&_svg]:size-6">{icon}</div>
      <p className="max-w-xs text-sm leading-relaxed text-steel-400">{title}</p>
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry, retryLabel }: { message: string; onRetry: () => void; retryLabel: string }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-3xl border border-danger/25 bg-danger/5 px-6 py-8 text-center">
      <p className="text-sm text-steel-300">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-xl px-4 py-2 text-sm font-medium text-lime-400 hover:bg-glass"
      >
        {retryLabel}
      </button>
    </div>
  );
}
