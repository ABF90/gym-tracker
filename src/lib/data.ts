"use client";

import { useCallback, useEffect, useEffectEvent, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { useSync } from "@/lib/sync/provider";
import type { Tables } from "@/types/database";

export type Exercise = Tables<"exercises">;
export type Workout = Tables<"workouts">;
export type Session = Tables<"workout_sessions">;
export type PersonalRecord = Tables<"personal_records">;
export type ExerciseType = "resistance" | "cardio";

/** Public URL for an image in the exercise-images bucket, built from its stored relative path. */
export function exerciseImageUrl(imagePath: string | null | undefined) {
  if (!imagePath) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${base}/storage/v1/object/public/exercise-images/${imagePath.split("/").map(encodeURIComponent).join("/")}`;
}

// ---------------------------------------------------------------- queries

export async function fetchExercises(type?: ExerciseType) {
  let query = getSupabase().from("exercises").select("*").order("name");
  if (type) query = query.eq("exercise_type", type);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function fetchExercise(id: string) {
  const { data, error } = await getSupabase().from("exercises").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchWorkouts(opts: { from?: string; to?: string; exerciseId?: string; limit?: number } = {}) {
  let query = getSupabase()
    .from("workouts")
    .select("*")
    .order("workout_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 1000);
  if (opts.from) query = query.gte("workout_date", opts.from);
  if (opts.to) query = query.lte("workout_date", opts.to);
  if (opts.exerciseId) query = query.eq("exercise_id", opts.exerciseId);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function fetchSessions(opts: { from?: string; to?: string } = {}) {
  let query = getSupabase()
    .from("workout_sessions")
    .select("*")
    .order("workout_date", { ascending: false })
    .order("started_at", { ascending: false })
    .limit(500);
  if (opts.from) query = query.gte("workout_date", opts.from);
  if (opts.to) query = query.lte("workout_date", opts.to);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function fetchRecords() {
  const { data, error } = await getSupabase()
    .from("personal_records")
    .select("*")
    .order("best_weight_kg", { ascending: false })
    .order("achieved_date", { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchRecordsForWorkouts(workoutIds: string[]) {
  if (!workoutIds.length) return [];
  const { data, error } = await getSupabase().from("personal_records").select("*").in("workout_id", workoutIds);
  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------- history model

export type HistoryEntry = {
  key: string;
  sessionId: string | null;
  kind: ExerciseType;
  exerciseId: string | null;
  exerciseName: string;
  imagePath: string | null;
  date: string;
  status: "completed" | "active" | "abandoned" | "legacy";
  sets: Workout[];
  cardio: Workout | null;
  durationSeconds: number | null;
  notes: string | null;
  sortAt: string;
};

export type ResistanceStats = { sets: number; totalReps: number; maxWeight: number | null; volume: number };

export function resistanceStats(sets: Workout[]): ResistanceStats {
  let totalReps = 0;
  let volume = 0;
  let maxWeight: number | null = null;
  for (const set of sets) {
    const reps = set.reps ?? 0;
    const weight = set.weight_kg ?? 0;
    totalReps += reps;
    volume += reps * weight;
    if (set.weight_kg !== null && (maxWeight === null || set.weight_kg > maxWeight)) maxWeight = set.weight_kg;
  }
  return { sets: sets.length, totalReps, maxWeight, volume: Math.round(volume * 100) / 100 };
}

/** Groups rows into workouts: one per session, and one per day+exercise for rows saved before sessions existed. */
export function buildHistory(workouts: Workout[], sessions: Session[], exercises: Exercise[]): HistoryEntry[] {
  const exerciseById = new Map(exercises.map((e) => [e.id, e]));
  const sessionById = new Map(sessions.map((s) => [s.id, s]));
  const groups = new Map<string, HistoryEntry>();

  for (const row of workouts) {
    const kind = row.exercise_type as ExerciseType;
    const session = row.session_id ? sessionById.get(row.session_id) : undefined;
    const key = row.session_id ?? `legacy:${row.workout_date}:${row.exercise_id ?? row.exercise_name}:${kind}`;
    const exercise = row.exercise_id ? exerciseById.get(row.exercise_id) : undefined;

    let entry = groups.get(key);
    if (!entry) {
      entry = {
        key,
        sessionId: row.session_id,
        kind,
        exerciseId: row.exercise_id,
        exerciseName: exercise?.name ?? row.exercise_name,
        imagePath: exercise?.image_path ?? null,
        date: session?.workout_date ?? row.workout_date,
        status: session ? (session.status as HistoryEntry["status"]) : "legacy",
        sets: [],
        cardio: null,
        durationSeconds: session?.duration_seconds ?? null,
        notes: session?.notes ?? null,
        sortAt: session?.started_at ?? row.created_at,
      };
      groups.set(key, entry);
    }

    if (kind === "cardio") {
      entry.cardio = row;
      if (entry.durationSeconds === null && row.duration_minutes !== null) {
        entry.durationSeconds = Math.round(row.duration_minutes * 60);
      }
      if (!entry.notes) entry.notes = row.notes;
    } else {
      entry.sets.push(row);
    }
  }

  for (const entry of groups.values()) {
    entry.sets.sort((a, b) => (a.set_number ?? 0) - (b.set_number ?? 0));
  }

  return [...groups.values()].sort((a, b) =>
    a.date === b.date ? b.sortAt.localeCompare(a.sortAt) : b.date.localeCompare(a.date),
  );
}

/** Best (heaviest) record per exercise, plus the full progression for each. */
export function bestRecords(records: PersonalRecord[]) {
  const byExercise = new Map<string, PersonalRecord[]>();
  for (const record of records) {
    const key = record.exercise_id ?? record.exercise_name;
    byExercise.set(key, [...(byExercise.get(key) ?? []), record]);
  }
  return [...byExercise.values()].map((list) => {
    const sorted = [...list].sort((a, b) => b.best_weight_kg - a.best_weight_kg || b.achieved_date.localeCompare(a.achieved_date));
    return { best: sorted[0], progression: [...list].sort((a, b) => a.achieved_date.localeCompare(b.achieved_date) || a.best_weight_kg - b.best_weight_kg) };
  });
}

// ---------------------------------------------------------------- hook

type QueryState<T> = { data: T | undefined; error: Error | null; loading: boolean; reload: () => void };

/**
 * Minimal client query: loads on mount, on dependency change and whenever queued writes
 * finish syncing. Keeps the previous data visible while a refetch is in flight.
 */
export function useQuery<T>(fetcher: () => Promise<T>, deps: unknown[]): QueryState<T> {
  const { version } = useSync();
  const [nonce, setNonce] = useState(0);
  const requestKey = JSON.stringify([...deps, version, nonce]);
  const [state, setState] = useState<{ key: string | null; data: T | undefined; error: Error | null }>({
    key: null,
    data: undefined,
    error: null,
  });
  const run = useEffectEvent(fetcher);

  useEffect(() => {
    let cancelled = false;
    run()
      .then((data) => !cancelled && setState({ key: requestKey, data, error: null }))
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error && typeof error === "object" && "message" in error ? String(error.message) : String(error);
        setState((s) => ({ ...s, key: requestKey, error: new Error(message) }));
      });
    return () => {
      cancelled = true;
    };
  }, [requestKey]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { data: state.data, error: state.error, loading: state.key !== requestKey, reload };
}
