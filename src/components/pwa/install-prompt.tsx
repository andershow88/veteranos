"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/* BeforeInstallPromptEvent isn't in lib.dom yet. */
type BeforeInstallPromptEvent = Event & {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt: () => Promise<void>;
};

const DISMISSED_KEY = "veteranos.pwa-install-dismissed";

function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  // iPad on iPadOS reports as Mac with maxTouchPoints > 1.
  const iPadOS = ua.includes("Mac") && (navigator.maxTouchPoints ?? 0) > 1;
  return /iPhone|iPad|iPod/i.test(ua) || iPadOS;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const navStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone;
  return window.matchMedia("(display-mode: standalone)").matches || navStandalone === true;
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (isStandalone()) {
      // Sync once on mount; the value reflects an external browser API,
      // so the lint rule's general advice doesn't apply here.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInstalled(true);
      return;
    }

    if (sessionStorage.getItem(DISMISSED_KEY) === "1") return;

    // Android / Chromium browsers fire beforeinstallprompt.
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("appinstalled", onInstalled);

    // iOS Safari has no event — surface a short hint instead.
    if (isIOS()) setShowIosHint(true);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;
  if (!deferred && !showIosHint) return null;

  const dismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, "1");
    setDeferred(null);
    setShowIosHint(false);
  };

  const install = async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "dismissed") dismiss();
    } finally {
      setDeferred(null);
    }
  };

  // Compact pill anchored to the bottom-right with safe-area padding.
  // Stays out of the way of forms / buttons. Tapping the pill expands the
  // detail card; X dismisses for this session.
  return (
    <div
      className="fixed z-40 right-3 bottom-3 max-w-[min(22rem,calc(100vw-1.5rem))] sm:max-w-sm"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="relative glass rounded-2xl border border-pitch-600/40 shadow-2xl px-3 py-2 pr-9 flex items-center gap-2.5">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="absolute right-1.5 top-1.5 text-muted hover:text-foreground transition"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        {deferred ? (
          <>
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-pitch-700/30 text-pitch-200">
              <Download className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1 text-[12px] leading-tight">
              <div className="font-semibold text-foreground">Install app</div>
              <div className="text-[11px] text-muted">One-tap home-screen add</div>
            </div>
            <Button size="sm" onClick={install}>Install</Button>
          </>
        ) : (
          <>
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-pitch-700/30 text-pitch-200">
              <Share className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1 text-[12px] leading-tight">
              <div className="font-semibold text-foreground">Add to Home Screen</div>
              <div className="text-[11px] text-muted">Safari: Share → Add to Home Screen</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
