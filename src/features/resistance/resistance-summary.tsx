"use client";

import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { CircleCheck, CloudUpload, History, House, Trophy } from "lucide-react";
import { ExerciseImage } from "@/components/exercise/exercise-image";
import { Button } from "@/components/ui/button";
import { GlassCard, Skeleton, Stat } from "@/components/ui/card";
import type { ResistanceSession } from "@/lib/active-session";
import { elapsedMs } from "@/lib/clock";
import { fetchRecordsForWorkouts, useQuery } from "@/lib/data";
import { formatDuration, formatNumber } from "@/lib/format";
import { fmt } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/provider";
import { isSynced } from "@/lib/sync/outbox";
import { useSync } from "@/lib/sync/provider";
import { clearFinishedSession } from "./actions";

export function ResistanceSummary({ session }: { session: ResistanceSession }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const reduced = useReducedMotion();
  const { pending } = useSync();

  const completed = session.plan
    .map((set) => session.results[set.id])
    .filter((r): r is Extract<NonNullable<typeof r>, { status: "completed" }> => r?.status === "completed");
  const totalReps = completed.reduce((sum, r) => sum + r.reps, 0);
  const maxWeight = completed.length ? Math.max(...completed.map((r) => r.weightKg)) : null;
  const volume = Math.round(completed.reduce((sum, r) => sum + r.reps * r.weightKg, 0) * 100) / 100;
  const durationSeconds = session.endedAt ? Math.round(elapsedMs(session.clock, session.endedAt) / 1000) : null;

  const ids = completed.map((r) => r.workoutId);
  const synced = pending === 0 || ids.every(isSynced);

  // Records come from the database trigger, so we only show what it verified.
  const records = useQuery(() => (synced ? fetchRecordsForWorkouts(ids) : Promise.resolve(null)), [synced, ids.join(",")]);
  const best = records.data?.length ? [...records.data].sort((a, b) => b.best_weight_kg - a.best_weight_kg)[0] : null;

  const leave = (href: string) => {
    clearFinishedSession();
    router.replace(href);
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))] sm:px-6">
      <motion.div
        initial={reduced ? false : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
        className="flex flex-col items-center text-center"
      >
        <div className="grid size-20 place-items-center rounded-full bg-lime-400 text-ink-950 shadow-lime">
          <CircleCheck className="size-10" aria-hidden />
        </div>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight">
          {completed.length ? t.summary.title : t.summary.abandoned}
        </h1>
        <p className="mt-1 text-steel-400">{session.exercise.name}</p>
      </motion.div>

      <ExerciseImage
        imagePath={session.exercise.image_path}
        name={session.exercise.name}
        kind="resistance"
        ratio="aspect-[16/9]"
        className="rounded-4xl"
        sizes="(min-width: 768px) 700px, 100vw"
      />

      <GlassCard className="grid grid-cols-2 gap-6 p-6 sm:grid-cols-3">
        <Stat label={t.summary.sets} value={completed.length} unit={`/ ${session.plan.length}`} accent />
        <Stat label={t.summary.totalReps} value={totalReps} />
        <Stat label={t.summary.maxWeight} value={maxWeight !== null ? formatNumber(maxWeight) : "—"} unit={maxWeight !== null ? t.common.kg : undefined} />
        <Stat label={t.summary.volume} value={formatNumber(volume)} unit={t.common.kg} hint={t.summary.volumeHint} />
        <Stat
          label={t.summary.duration}
          value={durationSeconds !== null ? formatDuration(durationSeconds, locale) : "—"}
          className="[&_span:first-child]:text-2xl"
        />
      </GlassCard>

      {completed.length > 0 && (
        <GlassCard className="flex items-center gap-4 p-5">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-lime-400/10 text-lime-400">
            {synced ? <Trophy className="size-6" aria-hidden /> : <CloudUpload className="size-6" aria-hidden />}
          </div>
          <div className="min-w-0 flex-1 text-sm" aria-live="polite">
            {!synced ? (
              <span className="text-steel-300">{t.summary.prPending}</span>
            ) : records.loading ? (
              <Skeleton className="h-5 w-48" />
            ) : best ? (
              <>
                <div className="font-medium text-lime-400">
                  {best.previous_best_kg === null
                    ? fmt(t.summary.prFirst, { kg: formatNumber(best.best_weight_kg) })
                    : fmt(t.summary.prNew, { kg: formatNumber(best.best_weight_kg) })}
                </div>
                {best.previous_best_kg !== null && (
                  <div className="mt-0.5 text-steel-400">
                    {fmt(t.summary.prImproved, {
                      diff: formatNumber(best.best_weight_kg - best.previous_best_kg),
                      prev: formatNumber(best.previous_best_kg),
                    })}
                  </div>
                )}
              </>
            ) : (
              <span className="text-steel-300">{t.summary.prNone}</span>
            )}
          </div>
        </GlassCard>
      )}

      <ol className="flex flex-col gap-2">
        {completed.map((r) => (
          <li key={r.workoutId} className="glass tabular flex items-center justify-between rounded-2xl px-5 py-3 text-sm">
            <span className="text-steel-400">{fmt(t.setup.setLabel, { n: r.setNumber })}</span>
            <span dir="ltr" className="font-medium">
              {r.reps} × {formatNumber(r.weightKg)} {t.common.kg}
              {r.effort !== null && <span className="ms-3 text-steel-400">RPE {r.effort}</span>}
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-auto grid gap-3 pt-4 sm:grid-cols-2">
        <Button variant="secondary" size="lg" icon={<History className="size-5" aria-hidden />} onClick={() => leave(`/history/${session.sessionId}`)} disabled={!completed.length}>
          {t.summary.viewHistory}
        </Button>
        <Button size="lg" icon={<House className="size-5" aria-hidden />} onClick={() => leave("/")}>
          {t.summary.done}
        </Button>
      </div>
    </main>
  );
}
