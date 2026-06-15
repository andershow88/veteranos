"use client";

import { useState, useEffect } from "react";
import { Check, X, ListPlus, ListMinus, Loader2, ChevronDown, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  setDeclinedAction,
  declineWithReplacementAction,
  getWaitlistPlayersForMatch,
} from "@/server/match-actions";
import { useSignup } from "./use-signup";
import type { Signup, Player } from "@prisma/client";

type Props = {
  matchId: string;
  locked: boolean;
  /** Match is over (past kickoff) — no manual in/out changes anymore. */
  isPast?: boolean;
  currentPlayer: {
    playerId: string | null;
    kind: "ABO" | "WAITLIST" | null;
    role: "ADMIN" | "PLAYER" | null;
  };
  mySignup: (Signup & { player: Player }) | null;
};

type WaitlistOption = { id: string; firstName: string; lastName: string | null; overall: number; _onMatchWaitlist: boolean };

export function SignupControls({ matchId, locked, isPast, currentPlayer, mySignup }: Props) {
  const sx = useSignup(matchId);
  const [showDeclineOptions, setShowDeclineOptions] = useState(false);

  if (!currentPlayer.playerId) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 bg-surface/50 px-4 py-3 text-sm text-muted">
        Log in to confirm or decline.
      </div>
    );
  }

  // Past match: the game is over — no more manual in/out changes. Payment
  // confirmation stays available elsewhere in the card.
  if (isPast) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-surface/50 px-4 py-3 text-sm text-muted">
        <Clock className="h-4 w-4 shrink-0" /> This match is over — sign-ups can no longer be changed.
      </div>
    );
  }

  if (locked) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-warning-line bg-warning-surface px-4 py-3 text-sm text-warning-ink">
        <X className="h-4 w-4 shrink-0" /> Sign-ups for this match are locked.
      </div>
    );
  }

  const isAbo = currentPlayer.kind === "ABO";
  const isAttending = mySignup?.status === "IN";
  const isDeclined = mySignup?.status === "OUT";
  const isOnWaitlist = mySignup?.status === "WAITLIST";

  const status = isAttending
    ? { tone: "success" as const, icon: <Check className="h-3 w-3" />, label: "You're in" }
    : isDeclined
    ? { tone: "danger" as const, icon: <X className="h-3 w-3" />, label: "You declined" }
    : isOnWaitlist
    ? { tone: "info" as const, icon: <ListPlus className="h-3 w-3" />, label: "On the waitlist" }
    : { tone: "warn" as const, icon: <Clock className="h-3 w-3" />, label: "No reply yet" };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted">Your reply</span>
          <Badge tone={status.tone}>{status.icon} {status.label}</Badge>
        </div>
        <span aria-live="polite" className="text-xs">
          {sx.pending ? (
            <span className="inline-flex items-center gap-1 text-muted"><Loader2 className="h-3 w-3 animate-spin" /> Saving…</span>
          ) : sx.saved ? (
            <span className="inline-flex items-center gap-1 font-semibold text-success-ink"><Check className="h-3 w-3" /> Saved</span>
          ) : sx.error ? (
            <span className="font-semibold text-danger-ink">{sx.error}</span>
          ) : null}
        </span>
      </div>

      {isAbo ? (
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={isAttending ? "primary" : "outline"}
            className="h-11 w-full"
            disabled={sx.pending}
            aria-pressed={isAttending}
            onClick={() => { setShowDeclineOptions(false); sx.attend(); }}
          >
            {sx.pending && isAttending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            I&apos;m in
          </Button>
          <Button
            variant={isDeclined ? "danger" : "outline"}
            className="h-11 w-full"
            disabled={sx.pending}
            aria-expanded={showDeclineOptions}
            onClick={() => setShowDeclineOptions((v) => !v)}
          >
            <X className="h-4 w-4" />
            Can&apos;t make it
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showDeclineOptions ? "rotate-180" : ""}`} />
          </Button>
        </div>
      ) : isOnWaitlist ? (
        <Button variant="outline" className="h-11 w-full" disabled={sx.pending} onClick={sx.leaveWaitlist}>
          {sx.pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListMinus className="h-4 w-4" />}
          Leave waitlist
        </Button>
      ) : (
        <Button variant="primary" className="h-11 w-full" disabled={sx.pending} onClick={sx.joinWaitlist}>
          {sx.pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListPlus className="h-4 w-4" />}
          Join waitlist
        </Button>
      )}

      {showDeclineOptions && (
        <DeclineOptions
          matchId={matchId}
          pending={sx.pending}
          run={sx.run}
          onDone={() => setShowDeclineOptions(false)}
        />
      )}
    </div>
  );
}

function DeclineOptions({
  matchId,
  pending,
  run,
  onDone,
}: {
  matchId: string;
  pending: boolean;
  run: (action: () => Promise<unknown> | unknown) => void;
  onDone: () => void;
}) {
  const [mode, setMode] = useState<"auto" | "existing">("auto");
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [waitlistPlayers, setWaitlistPlayers] = useState<WaitlistOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (mode === "existing" && waitlistPlayers.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(true);
      getWaitlistPlayersForMatch(matchId).then((players) => {
        setWaitlistPlayers(players);
        setLoading(false);
      });
    }
  }, [mode, matchId, waitlistPlayers.length]);

  const submit = () => {
    if (mode === "auto") {
      run(async () => { await setDeclinedAction(matchId); onDone(); });
    } else {
      run(async () => {
        await declineWithReplacementAction({ matchId, mode: "existing", existingPlayerId: selectedPlayerId });
        onDone();
      });
    }
  };

  const canSubmit = mode === "auto" || (mode === "existing" && selectedPlayerId);

  return (
    <div className="space-y-3 rounded-xl border border-border/60 bg-surface/50 p-4">
      <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted">Who takes your spot?</div>

      <div className="grid gap-2 sm:grid-cols-2">
        <ModeButton active={mode === "auto"} onClick={() => setMode("auto")} icon={<Users className="h-4 w-4" />} label="Auto assign" desc="Next from waitlist" />
        <ModeButton active={mode === "existing"} onClick={() => setMode("existing")} icon={<ListPlus className="h-4 w-4" />} label="Pick player" desc="Choose from waitlist" />
      </div>

      {mode === "existing" && (
        <div>
          {loading ? (
            <div className="flex items-center gap-2 py-2 text-xs text-muted">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading players…
            </div>
          ) : waitlistPlayers.length === 0 ? (
            <div className="py-2 text-xs text-muted">No available waitlist players.</div>
          ) : (
            <div className="grid max-h-56 gap-1.5 overflow-auto scrollbar-thin">
              {(() => {
                const onMatch = waitlistPlayers.filter((p) => p._onMatchWaitlist);
                const global = waitlistPlayers.filter((p) => !p._onMatchWaitlist);
                return (
                  <>
                    {onMatch.length > 0 && (
                      <div className="pt-1 text-[9px] font-bold uppercase tracking-widest text-muted">Signed up for this match</div>
                    )}
                    {onMatch.map((p) => (
                      <PlayerRadio key={p.id} player={p} selected={selectedPlayerId === p.id} onSelect={setSelectedPlayerId} />
                    ))}
                    {global.length > 0 && (
                      <div className="mt-1 border-t border-border/40 pt-2 text-[9px] font-bold uppercase tracking-widest text-muted">All waitlist players</div>
                    )}
                    {global.map((p) => (
                      <PlayerRadio key={p.id} player={p} selected={selectedPlayerId === p.id} onSelect={setSelectedPlayerId} />
                    ))}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <Button size="md" variant="danger" disabled={pending || !canSubmit} onClick={submit}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
          Confirm decline
        </Button>
        <Button size="md" variant="secondary" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function ModeButton({
  active, onClick, icon, label, desc,
}: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string; desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
        active ? "border-pitch-500 bg-pitch-700/20" : "border-border/60 bg-surface/30 hover:border-pitch-500/40"
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

function PlayerRadio({ player, selected, onSelect }: { player: WaitlistOption; selected: boolean; onSelect: (id: string) => void }) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition ${
        selected ? "border-pitch-500 bg-pitch-700/20" : "border-border/60 bg-surface/30 hover:border-pitch-500/40"
      }`}
    >
      <input type="radio" name="replacement" value={player.id} checked={selected} onChange={() => onSelect(player.id)} className="sr-only" />
      <span className="flex-1 truncate text-sm">{player.firstName} {player.lastName}</span>
      <span className="number-pill text-xs text-muted">OVR {player.overall}</span>
    </label>
  );
}
