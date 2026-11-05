"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Gauge } from "lucide-react";
import { useState } from "react";
import { ExerciseImage } from "@/components/exercise/exercise-image";
import { Button } from "@/components/ui/button";
import { ErrorState, GlassCard, Skeleton } from "@/components/ui/card";
import { ChipGroup } from "@/components/ui/chips";
import { NumberStepper } from "@/components/ui/number-stepper";
import { isUnfinished, useActiveSession } from "@/lib/active-session";
import { fetchExercise, useQuery } from "@/lib/data";
import { useI18n } from "@/lib/i18n/provider";
import { prepareCardio } from "./actions";

const PRESETS = [10, 15, 20, 30, 45, 60];

export function CardioSetup({ exerciseId }: { exerciseId: string }) {
  const { t, dir } = useI18n();
  const router = useRouter();
  const active = useActiveSession();
  const Back = dir === "rtl" ? ArrowRight : ArrowLeft;
  const { data: exercise, error, loading, reload } = useQuery(() => fetchExercise(exerciseId), [exerciseId]);

  const [minutes, setMinutes] = useState(20);
  const [custom, setCustom] = useState(false);
  const [withDistance, setWithDistance] = useState(false);
  const [distance, setDistance] = useState(3);
  const blocked = isUnfinished(active);

  if (error && !exercise) return <ErrorState message={t.common.loadError} onRetry={reload} retryLabel={t.common.retry} />;
  if (loading && !exercise) return <Skeleton className="aspect-[4/3] max-w-xl rounded-4xl" />;
  if (!exercise || exercise.exercise_type !== "cardio") {
    return <ErrorState message={t.history.notFound} onRetry={() => router.push("/train/cardio")} retryLabel={t.common.back} />;
  }

  const go = () => {
    if (blocked || minutes < 1) return;
    prepareCardio(
      { id: exercise.id, name: exercise.name, image_path: exercise.image_path },
      minutes * 60,
      withDistance ? distance : null,
    );
    router.push("/train/cardio/session");
  };

  return (
    <div className="pb-28 lg:pb-0">
      <Link href="/train/cardio" className="mb-6 inline-flex items-center gap-2 text-sm text-steel-400 hover:text-chalk">
        <Back className="size-4" aria-hidden />
        {t.train.chooseActivity}
      </Link>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <ExerciseImage imagePath={exercise.image_path} name={exercise.name} kind="cardio" className="rounded-4xl" priority sizes="(min-width: 1024px) 45vw, 100vw" />
          <div>
            <span className="text-xs font-medium uppercase tracking-[0.16em] text-lime-400">{t.common.cardio}</span>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">{exercise.name}</h1>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <GlassCard className="p-6">
            <h2 className="mb-4 text-lg font-semibold">{t.cardio.targetDuration}</h2>
            <ChipGroup
              label={t.cardio.targetDuration}
              value={custom ? -1 : minutes}
              onChange={(v) => {
                if (v === -1) return setCustom(true);
                setCustom(false);
                setMinutes(v);
              }}
              options={[
                ...PRESETS.map((m) => ({ value: m, label: <span dir="ltr">{m} {t.common.min}</span> })),
                { value: -1, label: t.cardio.custom },
              ]}
            />
            {custom && (
              <div className="mt-4">
                <NumberStepper label={t.cardio.customMinutes} value={minutes} min={1} max={300} step={1} onChange={setMinutes} unit={t.common.min} />
              </div>
            )}
          </GlassCard>

          <GlassCard className="p-6">
            <label className="flex items-center justify-between gap-4">
              <span className="text-lg font-semibold">
                {t.cardio.targetDistance} <span className="text-sm font-normal text-steel-500">({t.common.optional})</span>
              </span>
              <input
                type="checkbox"
                checked={withDistance}
                onChange={(e) => setWithDistance(e.target.checked)}
                className="size-6 accent-lime-400"
              />
            </label>
            {withDistance && (
              <div className="mt-4">
                <NumberStepper label={t.cardio.distanceKm} value={distance} min={0.1} max={200} step={0.5} decimals onChange={setDistance} unit={t.common.km} />
              </div>
            )}
          </GlassCard>

          <p className="text-xs leading-relaxed text-steel-500">{t.cardio.noSensorNote}</p>
          {blocked && <p className="text-sm text-steel-300">{t.train.activeElsewhere}</p>}

          <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 border-t border-line bg-ink-950/90 px-4 py-3 backdrop-blur-xl lg:static lg:border-0 lg:bg-transparent lg:p-0">
            <Button size="xl" block icon={<Gauge className="size-6" aria-hidden />} onClick={go} disabled={blocked}>
              {t.cardio.start}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
