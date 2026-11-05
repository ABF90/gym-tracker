"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ExerciseImage } from "@/components/exercise/exercise-image";
import { cn } from "@/lib/cn";
import { entryName, resistanceStats, type HistoryEntry } from "@/lib/data";
import { formatDate, formatDuration, formatNumber } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";

export function historyHref(entry: HistoryEntry) {
  return `/history/${encodeURIComponent(entry.key)}`;
}

export function HistoryCard({ entry }: { entry: HistoryEntry }) {
  const { t, locale, dir } = useI18n();
  const Chevron = dir === "rtl" ? ChevronLeft : ChevronRight;

  const facts: string[] = [];
  if (entry.kind === "resistance") {
    const stats = resistanceStats(entry.sets);
    facts.push(`${stats.sets} ${t.common.sets}`);
    facts.push(`${stats.totalReps} ${t.common.reps}`);
    if (stats.maxWeight !== null) facts.push(`${formatNumber(stats.maxWeight)} ${t.common.kg}`);
  } else {
    if (entry.durationSeconds !== null) facts.push(formatDuration(entry.durationSeconds, locale));
    if (entry.cardio?.distance_km != null) facts.push(`${formatNumber(entry.cardio.distance_km)} ${t.common.km}`);
    if (entry.cardio?.effort_level != null) facts.push(`${t.common.effort} ${entry.cardio.effort_level}/10`);
  }

  return (
    <Link
      href={historyHref(entry)}
      className="glass group flex items-center gap-4 rounded-3xl p-3 pe-4 transition-colors hover:border-line-strong hover:bg-glass-strong"
    >
      <ExerciseImage
        imagePath={entry.imagePath}
        name={entryName(entry, locale)}
        pending={entry.imagePending}
        kind={entry.kind}
        ratio="aspect-square"
        sizes="80px"
        className="w-16 shrink-0 rounded-2xl sm:w-20"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-md px-1.5 py-0.5 text-[11px] font-medium",
              entry.kind === "cardio" ? "bg-steel-500/15 text-steel-300" : "bg-lime-400/10 text-lime-400",
            )}
          >
            {entry.kind === "cardio" ? t.common.cardio : t.common.resistance}
          </span>
          <span className="text-xs text-steel-500">{formatDate(entry.date, locale)}</span>
          {entry.status === "active" && <span className="text-xs text-steel-400">· {t.history.status_active}</span>}
        </div>
        <div className="mt-1 truncate text-base font-medium">{entryName(entry, locale)}</div>
        <div className="tabular mt-0.5 truncate text-sm text-steel-400">{facts.join(" · ")}</div>
      </div>
      <Chevron className="size-5 shrink-0 text-steel-500 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" aria-hidden />
    </Link>
  );
}
