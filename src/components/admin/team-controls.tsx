"use client";

import { useMemo, useState, useTransition } from "react";
import { RefreshCcw, Trash2, Loader2, Info, ChevronDown, ChevronUp, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { generateTeamsAction, deleteTeamsAction } from "@/server/admin-actions";
import { setMatchLockedAction } from "@/server/match-actions";

type PoolEntry = {
  id: string;
  firstName: string;
  lastName: string | null;
  avatarUrl: string | null;
  kind: "ABO" | "WAITLIST";
  overall: number;
};

type Props = {
  matchId: string;
  hasTeams: boolean;
  locked: boolean;
  isPast?: boolean;
  teamCount: number;
  pool: PoolEntry[];
};

export function TeamControls({ matchId, hasTeams, locked, isPast, teamCount, pool }: Props) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [useAll, setUseAll] = useState(false);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [showList, setShowList] = useState(false);
  const { confirm, dialog } = useConfirm();

  const standardLimit = teamCount * 5;
  const includedPool = useMemo(
    () => pool.filter((p) => !excluded.has(p.id)),
    [pool, excluded],
  );
  const willUse = useAll
    ? includedPool.length
    : Math.min(standardLimit, includedPool.length);
  const standardOverflow = Math.max(0, includedPool.length - standardLimit);

  const toggle = (id: string) => {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const generate = () => {
    setError(null);
    start(async () => {
      try {
        await generateTeamsAction(matchId, {
          useAllPlayers: useAll,
          excludePlayerIds: Array.from(excluded),
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to generate teams");
      }
    });
  };

  const remove = async () => {
    const ok = await confirm({
      title: "Delete teams?",
      description: "All generated teams for this match will be removed. You can regenerate them at any time.",
      confirmText: "Delete teams",
      variant: "danger",
    });
    if (!ok) return;
    start(() => deleteTeamsAction(matchId));
  };

  const toggleLock = () => {
    start(() => setMatchLockedAction(matchId, !locked));
  };

  // Past matches: fully read-only, no controls at all
  if (isPast) {
    return (
      <div className="rounded-lg border border-border/60 bg-surface/40 px-3 py-2.5 text-xs text-muted">
        This match is in the past. No changes possible.
      </div>
    );
  }

  // Locked: only show unlock button, hide everything else
  if (locked) {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-amber-700/40 bg-amber-900/20 px-3 py-2 text-xs text-amber-200">
          Sign-ups and teams are locked. Unlock to make changes.
        </div>
        <Button variant="secondary" onClick={toggleLock} disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlock className="h-4 w-4" />}
          Unlock list
        </Button>
        {dialog}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-amber-700/40 bg-amber-900/20 px-3 py-2 text-xs text-amber-200">
        Tip: lock the list first so sign-ups stop changing, then generate teams.
      </div>

      <div className="rounded-xl border border-border/60 bg-surface/40 px-3 py-2.5 space-y-3">
        <div className="text-xs text-muted inline-flex items-center gap-2">
          <Info className="h-3.5 w-3.5 text-pitch-300" />
          {teamCount} teams · standard size {standardLimit} players (5 per team) · pool {pool.length}.
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={useAll}
            onChange={(e) => setUseAll(e.target.checked)}
            className="mt-1 h-4 w-4 accent-pitch-500"
          />
          <div className="text-sm">
            <span className="font-semibold text-foreground">Use all signed-up players</span>
            <div className="text-[11px] text-muted">
              Override the 5-per-team limit and stretch teams to include everyone
              {standardOverflow > 0 ? ` (${standardOverflow} extra past the standard limit)` : ""}.
            </div>
          </div>
        </label>

        <button
          type="button"
          onClick={() => setShowList((v) => !v)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-pitch-300 hover:text-pitch-200 transition"
        >
          {showList ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {excluded.size > 0
            ? `${excluded.size} player${excluded.size === 1 ? "" : "s"} excluded`
            : "Optionally exclude individual players"}
        </button>

        {showList && (
          <div className="space-y-1.5 max-h-72 overflow-auto scrollbar-thin pr-1">
            {pool.length === 0 ? (
              <p className="text-sm text-subtle">No signed-up players yet.</p>
            ) : (
              pool.map((p) => {
                const isExcluded = excluded.has(p.id);
                return (
                  <label
                    key={p.id}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer transition ${
                      isExcluded
                        ? "border-border/40 bg-surface/30 opacity-60"
                        : "border-border/60 bg-surface/50 hover:border-pitch-500"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={!isExcluded}
                      onChange={() => toggle(p.id)}
                      className="h-4 w-4 accent-pitch-500"
                    />
                    <Avatar firstName={p.firstName} lastName={p.lastName} size="sm" src={p.avatarUrl} />
                    <span className={`text-sm flex-1 min-w-0 truncate ${isExcluded ? "line-through" : ""}`}>
                      {p.firstName} {p.lastName}
                    </span>
                    <Badge tone={p.kind === "ABO" ? "success" : "info"} className="shrink-0">
                      {p.kind === "ABO" ? "Subscriber" : "Waitlist"}
                    </Badge>
                    <span className="number-pill text-xs text-muted shrink-0">OVR {p.overall}</span>
                  </label>
                );
              })
            )}
          </div>
        )}

        <div className="text-[11px] text-pitch-300/80 number-pill border-t border-border/60 pt-2">
          → {willUse} player{willUse === 1 ? "" : "s"} will be drafted into the {teamCount} teams.
          {!useAll && includedPool.length > standardLimit && (
            <span className="text-amber-300/80">
              {" "}
              ({includedPool.length - standardLimit}{" "}player{includedPool.length - standardLimit === 1 ? "" : "s"}{" "}past the standard limit will sit out — enable &ldquo;Use all&rdquo; to include them.)
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={generate} disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
          {hasTeams ? "Regenerate teams" : "Generate teams"}
        </Button>
        {hasTeams && (
          <>
            <Button variant="primary" onClick={toggleLock} disabled={pending}>
              <Lock className="h-4 w-4" />
              Lock & publish
            </Button>
            <Button variant="danger" onClick={remove} disabled={pending}>
              <Trash2 className="h-4 w-4" /> Delete teams
            </Button>
          </>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-700/40 bg-red-900/20 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      {dialog}
    </div>
  );
}
