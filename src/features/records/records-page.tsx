"use client";

import { Info, Trophy } from "lucide-react";
import { PageTitle } from "@/components/layout/app-shell";
import { ExerciseImage } from "@/components/exercise/exercise-image";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/card";
import { FadeIn } from "@/components/ui/fade-in";
import { bestRecords, exerciseName, fetchExercises, fetchRecords, isImagePending, useQuery } from "@/lib/data";
import { formatDate, formatNumber } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";

export function RecordsPage() {
  const { t, locale } = useI18n();
  const { data, error, loading, reload } = useQuery(async () => {
    const [exercises, records] = await Promise.all([fetchExercises("resistance"), fetchRecords()]);
    return { exercises, groups: bestRecords(records) };
  }, []);

  // Only exercises that actually have a verified record, best first.
  const exerciseById = new Map((data?.exercises ?? []).map((e) => [e.id, e]));
  const rows = (data?.groups ?? [])
    .map((group) => ({ group, exercise: group.best.exercise_id ? exerciseById.get(group.best.exercise_id) : undefined }))
    .sort((a, b) => b.group.best.achieved_date.localeCompare(a.group.best.achieved_date));

  return (
    <div>
      <PageTitle title={t.records.title} />
      <p className="glass mb-8 flex items-start gap-3 rounded-2xl p-4 text-sm leading-relaxed text-steel-300">
        <Info className="mt-0.5 size-4 shrink-0 text-lime-400" aria-hidden />
        {t.records.definition}
      </p>

      {error && !data ? (
        <ErrorState message={t.common.loadError} onRetry={reload} retryLabel={t.common.retry} />
      ) : loading && !data ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-80 rounded-4xl" />
          <Skeleton className="h-80 rounded-4xl" />
        </div>
      ) : !rows.length ? (
        <EmptyState icon={<Trophy aria-hidden />} title={t.records.empty} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map(({ exercise, group }, i) => (
            <FadeIn key={group.best.id} delay={i * 0.05}>
              <article className="glass flex h-full flex-col overflow-hidden rounded-4xl">
                <ExerciseImage
                  imagePath={exercise?.image_path ?? null}
                  pending={exercise ? isImagePending(exercise) : false}
                  name={exerciseName(exercise, locale, group.best.exercise_name)}
                  kind="resistance"
                  ratio={exercise?.slug ? "aspect-[4/5]" : "aspect-[4/3]"}
                  sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 100vw"
                />
                <div className="flex flex-1 flex-col p-6">
                  <h2 className="text-lg font-semibold">{exerciseName(exercise, locale, group.best.exercise_name)}</h2>
                  <div className="mt-4 flex items-end justify-between gap-4">
                    <div>
                      <div className="text-xs text-steel-500">{t.records.bestWeight}</div>
                      <div className="mt-1 flex items-baseline gap-1.5" dir="ltr">
                        <span className="tabular text-5xl font-semibold tracking-tight text-lime-400">{formatNumber(group.best.best_weight_kg)}</span>
                        <span className="text-steel-400">{t.common.kg}</span>
                        <span className="tabular ms-2 text-xl text-chalk">× {group.best.reps}</span>
                      </div>
                    </div>
                    <Trophy className="mb-2 size-8 text-lime-400/80" aria-hidden />
                  </div>
                  <div className="mt-2 text-sm text-steel-400">
                    {t.records.achieved}: {formatDate(group.best.achieved_date, locale)}
                  </div>
                  {group.progression.length > 1 && (
                    <div className="mt-6 border-t border-line pt-4">
                      <div className="mb-2 text-xs text-steel-500">{t.records.timeline}</div>
                      <ol className="flex flex-col gap-1.5 text-sm">
                        {group.progression.map((r) => (
                          <li key={r.id} className="tabular flex justify-between text-steel-300">
                            <span>{formatDate(r.achieved_date, locale)}</span>
                            <span dir="ltr">
                              {formatNumber(r.best_weight_kg)} {t.common.kg} × {r.reps}
                            </span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              </article>
            </FadeIn>
          ))}
        </div>
      )}
    </div>
  );
}
