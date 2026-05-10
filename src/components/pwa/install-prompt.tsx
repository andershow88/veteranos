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

  return (
    <div className="fixed inset-x-3 bottom-3 z-40 sm:left-auto sm:right-3 sm:max-w-sm">
      <div className="relative glass rounded-2xl border border-pitch-600/40 shadow-2xl px-4 py-3 pr-10">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="absolute right-2 top-2 text-muted hover:text-foreground transition"
        >
          <X className="h-4 w-4" />
        </button>

        {deferred ? (
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-pitch-700/30 text-pitch-200">
              <Download className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-foreground">Install Veteranos</div>
              <div className="text-[11px] text-muted leading-snug">
                Add the app to your home screen for a faster, full-screen experience.
              </div>
            </div>
            <Button size="sm" onClick={install}>Install</Button>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-pitch-700/30 text-pitch-200">
              <Share className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-foreground">Add to Home Screen</div>
              <div className="text-[11px] text-muted leading-snug">
                Tap the Share icon in Safari, then choose &ldquo;Add to Home Screen&rdquo; to install Veteranos.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
