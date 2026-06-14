"use client";

import { Check, X, ListPlus, ListMinus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSignup } from "./use-signup";

type Props = {
  matchId: string;
  kind: "ABO" | "WAITLIST" | null;
  status: "IN" | "OUT" | "WAITLIST" | null;
};

/**
 * Compact, sticky participation bar for the match detail page on mobile.
 * Sits just above the bottom navigation so the user can reply at any scroll
 * position. Reuses useSignup (same logic/feedback as the in-card controls).
 * "Out" uses the auto-assign default; the in-card control offers the full
 * replacement picker.
 */
export function MatchSignupBar({ matchId, kind, status }: Props) {
  const sx = useSignup(matchId);
  const isAttending = status === "IN";
  const isDeclined = status === "OUT";
  const isOnWaitlist = status === "WAITLIST";

  return (
    <div
      className="fixed inset-x-0 z-30 border-t border-border/60 bg-bg/95 backdrop-blur-md md:hidden"
      style={{ bottom: "calc(4.5rem + env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-md items-center gap-2 px-3 py-2">
        <span className="shrink-0 text-[11px] font-semibold uppercase tracking-widest text-muted">Your reply</span>
        {kind === "ABO" ? (
          <div className="grid flex-1 grid-cols-2 gap-2">
            <Button variant={isAttending ? "primary" : "outline"} className="h-11 w-full" disabled={sx.pending} aria-pressed={isAttending} onClick={sx.attend}>
              {sx.pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} In
            </Button>
            <Button variant={isDeclined ? "danger" : "outline"} className="h-11 w-full" disabled={sx.pending} aria-pressed={isDeclined} onClick={sx.declineAuto}>
              <X className="h-4 w-4" /> Out
            </Button>
          </div>
        ) : (
          <div className="flex-1">
            {isOnWaitlist ? (
              <Button variant="outline" className="h-11 w-full" disabled={sx.pending} onClick={sx.leaveWaitlist}>
                {sx.pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListMinus className="h-4 w-4" />} Leave waitlist
              </Button>
            ) : (
              <Button variant="primary" className="h-11 w-full" disabled={sx.pending} onClick={sx.joinWaitlist}>
                {sx.pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListPlus className="h-4 w-4" />} Join waitlist
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
