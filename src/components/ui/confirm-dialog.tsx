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

export function ConfirmDialog({
  open,
  options,
  onClose,
}: {
  open: boolean;
  options: ConfirmOptions;
  onClose: (result: boolean) => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  const isDanger = options.variant === "danger";

  // Render through a portal so the dialog escapes any ancestor stacking
  // context (e.g. transformed/filtered elements, sticky headers, the install
  // prompt) and always sits above everything else.
  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose(false);
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl glass shadow-2xl sm:max-w-md sm:rounded-2xl"
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
            autoFocus
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
