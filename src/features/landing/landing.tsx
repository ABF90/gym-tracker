"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  CloudUpload,
  Dumbbell,
  Gauge,
  History,
  Languages,
  LockKeyhole,
  Timer,
  Trophy,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { ExerciseImage } from "@/components/exercise/exercise-image";
import { CardioGauge } from "@/components/gauges/cardio-gauge";
import { RingProgress } from "@/components/gauges/ring-progress";
import { LanguageToggle } from "@/components/layout/app-shell";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/card";
import { useHydrated } from "@/lib/active-session";
import { useNow } from "@/lib/clock";
import { fetchExercises, useQuery } from "@/lib/data";
import { formatClock } from "@/lib/format";
import { fmt } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/provider";
import { getSupabase } from "@/lib/supabase/client";

function useSignedIn() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    void getSupabase()
      .auth.getSession()
      .then(({ data }) => setSignedIn(Boolean(data.session)));
  }, []);
  return signedIn;
}

function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45, delay, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}

// Demo clock origin; only read after hydration, so server and client markup match.
const DEMO_EPOCH = Date.now();

/** Live demo of the cardio dial: a real running clock (at 6× speed), clearly labelled as a demo. */
function DemoGauge() {
  const { t } = useI18n();
  const reduced = useReducedMotion();
  const hydrated = useHydrated();
  const live = hydrated && !reduced;
  const now = useNow(live, 250);
  const target = 15 * 60;
  const elapsed = live ? (522 + Math.floor((now - DEMO_EPOCH) / 1000) * 6) % (target + 120) : 522;
  return (
    <div className="relative">
      <span className="absolute start-0 top-0 z-10 rounded-full border border-line bg-ink-900/80 px-3 py-1 text-xs text-steel-300 backdrop-blur">
        {t.landing.demo}
      </span>
      <CardioGauge elapsedSeconds={elapsed} targetSeconds={target} activity="Treadmill" state="running" />
    </div>
  );
}

function DemoConsole() {
  const { t } = useI18n();
  return (
    <div className="glass relative flex flex-col items-center gap-5 rounded-4xl p-8">
      <span className="absolute start-4 top-4 rounded-full border border-line bg-ink-900/80 px-3 py-1 text-xs text-steel-300">{t.landing.demo}</span>
      <RingProgress value={1} segments={3} size={220} stroke={10} label={fmt(t.session.setOf, { n: 2, total: 3 })}>
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-lime-400">{fmt(t.session.setOf, { n: 2, total: 3 })}</span>
        <span className="tabular mt-2 text-6xl font-semibold leading-none tracking-tighter" dir="ltr">
          10
        </span>
        <span className="text-xs uppercase tracking-[0.2em] text-steel-400">{t.common.reps}</span>
        <span className="tabular mt-2 text-2xl font-medium" dir="ltr">
          12 <span className="text-sm text-steel-400">{t.common.kg}</span>
        </span>
      </RingProgress>
      <div className="flex gap-2 text-xs" dir="ltr">
        <span className="tabular rounded-lg border border-lime-400/40 bg-lime-400/10 px-2.5 py-1.5 text-lime-400">8×14</span>
        <span className="tabular rounded-lg border border-chalk/40 bg-glass-strong px-2.5 py-1.5">10×12</span>
        <span className="tabular rounded-lg border border-line px-2.5 py-1.5 text-steel-400">10×11</span>
      </div>
      <div className="flex w-full items-center justify-between rounded-2xl border border-line bg-ink-900/60 px-4 py-3">
        <span className="flex items-center gap-2 text-sm text-steel-400">
          <Timer className="size-4 text-lime-400" aria-hidden />
          {t.rest.title}
        </span>
        <span className="tabular text-lg font-semibold" dir="ltr">
          {formatClock(48)}
        </span>
      </div>
    </div>
  );
}

