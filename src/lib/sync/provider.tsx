"use client";

import { createContext, use, useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { flushOutbox, readOutbox, subscribeOutbox, type FlushResult } from "./outbox";

type SyncValue = {
  pending: number;
  online: boolean;
  lastError: string | null;
  /** Bumps whenever the queue drains, so screens can refetch fresh data. */
  version: number;
  flush: () => Promise<FlushResult>;
};

const SyncContext = createContext<SyncValue | null>(null);

const pendingCount = () => readOutbox().length;

function subscribeOnline(fn: () => void) {
  window.addEventListener("online", fn);
  window.addEventListener("offline", fn);
  return () => {
    window.removeEventListener("online", fn);
    window.removeEventListener("offline", fn);
  };
}

export function SyncProvider({ children }: { children: ReactNode }) {
  const pending = useSyncExternalStore(subscribeOutbox, pendingCount, () => 0);
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
  const [lastError, setLastError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const retry = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attempt = useRef(0);
  const flushRef = useRef<() => Promise<FlushResult>>(null);

  const flush = useCallback(async () => {
    if (retry.current) clearTimeout(retry.current);
    const result = await flushOutbox();
    if (result.ok) {
      attempt.current = 0;
      setLastError(null);
      setVersion((v) => v + 1);
    } else {
      setLastError(result.error ?? "error");
      attempt.current += 1;
      const delay = Math.min(30_000, 2_000 * 2 ** (attempt.current - 1));
      retry.current = setTimeout(() => void flushRef.current?.(), delay);
    }
    return result;
  }, []);

  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  useEffect(() => {
    const kick = () => {
      if (readOutbox().length) void flush();
    };
    const onVisible = () => document.visibilityState === "visible" && kick();
    const initial = setTimeout(kick, 0);
    const unsubscribe = subscribeOutbox(kick);
    window.addEventListener("online", kick);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(initial);
      unsubscribe();
      window.removeEventListener("online", kick);
      document.removeEventListener("visibilitychange", onVisible);
      if (retry.current) clearTimeout(retry.current);
    };
  }, [flush]);

  return <SyncContext value={{ pending, online, lastError, version, flush }}>{children}</SyncContext>;
}

export function useSync() {
  const value = use(SyncContext);
  if (!value) throw new Error("useSync must be used inside SyncProvider");
  return value;
}
