"use client";

import { ArrowLeft, ArrowRight, Dumbbell, HeartPulse } from "lucide-react";
import { PageTitle } from "@/components/layout/app-shell";
import { ErrorState } from "@/components/ui/card";
import { FadeIn } from "@/components/ui/fade-in";
import { fetchExercises, useQuery } from "@/lib/data";
import { useI18n } from "@/lib/i18n/provider";
import { ModeCard } from "@/features/dashboard/dashboard";

export function TrainHub() {
  const { t, dir } = useI18n();
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;
  const { data, error, loading, reload } = useQuery(() => fetchExercises(), []);
  const exercises = data ?? [];

  return (
    <div>
      <PageTitle title={t.train.title} />
      {error && !data ? (
        <ErrorState message={t.common.loadError} onRetry={reload} retryLabel={t.common.retry} />
      ) : (
        <FadeIn>
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
      )}
    </div>
  );
}
