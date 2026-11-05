"use client";

import {
  setActiveSession,
  updateActiveSession,
  getActiveSession,
  type CardioSession,
  type ExerciseRef,
} from "@/lib/active-session";
import { elapsedMs, idleStopwatch, pauseStopwatch, resumeStopwatch, startStopwatch } from "@/lib/clock";
import { localDateString, newId } from "@/lib/format";
import { enqueue } from "@/lib/sync/outbox";

const update = (fn: (s: CardioSession) => CardioSession) => updateActiveSession<CardioSession>(fn);

export function prepareCardio(exercise: ExerciseRef, targetSeconds: number, targetDistanceKm: number | null) {
  setActiveSession({
    kind: "cardio",
    version: 1,
    sessionId: newId(),
    exercise,
    targetSeconds,
    targetDistanceKm,
    clock: idleStopwatch(),
    workoutDate: null,
    phase: "ready",
    saved: null,
  });
}

export function startCardio() {
  const now = Date.now();
  update((s) => (s.phase === "ready" ? { ...s, clock: startStopwatch(now), workoutDate: localDateString(new Date(now)), phase: "running" } : s));
}

export function pauseCardio() {
  update((s) => ({ ...s, clock: pauseStopwatch(s.clock) }));
}

export function resumeCardio() {
  update((s) => (s.phase === "running" ? { ...s, clock: resumeStopwatch(s.clock) } : s));
}

/** Stops the clock and opens the finish form. The session is not saved yet. */
export function finishCardio() {
  update((s) => (s.phase === "running" ? { ...s, clock: pauseStopwatch(s.clock), phase: "finishing" } : s));
}

/** Leaves the finish form without saving; the clock stays paused. */
export function cancelFinish() {
  update((s) => (s.phase === "finishing" ? { ...s, phase: "running" } : s));
}

export function resetCardio() {
  update((s) => ({ ...s, sessionId: newId(), clock: idleStopwatch(), workoutDate: null, phase: "ready" }));
}

export function measuredSeconds(s: CardioSession) {
  return Math.round(elapsedMs(s.clock) / 1000);
}

/** Queues the session and its single cardio row. Both use ids fixed on this device, so retries can't duplicate. */
export function saveCardio(input: { durationSeconds: number; distanceKm: number | null; effort: number | null; notes: string | null }) {
  const s = getActiveSession();
  if (!s || s.kind !== "cardio" || s.phase !== "finishing" || !s.clock.startedAt) return;

  const endedAt = s.clock.pausedAt ?? Date.now();
  const workoutDate = s.workoutDate ?? localDateString(new Date(s.clock.startedAt));

  enqueue(
    {
      key: `session:${s.sessionId}`,
      kind: "insertSession",
      row: {
        id: s.sessionId,
        session_type: "cardio",
        exercise_id: s.exercise.id,
        status: "completed",
        workout_date: workoutDate,
        started_at: new Date(s.clock.startedAt).toISOString(),
        ended_at: new Date(endedAt).toISOString(),
        duration_seconds: input.durationSeconds,
        target_duration_seconds: s.targetSeconds,
        target_distance_km: s.targetDistanceKm,
        notes: input.notes,
      },
    },
    {
      key: `cardio:${s.sessionId}`,
      kind: "insertWorkout",
      row: {
        id: s.sessionId,
        session_id: s.sessionId,
        workout_date: workoutDate,
        exercise_type: "cardio",
        exercise_id: s.exercise.id,
        exercise_name: s.exercise.name,
        duration_minutes: Math.max(0.01, Math.round((input.durationSeconds / 60) * 100) / 100),
        distance_km: input.distanceKm,
        effort_level: input.effort,
        notes: input.notes,
      },
    },
  );

  update((current) => ({ ...current, phase: "saved", saved: input }));
}

export function clearCardio() {
  setActiveSession(null);
}
