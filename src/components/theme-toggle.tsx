"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { applyClubTheme } from "@/components/club-picker";
import { getClub } from "@/lib/clubs";

type Mode = "light" | "dark" | "system";

const MODES: { mode: Mode; label: string; Icon: typeof Sun }[] = [
  { mode: "light", label: "Light", Icon: Sun },
  { mode: "dark", label: "Dark", Icon: Moon },
  { mode: "system", label: "System", Icon: Monitor },
];

// External "store" = localStorage. Lets us read the choice without
// setState-in-effect (hydration-safe via useSyncExternalStore).
const listeners = new Set<() => void>();
function notify() {
  listeners.forEach((l) => l());
}
function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}
function readMode(): Mode {
  const s = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
  return s === "dark" || s === "light" || s === "system" ? s : "light";
}

function prefersDark() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyMode(m: Mode) {
  document.documentElement.classList.toggle("dark", m === "dark" || (m === "system" && prefersDark()));
  // Re-derive the club palette for the now-active light/dark mode.
  try {
    const stored = localStorage.getItem("club-theme");
    if (stored) {
      const { slug } = JSON.parse(stored);
      if (slug && slug !== "none") applyClubTheme(getClub(slug));
    }
  } catch {}
}

export function ThemeToggle() {
  const mode = useSyncExternalStore(subscribe, readMode, () => "light" as Mode);

  // Keep the DOM in sync with the current choice (external-system update).
  useEffect(() => {
    applyMode(mode);
  }, [mode]);

  // While "system" is selected, follow OS changes live.
  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyMode("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode]);

  function choose(m: Mode) {
    localStorage.setItem("theme", m);
    applyMode(m);
    notify(); // make useSyncExternalStore re-read -> re-render
  }

  return (
    <div
      className="inline-flex items-center gap-0.5 rounded-xl border border-border/60 bg-surface-2/40 p-0.5"
      role="group"
      aria-label="Theme"
    >
      {MODES.map(({ mode: m, label, Icon }) => {
        const active = mode === m;
        return (
          <button
            key={m}
            type="button"
            onClick={() => choose(m)}
            aria-pressed={active}
            title={label}
            className={
              "grid h-8 w-8 place-items-center rounded-lg transition " +
              (active
                ? "bg-bg-elevated text-foreground shadow-sm"
                : "text-foreground/70 hover:bg-surface-2/60 hover:text-foreground")
            }
          >
            <Icon className="h-4 w-4" />
            <span className="sr-only">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
