"use client";

import { useEffect } from "react";

/**
 * Warns the user before leaving the page (refresh / close / hard navigation)
 * while there are unsaved form changes. Soft in-app navigation should be
 * guarded explicitly (e.g. confirm() on a Cancel button).
 */
export function useUnsavedWarning(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [active]);
}
