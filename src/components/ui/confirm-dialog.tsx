"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "./button";

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary";
};

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function ConfirmDialog({
  open,
  options,
  onClose,
}: {
  open: boolean;
  options: ConfirmOptions;
  onClose: (result: boolean) => void;
}) {
  // Keep the dialog mounted briefly after `open` flips to false so it can play
  // an exit animation; `visible` drives the enter/exit transform+opacity.
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const prevFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      prevFocus.current = document.activeElement as HTMLElement | null;
      // Mount immediately, then reveal next frame so the enter transition runs.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMounted(true);
      const r = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(r);
    }
    // Start the exit transition, then unmount once it has played.
    setVisible(false);
    const t = setTimeout(() => setMounted(false), 200);
    return () => clearTimeout(t);
  }, [open]);

  // Lock background scroll while mounted; restore focus once fully closed.
  useEffect(() => {
    if (!mounted) {
      if (prevFocus.current) {
        prevFocus.current.focus?.();
        prevFocus.current = null;
      }
      return;
    }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [mounted]);

  // Move focus into the dialog once it is shown.
  useEffect(() => {
    if (visible) panelRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
  }, [visible]);

  // Escape closes; Tab is trapped within the dialog.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose(false);
        return;
      }
      if (e.key === "Tab" && panelRef.current) {
        const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;
  if (typeof document === "undefined") return null;

  const isDanger = options.variant === "danger";

  // Render through a portal so the dialog escapes any ancestor stacking context
  // (transformed/filtered elements, sticky headers, the install prompt).
  return createPortal(
    <div
      className={`fixed inset-0 z-[1000] flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm transition-opacity duration-200 sm:items-center sm:p-4 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose(false);
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className={`max-h-[90vh] w-full overflow-y-auto rounded-t-2xl glass shadow-2xl transition-all duration-200 ease-out sm:max-w-md sm:rounded-2xl ${
          visible
            ? "translate-y-0 opacity-100 sm:scale-100"
            : "translate-y-full opacity-0 sm:translate-y-0 sm:scale-95"
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <header className="flex items-start justify-between gap-3 border-b border-border/60 px-5 py-4">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <span
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                isDanger ? "bg-danger-surface text-danger-ink" : "bg-pitch-700/30 text-pitch-300"
              }`}
            >
              <AlertTriangle className="h-5 w-5" />
            </span>
            <h3 id="confirm-dialog-title" className="pt-1.5 font-display text-xl leading-tight tracking-wide">
              {options.title}
            </h3>
          </div>
          <button
            onClick={() => onClose(false)}
            className="text-muted hover:text-foreground transition"
            aria-label="Close"
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {options.description && (
          <div className="px-5 py-4 text-sm text-foreground/85 whitespace-pre-wrap">
            {options.description}
          </div>
        )}

        <footer className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border/60">
          <Button size="sm" variant="outline" onClick={() => onClose(false)} type="button">
            {options.cancelText ?? "Cancel"}
          </Button>
          <Button
            size="sm"
            variant={isDanger ? "danger" : "primary"}
            onClick={() => onClose(true)}
            type="button"
            data-autofocus
          >
            {options.confirmText ?? "Confirm"}
          </Button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}

/**
 * Component-local confirm dialog. Render `dialog` somewhere in the component
 * tree, then `await confirm({...})` returns true/false.
 */
export function useConfirm() {
  const [state, setState] = useState<{ open: boolean; options: ConfirmOptions }>({
    open: false,
    options: { title: "" },
  });
  const resolveRef = useRef<((v: boolean) => void) | null>(null);

  const confirm = (options: ConfirmOptions): Promise<boolean> =>
    new Promise((resolve) => {
      resolveRef.current = resolve;
      setState({ open: true, options });
    });

  const handleClose = (result: boolean) => {
    setState((prev) => ({ ...prev, open: false }));
    resolveRef.current?.(result);
    resolveRef.current = null;
  };

  const dialog = (
    <ConfirmDialog open={state.open} options={state.options} onClose={handleClose} />
  );

  return { confirm, dialog };
}
