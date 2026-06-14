"use client";

import { useState, useTransition } from "react";
import {
  setAttendingAction,
  setDeclinedAction,
  joinWaitlistAction,
  leaveWaitlistAction,
} from "@/server/match-actions";

/**
 * Shared sign-up action logic + feedback state, used by both the full
 * SignupControls and the sticky mobile action bar (no duplicated logic).
 * Gives optimistic-feeling feedback: pending -> saved (brief) / error,
 * and never overwrites the selection on failure.
 */
export function useSignup(matchId: string) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<unknown> | unknown) {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        await action();
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } catch {
        setError("Could not save your reply. Please try again.");
      }
    });
  }

  return {
    pending,
    saved,
    error,
    run,
    attend: () => run(() => setAttendingAction(matchId)),
    declineAuto: () => run(() => setDeclinedAction(matchId)),
    joinWaitlist: () => run(() => joinWaitlistAction(matchId)),
    leaveWaitlist: () => run(() => leaveWaitlistAction(matchId)),
  };
}
