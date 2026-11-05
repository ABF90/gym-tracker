"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Circular progress ring. With `segments`, the ring is split into equal arcs
 * (one per set) and `value` counts completed segments.
 */
export function RingProgress({
  value,
  segments,
  size = 220,
  stroke = 12,
  children,
  className,
  label,
  smooth = true,
}: {
  value: number;
  segments?: number;
  size?: number;
  stroke?: number;
  children?: ReactNode;
  className?: string;
  label: string;
  smooth?: boolean;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const center = size / 2;

  const arcs = segments
    ? Array.from({ length: segments }, (_, i) => {
        const gap = segments > 1 ? Math.min(14, c / segments / 4) : 0;
        const len = c / segments - gap;
        return { offset: (c / segments) * i + gap / 2, len, filled: i < value };
      })
    : null;

  const fraction = Math.min(1, Math.max(0, value));

  return (
    <div
      className={cn("relative grid place-items-center", className)}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={segments ?? 100}
      aria-valuenow={segments ? value : Math.round(fraction * 100)}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 -rotate-90" aria-hidden>
        {arcs ? (
          arcs.map((arc, i) => (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={r}
              fill="none"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${arc.len} ${c - arc.len}`}
              strokeDashoffset={-arc.offset}
              className={cn(
                "transition-[stroke] duration-500",
                arc.filled ? "stroke-lime-400 drop-shadow-[0_0_6px_rgb(198_255_61/0.45)]" : "stroke-ink-700",
              )}
            />
          ))
        ) : (
          <>
            <circle cx={center} cy={center} r={r} fill="none" strokeWidth={stroke} className="stroke-ink-700" />
            <circle
              cx={center}
              cy={center}
              r={r}
              fill="none"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={c * (1 - fraction)}
              className={cn(
                "stroke-lime-400 drop-shadow-[0_0_6px_rgb(198_255_61/0.45)]",
                smooth && "transition-[stroke-dashoffset] duration-300 ease-linear",
              )}
            />
          </>
        )}
      </svg>
      <div className="relative flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}
