"use client";

import Link from "next/link";
import { Activity, ArrowLeft, ArrowRight, Dumbbell, HeartPulse, History, Play, Trophy } from "lucide-react";
import { ExerciseImage } from "@/components/exercise/exercise-image";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, ErrorState, GlassCard, SectionHeader, Skeleton, Stat } from "@/components/ui/card";
import { FadeIn } from "@/components/ui/fade-in";
import { isUnfinished, useActiveSession } from "@/lib/active-session";
import {
  bestRecords,
  buildHistory,
  entryName,
  exerciseName,
  fetchExercises,
  fetchRecords,
  fetchSessions,
  fetchWorkouts,
  useQuery,
  type Exercise,
} from "@/lib/data";
import { formatDate, formatDuration, localDateString } from "@/lib/format";
import { fmt } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/provider";
import { useCurrentUser } from "@/lib/auth";
import { HistoryCard } from "@/features/history/history-card";
import { RecordCard } from "@/features/records/record-card";

export function Dashboard() {
  const { t, locale, dir } = useI18n();
  const active = useActiveSession();
  const user = useCurrentUser();
  const username = user?.name ?? null;
  const today = localDateString();
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;

  const { data, error, loading, reload } = useQuery(async () => {
    const [exercises, workouts, sessions, records] = await Promise.all([
      fetchExercises(),
      fetchWorkouts({ limit: 300 }),
      fetchSessions(),
      fetchRecords(),
    ]);
    return { exercises, history: buildHistory(workouts, sessions, exercises), records };
  }, []);

  const exercises = data?.exercises ?? [];
  const history = data?.history ?? [];
  const todayEntries = history.filter((entry) => entry.date === today);
  const todaySets = todayEntries.reduce((sum, entry) => sum + entry.sets.length, 0);
  const durations = todayEntries.map((e) => e.durationSeconds).filter((d): d is number => d !== null);
  const todayDuration = durations.length ? durations.reduce((a, b) => a + b, 0) : null;
  const records = bestRecords(data?.records ?? []).slice(0, 3);
  const exerciseById = new Map(exercises.map((e) => [e.id, e]));

  const activeHref =
    active?.kind === "resistance" ? "/train/resistance/session" : active?.kind === "cardio" ? "/train/cardio/session" : "/train";

  return (
    <div className="flex flex-col gap-8">
      <FadeIn>
        <header className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sm text-steel-400">{formatDate(today, locale, "long")}</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
              {username ? fmt(t.dashboard.greetingName, { name: username }) : t.dashboard.greeting}
            </h1>
            <p className="mt-2 text-steel-400">{t.app.tagline}</p>
          </div>
          <ButtonLink href="/train" size="xl" icon={<Play className="size-6 fill-current" aria-hidden />} className="w-full sm:w-auto">
            {t.dashboard.startWorkout}
          </ButtonLink>
        </header>
      </FadeIn>

      {isUnfinished(active) && active && (
        <FadeIn>
          <Link
            href={activeHref}
            className="flex items-center gap-4 rounded-3xl border border-lime-400/40 bg-lime-400/[0.07] p-4 transition-colors hover:bg-lime-400/10"
          >
            <span className="relative grid size-11 shrink-0 place-items-center rounded-2xl bg-lime-400 text-ink-950">
              <Activity className="size-5" aria-hidden />
              <span className="absolute -end-0.5 -top-0.5 size-3 animate-ping rounded-full bg-lime-300 motion-reduce:hidden" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm text-lime-400">{t.dashboard.resume}</div>
              <div className="truncate font-medium">{exerciseName(active.exercise, locale)}</div>
            </div>
            <span className="flex items-center gap-1 text-sm font-medium text-lime-400">
              {t.dashboard.resumeAction}
              <Arrow className="size-4" aria-hidden />
            </span>
          </Link>
        </FadeIn>
      )}

      <FadeIn delay={0.05}>
        <div className="grid gap-4 md:grid-cols-2">
          <ModeCard
            href="/train/resistance"
            title={t.dashboard.resistanceTitle}
            body={t.dashboard.resistanceBody}
            icon={<Dumbbell className="size-6" aria-hidden />}
            exercises={exercises.filter((e) => e.exercise_type === "resistance")}
            loading={loading && !data}
            arrow={<Arrow className="size-5" aria-hidden />}
          />
          <ModeCard
            href="/train/cardio"
            title={t.dashboard.cardioTitle}
            body={t.dashboard.cardioBody}
            icon={<HeartPulse className="size-6" aria-hidden />}
            exercises={exercises.filter((e) => e.exercise_type === "cardio")}
            loading={loading && !data}
            arrow={<Arrow className="size-5" aria-hidden />}
          />
        </div>
      </FadeIn>

      {error && !data ? (
        <ErrorState message={t.common.loadError} onRetry={reload} retryLabel={t.common.retry} />
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col gap-8">
            <FadeIn delay={0.1}>
              <section aria-labelledby="today-title">
                <SectionHeader title={t.dashboard.todayTitle} />
                <GlassCard className="p-6">
                  {loading && !data ? (
                    <div className="grid grid-cols-3 gap-4">
                      <Skeleton className="h-16" />
                      <Skeleton className="h-16" />
                      <Skeleton className="h-16" />
                    </div>
                  ) : todayEntries.length === 0 ? (
                    <p className="text-sm text-steel-400" id="today-title">
                      {t.dashboard.todayEmpty}
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 gap-4" id="today-title">
                      <Stat label={t.dashboard.todaySessions} value={todayEntries.length} />
                      <Stat label={t.dashboard.todaySets} value={todaySets} accent />
                      <Stat
                        label={t.dashboard.todayDuration}
                        value={todayDuration !== null ? formatDuration(todayDuration, locale) : "—"}
                        className="[&_span:first-child]:text-xl sm:[&_span:first-child]:text-2xl"
                      />
                    </div>
                  )}
                </GlassCard>
              </section>
            </FadeIn>

            <FadeIn delay={0.15}>
              <section>
                <SectionHeader
                  title={t.dashboard.recent}
                  action={
                    history.length > 0 && (
                      <Link href="/history" className="text-sm text-lime-400 hover:underline">
                        {t.dashboard.viewAll}
                      </Link>
                    )
                  }
                />
                {loading && !data ? (
                  <div className="flex flex-col gap-3">
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                  </div>
                ) : history.length === 0 ? (
                  <EmptyState icon={<History aria-hidden />} title={t.dashboard.recentEmpty} />
                ) : (
                  <div className="flex flex-col gap-3">
                    {history.slice(0, 5).map((entry) => (
                      <HistoryCard key={entry.key} entry={entry} />
                    ))}
                  </div>
                )}
              </section>
            </FadeIn>
          </div>

          <div className="flex flex-col gap-8">
            <FadeIn delay={0.12}>
              <section>
                <SectionHeader title={t.dashboard.latest} />
                {loading && !data ? (
                  <Skeleton className="aspect-[4/3]" />
                ) : history[0] ? (
                  <LatestCard entry={history[0]} />
                ) : (
                  <EmptyState icon={<Activity aria-hidden />} title={t.dashboard.latestEmpty} />
                )}
              </section>
            </FadeIn>

            <FadeIn delay={0.18}>
              <section>
                <SectionHeader
                  title={t.dashboard.records}
                  action={
                    records.length > 0 && (
                      <Link href="/records" className="text-sm text-lime-400 hover:underline">
                        {t.dashboard.viewAll}
                      </Link>
                    )
                  }
                />
                {loading && !data ? (
                  <Skeleton className="h-24" />
                ) : records.length === 0 ? (
                  <EmptyState icon={<Trophy aria-hidden />} title={t.dashboard.recordsEmpty} />
                ) : (
                  <div className="flex flex-col gap-3">
                    {records.map(({ best }) => (
                      <RecordCard key={best.id} record={best} exercise={best.exercise_id ? exerciseById.get(best.exercise_id) : undefined} />
                    ))}
                  </div>
                )}
              </section>
            </FadeIn>
          </div>
        </div>
      )}
    </div>
  );
}

