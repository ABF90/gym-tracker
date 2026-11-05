"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useRef, useState, type ReactNode } from "react";
import { IconButton } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { fmt } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/provider";

type Item = { id: string; label: string };

/** Signed distance from the active index; circular when there are enough cards to loop without a visible jump. */
function offsetOf(i: number, active: number, n: number, loop: boolean) {
  if (!loop) return i - active;
  let d = (((i - active) % n) + n) % n;
  if (d > n / 2) d -= n;
  return d;
}

/**
 * 3D coverflow: the centre card faces the viewer, neighbours angle away, shrink and fade.
 * Swipe, drag, click a side card, arrow buttons or keyboard (direction-aware in RTL).
 * Cards beyond the visible window are fully transparent while they wrap, so the loop never jumps.
 */
export function Coverflow<T extends Item>({
  items,
  index,
  onIndexChange,
  onActivate,
  renderCard,
  label,
}: {
  items: T[];
  index: number;
  onIndexChange: (index: number) => void;
  onActivate?: (item: T) => void;
  renderCard: (item: T, state: { active: boolean; offset: number }) => ReactNode;
  label: string;
}) {
  const { t, dir } = useI18n();
  const reduced = useReducedMotion();
  const n = items.length;
  const loop = n >= 3;
  const maxVisible = loop ? Math.min(3, Math.floor((n - 1) / 2)) : Math.max(0, n - 1);
  const rtl = dir === "rtl";
  const sign = rtl ? -1 : 1;

  const [drag, setDrag] = useState(0);
  const dragState = useRef<{ x: number; t: number; moved: boolean; id: number } | null>(null);
  const [trackWidth, setTrackWidth] = useState(1);
  const suppressClick = useRef(false);

  const go = (step: number) => {
    if (!n) return;
    const next = loop ? (index + step + n) % n : Math.min(n - 1, Math.max(0, index + step));
    if (next !== index) onIndexChange(next);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    setTrackWidth(e.currentTarget.getBoundingClientRect().width || 1);
    dragState.current = { x: e.clientX, t: performance.now(), moved: false, id: e.pointerId };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = dragState.current;
    if (!s || s.id !== e.pointerId) return;
    const dx = e.clientX - s.x;
    if (!s.moved && Math.abs(dx) > 6) {
      s.moved = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    if (s.moved) setDrag(dx);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = dragState.current;
    dragState.current = null;
    if (!s || !s.moved) return;
    suppressClick.current = true;
    const dx = e.clientX - s.x;
    const velocity = dx / Math.max(1, performance.now() - s.t);
    setDrag(0);
    // Dragging toward the reading direction's start reveals the next card.
    if (Math.abs(dx) > trackWidth * 0.12 || Math.abs(velocity) > 0.45) go(dx < 0 ? sign : -sign);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(rtl ? -1 : 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); go(rtl ? 1 : -1); }
    else if (e.key === "Home") { e.preventDefault(); onIndexChange(0); }
    else if (e.key === "End") { e.preventDefault(); onIndexChange(n - 1); }
    else if ((e.key === "Enter" || e.key === " ") && items[index] && e.target === e.currentTarget) { e.preventDefault(); onActivate?.(items[index]); }
  };

  const dragShift = drag / (trackWidth * 0.42);
  const Prev = rtl ? ChevronRight : ChevronLeft;
  const Next = rtl ? ChevronLeft : ChevronRight;

  return (
    <div className="flex flex-col items-center gap-5">
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label={label}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          dragState.current = null;
          setDrag(0);
        }}
        className="relative h-[min(118vw,32rem)] w-full touch-pan-y select-none overflow-hidden rounded-4xl outline-none [perspective:1300px] focus-visible:ring-2 focus-visible:ring-lime-400/60 sm:h-[30rem]"
      >
        {items.map((item, i) => {
          const base = offsetOf(i, index, n, loop);
          const d = base + dragShift * sign;
          const abs = Math.abs(d);
          const hidden = Math.abs(base) > maxVisible;
          const active = base === 0;
          const x = d * 54 * sign;
          const transform = reduced
            ? `translateX(calc(-50% + ${x}%)) scale(${1 - Math.min(abs, 3) * 0.1})`
            : `translateX(calc(-50% + ${x}%)) translateZ(${-abs * 130}px) rotateY(${-d * 30 * sign}deg) scale(${1 - Math.min(abs, 3) * 0.1})`;
          return (
            <div
              key={item.id}
              aria-hidden={!active}
              className={cn(
                "absolute left-1/2 top-1/2 w-[min(68vw,19rem)] cursor-pointer [transform-style:preserve-3d]",
                drag ? "transition-none" : reduced ? "transition-[transform,opacity] duration-200" : "transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
              )}
              style={{
                transform: `${transform} translateY(-50%)`,
                opacity: hidden ? 0 : Math.max(0, 1 - abs * 0.28),
                zIndex: 20 - Math.round(abs * 2),
                pointerEvents: hidden ? "none" : "auto",
              }}
              onClick={() => {
                if (suppressClick.current) {
                  suppressClick.current = false;
                  return;
                }
                if (active) onActivate?.(item);
                else onIndexChange(i);
              }}
            >
              {renderCard(item, { active, offset: base })}
            </div>
          );
        })}
      </div>

      {n > 1 && (
        <div className="flex w-full max-w-sm items-center justify-between gap-4">
          <IconButton label={t.library.previous} onClick={() => go(-1)} disabled={!loop && index === 0}>
            <Prev className="size-5" aria-hidden />
          </IconButton>
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-1.5" aria-hidden>
              {items.map((item, i) => (
                <span key={item.id} className={cn("h-1.5 rounded-full transition-all duration-300", i === index ? "w-6 bg-lime-400" : "w-1.5 bg-ink-600")} />
              ))}
            </div>
            <span className="tabular text-xs text-steel-500" aria-live="polite">
              {fmt(t.library.exerciseOf, { n: index + 1, total: n })} · {items[index]?.label}
            </span>
          </div>
          <IconButton label={t.library.next} onClick={() => go(1)} disabled={!loop && index === n - 1}>
            <Next className="size-5" aria-hidden />
          </IconButton>
        </div>
      )}
      <p className="text-xs text-steel-500">{t.library.swipeHint}</p>
    </div>
  );
}
