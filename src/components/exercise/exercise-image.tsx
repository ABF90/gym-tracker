"use client";

import Image from "next/image";
import { Dumbbell, HeartPulse } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { exerciseImageUrl, type ExerciseType } from "@/lib/data";
import { useI18n } from "@/lib/i18n/provider";

/**
 * Fixed-ratio exercise image. The photo is shown whole (object-contain) over a blurred
 * copy of itself, so baked-in labels are never cropped and every card keeps the same shape.
 */
export function ExerciseImage({
  imagePath,
  name,
  kind,
  className,
  sizes = "(min-width: 1024px) 33vw, 100vw",
  priority,
  ratio = "aspect-[4/3]",
}: {
  imagePath: string | null;
  name: string;
  kind: ExerciseType;
  className?: string;
  sizes?: string;
  priority?: boolean;
  ratio?: string;
}) {
  const { t } = useI18n();
  const url = exerciseImageUrl(imagePath);
  const [failed, setFailed] = useState(false);
  const Icon = kind === "cardio" ? HeartPulse : Dumbbell;

  return (
    <div className={cn("relative overflow-hidden bg-ink-800", ratio, className)}>
      {url && !failed ? (
        <>
          <Image
            src={url}
            alt=""
            aria-hidden
            fill
            sizes="64px"
            className="scale-125 object-cover opacity-50 blur-2xl"
          />
          <Image
            src={url}
            alt={name}
            fill
            sizes={sizes}
            priority={priority}
            onError={() => setFailed(true)}
            className="object-contain"
          />
        </>
      ) : (
        <div
          role="img"
          aria-label={`${name} — ${t.common.noImage}`}
          className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_50%_40%,rgb(198_255_61/0.08),transparent_60%)]"
        >
          <div className="grid size-16 place-items-center rounded-2xl border border-line bg-glass text-steel-400">
            <Icon className="size-7" aria-hidden />
          </div>
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/5" />
    </div>
  );
}
