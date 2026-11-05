"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { CircleCheck, Flag, House, Pause, Play, RotateCcw, Timer } from "lucide-react";
import { useEffect, useState } from "react";
import { CardioGauge } from "@/components/gauges/cardio-gauge";
import { ExerciseImage } from "@/components/exercise/exercise-image";
import { Button, ButtonLink } from "@/components/ui/button";
import { GlassCard, Stat } from "@/components/ui/card";
import { ChipGroup } from "@/components/ui/chips";
import { NumberStepper } from "@/components/ui/number-stepper";
import { ConfirmSheet, Sheet } from "@/components/ui/sheet";
import { useActiveSession, useHydrated, type CardioSession } from "@/lib/active-session";
import { elapsedMs, useNow } from "@/lib/clock";
import { formatDuration, formatNumber } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";
import * as actions from "./actions";

export function CardioSessionScreen() {
  const session = useActiveSession();
  const { t } = useI18n();
  const hydrated = useHydrated();

  if (!hydrated) return <div className="min-h-dvh" />;

  if (!session || session.kind !== "cardio") {
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

  if (session.phase === "saved") return <CardioSaved session={session} />;
  return <Cockpit session={session} />;
}

function Cockpit({ session }: { session: CardioSession }) {
  const { t } = useI18n();
  const started = session.clock.startedAt !== null;
  const paused = session.clock.pausedAt !== null;
  const running = started && !paused;
  const now = useNow(running, 250);
  const elapsed = Math.floor(elapsedMs(session.clock, now) / 1000);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (!started) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [started]);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
      <header className="flex items-center gap-3">
        <Link
          href="/"
          aria-label={t.session.goHome}
          title={t.session.leaveWarning}
          className="grid size-12 shrink-0 place-items-center rounded-2xl text-steel-400 hover:bg-glass hover:text-chalk"
        >
          <House className="size-5" aria-hidden />
        </Link>
        <ExerciseImage
          imagePath={session.exercise.image_path}
          name={session.exercise.name}
          kind="cardio"
          ratio="aspect-square"
          sizes="48px"
          className="size-12 shrink-0 rounded-2xl"
        />
        <div className="min-w-0 flex-1">
          <div className="text-xs uppercase tracking-[0.16em] text-lime-400">{t.common.cardio}</div>
          <div className="truncate font-medium">{session.exercise.name}</div>
        </div>
        {session.targetDistanceKm !== null && (
          <div className="text-end text-xs text-steel-400">
            {t.cardio.targetDistance}
            <div className="tabular text-sm text-chalk" dir="ltr">
              {formatNumber(session.targetDistanceKm)} {t.common.km}
            </div>
          </div>
        )}
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 py-6">
        <CardioGauge
          elapsedSeconds={elapsed}
          targetSeconds={session.targetSeconds}
          activity={session.exercise.name}
          state={!started ? "ready" : paused ? "paused" : "running"}
        />

        <div className="flex w-full max-w-md flex-col gap-3">
          {!started ? (
            <Button size="xl" block icon={<Play className="size-6 fill-current" aria-hidden />} onClick={actions.startCardio} autoFocus>
              {t.cardio.start}
            </Button>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                {paused ? (
                  <Button size="xl" icon={<Play className="size-6 fill-current" aria-hidden />} onClick={actions.resumeCardio}>
                    {t.cardio.resume}
                  </Button>
                ) : (
                  <Button variant="secondary" size="xl" icon={<Pause className="size-6" aria-hidden />} onClick={actions.pauseCardio}>
                    {t.cardio.pause}
                  </Button>
                )}
                <Button variant={paused ? "secondary" : "primary"} size="xl" icon={<Flag className="size-6" aria-hidden />} onClick={actions.finishCardio}>
                  {t.cardio.finish}
                </Button>
              </div>
              {paused && (
                <Button variant="ghost" icon={<RotateCcw className="size-5" aria-hidden />} onClick={() => setConfirmReset(true)}>
                  {t.cardio.reset}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      <ConfirmSheet
        open={confirmReset}
        title={t.cardio.resetTitle}
        description={t.cardio.resetBody}
        confirmLabel={t.cardio.reset}
        danger
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          actions.resetCardio();
          setConfirmReset(false);
        }}
      />

      {session.phase === "finishing" && <FinishSheet key={session.sessionId} session={session} />}
    </main>
  );
}

function FinishSheet({ session }: { session: CardioSession }) {
  const { t } = useI18n();
  const measured = actions.measuredSeconds(session);
  const [mins, setMins] = useState(Math.floor(measured / 60));
  const [secs, setSecs] = useState(measured % 60);
  const [distance, setDistance] = useState<number>(session.targetDistanceKm ?? 0);
  const [withDistance, setWithDistance] = useState(session.targetDistanceKm !== null);
  const [effort, setEffort] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  const total = mins * 60 + secs;
  const validDistance = !withDistance || distance >= 0;
  const valid = total > 0 && validDistance;

  return (
    <Sheet
      open
      onClose={actions.cancelFinish}
      title={t.cardio.finishTitle}
      description={t.cardio.durationHint}
      footer={
        <Button
          size="xl"
          block
          disabled={!valid}
          icon={<CircleCheck className="size-6" aria-hidden />}
          onClick={() =>
            actions.saveCardio({
              durationSeconds: total,
              distanceKm: withDistance ? distance : null,
              effort,
              notes: notes.trim() || null,
            })
          }
        >
          {t.cardio.saveSession}
        </Button>
      }
    >
      <div className="flex flex-col gap-5">
        <div>
          <div className="mb-1.5 text-xs text-steel-400">{t.cardio.actualDuration}</div>
          <div className="grid grid-cols-2 gap-3">
            <NumberStepper label={t.cardio.minutesShort} value={mins} min={0} max={600} step={1} onChange={setMins} />
            <NumberStepper label={t.cardio.secondsShort} value={secs} min={0} max={59} step={1} onChange={setSecs} />
          </div>
          {total <= 0 && <p className="mt-2 text-sm text-danger">{t.cardio.invalidDuration}</p>}
        </div>

        <div>
          <label className="mb-2 flex items-center justify-between gap-4">
            <span className="text-sm">
              {t.cardio.distanceKm} <span className="text-steel-500">({t.common.optional})</span>
            </span>
            <input type="checkbox" checked={withDistance} onChange={(e) => setWithDistance(e.target.checked)} className="size-6 accent-lime-400" />
          </label>
          {withDistance && (
            <NumberStepper label={t.common.distance} value={distance} min={0} max={200} step={0.1} decimals onChange={setDistance} unit={t.common.km} />
          )}
        </div>

        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-sm">
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

        <label className="block">
          <span className="mb-1.5 block text-sm">
            {t.common.notes} <span className="text-steel-500">({t.common.optional})</span>
          </span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            maxLength={500}
            className="w-full resize-none rounded-2xl border border-line bg-ink-900/70 px-4 py-3 text-base outline-none focus:border-lime-400/50"
          />
        </label>
      </div>
    </Sheet>
  );
}

function CardioSaved({ session }: { session: CardioSession }) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const reduced = useReducedMotion();
  const saved = session.saved!;
  const leave = (href: string) => {
    actions.clearCardio();
    router.replace(href);
  };

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-6 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))] sm:px-6">
      <motion.div
        initial={reduced ? false : { opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
        className="flex flex-col items-center text-center"
      >
        <div className="relative grid size-24 place-items-center">
          {!reduced && (
            <motion.span
              className="absolute inset-0 rounded-full border-2 border-lime-400"
              initial={{ scale: 0.6, opacity: 0.8 }}
              animate={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          )}
          <div className="grid size-20 place-items-center rounded-full bg-lime-400 text-ink-950 shadow-lime">
            <CircleCheck className="size-10" aria-hidden />
          </div>
        </div>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight">{t.cardio.savedTitle}</h1>
        <p className="mt-1 text-steel-400">{session.exercise.name}</p>
      </motion.div>

      <ExerciseImage imagePath={session.exercise.image_path} name={session.exercise.name} kind="cardio" ratio="aspect-[16/9]" className="rounded-4xl" sizes="(min-width: 768px) 640px, 100vw" />

      <GlassCard className="grid grid-cols-2 gap-6 p-6">
        <Stat label={t.common.duration} value={formatDuration(saved.durationSeconds, locale)} accent className="[&_span:first-child]:text-2xl" />
        <Stat label={t.cardio.targetDuration} value={formatDuration(session.targetSeconds, locale)} className="[&_span:first-child]:text-2xl" />
        <Stat label={t.common.distance} value={saved.distanceKm !== null ? formatNumber(saved.distanceKm) : "—"} unit={saved.distanceKm !== null ? t.common.km : undefined} />
        <Stat label={t.common.effort} value={saved.effort !== null ? `${saved.effort}/10` : "—"} />
      </GlassCard>
      {saved.notes && <p className="glass rounded-2xl px-5 py-4 text-sm text-steel-300">{saved.notes}</p>}

      <div className="mt-auto grid gap-3 pt-4 sm:grid-cols-2">
        <Button variant="secondary" size="lg" onClick={() => leave(`/history/${session.sessionId}`)}>
          {t.summary.viewHistory}
        </Button>
        <Button size="lg" icon={<House className="size-5" aria-hidden />} onClick={() => leave("/")}>
          {t.summary.done}
        </Button>
      </div>
    </main>
  );
}
