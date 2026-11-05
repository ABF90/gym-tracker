"use client";

import { Minus, Plus } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { fmt } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/provider";

type Props = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  unit?: string;
  decimals?: boolean;
  size?: "md" | "lg";
  invalid?: boolean;
};

const round = (n: number) => Math.round(n * 100) / 100;

/** Large +/- control for thumbs. Press and hold repeats; the number can also be typed. */
export function NumberStepper({ label, value, onChange, min, max, step, unit, decimals, size = "md", invalid }: Props) {
  const { t } = useI18n();
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const clamp = (n: number) => Math.min(max, Math.max(min, round(n)));

  const bump = (dir: 1 | -1) => {
    const next = clamp(valueRef.current + dir * step);
    if (next !== valueRef.current) {
      valueRef.current = next;
      onChange(next);
    }
  };

  const commit = (raw: string) => {
    setDraft(null);
    const parsed = Number(raw.replace(",", "."));
    if (raw.trim() === "" || Number.isNaN(parsed)) return;
    onChange(clamp(decimals ? parsed : Math.round(parsed)));
  };

  const btn = size === "lg" ? "size-14 rounded-2xl" : "size-12 rounded-xl";

  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1.5 block text-xs text-steel-400">
        {label}
      </label>
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-2xl border bg-ink-900/70 p-1.5 transition-colors",
          invalid ? "border-danger/60" : "border-line focus-within:border-lime-400/50",
        )}
        dir="ltr"
      >
        <RepeatButton
          label={fmt(t.setup.decrease, { label })}
          disabled={value <= min}
          onStep={() => bump(-1)}
          className={btn}
        >
          <Minus className="size-5" aria-hidden />
        </RepeatButton>
        <div className="flex min-w-0 flex-1 items-baseline justify-center gap-1">
          <input
            id={id}
            type="text"
            inputMode={decimals ? "decimal" : "numeric"}
            value={draft ?? String(value)}
            onFocus={(e) => {
              setDraft(String(value));
              e.currentTarget.select();
            }}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={(e) => commit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                e.preventDefault();
                setDraft(null);
                bump(e.key === "ArrowUp" ? 1 : -1);
              }
            }}
            aria-invalid={invalid || undefined}
            className={cn(
              "tabular w-full min-w-0 bg-transparent text-center font-semibold text-chalk outline-none",
              size === "lg" ? "text-3xl" : "text-2xl",
            )}
          />
          {unit && <span className="shrink-0 text-sm text-steel-400">{unit}</span>}
        </div>
        <RepeatButton
          label={fmt(t.setup.increase, { label })}
          disabled={value >= max}
          onStep={() => bump(1)}
          className={btn}
        >
          <Plus className="size-5" aria-hidden />
        </RepeatButton>
      </div>
    </div>
  );
}

/** Steps once on press, then keeps stepping (accelerating) while held. Enter/Space step once. */
function RepeatButton({
  label,
  disabled,
  onStep,
  className,
  children,
}: {
  label: string;
  disabled: boolean;
  onStep: () => void;
  className: string;
  children: React.ReactNode;
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stepRef = useRef(onStep);

  useEffect(() => {
    stepRef.current = onStep;
  }, [onStep]);

  useEffect(() => () => stop(), []);

  function stop() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }

  function start() {
    stepRef.current();
    let delay = 380;
    const tick = () => {
      stepRef.current();
      delay = Math.max(60, delay * 0.8);
      timer.current = setTimeout(tick, delay);
    };
    timer.current = setTimeout(tick, delay);
  }

  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        start();
      }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          stepRef.current();
        }
      }}
      onContextMenu={(e) => e.preventDefault()}
      className={cn(
        className,
        "grid shrink-0 touch-none place-items-center bg-glass-strong text-chalk transition active:scale-95 active:bg-ink-600 disabled:opacity-30",
      )}
    >
      {children}
    </button>
  );
}