export function ModeCard({
  href,
  title,
  body,
  icon,
  exercises,
  loading,
  arrow,
}: {
  href: string;
  title: string;
  body: string;
  icon: React.ReactNode;
  exercises: Exercise[];
  loading: boolean;
  arrow: React.ReactNode;
}) {
  const preview = exercises.slice(0, 4);
  return (
    <Link
      href={href}
      className="glass group relative flex min-h-48 flex-col justify-between overflow-hidden rounded-4xl p-6 transition-[border-color,background-color] hover:border-lime-400/40 hover:bg-glass-strong"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="grid size-12 place-items-center rounded-2xl bg-lime-400/10 text-lime-400">{icon}</span>
        <div className="flex -space-x-3 rtl:space-x-reverse">
          {loading
            ? [0, 1].map((i) => <Skeleton key={i} className="size-12 rounded-2xl" />)
            : preview.map((e) => (
                <ExerciseImage
                  key={e.id}
                  imagePath={e.image_path}
                  name={e.name}
                  kind={e.exercise_type as "resistance" | "cardio"}
                  ratio="aspect-square"
                  sizes="48px"
                  className="size-12 rounded-2xl border-2 border-ink-900"
                />
              ))}
        </div>
      </div>
      <div className="mt-8 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-1 text-sm text-steel-400">{body}</p>
        </div>
        <span className="grid size-11 shrink-0 place-items-center rounded-full border border-line text-steel-300 transition-colors group-hover:border-lime-400/50 group-hover:text-lime-400">
          {arrow}
        </span>
      </div>
    </Link>
  );
}

function LatestCard({ entry }: { entry: ReturnType<typeof buildHistory>[number] }) {
  const { locale } = useI18n();
  return (
    <div className="flex flex-col gap-3">
      <ExerciseImage
        imagePath={entry.imagePath}
        name={entryName(entry, locale)}
        pending={entry.imagePending}
        kind={entry.kind}
        className="rounded-3xl"
        sizes="(min-width: 1024px) 40vw, 100vw"
      />
      <HistoryCard entry={entry} />
    </div>
  );
}
