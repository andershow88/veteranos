"use client";

import { useTransition, useState } from "react";
import { RefreshCcw, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { generateTeamsAction, deleteTeamsAction } from "@/server/admin-actions";

export function TeamControls({
  matchId,
  hasTeams,
  locked,
}: {
  matchId: string;
  hasTeams: boolean;
  locked: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { confirm, dialog } = useConfirm();

  const generate = () => {
    setError(null);
    start(async () => {
      try {
        await generateTeamsAction(matchId);
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

  return (
    <div className="space-y-3">
      {!locked && (
        <div className="rounded-lg border border-amber-700/40 bg-amber-900/20 px-3 py-2 text-xs text-amber-200">
          Tip: lock the list first so sign-ups stop changing, then generate teams.
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button onClick={generate} disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
          {hasTeams ? "Regenerate teams" : "Generate teams"}
        </Button>
        {hasTeams && (
          <Button variant="danger" onClick={remove} disabled={pending}>
            <Trash2 className="h-4 w-4" /> Delete teams
          </Button>
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
