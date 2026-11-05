"use client";

import { useEffect, useState } from "react";

/**
 * A pausable stopwatch stored as wall-clock timestamps, so elapsed time stays correct
 * across tab switches, background throttling, sleep and page reloads.
 */
export type Stopwatch = {
  startedAt: number | null;
  pausedAt: number | null;
  pausedMs: number;
};

export const idleStopwatch = (): Stopwatch => ({ startedAt: null, pausedAt: null, pausedMs: 0 });

export function startStopwatch(now = Date.now()): Stopwatch {
  return { startedAt: now, pausedAt: null, pausedMs: 0 };
}

export function pauseStopwatch(sw: Stopwatch, now = Date.now()): Stopwatch {
  if (!sw.startedAt || sw.pausedAt) return sw;
  return { ...sw, pausedAt: now };
}

export function resumeStopwatch(sw: Stopwatch, now = Date.now()): Stopwatch {
  if (!sw.startedAt || !sw.pausedAt) return sw;
  return { ...sw, pausedAt: null, pausedMs: sw.pausedMs + (now - sw.pausedAt) };
}

export function elapsedMs(sw: Stopwatch, now = Date.now()) {
  if (!sw.startedAt) return 0;
  const end = sw.pausedAt ?? now;
  return Math.max(0, end - sw.startedAt - sw.pausedMs);
}

/** A countdown that can be paused; `endsAt` while running, `remainingMs` while paused. */
export type Countdown = { totalMs: number; endsAt: number | null; remainingMs: number | null };

export function startCountdown(totalMs: number, now = Date.now()): Countdown {
  return { totalMs, endsAt: now + totalMs, remainingMs: null };
}

export function remainingMs(cd: Countdown, now = Date.now()) {
  if (cd.remainingMs !== null) return Math.max(0, cd.remainingMs);
  if (cd.endsAt === null) return cd.totalMs;
  return Math.max(0, cd.endsAt - now);
}

export function pauseCountdown(cd: Countdown, now = Date.now()): Countdown {
  if (cd.remainingMs !== null) return cd;
  return { ...cd, endsAt: null, remainingMs: remainingMs(cd, now) };
}

export function resumeCountdown(cd: Countdown, now = Date.now()): Countdown {
  if (cd.remainingMs === null) return cd;
  return { ...cd, endsAt: now + cd.remainingMs, remainingMs: null };
}

export function extendCountdown(cd: Countdown, ms: number, now = Date.now()): Countdown {
  if (cd.remainingMs !== null) return { ...cd, totalMs: cd.totalMs + ms, remainingMs: cd.remainingMs + ms };
  const left = remainingMs(cd, now);
  return { ...cd, totalMs: cd.totalMs + ms, endsAt: now + left + ms };
}

/** Re-renders on an interval and immediately when the tab becomes visible again. */
export function useNow(active: boolean, intervalMs = 250) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const first = setTimeout(() => setNow(Date.now()), 0);
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    const onVisible = () => setNow(Date.now());
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      clearTimeout(first);
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [active, intervalMs]);
  return now;
}
