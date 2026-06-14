"use client";

import { useEffect, useState } from "react";
import { Bell, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const VAPID_PUBLIC = "BFawXGGBS-53e2M-WlrshU7TINMor70na0LEnu5M-yU77jghXwHzAN6MZI4JP_KGTccMiVuGlMm-hqe2n-Kz2nk";
const DISMISSED_KEY = "veteranos.push-dismissed";

function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
}

function isIOS(): boolean {
    if (typeof window === "undefined") return false;
    const ua = window.navigator.userAgent;
    const iPadOS = ua.includes("Mac") && (navigator.maxTouchPoints ?? 0) > 1;
    return /iPhone|iPad|iPod/i.test(ua) || iPadOS;
}

function isStandalone(): boolean {
    if (typeof window === "undefined") return false;
    const navStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone;
    return window.matchMedia("(display-mode: standalone)").matches || navStandalone === true;
}

export function NotificationPrompt() {
    const [mode, setMode] = useState<"hidden" | "subscribe" | "ios-install">("hidden");
    const [subscribed, setSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (sessionStorage.getItem(DISMISSED_KEY) === "1") return;

        const hasNotificationAPI = "Notification" in window && "serviceWorker" in navigator;

        if (hasNotificationAPI) {
            if (Notification.permission === "granted") {
                checkExistingSub();
            } else if (Notification.permission !== "denied") {
                // Initialise the prompt mode from the notification permission (intentional).
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setMode("subscribe");
            }
        } else if (isIOS() && !isStandalone()) {
            setMode("ios-install");
        }
    }, []);

    async function checkExistingSub() {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
            setSubscribed(true);
        } else {
            setMode("subscribe");
        }
    }

    async function subscribe() {
        setLoading(true);
        try {
            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
                dismiss();
                return;
            }

            const reg = await navigator.serviceWorker.ready;
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
            });

            await fetch("/api/push", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(sub.toJSON()),
            });

            setSubscribed(true);
            setMode("hidden");
        } catch (err) {
            console.warn("[push] subscribe failed:", err);
        } finally {
            setLoading(false);
        }
    }

    function dismiss() {
        sessionStorage.setItem(DISMISSED_KEY, "1");
        setMode("hidden");
    }

    if (mode === "hidden" || subscribed) return null;

    return (
        <div
            className="fixed z-40 left-3 right-3 bottom-16 sm:left-auto sm:right-3 sm:bottom-3 max-w-sm"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
            <div className="relative rounded-2xl border border-border/60 bg-surface/95 backdrop-blur-md shadow-2xl px-4 py-3 pr-10">
                <button
                    type="button"
                    onClick={dismiss}
                    aria-label="Close"
                    className="absolute right-2 top-2 text-subtle hover:text-foreground transition"
                >
                    <X className="h-4 w-4" />
                </button>

                {mode === "subscribe" && (
                    <div className="flex items-start gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-pitch-500/10 text-pitch-400 mt-0.5">
                            <Bell className="h-4 w-4" />
                        </span>
                        <div className="space-y-2">
                            <div>
                                <div className="text-sm font-semibold text-foreground">
                                    Enable notifications?
                                </div>
                                <div className="text-xs text-subtle">
                                    Get notified about match updates and team news!
                                </div>
                            </div>
                            <Button size="sm" onClick={subscribe} disabled={loading}>
                                {loading ? "Enabling..." : "Enable notifications"}
                            </Button>
                        </div>
                    </div>
                )}

                {mode === "ios-install" && (
                    <div className="flex items-start gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-pitch-500/10 text-pitch-400 mt-0.5">
                            <Bell className="h-4 w-4" />
                        </span>
                        <div className="space-y-1.5">
                            <div className="text-sm font-semibold text-foreground">
                                Want notifications?
                            </div>
                            <div className="text-xs text-subtle leading-relaxed">
                                On iPhone, install the app first:
                            </div>
                            <div className="text-xs text-foreground leading-relaxed">
                                1. Tap <Share className="inline h-3.5 w-3.5 text-pitch-400 -mt-0.5" /> <strong>Share</strong>
                            </div>
                            <div className="text-xs text-foreground leading-relaxed">
                                2. Tap <strong>&ldquo;Add to Home Screen&rdquo;</strong>
                            </div>
                            <div className="text-xs text-foreground leading-relaxed">
                                3. Open the app and enable notifications
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
