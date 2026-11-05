"use client";

import { useSyncExternalStore } from "react";
import { readJSON, removeKey, writeJSON } from "./storage";
import type { Countdown, Stopwatch } from "./clock";

export type ExerciseRef = { id: string; name: string; name_ar?: string | null; image_path: string | null };

export type PlannedSet = { id: string; reps: number; weightKg: number };

export type SetResult =
  | { status: "completed"; workoutId: string; setNumber: number; reps: number; weightKg: number; effort: number | null; at: number }
  | { status: "skipped"; at: number };

export type ResistanceSession = {
  kind: "resistance";
  version: 1;
  sessionId: string;
  exercise: ExerciseRef;
  workoutDate: string;
  notes: string | null;
  clock: Stopwatch;
  plan: PlannedSet[];
  results: Record<string, SetResult>;
  index: number;
  phase: "set" | "rest" | "summary";
  rest: Countdown | null;
  restSeconds: number;
  endedAt: number | null;
  status: "active" | "completed" | "abandoned";
};

export type CardioSession = {
  kind: "cardio";
  version: 1;
  sessionId: string;
  exercise: ExerciseRef;
  targetSeconds: number;
  targetDistanceKm: number | null;
  clock: Stopwatch;
  workoutDate: string | null;
  phase: "ready" | "running" | "finishing" | "saved";
  saved: { durationSeconds: number; distanceKm: number | null; effort: number | null; notes: string | null } | null;
};

export type ActiveSession = ResistanceSession | CardioSession;

const KEY = "gt.active.v1";
const listeners = new Set<() => void>();
let cache: ActiveSession | null | undefined;

function read(): ActiveSession | null {
  if (cache === undefined) cache = readJSON<ActiveSession>(KEY);
  return cache;
}

export function getActiveSession() {
  return read();
}

export function setActiveSession(next: ActiveSession | null) {
  cache = next;
  if (next) writeJSON(KEY, next);
  else removeKey(KEY);
  listeners.forEach((fn) => fn());
}

export function updateActiveSession<T extends ActiveSession>(fn: (current: T) => T) {
  const current = read();
  if (current) setActiveSession(fn(current as T));
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = undefined;
      fn();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", onStorage);
  };
}

/** The workout in progress on this device, restored after refresh or accidental navigation. */
export function useActiveSession() {
  return useSyncExternalStore(subscribe, read, () => null);
}

const noop = () => () => {};

/** False during server render and hydration, true afterwards; avoids flashing "no workout" before storage is read. */
export function useHydrated() {
  return useSyncExternalStore(noop, () => true, () => false);
}

/** True while a session still needs the user's attention (not finished and saved). */
export function isUnfinished(session: ActiveSession | null) {
  if (!session) return false;
  if (session.kind === "resistance") return session.phase !== "summary";
  return session.phase !== "saved" && session.clock.startedAt !== null;
}
