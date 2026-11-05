"use client";

import Link from "next/link";
import { Activity, Dumbbell } from "lucide-react";
import { useState } from "react";
import { PageTitle } from "@/components/layout/app-shell";
import { ExerciseImage } from "@/components/exercise/exercise-image";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/card";
import { ChipGroup } from "@/components/ui/chips";
import { FadeIn } from "@/components/ui/fade-in";
import { isUnfinished, useActiveSession } from "@/lib/active-session";
import { fetchMuscleGroups, muscleName, useQuery } from "@/lib/data";
import { fmt } from "@/lib/i18n";
import { useI18n } from "@/lib/i18n/provider";

type View = "all" | "front" | "back" | "legs";

/** Resistance step 1: pick one of the muscle groups. */
export function MusclePicker() {
  const { t, locale } = useI18n();
  const active = useActiveSession();
  const [view, setView] = useState<View>("all");
  const { data, error, loading, reload } = useQuery(() => fetchMuscleGroups(), []);
  const groups = (data ?? []).filter((g) => g.is_active && (view === "all" || g.body_view === view));
  const other = locale === "ar" ? "en" : "ar";

  return (
    <div>
      <PageTitle title={t.library.chooseMuscle} subtitle={t.library.chooseMuscleSub} />

      {isUnfinished(active) && (
        <Link
          href={active?.kind === "cardio" ? "/train/cardio/session" : "/train/resistance/session"}
          className="mb-6 flex items-center gap-3 rounded-2xl border border-lime-400/40 bg-lime-400/[0.07] p-4 text-sm"
        >
          <Activity className="size-5 text-lime-400" aria-hidden />
          <span className="flex-1">{t.train.activeElsewhere}</span>
          <span className="font-medium text-lime-400">{t.dashboard.resumeAction}</span>
        </Link>
      )}

      <ChipGroup<View>
        label={t.library.chooseMuscle}
        size="sm"
        value={view}
        onChange={setView}
        className="mb-6"
        options={[
          { value: "all", label: t.library.all },
          { value: "front", label: t.library.front },
          { value: "back", label: t.library.back },
          { value: "legs", label: t.library.legs },
        ]}
      />

      {error && !data ? (
        <ErrorState message={t.common.loadError} onRetry={reload} retryLabel={t.common.retry} />
      ) : loading && !data ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="aspect-[4/5] rounded-3xl" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <EmptyState icon={<Dumbbell aria-hidden />} title={t.library.empty} />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {groups.map((g, i) => (
            <FadeIn key={g.id} delay={Math.min(i, 8) * 0.03}>
              <li>
                <Link
                  href={`/train/resistance/muscle/${g.id}`}
                  className="glass group block overflow-hidden rounded-3xl transition-[border-color,transform] hover:border-lime-400/50 active:scale-[0.98]"
                >
                  <ExerciseImage
                    imagePath={g.image_path}
                    pending={!g.image_path}
                    name={muscleName(g, locale)}
                    kind="resistance"
                    ratio="aspect-[4/5]"
                    priority={i < 4}
                    sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 46vw"
                  />
                  <div className="p-3 sm:p-4">
                    <div className="truncate font-semibold">{muscleName(g, locale)}</div>
                    <div className="flex items-center justify-between gap-2 text-xs text-steel-500">
                      <span className="truncate" dir={other === "ar" ? "rtl" : "ltr"}>
                        {muscleName(g, other)}
                      </span>
                      <span className="tabular shrink-0 text-lime-400">{fmt(t.library.exercisesCount, { n: g.cardCount })}</span>
                    </div>
                  </div>
                </Link>
              </li>
            </FadeIn>
          ))}
        </ul>
      )}
    </div>
  );
}
