"use client";

import { useState, useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deletePlayerAction } from "@/server/admin-actions";

export function DeletePlayerButton({
  playerId,
  playerName,
  isSelf,
}: {
  playerId: string;
  playerName: string;
  isSelf: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onDelete = () => {
    setError(null);
    if (
      !confirm(
        `Really delete ${playerName}? This removes the player profile, account, sign-ups and any team slots. This cannot be undone.`,
      )
    )
      return;
    start(async () => {
      try {
        await deletePlayerAction(playerId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to delete player");
      }
    });
  };

  return (
    <div className="space-y-2">
      <Button
        variant="danger"
        onClick={onDelete}
        disabled={pending || isSelf}
        title={isSelf ? "You cannot delete your own account" : undefined}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        Delete player
      </Button>
      {isSelf && (
        <p className="text-xs text-muted">
          You cannot delete your own account. Promote another admin first, then delete it from a different admin session.
        </p>
      )}
      {error && (
        <div className="rounded-lg border border-red-700/40 bg-red-900/20 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}
    </div>
  );
}
