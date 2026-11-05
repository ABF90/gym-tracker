"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Option<T extends string | number> = { value: T; label: ReactNode };

/** Single-choice chip group (radio semantics). */
export function ChipGroup<T extends string | number>({
  options,
  value,
  onChange,
  label,
  className,
  size = "md",
  columns,
}: {
  options: Option<T>[];
  value: T | null;
  onChange: (value: T) => void;
  label: string;
  className?: string;
  size?: "sm" | "md";
  /** Lay chips out as an even grid (e.g. effort 1–10) instead of wrapping. */
  columns?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(columns ? "grid grid-cols-5 gap-2 sm:grid-cols-10" : "flex flex-wrap gap-2", className)}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "tabular rounded-xl border font-medium transition-[background-color,border-color,color] duration-200 active:scale-[0.97]",
              size === "sm" ? "h-9 min-w-9 px-3 text-sm" : "h-11 min-w-11 px-4 text-base",
              selected
                ? "border-lime-400/70 bg-lime-400/12 text-lime-400"
                : "border-line bg-glass text-steel-300 hover:border-line-strong hover:text-chalk",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
