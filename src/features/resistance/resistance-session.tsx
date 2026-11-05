"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Flag, House, Pause, Pencil, Play, Plus, SkipForward, Timer } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ExerciseImage } from "@/components/exercise/exercise-image";
import { RingProgress } from "@/components/gauges/ring-progress";
import { Button, ButtonLink, IconButton } from "@/components/ui/button";
import { ChipGroup } from "@/components/ui/chips";
import { NumberStepper } from "@/components/ui/number-stepper";
import { ConfirmSheet, Sheet } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/toast";
import { useActiveSession, useHydrated, type ResistanceSession } from "@/lib/active-session";
import { playChime, primeAudio } from "@/lib/alert";
import { elapsedMs, remainingMs, useNow } from "@/lib/clock";
import { cn } from "@/lib/cn";
import { exerciseName } from "@/lib/data";
import { formatClock, formatNumber } from "@/lib/format";
import { fmt } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/provider";
import { ResistanceSummary } from "./resistance-summary";
import * as actions from "./actions";

export function ResistanceSessionScreen() {
  const session = useActiveSession();
  const { t } = useI18n();
  const hydrated = useHydrated();

  if (!hydrated) return <div className="min-h-dvh" />;

  if (!session || session.kind !== "resistance") {
    return (
      <main className="grid min-h-dvh place-items-center px-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <Timer className="size-10 text-steel-500" aria-hidden />
          <p className="text-steel-300">{t.session.notFound}</p>
          <ButtonLink href="/" variant="secondary" icon={<House className="size-5" aria-hidden />}>
            {t.session.goHome}
          </ButtonLink>
        </div>
      </main>
    );
  }

  if (session.phase === "summary") return <ResistanceSummary session={session} />;
  return <Console session={session} />;
}

