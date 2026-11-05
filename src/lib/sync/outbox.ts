import { getSupabase } from "@/lib/supabase/client";
import { readJSON, writeJSON } from "@/lib/storage";
import type { TablesInsert, TablesUpdate } from "@/types/database";

/**
 * Durable, ordered write queue.
 *
 * Every row gets its id on the device before it is sent, so a retry after a timeout
 * can never create a second row: inserts use ON CONFLICT (id) DO NOTHING, and the
 * database also enforces one row per (session_id, set_number).
 */
export type OutboxOp =
  | { key: string; kind: "insertSession"; row: TablesInsert<"workout_sessions"> & { id: string } }
  | { key: string; kind: "insertWorkout"; row: TablesInsert<"workouts"> & { id: string } }
  | { key: string; kind: "updateSession"; id: string; patch: TablesUpdate<"workout_sessions"> };

const KEY = "gt.outbox.v1";
const listeners = new Set<() => void>();

export function readOutbox(): OutboxOp[] {
  return readJSON<OutboxOp[]>(KEY) ?? [];
}

function save(ops: OutboxOp[]) {
  writeJSON(KEY, ops);
  listeners.forEach((fn) => fn());
}

export function subscribeOutbox(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function enqueue(...ops: OutboxOp[]) {
  const current = readOutbox();
  const keys = new Set(current.map((op) => op.key));
  save([...current, ...ops.filter((op) => !keys.has(op.key))]);
}

/** True when every queued write that mentions this id has been confirmed by the database. */
export function isSynced(id: string) {
  return !readOutbox().some((op) => (op.kind === "updateSession" ? op.id : op.row.id) === id);
}

const DUPLICATE = "23505";

async function run(op: OutboxOp) {
  const supabase = getSupabase();
  if (op.kind === "insertSession") {
    const { error } = await supabase
      .from("workout_sessions")
      .upsert(op.row, { onConflict: "id", ignoreDuplicates: true });
    return error;
  }
  if (op.kind === "insertWorkout") {
    const { error } = await supabase
      .from("workouts")
      .upsert(op.row, { onConflict: "id", ignoreDuplicates: true });
    // The (session_id, set_number) guard firing means this set is already stored.
    if (error?.code === DUPLICATE) return null;
    return error;
  }
  const { error } = await supabase.from("workout_sessions").update(op.patch).eq("id", op.id);
  return error;
}

let flushing: Promise<FlushResult> | null = null;

export type FlushResult = { ok: boolean; remaining: number; error?: string };

/** Sends queued writes in order and stops at the first failure so later rows never jump ahead. */
export function flushOutbox(): Promise<FlushResult> {
  if (flushing) return flushing;
  flushing = (async () => {
    try {
      while (true) {
        const [op] = readOutbox();
        if (!op) return { ok: true, remaining: 0 };
        const error = await run(op).catch((e: unknown) => ({ message: String(e) }));
        if (error) return { ok: false, remaining: readOutbox().length, error: error.message };
        save(readOutbox().filter((queued) => queued.key !== op.key));
      }
    } finally {
      flushing = null;
    }
  })();
  return flushing;
}
