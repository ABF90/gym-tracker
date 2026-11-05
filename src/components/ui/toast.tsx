"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CircleCheck, CircleAlert, Info } from "lucide-react";
import { createContext, use, useCallback, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "success" | "error" | "info";
type Toast = { id: number; message: string; tone: Tone };

const ToastContext = createContext<((message: string, tone?: Tone) => void) | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const reduced = useReducedMotion();

  const push = useCallback((message: string, tone: Tone = "info") => {
    const id = Date.now() + Math.random();
    setToasts((list) => [...list.slice(-2), { id, message, tone }]);
    setTimeout(() => setToasts((list) => list.filter((toast) => toast.id !== id)), 3800);
  }, []);

  return (
    <ToastContext value={push}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-[max(1rem,env(safe-area-inset-top))] z-[60] flex flex-col items-center gap-2 px-4"
      >
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icon = toast.tone === "success" ? CircleCheck : toast.tone === "error" ? CircleAlert : Info;
            return (
              <motion.div
                key={toast.id}
                role={toast.tone === "error" ? "alert" : "status"}
                initial={reduced ? false : { opacity: 0, y: -12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                className="glass pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl bg-ink-850/90 px-4 py-3 text-sm shadow-2xl"
              >
                <Icon
                  className={cn(
                    "size-5 shrink-0",
                    toast.tone === "success" && "text-lime-400",
                    toast.tone === "error" && "text-danger",
                    toast.tone === "info" && "text-steel-300",
                  )}
                  aria-hidden
                />
                <span>{toast.message}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext>
  );
}

export function useToast() {
  const push = use(ToastContext);
  if (!push) throw new Error("useToast must be used inside ToastProvider");
  return push;
}