function Console({ session }: { session: ResistanceSession }) {
  const { t, locale } = useI18n();
  const name = exerciseName(session.exercise, locale);
  const reduced = useReducedMotion();
  const paused = session.clock.pausedAt !== null;
  const now = useNow(!paused);
  const elapsed = Math.floor(elapsedMs(session.clock, now) / 1000);

  const [sheet, setSheet] = useState<null | "complete" | "edit" | "skip" | "end">(null);
  const current = session.plan[session.index];
  const done = Object.values(session.results).filter((r) => r.status === "completed").length;
  const total = session.plan.length;

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
      <TopBar
        title={name}
        elapsed={elapsed}
        paused={paused}
        onPause={() => (paused ? actions.resumeWorkout() : actions.pauseWorkout())}
      />

      {session.phase === "rest" && session.rest ? (
        <RestPanel session={session} paused={paused} />
      ) : (
        current && (
          <div className="grid flex-1 items-center gap-6 py-4 lg:grid-cols-2 lg:gap-10">
            <ExerciseImage
              imagePath={session.exercise.image_path}
              name={name}
              kind="resistance"
              className="rounded-4xl"
              priority
              sizes="(min-width: 1024px) 45vw, 100vw"
            />

            <div className="flex flex-col items-center gap-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.id}
                  initial={reduced ? false : { opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.25 }}
                >
                  <RingProgress
                    value={done}
                    segments={total}
                    size={260}
                    stroke={10}
                    label={fmt(t.session.setOf, { n: session.index + 1, total })}
                  >
                    <span className="text-xs font-medium uppercase tracking-[0.2em] text-lime-400">
                      {fmt(t.session.setOf, { n: session.index + 1, total })}
                    </span>
                    <span className="tabular mt-2 text-7xl font-semibold leading-none tracking-tighter" dir="ltr">
                      {current.reps}
                    </span>
                    <span className="text-sm uppercase tracking-[0.2em] text-steel-400">{t.common.reps}</span>
                    <span className="tabular mt-3 text-3xl font-medium text-chalk" dir="ltr">
                      {formatNumber(current.weightKg)} <span className="text-base text-steel-400">{t.common.kg}</span>
                    </span>
                  </RingProgress>
                </motion.div>
              </AnimatePresence>

              <SetTrack session={session} />

              <div className="flex w-full max-w-md flex-col gap-3">
                <Button
                  size="xl"
                  block
                  icon={<Check className="size-6" aria-hidden />}
                  onClick={() => {
                    primeAudio();
                    setSheet("complete");
                  }}
                  disabled={paused}
                >
                  {t.session.complete}
                </Button>
                <div className="grid grid-cols-3 gap-3">
                  <Button variant="secondary" size="lg" icon={<Pencil className="size-5" aria-hidden />} onClick={() => setSheet("edit")} disabled={paused}>
                    {t.session.edit}
                  </Button>
                  <Button variant="secondary" size="lg" icon={<SkipForward className="size-5" aria-hidden />} onClick={() => setSheet("skip")} disabled={paused}>
                    {t.session.skip}
                  </Button>
                  <Button variant="danger" size="lg" icon={<Flag className="size-5" aria-hidden />} onClick={() => setSheet("end")}>
                    {t.session.end}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )
      )}

      {paused && <PausedOverlay onResume={actions.resumeWorkout} />}

      {current && (
        <>
          <CompleteSheet key={`c${current.id}${sheet === "complete"}`} open={sheet === "complete"} onClose={() => setSheet(null)} target={current} />
          <EditSheet key={`e${current.id}${sheet === "edit"}`} open={sheet === "edit"} onClose={() => setSheet(null)} target={current} />
        </>
      )}
      <ConfirmSheet
        open={sheet === "skip"}
        title={t.session.skipTitle}
        description={t.session.skipBody}
        confirmLabel={t.session.skip}
        onClose={() => setSheet(null)}
        onConfirm={() => {
          actions.skipCurrentSet();
          setSheet(null);
        }}
      />
      <ConfirmSheet
        open={sheet === "end"}
        title={t.session.endTitle}
        description={t.session.endBody}
        confirmLabel={t.session.endConfirm}
        danger
        onClose={() => setSheet(null)}
        onConfirm={() => {
          actions.endWorkout();
          setSheet(null);
        }}
      />
    </main>
  );
}

function TopBar({ title, elapsed, paused, onPause }: { title: string; elapsed: number; paused: boolean; onPause: () => void }) {
  const { t } = useI18n();
  return (
    <header className="flex items-center gap-3">
      <Link
        href="/"
        aria-label={t.session.goHome}
        title={t.session.leaveWarning}
        className="grid size-12 shrink-0 place-items-center rounded-2xl text-steel-400 hover:bg-glass hover:text-chalk"
      >
        <House className="size-5" aria-hidden />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm text-steel-400">{title}</div>
        <div className="flex items-center gap-2">
          <span className={cn("size-2 rounded-full", paused ? "bg-steel-500" : "bg-lime-400 motion-safe:animate-pulse")} aria-hidden />
          <span className="text-xs text-steel-500">{t.session.elapsed}</span>
          <span className="tabular text-lg font-semibold" dir="ltr" aria-live="off">
            {formatClock(elapsed)}
          </span>
        </div>
      </div>
      <IconButton label={paused ? t.session.resume : t.session.pause} onClick={onPause}>
        {paused ? <Play className="size-5 fill-current" aria-hidden /> : <Pause className="size-5" aria-hidden />}
      </IconButton>
    </header>
  );
}

