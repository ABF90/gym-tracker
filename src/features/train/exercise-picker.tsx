"use client";

import Link from "next/link";
import { Activity, Dumbbell } from "lucide-react";
import { PageTitle } from "@/components/layout/app-shell";
import { ExerciseImage } from "@/components/exercise/exercise-image";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/card";
import { FadeIn } from "@/components/ui/fade-in";
import { isUnfinished, useActiveSession } from "@/lib/active-session";
import {
  bestRecords,
  buildHistory,
  fetchExercises,
  fetchRecords,
  fetchSessions,
  fetchWorkouts,
  resistanceStats,
  useQuery,
  type ExerciseType,
  type HistoryEntry,
  type PersonalRecord,
} from "@/lib/data";
import { formatDate, formatDuration, formatNumber } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";

export function ExercisePicker({ type }: { type: ExerciseType }) {
  const { t, locale } = useI18n();
  const active = useActiveSession();

  const { data, error, loading, reload } = useQuery(async () => {
    const [allExercises, workouts, sessions, records] = await Promise.all([
      fetchExercises(),
      fetchWorkouts({ limit: 500 }),
      fetchSessions(),
      type === "resistance" ? fetchRecords() : Promise.resolve([] as PersonalRecord[]),
    ]);
    return {
      exercises: allExercises.filter((e) => e.exercise_type === type),
      history: buildHistory(workouts, sessions, allExercises),
      records: bestRecords(records),
    };
  }, [type]);

  const lastFor = (id: string) => data?.history.find((entry) => entry.exerciseId === id && entry.kind === type);
  const bestFor = (id: string) => data?.records.find((r) => r.best.exercise_id === id)?.best;

  const activeHref = active?.kind === "resistance" ? "/train/resistance/session" : "/train/cardio/session";

  return (
    <div>
      <PageTitle
        title={type === "resistance" ? t.train.chooseExercise : t.train.chooseActivity}
        subtitle={type === "resistance" ? t.dashboard.resistanceTitle : t.dashboard.cardioTitle}
      />

      {isUnfinished(active) && (
        <Link
          href={activeHref}
          className="mb-6 flex items-center gap-3 rounded-2xl border border-lime-400/40 bg-lime-400/[0.07] p-4 text-sm"
        >
          <Activity className="size-5 text-lime-400" aria-hidden />
          <span className="flex-1">{t.train.activeElsewhere}</span>
          <span className="font-medium text-lime-400">{t.dashboard.resumeAction}</span>
        </Link>
      )}

      {error && !data ? (
        <ErrorState message={t.common.loadError} onRetry={reload} retryLabel={t.common.retry} />
      ) : loading && !data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="aspect-[4/5] rounded-4xl" />
          ))}
        </div>
      ) : !data?.exercises.length ? (
        <EmptyState icon={<Dumbbell aria-hidden />} title={t.train.noExercises} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.exercises.map((exercise, i) => {
            const last = lastFor(exercise.id);
            const best = bestFor(exercise.id);
            return (
              <FadeIn key={exercise.id} delay={i * 0.04}>
                <Link
                  href={`/train/${type}/setup/${exercise.id}`}
                  className="glass group flex h-full flex-col overflow-hidden rounded-4xl transition-[border-color,transform] hover:border-lime-400/40 active:scale-[0.99]"
                >
                  <ExerciseImage
                    imagePath={exercise.image_path}
                    name={exercise.name}
                    kind={type}
                    priority={i < 2}
                    sizes="(min-width: 1280px) 30vw, (min-width: 640px) 45vw, 100vw"
                  />
                  <div className="flex flex-1 flex-col gap-4 p-5">
                    <div>
                      <span className="text-xs font-medium uppercase tracking-[0.16em] text-lime-400">
                        {type === "cardio" ? t.common.cardio : t.common.resistance}
                      </span>
                      <h2 className="mt-1 text-xl font-semibold">{exercise.name}</h2>
                    </div>
                    <dl className="mt-auto grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm">
                      <div>
                        <dt className="text-xs text-steel-500">{t.train.previous}</dt>
                        <dd className="tabular mt-1 text-steel-300">{describeLast(last, type, t, locale) ?? t.train.none}</dd>
                      </div>
                      {type === "resistance" && (
                        <div>
                          <dt className="text-xs text-steel-500">{t.train.best}</dt>
                          <dd className="tabular mt-1 text-chalk" dir="ltr">
                            {best ? (
                              <>
                                <span className="font-semibold text-lime-400">{formatNumber(best.best_weight_kg)}</span> {t.common.kg} × {best.reps}
                              </>
                            ) : (
                              <span dir="auto">{t.train.none}</span>
                            )}
                          </dd>
                        </div>
                      )}
                      {type === "cardio" && last && (
                        <div>
                          <dt className="text-xs text-steel-500">{t.common.date}</dt>
                          <dd className="mt-1 text-steel-300">{formatDate(last.date, locale)}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </Link>
              </FadeIn>
            );
          })}
        </div>
      )}
    </div>
  );
}

function describeLast(
  entry: HistoryEntry | undefined,
  type: ExerciseType,
  t: ReturnType<typeof useI18n>["t"],
  locale: ReturnType<typeof useI18n>["locale"],
) {
  if (!entry) return null;
  if (type === "resistance") {
    const stats = resistanceStats(entry.sets);
    const top = stats.maxWeight !== null ? ` · ${formatNumber(stats.maxWeight)} ${t.common.kg}` : "";
    return `${stats.sets} × ${Math.round(stats.totalReps / Math.max(1, stats.sets))}${top}`;
  }
  const parts = [entry.durationSeconds !== null ? formatDuration(entry.durationSeconds, locale) : null];
  if (entry.cardio?.distance_km != null) parts.push(`${formatNumber(entry.cardio.distance_km)} ${t.common.km}`);
  return parts.filter(Boolean).join(" · ") || null;
}
