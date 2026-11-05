"use client";

import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";
import { formatClock } from "@/lib/format";
import { fmt } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/provider";

const SIZE = 440;
const C = SIZE / 2;
const R = 168;
const START = -140;
const SWEEP = 280;

function point(radius: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  // Rounded so server and browser trig produce identical markup.
  const r2 = (n: number) => Math.round(n * 100) / 100;
  return { x: r2(C + radius * Math.sin(rad)), y: r2(C - radius * Math.cos(rad)) };
}

function arcPath(radius: number, from: number, to: number) {
  const a = point(radius, from);
  const b = point(radius, to);
  const large = to - from > 180 ? 1 : 0;
  return `M ${a.x} ${a.y} A ${radius} ${radius} 0 ${large} 1 ${b.x} ${b.y}`;
}

function tickSteps(targetMinutes: number) {
  if (targetMinutes <= 12) return { minor: 1, major: 2 };
  if (targetMinutes <= 30) return { minor: 1, major: 5 };
  if (targetMinutes <= 60) return { minor: 1, major: 10 };
  if (targetMinutes <= 120) return { minor: 5, major: 15 };
  return { minor: 10, major: 30 };
}

/**
 * Sports-dashboard style dial where TIME is the hero: the arc fills toward the target
 * duration, the centre shows elapsed minutes huge with seconds beside them.
 */
export function CardioGauge({
  elapsedSeconds,
  targetSeconds,
  activity,
  state,
}: {
  elapsedSeconds: number;
  targetSeconds: number;
  activity: string;
  state: "ready" | "running" | "paused";
}) {
  const { t } = useI18n();
  const reduced = useReducedMotion();
  const targetMinutes = Math.max(1, Math.round(targetSeconds / 60));
  const progress = Math.min(1, elapsedSeconds / targetSeconds);
  const overtimeSeconds = Math.max(0, elapsedSeconds - targetSeconds);
  const overtime = Math.min(1, overtimeSeconds / targetSeconds);
  const remaining = Math.max(0, targetSeconds - elapsedSeconds);
  const reached = elapsedSeconds >= targetSeconds;
  const elapsedMinutes = elapsedSeconds / 60;

  const { minor, major } = tickSteps(targetMinutes);
  const ticks: { minute: number; deg: number; major: boolean }[] = [];
  for (let m = 0; m <= targetMinutes; m += minor) {
    ticks.push({ minute: m, deg: START + (SWEEP * m) / targetMinutes, major: m % major === 0 || m === targetMinutes });
  }

  const tip = point(R, START + SWEEP * progress);
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = String(Math.floor(elapsedSeconds % 60)).padStart(2, "0");
  const transition = reduced ? undefined : "stroke-dasharray 260ms linear";

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[min(88vw,30rem)]">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0 size-full" aria-hidden>
        <defs>
          <radialGradient id="gauge-face" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#181b20" />
            <stop offset="70%" stopColor="#0f1114" />
            <stop offset="100%" stopColor="#0a0b0d" />
          </radialGradient>
          <linearGradient id="gauge-bezel" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(255 255 255 / 0.18)" />
            <stop offset="50%" stopColor="rgb(255 255 255 / 0.04)" />
            <stop offset="100%" stopColor="rgb(255 255 255 / 0.12)" />
          </linearGradient>
          <filter id="gauge-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle cx={C} cy={C} r={206} fill="url(#gauge-face)" stroke="url(#gauge-bezel)" strokeWidth={2} />
        <circle cx={C} cy={C} r={142} fill="none" stroke="rgb(255 255 255 / 0.04)" strokeWidth={1} />

        {ticks.map((tick) => {
          const lit = tick.minute <= elapsedMinutes;
          const inner = point(tick.major ? 182 : 186, tick.deg);
          const outer = point(tick.major ? 198 : 194, tick.deg);
          return (
            <line
              key={tick.minute}
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              strokeWidth={tick.major ? 3 : 1.5}
              strokeLinecap="round"
              className={cn("transition-[stroke] duration-300", lit ? "stroke-lime-400" : tick.major ? "stroke-steel-400" : "stroke-ink-600")}
            />
          );
        })}

        {ticks
          .filter((tick) => tick.major)
          .map((tick) => {
            const p = point(152, tick.deg);
            return (
              <text
                key={`l${tick.minute}`}
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline="central"
                className={cn("tabular text-[13px] font-medium", tick.minute <= elapsedMinutes ? "fill-lime-400" : "fill-steel-500")}
              >
                {tick.minute}
              </text>
            );
          })}

        <path d={arcPath(R, START, START + SWEEP)} fill="none" strokeWidth={14} strokeLinecap="round" className="stroke-ink-700" />
        {progress > 0 && (
          <path
            d={arcPath(R, START, START + SWEEP)}
            fill="none"
            strokeWidth={14}
            strokeLinecap="round"
            pathLength={1000}
            strokeDasharray={`${progress * 1000} 1000`}
            style={{ transition }}
            className="stroke-lime-400"
            filter="url(#gauge-glow)"
          />
        )}
        {overtime > 0 && (
          <path
            d={arcPath(R - 20, START, START + SWEEP)}
            fill="none"
            strokeWidth={5}
            strokeLinecap="round"
            pathLength={1000}
            strokeDasharray={`${overtime * 1000} 1000`}
            style={{ transition }}
            className="stroke-lime-300/70"
          />
        )}
        {progress > 0 && <circle cx={tip.x} cy={tip.y} r={9} className="fill-chalk" filter="url(#gauge-glow)" />}
      </svg>

      {/* The open gap at the bottom of the arc is the only spot that never collides with tick labels. */}
      <div className="absolute inset-x-0 bottom-[8%] flex justify-center">
        <span className="max-w-[45%] truncate text-xs font-medium uppercase tracking-[0.2em] text-steel-400 sm:text-sm">{activity}</span>
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div
          className={cn("flex items-baseline transition-opacity duration-300", state === "paused" && "animate-pulse opacity-60")}
          dir="ltr"
          aria-live="off"
        >
          <span className="tabular text-[clamp(5rem,26vw,9rem)] font-semibold leading-none tracking-tighter text-chalk">
            {String(minutes).padStart(2, "0")}
          </span>
          <span className="tabular ms-1 text-[clamp(1.75rem,8vw,3rem)] font-medium leading-none text-steel-300">:{seconds}</span>
        </div>
        <div className="mt-1 text-xs uppercase tracking-[0.2em] text-steel-500">{t.common.minutes}</div>

        <div className="mt-4 flex flex-col items-center gap-1">
          {reached ? (
            <span className="tabular text-sm font-medium text-lime-400" dir="ltr">
              {t.cardio.overtime} +{formatClock(overtimeSeconds)}
            </span>
          ) : (
            <span className="text-sm text-steel-300">
              {t.cardio.remaining}{" "}
              <span className="tabular font-medium text-chalk" dir="ltr">
                {formatClock(remaining)}
              </span>
            </span>
          )}
          <span className="text-xs text-steel-500">{fmt(t.cardio.of, { n: targetMinutes })}</span>
        </div>

        <div className="mt-3 h-6">
          {state !== "running" && (
            <span className="rounded-full border border-line bg-glass px-3 py-1 text-xs text-steel-300">
              {state === "paused" ? t.cardio.paused : t.cardio.ready}
            </span>
          )}
          {state === "running" && reached && (
            <span className="rounded-full border border-lime-400/40 bg-lime-400/10 px-3 py-1 text-xs text-lime-400">
              {t.cardio.targetReached}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
