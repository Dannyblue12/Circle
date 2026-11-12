"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { cx } from "./ui";

type Tone = "success" | "info" | "error";
type Toast = { id: number; message: string; tone: Tone; action?: { label: string; onClick: () => void } };
type ToastFn = (message: string, opts?: { tone?: Tone; action?: Toast["action"] }) => void;

const Ctx = createContext<ToastFn>(() => {});

/** Small, non-blocking confirmations ("Link copied", "Saved"). Announced to screen readers. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const next = useRef(0);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const toast = useCallback<ToastFn>(
    (message, opts) => {
      const id = ++next.current;
      // Keep at most three on screen; newest at the bottom.
      setToasts((t) => [...t.slice(-2), { id, message, tone: opts?.tone ?? "success", action: opts?.action }]);
      setTimeout(() => dismiss(id), opts?.action ? 5000 : 3200);
    },
    [dismiss],
  );

  return (
    <Ctx.Provider value={useMemo(() => toast, [toast])}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cx(
              "toast-in pointer-events-auto flex max-w-sm items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-lg",
              t.tone === "error" ? "bg-red-ink text-white" : "bg-ink text-white",
            )}
          >
            <span aria-hidden className={cx("grid size-5 shrink-0 place-items-center rounded-full text-[11px]", t.tone === "error" ? "bg-white/20" : "bg-brand")}>
              {t.tone === "error" ? "!" : t.tone === "info" ? "i" : "✓"}
            </span>
            <span className="min-w-0 flex-1">{t.message}</span>
            {t.action && (
              <button
                onClick={() => {
                  t.action!.onClick();
                  dismiss(t.id);
                }}
                className="shrink-0 rounded-md px-2 py-0.5 font-semibold text-brand-soft underline-offset-2 hover:underline"
              >
                {t.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  return useContext(Ctx);
}
