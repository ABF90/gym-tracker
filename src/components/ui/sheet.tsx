"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n/provider";
import { Button } from "./button";

/**
 * Bottom sheet on phones, centered panel on larger screens.
 * Built on <dialog> for focus trapping, Escape to close and an inert background.
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  dismissible = true,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  dismissible?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const { t } = useI18n();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="sheet-title"
      onCancel={(e) => {
        e.preventDefault();
        if (dismissible) onClose();
      }}
      onClick={(e) => {
        if (dismissible && e.target === e.currentTarget) onClose();
      }}
      className={cn(
        "m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-visible bg-transparent p-0 text-chalk",
        "sm:m-auto sm:max-w-lg",
        "open:animate-[sheet-in_240ms_cubic-bezier(0.2,0.8,0.2,1)]",
      )}
    >
      <div className="flex max-h-[92dvh] flex-col rounded-t-4xl border border-line-strong bg-ink-850 shadow-2xl sm:rounded-4xl">
        <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-ink-600 sm:hidden" aria-hidden />
        <div className="flex items-start justify-between gap-4 px-6 pb-2 pt-4 sm:pt-6">
          <div>
            <h2 id="sheet-title" className="text-xl font-semibold">
              {title}
            </h2>
            {description && <p className="mt-1 text-sm text-steel-400">{description}</p>}
          </div>
          {dismissible && (
            <button
              type="button"
              onClick={onClose}
              aria-label={t.common.close}
              className="grid size-10 shrink-0 place-items-center rounded-xl text-steel-400 hover:bg-glass hover:text-chalk"
            >
              <X className="size-5" aria-hidden />
            </button>
          )}
        </div>
        {children && <div className="overflow-y-auto px-6 py-3">{children}</div>}
        {footer && (
          <div className="flex gap-3 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3">{footer}</div>
        )}
      </div>
    </dialog>
  );
}

export function ConfirmSheet({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onClose,
  danger,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  danger?: boolean;
}) {
  const { t } = useI18n();
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" size="lg" block onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button variant={danger ? "danger" : "primary"} size="lg" block onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