function SetTrack({ session }: { session: ResistanceSession }) {
  const { t } = useI18n();
  return (
    <ol className="flex flex-wrap justify-center gap-2" aria-label={t.common.sets}>
      {session.plan.map((set, i) => {
        const result = session.results[set.id];
        const current = i === session.index && !result;
        return (
          <li
            key={set.id}
            className={cn(
              "tabular flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs",
              result?.status === "completed" && "border-lime-400/40 bg-lime-400/10 text-lime-400",
              result?.status === "skipped" && "border-line text-steel-500 line-through",
              current && "border-chalk/40 bg-glass-strong text-chalk",
              !result && !current && "border-line text-steel-400",
            )}
            aria-current={current ? "step" : undefined}
          >
            {result?.status === "completed" && <Check className="size-3.5" aria-hidden />}
            <span dir="ltr">
              {result?.status === "completed" ? `${result.reps}×${formatNumber(result.weightKg)}` : `${set.reps}×${formatNumber(set.weightKg)}`}
            </span>
            <span className="sr-only">
              {result?.status === "completed" ? t.session.completedBadge : result?.status === "skipped" ? t.session.skippedBadge : ""}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function PausedOverlay({ onResume }: { onResume: () => void }) {
  const { t } = useI18n();
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-ink-950/85 px-6 backdrop-blur-md" role="dialog" aria-modal="true" aria-label={t.session.paused}>
      <div className="flex flex-col items-center gap-6 text-center">
        <Pause className="size-12 text-steel-400" aria-hidden />
        <p className="text-2xl font-semibold">{t.session.paused}</p>
        <Button size="xl" icon={<Play className="size-6 fill-current" aria-hidden />} onClick={onResume} autoFocus>
          {t.session.resume}
        </Button>
      </div>
    </div>
  );
}

function CompleteSheet({ open, onClose, target }: { open: boolean; onClose: () => void; target: { reps: number; weightKg: number } }) {
  const { t } = useI18n();
  const [reps, setReps] = useState(target.reps);
  const [weight, setWeight] = useState(target.weightKg);
  const [effort, setEffort] = useState<number | null>(null);
  const valid = Number.isInteger(reps) && reps >= 1 && reps <= 100 && weight >= 0 && weight <= 500;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t.session.confirmTitle}
      description={t.session.confirmBody}
      footer={
        <Button
          size="xl"
          block
          disabled={!valid}
          icon={<Check className="size-6" aria-hidden />}
          onClick={() => {
            actions.completeCurrentSet({ reps, weightKg: weight, effort });
            onClose();
          }}
        >
          {t.session.saveSet}
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <NumberStepper label={t.session.actualReps} value={reps} min={1} max={100} step={1} onChange={setReps} size="lg" />
        <NumberStepper label={t.session.actualWeight} value={weight} min={0} max={500} step={1} decimals unit={t.common.kg} onChange={setWeight} size="lg" />
      </div>
      <div className="mt-5">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-xs text-steel-400">
            {t.common.effort} <span className="text-steel-500">({t.common.optional})</span>
          </span>
          <span className="text-xs text-steel-500">{t.common.effortHint}</span>
        </div>
        <ChipGroup
          label={t.common.effort}
          size="sm"
          value={effort}
          onChange={(v) => setEffort(v === effort ? null : v)}
          options={Array.from({ length: 10 }, (_, i) => ({ value: i + 1, label: i + 1 }))}
          columns
          className="[&>button]:min-w-0"
        />
      </div>
    </Sheet>
  );
}

function EditSheet({ open, onClose, target }: { open: boolean; onClose: () => void; target: { reps: number; weightKg: number } }) {
  const { t } = useI18n();
  const [reps, setReps] = useState(target.reps);
  const [weight, setWeight] = useState(target.weightKg);
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={t.session.editTitle}
      footer={
        <>
          <Button variant="secondary" size="lg" block onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button
            size="lg"
            block
            onClick={() => {
              actions.editCurrentSet(reps, weight);
              onClose();
            }}
          >
            {t.common.save}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <NumberStepper label={t.setup.targetReps} value={reps} min={1} max={100} step={1} onChange={setReps} size="lg" />
        <NumberStepper label={t.setup.weight} value={weight} min={0} max={500} step={1} decimals unit={t.common.kg} onChange={setWeight} size="lg" />
      </div>
    </Sheet>
  );
}

// ------------------------------------------------------------------ rest

const REST_PRESETS = [30, 60, 90, 120];

function RestPanel({ session, paused }: { session: ResistanceSession; paused: boolean }) {
  const { t } = useI18n();
  const toast = useToast();
  const rest = session.rest!;
  const restPaused = rest.remainingMs !== null;
  const now = useNow(!restPaused && !paused, 200);
  const left = remainingMs(rest, now);
  const finished = left <= 0;
  const notified = useRef<number | null>(null);
  const [custom, setCustom] = useState(false);
  const [customValue, setCustomValue] = useState(session.restSeconds);
  const next = session.plan[session.index];

  useEffect(() => {
    if (finished && notified.current !== rest.endsAt) {
      notified.current = rest.endsAt;
      playChime();
      toast(t.rest.done, "success");
    }
  }, [finished, rest.endsAt, t.rest.done, toast]);

  const preset = REST_PRESETS.includes(session.restSeconds) ? session.restSeconds : -1;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 py-6">
      <RingProgress
        value={rest.totalMs ? left / rest.totalMs : 0}
        size={300}
        stroke={12}
        label={t.rest.title}
        smooth={!restPaused}
      >
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-steel-400">{finished ? t.rest.done : t.rest.title}</span>
        <span
          className={cn("tabular mt-2 text-7xl font-semibold leading-none tracking-tighter", finished ? "text-lime-400" : "text-chalk", restPaused && "opacity-60")}
          dir="ltr"
          role="timer"
          aria-live="off"
        >
          {formatClock(Math.ceil(left / 1000))}
        </span>
        {next && (
          <span className="mt-3 text-sm text-steel-400">
            {fmt(t.rest.next, { n: session.index + 1 })} ·{" "}
            <span className="tabular" dir="ltr">
              {next.reps}×{formatNumber(next.weightKg)} {t.common.kg}
            </span>
          </span>
        )}
      </RingProgress>

      {finished ? (
        <Button size="xl" icon={<Play className="size-6 fill-current" aria-hidden />} onClick={actions.skipRest} className="w-full max-w-md" autoFocus>
          {fmt(t.setup.setLabel, { n: session.index + 1 })}
        </Button>
      ) : (
        <div className="flex w-full max-w-md flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant="secondary"
              size="lg"
              icon={restPaused ? <Play className="size-5 fill-current" aria-hidden /> : <Pause className="size-5" aria-hidden />}
              onClick={restPaused ? actions.resumeRest : actions.pauseRest}
              disabled={paused}
            >
              {restPaused ? t.rest.resume : t.rest.pause}
            </Button>
            <Button variant="secondary" size="lg" icon={<Plus className="size-5" aria-hidden />} onClick={() => actions.addRest(15)} disabled={paused}>
              <span dir="ltr">{t.rest.add15}</span>
            </Button>
            <Button variant="primary" size="lg" icon={<SkipForward className="size-5" aria-hidden />} onClick={actions.skipRest}>
              {t.rest.skip}
            </Button>
          </div>
          <ChipGroup
            label={t.rest.title}
            value={custom ? -2 : preset}
            onChange={(v) => {
              if (v === -2) return setCustom(true);
              setCustom(false);
              actions.setRestDuration(v);
            }}
            options={[
              ...REST_PRESETS.map((s) => ({ value: s, label: <span dir="ltr">{s} {t.rest.seconds}</span> })),
              { value: -2, label: t.rest.custom },
            ]}
            className="justify-center"
          />
          {custom && (
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <NumberStepper label={t.rest.customSeconds} value={customValue} min={5} max={600} step={5} onChange={setCustomValue} unit={t.rest.seconds} />
              </div>
              <Button
                size="lg"
                className="h-[3.75rem]"
                onClick={() => {
                  actions.setRestDuration(customValue);
                  setCustom(false);
                }}
              >
                {t.common.confirm}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
