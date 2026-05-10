"use client";

import { useTransition } from "react";
import { Check, X, ListPlus, ListMinus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  setAttendingAction,
  setDeclinedAction,
  joinWaitlistAction,
  leaveWaitlistAction,
} from "@/server/match-actions";
import type { Signup, Player } from "@prisma/client";

type Props = {
  matchId: string;
  locked: boolean;
  currentPlayer: {
    playerId: string | null;
    kind: "SUBSCRIBER" | "WAITLIST" | null;
    role: "ADMIN" | "PLAYER" | null;
  };
  mySignup: (Signup & { player: Player }) | null;
};

export function SignupControls({ matchId, locked, currentPlayer, mySignup }: Props) {
  const [pending, startTransition] = useTransition();

  if (!currentPlayer.playerId) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-surface/50 px-4 py-3 text-xs text-muted">
        Logge dich ein, um zu- oder abzusagen.
      </div>
    );
  }

  if (locked) {
    return (
      <div className="rounded-xl border border-amber-700/40 bg-amber-900/10 px-4 py-3 text-xs text-amber-200">
        Die Anmeldung für diesen Termin ist gesperrt.
      </div>
    );
  }

  const isSubscriber = currentPlayer.kind === "SUBSCRIBER";
  const isAttending = mySignup?.status === "IN";
  const isDeclined = mySignup?.status === "OUT";
  const isOnWaitlist = mySignup?.status === "WAITLIST";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-widest text-muted mr-1">
        Deine Antwort:
      </span>

      {isSubscriber ? (
        <>
          <Button
            size="sm"
            variant={isAttending ? "primary" : "outline"}
            disabled={pending}
            onClick={() => startTransition(() => setAttendingAction(matchId))}
          >
            {pending && isAttending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Kann spielen
          </Button>
          <Button
            size="sm"
            variant={isDeclined ? "danger" : "outline"}
            disabled={pending}
            onClick={() => startTransition(() => setDeclinedAction(matchId))}
          >
            {pending && isDeclined ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
            Kann nicht
          </Button>
        </>
      ) : (
        <>
          {isOnWaitlist ? (
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => startTransition(() => leaveWaitlistAction(matchId))}
            >
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ListMinus className="h-3.5 w-3.5" />}
              Von Warteliste runter
            </Button>
          ) : (
            <Button
              size="sm"
              variant="primary"
              disabled={pending}
              onClick={() => startTransition(() => joinWaitlistAction(matchId))}
            >
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ListPlus className="h-3.5 w-3.5" />}
              Auf Warteliste setzen
            </Button>
          )}
        </>
      )}
    </div>
  );
}