export function Landing() {
  const { t, dir } = useI18n();
  const signedIn = useSignedIn();
  const Arrow = dir === "rtl" ? ArrowLeft : ArrowRight;
  const { data: exercises, loading } = useQuery(() => fetchExercises(), []);

  const features = [
    { icon: Dumbbell, title: t.landing.f1Title, body: t.landing.f1Body },
    { icon: Timer, title: t.landing.f2Title, body: t.landing.f2Body },
    { icon: Gauge, title: t.landing.f3Title, body: t.landing.f3Body },
    { icon: History, title: t.landing.f4Title, body: t.landing.f4Body },
    { icon: Trophy, title: t.landing.f5Title, body: t.landing.f5Body },
    { icon: LockKeyhole, title: t.landing.f6Title, body: t.landing.f6Body },
    { icon: CloudUpload, title: t.landing.f7Title, body: t.landing.f7Body },
    { icon: Languages, title: t.landing.f8Title, body: t.landing.f8Body },
  ];

  const primaryCta = signedIn ? (
    <ButtonLink href="/" size="xl" icon={<Arrow className="size-5" aria-hidden />}>
      {t.landing.openDashboard}
    </ButtonLink>
  ) : (
    <ButtonLink href="/login?mode=signup" size="xl" icon={<Arrow className="size-5" aria-hidden />}>
      {t.landing.ctaStart}
    </ButtonLink>
  );

  return (
    <div className="min-h-dvh overflow-x-clip">
      <header className="sticky top-0 z-30 border-b border-line bg-ink-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Gym Tracker">
            <span className="grid size-9 place-items-center rounded-xl bg-lime-400 text-ink-950 shadow-lime">
              <Dumbbell className="size-5" aria-hidden />
            </span>
            <span className="text-lg font-semibold tracking-tight" dir="ltr">
              Gym<span className="text-lime-400">Tracker</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageToggle compact />
            {!signedIn && (
              <ButtonLink href="/login" variant="secondary" size="sm">
                {t.landing.ctaSignIn}
              </ButtonLink>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="relative">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(60%_50%_at_70%_20%,rgb(198_255_61/0.10),transparent_70%)]" aria-hidden />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-2 lg:pb-24 lg:pt-20">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-lime-400/30 bg-lime-400/10 px-3 py-1 text-xs font-medium text-lime-400">
                <span className="size-1.5 rounded-full bg-lime-400" aria-hidden />
                {t.landing.badge}
              </span>
              <h1 className="mt-6 text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">{t.landing.title}</h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-steel-300">{t.landing.subtitle}</p>
              <div className="mt-10 flex flex-wrap gap-3">
                {primaryCta}
                {!signedIn && (
                  <ButtonLink href="/login" variant="secondary" size="xl">
                    {t.landing.ctaSignIn}
                  </ButtonLink>
                )}
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <DemoGauge />
            </Reveal>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24" aria-labelledby="features-title">
          <Reveal>
            <h2 id="features-title" className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {t.landing.featuresTitle}
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, body }, i) => (
              <Reveal key={title} delay={(i % 4) * 0.05}>
                <div className="glass h-full rounded-3xl p-6">
                  <span className="grid size-11 place-items-center rounded-2xl bg-lime-400/10 text-lime-400">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-steel-400">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <Reveal className="order-2 lg:order-1">
            <DemoConsole />
          </Reveal>
          <Reveal className="order-1 lg:order-2">
            <span className="text-sm font-medium uppercase tracking-[0.16em] text-lime-400">{t.common.resistance}</span>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{t.landing.f1Title}</h2>
            <p className="mt-4 text-lg leading-relaxed text-steel-300">{t.landing.f1Body}</p>
            <p className="mt-3 leading-relaxed text-steel-400">{t.landing.f2Body}</p>
          </Reveal>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24" aria-labelledby="library-title">
          <Reveal>
            <h2 id="library-title" className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {t.landing.exercisesTitle}
            </h2>
            <p className="mt-3 text-steel-400">{t.landing.exercisesBody}</p>
          </Reveal>
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {loading && !exercises
              ? [0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="aspect-[4/5] rounded-3xl" />)
              : (exercises ?? []).map((exercise, i) => (
                  <Reveal key={exercise.id} delay={i * 0.04}>
                    <figure className="glass overflow-hidden rounded-3xl">
                      <ExerciseImage
                        imagePath={exercise.image_path}
                        name={exercise.name}
                        kind={exercise.exercise_type as "resistance" | "cardio"}
                        sizes="(min-width: 1024px) 20vw, (min-width: 768px) 33vw, 50vw"
                      />
                      <figcaption className="p-4">
                        <div className="text-xs text-lime-400">{exercise.exercise_type === "cardio" ? t.common.cardio : t.common.resistance}</div>
                        <div className="mt-0.5 truncate text-sm font-medium">{exercise.name}</div>
                      </figcaption>
                    </figure>
                  </Reveal>
                ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24" aria-labelledby="how-title">
          <Reveal>
            <h2 id="how-title" className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {t.landing.howTitle}
            </h2>
          </Reveal>
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[t.landing.how1, t.landing.how2, t.landing.how3, t.landing.how4].map((step, i) => (
              <Reveal key={step} delay={i * 0.06}>
                <li className="glass flex h-full flex-col gap-4 rounded-3xl p-6">
                  <span className="tabular text-4xl font-semibold text-lime-400" dir="ltr">
                    0{i + 1}
                  </span>
                  <span className="leading-relaxed text-steel-300">{step}</span>
                </li>
              </Reveal>
            ))}
          </ol>
          <Reveal className="mt-10 flex flex-wrap items-center gap-2 text-sm text-steel-400">
            <span className="me-2">{t.landing.techTitle}</span>
            {["Next.js", "TypeScript", "Tailwind CSS", "Supabase", "Row Level Security", "Motion"].map((tech) => (
              <span key={tech} className="rounded-full border border-line bg-glass px-3 py-1" dir="ltr">
                {tech}
              </span>
            ))}
          </Reveal>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6">
          <Reveal>
            <div className="relative overflow-hidden rounded-4xl border border-lime-400/30 bg-lime-400/[0.06] px-6 py-14 text-center sm:px-12">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_80%_at_50%_0%,rgb(198_255_61/0.15),transparent_70%)]" aria-hidden />
              <h2 className="relative text-3xl font-semibold tracking-tight sm:text-4xl">{t.landing.finalTitle}</h2>
              <p className="relative mt-3 text-steel-300">{t.landing.finalBody}</p>
              <div className="relative mt-8 flex justify-center">{primaryCta}</div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-steel-500 sm:px-6">
          <span dir="ltr">© {new Date().getFullYear()} Gym Tracker</span>
          <span>{t.landing.f6Title}</span>
        </div>
      </footer>
    </div>
  );
}
