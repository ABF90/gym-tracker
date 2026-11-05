"use client";

import { Trophy } from "lucide-react";
import { ExerciseImage } from "@/components/exercise/exercise-image";
import type { Exercise, PersonalRecord } from "@/lib/data";
import { formatDate, formatNumber } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";

export function RecordCard({ record, exercise }: { record: PersonalRecord; exercise?: Exercise }) {
  const { t, locale } = useI18n();
  return (
    <div className="glass flex items-center gap-4 rounded-3xl p-3 pe-5">
      <ExerciseImage
        imagePath={exercise?.image_path ?? null}
        name={record.exercise_name}
        kind="resistance"
        ratio="aspect-square"
        sizes="80px"
        className="w-16 shrink-0 rounded-2xl"
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm text-steel-300">{exercise?.name ?? record.exercise_name}</div>
        <div className="mt-0.5 flex items-baseline gap-1.5" dir="ltr">
          <span className="tabular text-2xl font-semibold text-lime-400">{formatNumber(record.best_weight_kg)}</span>
          <span className="text-sm text-steel-400">{t.common.kg}</span>
          <span className="tabular ms-2 text-sm text-steel-300">× {record.reps}</span>
        </div>
        <div className="mt-0.5 text-xs text-steel-500">{formatDate(record.achieved_date, locale)}</div>
      </div>
      <Trophy className="size-5 shrink-0 text-lime-400/80" aria-hidden />
    </div>
  );
}
