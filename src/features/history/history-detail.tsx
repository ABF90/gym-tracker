"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Lock } from "lucide-react";
import { ExerciseImage } from "@/components/exercise/exercise-image";
import { ErrorState, GlassCard, Skeleton, Stat } from "@/components/ui/card";
import { buildHistory, entryName, fetchExercises, fetchSessions, fetchWorkouts, resistanceStats, useQuery } from "@/lib/data";
import { formatDate, formatDuration, formatNumber } from "@/lib/format";
import { fmt } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/provider";

export function HistoryDetail({ entryKey }: { entryKey: string }) {
  const { t, locale, dir } = useI18n();
  const Back = dir === "rtl" ? ArrowRight : ArrowLeft;

  const { data, error, loading, reload } = useQuery(async () => {
    const [exercises, workouts, sessions] = await Promise.all([fetchExercises(), fetchWorkouts(), fetchSessions()]);
    return buildHistory(workouts, sessions, exercises).find((entry) => entry.key === entryKey) ?? null;
  }, [entryKey]);

  const back = (
    <Link href="/history" className="mb-6 inline-flex items-center gap-2 text-sm text-steel-400 hover:text-chalk">
      <Back className="size-4" aria-hidden />
      {t.history.title}
    </Link>
  );

  if (error && data === undefined) return <ErrorState message={t.common.loadError} onRetry={reload} retryLabel={t.common.retry} />;
  if (loading && data === undefined) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="aspect-[4/3] rounded-4xl" />
        <Skeleton className="h-64 rounded-4xl" />
      </div>
    );
  }
  if (!data) {
    return (
      <div>
        {back}
        <ErrorState message={t.history.notFound} onRetry={reload} retryLabel={t.common.retry} />
      </div>
    );
  }

  const entry = data;
  const stats = entry.kind === "resistance" ? resistanceStats(entry.sets) : null;
  const statusLabel = entry.status === "legacy" ? t.history.legacy : t.history[`status_${entry.status}`];

  return (
    <div>
      {back}
      <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="flex flex-col gap-4">
          <ExerciseImage imagePath={entry.imagePath} name={entryName(entry, locale)} pending={entry.imagePending} kind={entry.kind} className="rounded-4xl" priority sizes="(min-width: 1024px) 40vw, 100vw" />
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-medium uppercase tracking-[0.16em] text-lime-400">{entry.kind === "cardio" ? t.common.cardio : t.common.resistance}</span>
              <span className="rounded-md border border-line px-2 py-0.5 text-steel-400">{statusLabel}</span>
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">{entryName(entry, locale)}</h1>
            <p className="mt-1 text-steel-400">{formatDate(entry.date, locale, "long")}</p>
          </div>
          <p className="flex items-center gap-2 text-xs text-steel-500">
            <Lock className="size-3.5" aria-hidden />
            {t.history.readOnly}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {stats ? (
            <>
              <GlassCard className="grid grid-cols-2 gap-6 p-6 sm:grid-cols-4">
                <Stat label={t.summary.sets} value={stats.sets} accent />
                <Stat label={t.summary.totalReps} value={stats.totalReps} />
                <Stat label={t.summary.maxWeight} value={stats.maxWeight !== null ? formatNumber(stats.maxWeight) : "—"} unit={stats.maxWeight !== null ? t.common.kg : undefined} />
                <Stat label={t.summary.volume} value={formatNumber(stats.volume)} unit={t.common.kg} />
              </GlassCard>
              {entry.durationSeconds !== null && (
                <GlassCard className="p-6">
                  <Stat label={t.common.duration} value={formatDuration(entry.durationSeconds, locale)} className="[&_span:first-child]:text-2xl" />
                </GlassCard>
              )}
              <div className="glass overflow-hidden rounded-3xl">
                <table className="w-full text-sm">
                  <thead className="text-xs text-steel-500">
                    <tr className="border-b border-line">
                      <th scope="col" className="px-5 py-3 text-start font-normal">{t.common.set}</th>
                      <th scope="col" className="px-5 py-3 text-start font-normal">{t.common.reps}</th>
                      <th scope="col" className="px-5 py-3 text-start font-normal">{t.common.kg}</th>
                      <th scope="col" className="px-5 py-3 text-start font-normal">{t.common.effort}</th>
                    </tr>
                  </thead>
                  <tbody className="tabular">
                    {entry.sets.map((set) => (
                      <tr key={set.id} className="border-b border-line last:border-0">
                        <td className="px-5 py-3 text-steel-400">{fmt(t.setup.setLabel, { n: set.set_number ?? "—" })}</td>
                        <td className="px-5 py-3 font-medium">{set.reps ?? "—"}</td>
                        <td className="px-5 py-3 font-medium">{set.weight_kg !== null ? formatNumber(set.weight_kg) : "—"}</td>
                        <td className="px-5 py-3 text-steel-300">{set.effort_level !== null ? `${set.effort_level}/10` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <GlassCard className="grid grid-cols-2 gap-6 p-6">
              <Stat label={t.common.duration} value={entry.durationSeconds !== null ? formatDuration(entry.durationSeconds, locale) : "—"} accent className="[&_span:first-child]:text-2xl" />
              <Stat label={t.common.distance} value={entry.cardio?.distance_km != null ? formatNumber(entry.cardio.distance_km) : "—"} unit={entry.cardio?.distance_km != null ? t.common.km : undefined} />
              <Stat label={t.common.effort} value={entry.cardio?.effort_level != null ? `${entry.cardio.effort_level}/10` : "—"} />
            </GlassCard>
          )}
          {entry.notes && (
            <GlassCard className="p-5">
              <div className="text-xs text-steel-500">{t.common.notes}</div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-steel-300">{entry.notes}</p>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}
