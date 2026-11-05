"use client";

import {
  extendCountdown,
  pauseCountdown,
  pauseStopwatch,
  resumeCountdown,
  resumeStopwatch,
  startCountdown,
  startStopwatch,
  elapsedMs,
} from "@/lib/clock";
import {
  getActiveSession,
  setActiveSession,
  updateActiveSession,
  type ExerciseRef,
  type PlannedSet,
  type ResistanceSession,
} from "@/lib/active-session";
import { localDateString, newId } from "@/lib/format";
import { enqueue } from "@/lib/sync/outbox";

const update = (fn: (s: ResistanceSession) => ResistanceSession) => updateActiveSession<ResistanceSession>(fn);

export function startResistance(exercise: ExerciseRef, plan: PlannedSet[], notes: string | null, restSeconds: number) {
  const now = Date.now();
  const sessionId = newId();
  const workoutDate = localDateString(new Date(now));

  const session: ResistanceSession = {
    kind: "resistance",
    version: 1,
    sessionId,
    exercise,
    workoutDate,
    notes,
    clock: startStopwatch(now),
    plan,
    results: {},
    index: 0,
    phase: "set",
    rest: null,
    restSeconds,
    endedAt: null,
    status: "active",
  };

  // Only the plan snapshot is stored; nothing counts as a completed set until confirmed.
  enqueue({
    key: `session:${sessionId}`,
    kind: "insertSession",
    row: {
      id: sessionId,
      session_type: "resistance",
      exercise_id: exercise.id,
      status: "active",
      workout_date: workoutDate,
      started_at: new Date(now).toISOString(),
      planned_sets: plan.map((set, i) => ({ set_number: i + 1, reps: set.reps, weight_kg: set.weightKg })),
      notes,
    },
  });
  setActiveSession(session);
}

/** Next set index that hasn't been completed or skipped, or -1. */
function nextOpenIndex(session: ResistanceSession, from: number) {
  for (let i = from; i < session.plan.length; i++) {
    if (!session.results[session.plan[i].id]) return i;
  }
  return -1;
}

function completedCount(session: ResistanceSession) {
  return Object.values(session.results).filter((r) => r.status === "completed").length;
}

/** Saves the actual set. Calling it twice for the same planned set is a no-op. */
export function completeCurrentSet(actual: { reps: number; weightKg: number; effort: number | null }) {
  const session = getActiveSession();
  if (!session || session.kind !== "resistance" || session.phase !== "set") return;
  const planned = session.plan[session.index];
  if (!planned || session.results[planned.id]) return;

  const now = Date.now();
  const setNumber = completedCount(session) + 1;
  const workoutId = planned.id; // planned set ids double as row ids, so retries can't duplicate

  enqueue({
    key: `set:${workoutId}`,
    kind: "insertWorkout",
    row: {
      id: workoutId,
      session_id: session.sessionId,
      workout_date: session.workoutDate,
      exercise_type: "resistance",
      exercise_id: session.exercise.id,
      exercise_name: session.exercise.name,
      set_number: setNumber,
      reps: actual.reps,
      weight_kg: actual.weightKg,
      effort_level: actual.effort,
    },
  });

  update((s) => {
    const results = {
      ...s.results,
      [planned.id]: { status: "completed" as const, workoutId, setNumber, reps: actual.reps, weightKg: actual.weightKg, effort: actual.effort, at: now },
    };
    const next = { ...s, results };
    const nextIndex = nextOpenIndex(next, s.index + 1);
    if (nextIndex === -1) return finish(next, now);
    return { ...next, index: nextIndex, phase: "rest", rest: startCountdown(s.restSeconds * 1000, now) };
  });
}

export function skipCurrentSet() {
  update((s) => {
    const planned = s.plan[s.index];
    if (!planned || s.results[planned.id]) return s;
    const now = Date.now();
    const next = { ...s, results: { ...s.results, [planned.id]: { status: "skipped" as const, at: now } } };
    const nextIndex = nextOpenIndex(next, s.index + 1);
    if (nextIndex === -1) return finish(next, now);
    return { ...next, index: nextIndex };
  });
}

export function editCurrentSet(reps: number, weightKg: number) {
  update((s) => ({
    ...s,
    plan: s.plan.map((set, i) => (i === s.index ? { ...set, reps, weightKg } : set)),
  }));
}

export function pauseWorkout() {
  update((s) => ({ ...s, clock: pauseStopwatch(s.clock), rest: s.rest ? pauseCountdown(s.rest) : s.rest }));
}

export function resumeWorkout() {
  update((s) => ({ ...s, clock: resumeStopwatch(s.clock), rest: s.rest ? resumeCountdown(s.rest) : s.rest }));
}

export function endWorkout() {
  update((s) => finish(s, Date.now()));
}

function finish(s: ResistanceSession, now: number): ResistanceSession {
  if (s.phase === "summary") return s;
  const clock = s.clock.pausedAt ? s.clock : pauseStopwatch(s.clock, now);
  const durationSeconds = Math.round(elapsedMs(clock, now) / 1000);
  const status = completedCount(s) > 0 ? "completed" : "abandoned";
  enqueue({
    key: `finish:${s.sessionId}`,
    kind: "updateSession",
    id: s.sessionId,
    patch: { status, ended_at: new Date(now).toISOString(), duration_seconds: durationSeconds },
  });
  return { ...s, clock, phase: "summary", rest: null, endedAt: now, status };
}

// ------------------------------------------------------------- rest timer

export function setRestDuration(seconds: number) {
  update((s) => ({
    ...s,
    restSeconds: seconds,
    rest: s.phase === "rest" ? startCountdown(seconds * 1000) : s.rest,
  }));
}

export function pauseRest() {
  update((s) => (s.rest ? { ...s, rest: pauseCountdown(s.rest) } : s));
}

export function resumeRest() {
  update((s) => (s.rest ? { ...s, rest: resumeCountdown(s.rest) } : s));
}

export function addRest(seconds: number) {
  update((s) => (s.rest ? { ...s, rest: extendCountdown(s.rest, seconds * 1000) } : s));
}

export function skipRest() {
  update((s) => (s.phase === "rest" ? { ...s, phase: "set", rest: null } : s));
}

export function clearFinishedSession() {
  const session = getActiveSession();
  if (session?.kind === "resistance" && session.phase === "summary") setActiveSession(null);
}
