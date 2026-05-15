"use client";

import { useTransition, useState, useEffect } from "react";
import { Check, X, ListPlus, ListMinus, Loader2, ChevronDown, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  setAttendingAction,
  setDeclinedAction,
  joinWaitlistAction,
  leaveWaitlistAction,
  declineWithReplacementAction,
  getWaitlistPlayersForMatch,
} from "@/server/match-actions";
import type { Signup, Player } from "@prisma/client";

type Props = {
  matchId: string;
  locked: boolean;
  currentPlayer: {
    playerId: string | null;
    kind: "ABO" | "WAITLIST" | null;
    role: "ADMIN" | "PLAYER" | null;
  };
  mySignup: (Signup & { player: Player }) | null;
};

type WaitlistOption = { id: string; firstName: string; lastName: string | null; overall: number };

export function SignupControls({ matchId, locked, currentPlayer, mySignup }: Props) {
  const [pending, startTransition] = useTransition();
  const [showDeclineOptions, setShowDeclineOptions] = useState(false);

  if (!currentPlayer.playerId) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-surface/50 px-4 py-3 text-xs text-muted">
        Log in to confirm or decline.
      </div>
    );
  }

  if (locked) {
    return (
      <div className="rounded-xl border border-amber-700/40 bg-amber-900/10 px-4 py-3 text-xs text-amber-200">
        Sign-ups for this match are locked.
      </div>
    );
  }

  const isAbo = currentPlayer.kind === "ABO";
  const isAttending = mySignup?.status === "IN";
  const isDeclined = mySignup?.status === "OUT";
  const isOnWaitlist = mySignup?.status === "WAITLIST";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted mr-1">
          Your reply:
        </span>

        {isAbo ? (
          <>
            <Button
              size="sm"
              variant={isAttending ? "primary" : "outline"}
              disabled={pending}
              onClick={() => {
                setShowDeclineOptions(false);
                startTransition(() => setAttendingAction(matchId));
              }}
            >
              {pending && isAttending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              I&apos;m in
            </Button>
            <Button
              size="sm"
              variant={isDeclined ? "danger" : "outline"}
              disabled={pending}
              onClick={() => setShowDeclineOptions((v) => !v)}
            >
              <X className="h-3.5 w-3.5" />
              Can&apos;t make it
              <ChevronDown className={`h-3 w-3 transition-transform ${showDeclineOptions ? "rotate-180" : ""}`} />
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
                Leave waitlist
              </Button>
            ) : (
              <Button
                size="sm"
                variant="primary"
                disabled={pending}
                onClick={() => startTransition(() => joinWaitlistAction(matchId))}
              >
                {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ListPlus className="h-3.5 w-3.5" />}
                Join waitlist
              </Button>
            )}
          </>
        )}
      </div>

      {showDeclineOptions && (
        <DeclineOptions
          matchId={matchId}
          pending={pending}
          onDone={() => setShowDeclineOptions(false)}
          startTransition={startTransition}
        />
      )}
    </div>
  );
}

function DeclineOptions({
  matchId,
  pending,
  onDone,
  startTransition,
}: {
  matchId: string;
  pending: boolean;
  onDone: () => void;
  startTransition: (fn: () => Promise<void> | void) => void;
}) {
  const [mode, setMode] = useState<"auto" | "existing">("auto");
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [waitlistPlayers, setWaitlistPlayers] = useState<WaitlistOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mode === "existing" && waitlistPlayers.length === 0) {
      setLoading(true);
      getWaitlistPlayersForMatch(matchId).then((players) => {
        setWaitlistPlayers(players);
        setLoading(false);
      });
    }
  }, [mode, matchId, waitlistPlayers.length]);

  const submit = () => {
    if (mode === "auto") {
      startTransition(async () => {
        await setDeclinedAction(matchId);
        onDone();
      });
    } else {
      startTransition(async () => {
        await declineWithReplacementAction({
          matchId,
          mode: "existing",
          existingPlayerId: selectedPlayerId,
        });
        onDone();
      });
    }
  };

  const canSubmit = mode === "auto" || (mode === "existing" && selectedPlayerId);

  return (
    <div className="rounded-xl border border-border/60 bg-surface/50 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted">
        Who takes your spot?
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <ModeButton
          active={mode === "auto"}
          onClick={() => setMode("auto")}
          icon={<Users className="h-4 w-4" />}
          label="Auto assign"
          desc="Next from waitlist"
        />
        <ModeButton
          active={mode === "existing"}
          onClick={() => setMode("existing")}
          icon={<ListPlus className="h-4 w-4" />}
          label="Pick player"
          desc="Choose from waitlist"
        />
      </div>

      {mode === "existing" && (
        <div>
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-muted py-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading players…
            </div>
          ) : waitlistPlayers.length === 0 ? (
            <div className="text-xs text-muted py-2">No available waitlist players.</div>
          ) : (
            <div className="grid gap-1.5 max-h-48 overflow-auto scrollbar-thin">
              {waitlistPlayers.map((p) => (
                <label
                  key={p.id}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer transition ${
                    selectedPlayerId === p.id
                      ? "border-pitch-500 bg-pitch-700/20"
                      : "border-border/60 bg-surface/30 hover:border-pitch-500/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="replacement"
                    value={p.id}
                    checked={selectedPlayerId === p.id}
                    onChange={() => setSelectedPlayerId(p.id)}
                    className="sr-only"
                  />
                  <span className="text-sm flex-1 truncate">
                    {p.firstName} {p.lastName}
                  </span>
                  <span className="number-pill text-xs text-muted">OVR {p.overall}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <Button size="sm" variant="danger" disabled={pending || !canSubmit} onClick={submit}>
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
          Confirm decline
        </Button>
        <Button size="sm" variant="secondary" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  icon,
  label,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
        active
          ? "border-pitch-500 bg-pitch-700/20"
          : "border-border/60 bg-surface/30 hover:border-pitch-500/40"
      }`}
    >
      <div className={`shrink-0 ${active ? "text-pitch-300" : "text-muted"}`}>{icon}</div>
      <div>
        <div className={`text-sm font-semibold ${active ? "text-foreground" : "text-foreground/80"}`}>{label}</div>
        <div className="text-[10px] text-muted">{desc}</div>
      </div>
    </button>
  );
}
