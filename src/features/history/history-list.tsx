"use client";

import { History, ListFilter } from "lucide-react";
import { useMemo, useState } from "react";
import { PageTitle } from "@/components/layout/app-shell";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/card";
import { ChipGroup } from "@/components/ui/chips";
import { buildHistory, fetchExercises, fetchSessions, fetchWorkouts, useQuery, type ExerciseType } from "@/lib/data";
import { addDays, localDateString } from "@/lib/format";
import { useI18n } from "@/lib/i18n/provider";
import { HistoryCard } from "./history-card";

type Range = "all" | "7" | "30" | "custom";

export function HistoryList() {
  const { t } = useI18n();
  const today = localDateString();
  const [range, setRange] = useState<Range>("all");
  const [from, setFrom] = useState(addDays(today, -30));
  const [to, setTo] = useState(today);
  const [type, setType] = useState<"all" | ExerciseType>("all");
  const [exerciseId, setExerciseId] = useState("all");

  const { data, error, loading, reload } = useQuery(async () => {
    const [exercises, workouts, sessions] = await Promise.all([fetchExercises(), fetchWorkouts(), fetchSessions()]);
    return { exercises, history: buildHistory(workouts, sessions, exercises) };
  }, []);

  const bounds = useMemo(() => {
    if (range === "7") return { from: addDays(today, -6), to: today };
    if (range === "30") return { from: addDays(today, -29), to: today };
    if (range === "custom") return from <= to ? { from, to } : { from: to, to: from };
    return null;
  }, [range, from, to, today]);

  const entries = (data?.history ?? []).filter(
    (entry) =>
      (!bounds || (entry.date >= bounds.from && entry.date <= bounds.to)) &&
      (type === "all" || entry.kind === type) &&
      (exerciseId === "all" || entry.exerciseId === exerciseId),
  );

  const exerciseOptions = (data?.exercises ?? []).filter((e) => type === "all" || e.exercise_type === type);

  return (
    <div>
      <PageTitle title={t.history.title} subtitle={t.history.readOnly} />

      <section aria-label={t.history.filters} className="glass mb-6 flex flex-col gap-4 rounded-3xl p-4 sm:p-5">
        <div className="flex items-center gap-2 text-sm text-steel-400">
          <ListFilter className="size-4" aria-hidden />
          {t.history.filters}
        </div>
        <ChipGroup<Range>
          label={t.common.date}
          size="sm"
          value={range}
          onChange={setRange}
          options={[
            { value: "all", label: t.history.all },
            { value: "7", label: t.history.last7 },
            { value: "30", label: t.history.last30 },
            { value: "custom", label: t.history.range },
          ]}
        />
        {range === "custom" && (
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 text-xs text-steel-400">
              {t.history.from}
              <input type="date" value={from} max={today} onChange={(e) => e.target.value && setFrom(e.target.value)} className="h-12 rounded-xl border border-line bg-ink-900/70 px-3 text-base text-chalk outline-none focus:border-lime-400/50" />
            </label>
            <label className="flex flex-col gap-1.5 text-xs text-steel-400">
              {t.history.to}
              <input type="date" value={to} max={today} onChange={(e) => e.target.value && setTo(e.target.value)} className="h-12 rounded-xl border border-line bg-ink-900/70 px-3 text-base text-chalk outline-none focus:border-lime-400/50" />
            </label>
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <ChipGroup<"all" | ExerciseType>
            label={t.history.type}
            size="sm"
            value={type}
            onChange={(v) => {
              setType(v);
              setExerciseId("all");
            }}
            options={[
              { value: "all", label: t.history.all },
              { value: "resistance", label: t.common.resistance },
              { value: "cardio", label: t.common.cardio },
            ]}
          />
          <label className="sr-only" htmlFor="history-exercise">
            {t.history.exercise}
          </label>
          <select
            id="history-exercise"
            value={exerciseId}
            onChange={(e) => setExerciseId(e.target.value)}
            className="h-10 rounded-xl border border-line bg-ink-900/70 px-3 text-sm text-chalk outline-none focus:border-lime-400/50"
          >
            <option value="all">{t.history.allExercises}</option>
            {exerciseOptions.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      {error && !data ? (
        <ErrorState message={t.common.loadError} onRetry={reload} retryLabel={t.common.retry} />
      ) : loading && !data ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <EmptyState icon={<History aria-hidden />} title={t.history.empty} />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {entries.map((entry) => (
            <HistoryCard key={entry.key} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
