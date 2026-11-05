"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Info, Play } from "lucide-react";
import { useMemo } from "react";
import { Coverflow } from "@/components/coverflow";
import { ExerciseImage } from "@/components/exercise/exercise-image";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, GlassCard, Skeleton } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import {
  bestRecords,
  buildHistory,
  exerciseName,
  fetchGroupCards,
  fetchRecords,
  fetchSessions,
  fetchWorkouts,
  muscleName,
  resistanceStats,
  useQuery,
  type LibraryCard,
} from "@/lib/data";
import { formatDate, formatNumber } from "@/lib/format";
import { fmt, type Dictionary } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/provider";

const label = (t: Dictionary, key: string) => (t.library as Record<string, string>)[key] ?? key;

/** Resistance step 2: browse one muscle group's exercises in a 3D coverflow. */
export function MuscleExercises({ groupId, initialCard }: { groupId: string; initialCard?: string }) {
  const { t, locale, dir } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const Back = dir === "rtl" ? ArrowRight : ArrowLeft;

  const { data, error, loading, reload } = useQuery(async () => {
    const [library, workouts, sessions, records] = await Promise.all([
      fetchGroupCards(groupId),
      fetchWorkouts({ limit: 500 }),
      fetchSessions(),
      fetchRecords(),
    ]);
    const exercises = library.cards.map((c) => c.exercise);
    return {
      ...library,
      history: buildHistory(workouts, sessions, exercises),
      best: bestRecords(records),
    };
  }, [groupId]);

  const cards = useMemo(() => data?.cards ?? [], [data]);
  const groupById = useMemo(() => new Map((data?.groups ?? []).map((g) => [g.id, g])), [data]);
  const found = cards.findIndex((c) => c.id === initialCard);
  const index = found >= 0 ? found : 0;
  const current = cards[index];

  // The selected card lives in the URL so Back from the set planner returns to it.
  const setIndex = (i: number) => {
    const card = cards[i];
    if (card) router.replace(`${pathname}?card=${encodeURIComponent(card.id)}`, { scroll: false });
  };

  const choose = (card: LibraryCard) =>
    router.push(`/train/resistance/setup/${card.exercise.id}?group=${groupId}&card=${encodeURIComponent(card.id)}`);

  const backLink = (
    <Link href="/train/resistance" className="mb-4 inline-flex items-center gap-2 text-sm text-steel-400 hover:text-chalk">
      <Back className="size-4" aria-hidden />
      {t.library.backToMuscles}
    </Link>
  );

  if (error && !data) return <ErrorState message={t.common.loadError} onRetry={reload} retryLabel={t.common.retry} />;
  if (loading && !data) {
    return (
      <div className="flex flex-col items-center gap-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="aspect-[4/5] w-[min(68vw,19rem)] rounded-4xl" />
      </div>
    );
  }
  if (!data?.group) {
    return (
      <div>
        {backLink}
        <EmptyState icon={<Info aria-hidden />} title={t.library.notFound} />
      </div>
    );
  }

  const group = data.group;
  const last = current ? data.history.find((e) => e.exerciseId === current.exercise.id && e.kind === "resistance") : undefined;
  const lastStats = last ? resistanceStats(last.sets) : null;
  const best = current ? data.best.find((r) => r.best.exercise_id === current.exercise.id)?.best : undefined;
  const primaries = current?.muscles.filter((m) => m.role === "primary") ?? [];
  const secondaries = current?.muscles.filter((m) => m.role === "secondary") ?? [];

  return (
    <div>
      {backLink}
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{muscleName(group, locale)}</h1>
        <p className="mt-1 text-sm text-steel-500" dir={locale === "ar" ? "ltr" : "rtl"}>
          {muscleName(group, locale === "ar" ? "en" : "ar")}
        </p>
      </div>

      {cards.length === 0 ? (
        <EmptyState icon={<Info aria-hidden />} title={t.library.empty} />
      ) : (
        <div className="grid items-start gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <Coverflow
            items={cards.map((c) => ({ ...c, label: exerciseName(c.exercise, locale) }))}
            index={index}
            onIndexChange={setIndex}
            onActivate={choose}
            label={fmt(t.library.carousel, { group: muscleName(group, locale) })}
            renderCard={(card, { active }) => (
              <div
                className={cn(
                  "overflow-hidden rounded-[1.75rem] bg-ink-900 transition-shadow duration-500",
                  active ? "shadow-[0_0_0_2px_rgb(198_255_61/0.7),0_24px_60px_-20px_rgb(198_255_61/0.45)]" : "shadow-2xl",
                )}
              >
                <ExerciseImage
                  imagePath={card.image_path}
                  pending={!card.image_path}
                  name={`${exerciseName(card.exercise, locale)} — ${muscleName(groupById.get(card.muscle_group_id), locale)}`}
                  kind="resistance"
                  ratio="aspect-[4/5]"
                  priority={active}
                  sizes="(min-width: 640px) 19rem, 68vw"
                />
              </div>
            )}
          />

          {current && (
            <GlassCard className="flex flex-col gap-5 p-6" aria-live="polite">
              <div>
                <h2 className="text-2xl font-semibold leading-tight">{exerciseName(current.exercise, locale)}</h2>
                <p className="mt-1 text-sm text-steel-500" dir={locale === "ar" ? "ltr" : "rtl"}>
                  {locale === "ar" ? current.exercise.name : current.exercise.name_ar}
                </p>
              </div>

              <dl className="flex flex-col gap-4 text-sm">
                {current.exercise.equipment && (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-steel-500">{t.library.equipment}</dt>
                    <dd className="rounded-lg border border-line bg-glass px-2.5 py-1 text-chalk">{label(t, `eq_${current.exercise.equipment}`)}</dd>
                  </div>
                )}
                <div>
                  <dt className="mb-2 text-steel-500">{t.library.primary}</dt>
                  <dd className="flex flex-wrap gap-2">
                    {primaries.map((m) => (
                      <span key={m.muscle_group_id} className="rounded-lg border border-lime-400/40 bg-lime-400/10 px-2.5 py-1 text-lime-400">
                        {muscleName(groupById.get(m.muscle_group_id), locale)}
                      </span>
                    ))}
                  </dd>
                </div>
                {secondaries.length > 0 && (
                  <div>
                    <dt className="mb-2 text-steel-500">{t.library.secondary}</dt>
                    <dd className="flex flex-wrap gap-2">
                      {secondaries.map((m) => (
                        <span key={m.muscle_group_id} className="rounded-lg border border-line bg-glass px-2.5 py-1 text-steel-300">
                          {muscleName(groupById.get(m.muscle_group_id), locale)}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
                {current.focus_region && (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-steel-500">{t.library.focus}</dt>
                    <dd className="text-end text-chalk">{label(t, `focus_${current.focus_region}`)}</dd>
                  </div>
                )}
              </dl>

              {current.group_role === "stabilizer_or_secondary" && (
                <p className="rounded-xl border border-line bg-ink-900/60 px-4 py-3 text-xs leading-relaxed text-steel-300">
                  {fmt(t.library.roleStabilizer, { group: muscleName(group, locale) })}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm">
                <div>
                  <div className="text-xs text-steel-500">{t.library.yourLast}</div>
                  {last && lastStats ? (
                    <div className="mt-1">
                      <div className="tabular" dir="ltr">
                        {last.sets.map((s) => `${s.reps}×${formatNumber(s.weight_kg ?? 0)}`).join("  ")}
                      </div>
                      <div className="text-xs text-steel-500">{formatDate(last.date, locale)}</div>
                    </div>
                  ) : (
                    <div className="mt-1 text-steel-400">{t.train.none}</div>
                  )}
                </div>
                <div>
                  <div className="text-xs text-steel-500">{t.library.yourBest}</div>
                  {best ? (
                    <div className="tabular mt-1" dir="ltr">
                      <span className="text-lg font-semibold text-lime-400">{formatNumber(best.best_weight_kg)}</span> {t.common.kg} × {best.reps}
                    </div>
                  ) : (
                    <div className="mt-1 text-steel-400">{t.train.none}</div>
                  )}
                </div>
              </div>

              <Button size="xl" block icon={<Play className="size-6 fill-current" aria-hidden />} onClick={() => choose(current)}>
                {t.library.choose}
              </Button>
              <p className="flex items-start gap-2 text-xs leading-relaxed text-steel-500">
                <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                {t.library.disclaimer}
              </p>
            </GlassCard>
          )}
        </div>
      )}
    </div>
  );
}
