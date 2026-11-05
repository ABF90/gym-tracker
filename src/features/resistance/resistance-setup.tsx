"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Copy, Play, Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";
import { ExerciseImage } from "@/components/exercise/exercise-image";
import { Button, IconButton } from "@/components/ui/button";
import { ErrorState, GlassCard, Skeleton } from "@/components/ui/card";
import { NumberStepper } from "@/components/ui/number-stepper";
import { useToast } from "@/components/ui/toast";
import { isUnfinished, useActiveSession, type PlannedSet } from "@/lib/active-session";
import {
  bestRecords,
  buildHistory,
  fetchExercises,
  fetchRecords,
  fetchSessions,
  fetchWorkouts,
  resistanceStats,
  useQuery,
} from "@/lib/data";
import { formatDate, formatNumber, newId } from "@/lib/format";
import { fmt } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/provider";
import { startResistance } from "./actions";

const MAX_SETS = 12;
const DEFAULT_SET = { reps: 10, weightKg: 10 };
const validReps = (n: number) => Number.isInteger(n) && n >= 1 && n <= 100;
const validWeight = (n: number) => n >= 0 && n <= 500;

export function ResistanceSetup({ exerciseId }: { exerciseId: string }) {
  const { t, locale, dir } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const reduced = useReducedMotion();
  const active = useActiveSession();
  const Back = dir === "rtl" ? ArrowRight : ArrowLeft;

  const { data, error, loading, reload } = useQuery(async () => {
    const [exercises, workouts, sessions, records] = await Promise.all([
      fetchExercises(),
      fetchWorkouts({ exerciseId, limit: 200 }),
      fetchSessions(),
      fetchRecords(),
    ]);
    const exercise = exercises.find((e) => e.id === exerciseId && e.exercise_type === "resistance") ?? null;
    const last = buildHistory(workouts, sessions, exercises).find((e) => e.kind === "resistance" && e.sets.length > 0);
    const best = bestRecords(records).find((r) => r.best.exercise_id === exerciseId)?.best ?? null;
    return { exercise, last: last ?? null, best };
  }, [exerciseId]);

  const [edited, setPlan] = useState<PlannedSet[] | null>(null);
  const [notes, setNotes] = useState("");

  // Until the user edits anything, the plan mirrors the last session (or a 3 × 10 default).
  const initialPlan = useMemo<PlannedSet[] | null>(() => {
    if (!data) return null;
    if (data.last?.sets.length) return data.last.sets.map((s) => ({ id: newId(), reps: s.reps ?? 10, weightKg: s.weight_kg ?? 0 }));
    return [0, 1, 2].map(() => ({ id: newId(), ...DEFAULT_SET }));
  }, [data]);

  const sets = edited ?? initialPlan ?? [];
  const prefilled = !edited && Boolean(data?.last?.sets.length);
  const blocked = isUnfinished(active);
  const allValid = sets.length > 0 && sets.every((s) => validReps(s.reps) && validWeight(s.weightKg));

  const patch = (id: string, change: Partial<PlannedSet>) =>
    setPlan(sets.map((s) => (s.id === id ? { ...s, ...change } : s)));

  const addSet = () => {
    if (sets.length >= MAX_SETS) return toast(t.setup.maxSets, "error");
    const last = sets.at(-1) ?? { ...DEFAULT_SET };
    setPlan([...sets, { id: newId(), reps: last.reps, weightKg: last.weightKg }]);
  };

  const removeSet = (id: string) => sets.length > 1 && setPlan(sets.filter((s) => s.id !== id));

  const copyPrevious = (index: number) => {
    const prev = sets[index - 1];
    if (prev) patch(sets[index].id, { reps: prev.reps, weightKg: prev.weightKg });
  };

  const setCount = (count: number) => {
    if (count > sets.length) {
      const extra = Array.from({ length: count - sets.length }, () => {
        const last = sets.at(-1) ?? DEFAULT_SET;
        return { id: newId(), reps: last.reps, weightKg: last.weightKg };
      });
      setPlan([...sets, ...extra]);
    } else {
      setPlan(sets.slice(0, count));
    }
  };

  const start = () => {
    if (!data?.exercise || !allValid || blocked) return;
    startResistance(
      { id: data.exercise.id, name: data.exercise.name, image_path: data.exercise.image_path },
      sets,
      notes.trim() || null,
      60,
    );
    router.push("/train/resistance/session");
  };

  if (error && !data) return <ErrorState message={t.common.loadError} onRetry={reload} retryLabel={t.common.retry} />;

  if (loading && !data) {
    return (
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Skeleton className="aspect-[4/3] rounded-4xl" />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      </div>
    );
  }

  if (!data?.exercise) {
    return <ErrorState message={t.history.notFound} onRetry={() => router.push("/train/resistance")} retryLabel={t.common.back} />;
  }

  const lastStats = data.last ? resistanceStats(data.last.sets) : null;

  return (
    <div className="pb-28 lg:pb-0">
      <Link href="/train/resistance" className="mb-6 inline-flex items-center gap-2 text-sm text-steel-400 hover:text-chalk">
        <Back className="size-4" aria-hidden />
        {t.train.chooseExercise}
      </Link>

      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="flex flex-col gap-4 lg:sticky lg:top-10 lg:self-start">
          <ExerciseImage
            imagePath={data.exercise.image_path}
            name={data.exercise.name}
            kind="resistance"
            className="rounded-4xl"
            priority
            sizes="(min-width: 1024px) 35vw, 100vw"
          />
          <div>
            <span className="text-xs font-medium uppercase tracking-[0.16em] text-lime-400">{t.common.resistance}</span>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">{data.exercise.name}</h1>
          </div>
          <GlassCard className="grid grid-cols-2 gap-4 p-5 text-sm">
            <div>
              <div className="text-xs text-steel-500">{t.train.previous}</div>
              {data.last && lastStats ? (
                <div className="mt-1">
                  <div className="tabular text-chalk" dir="ltr">
                    {data.last.sets.map((s) => `${s.reps}×${formatNumber(s.weight_kg ?? 0)}`).join("  ")}
                  </div>
                  <div className="mt-0.5 text-xs text-steel-500">{formatDate(data.last.date, locale)}</div>
                </div>
              ) : (
                <div className="mt-1 text-steel-400">{t.train.none}</div>
              )}
            </div>
            <div>
              <div className="text-xs text-steel-500">{t.train.best}</div>
              {data.best ? (
                <div className="tabular mt-1 text-chalk" dir="ltr">
                  <span className="text-lg font-semibold text-lime-400">{formatNumber(data.best.best_weight_kg)}</span> {t.common.kg} × {data.best.reps}
                </div>
              ) : (
                <div className="mt-1 text-steel-400">{t.train.none}</div>
              )}
            </div>
          </GlassCard>
        </div>

        <section aria-labelledby="plan-title">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="plan-title" className="text-2xl font-semibold">
                {t.setup.title}
              </h2>
              {prefilled && <p className="mt-1 text-sm text-steel-400">{t.setup.prefilledFromLast}</p>}
            </div>
            <div className="w-48">
              <NumberStepper label={t.setup.setsCount} value={sets.length} min={1} max={MAX_SETS} step={1} onChange={setCount} />
            </div>
          </div>

          <ol className="flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {sets.map((set, index) => (
                <motion.li
                  key={set.id}
                  layout={!reduced}
                  initial={reduced ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, height: 0, marginBottom: -12 }}
                  transition={{ duration: 0.22 }}
                  className="glass rounded-3xl p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="tabular grid size-9 place-items-center rounded-xl bg-lime-400/10 text-sm font-semibold text-lime-400">
                        {index + 1}
                      </span>
                      <span className="font-medium">{fmt(t.setup.setLabel, { n: index + 1 })}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {index > 0 && (
                        <IconButton label={t.setup.copyPrevious} variant="ghost" size="sm" onClick={() => copyPrevious(index)}>
                          <Copy className="size-[18px]" aria-hidden />
                        </IconButton>
                      )}
                      <IconButton
                        label={t.setup.removeSet}
                        variant="ghost"
                        size="sm"
                        disabled={sets.length <= 1}
                        onClick={() => removeSet(set.id)}
                        className="hover:text-danger disabled:opacity-30"
                      >
                        <Trash2 className="size-[18px]" aria-hidden />
                      </IconButton>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <NumberStepper
                      label={t.setup.targetReps}
                      value={set.reps}
                      min={1}
                      max={100}
                      step={1}
                      onChange={(reps) => patch(set.id, { reps })}
                      invalid={!validReps(set.reps)}
                    />
                    <NumberStepper
                      label={t.setup.weight}
                      value={set.weightKg}
                      min={0}
                      max={500}
                      step={1}
                      decimals
                      unit={t.common.kg}
                      onChange={(weightKg) => patch(set.id, { weightKg })}
                      invalid={!validWeight(set.weightKg)}
                    />
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ol>

          <Button variant="secondary" block size="lg" className="mt-3 border-dashed" icon={<Plus className="size-5" aria-hidden />} onClick={addSet} disabled={sets.length >= MAX_SETS}>
            {t.setup.addSet}
          </Button>

          <label className="mt-6 block">
            <span className="mb-1.5 block text-xs text-steel-400">
              {t.setup.sessionNotes} <span className="text-steel-500">({t.common.optional})</span>
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              maxLength={500}
              className="w-full resize-none rounded-2xl border border-line bg-ink-900/70 px-4 py-3 text-base outline-none focus:border-lime-400/50"
            />
          </label>

          {blocked && <p className="mt-4 text-sm text-steel-300">{t.train.activeElsewhere}</p>}

          <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 border-t border-line bg-ink-950/90 px-4 py-3 backdrop-blur-xl lg:static lg:mt-6 lg:border-0 lg:bg-transparent lg:p-0">
            <Button size="xl" block icon={<Play className="size-6 fill-current" aria-hidden />} onClick={start} disabled={!allValid || blocked}>
              {t.setup.start}
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
