"use client";

import { useTransition, useState } from "react";
import { RefreshCcw, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  const generate = () => {
    setError(null);
    start(async () => {
      try {
        await generateTeamsAction(matchId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Fehler beim Generieren");
      }
    });
  };
  const remove = () => {
    if (!confirm("Teams wirklich löschen?")) return;
    start(() => deleteTeamsAction(matchId));
  };

  return (
    <div className="space-y-3">
      {!locked && (
        <div className="rounded-lg border border-amber-700/40 bg-amber-900/20 px-3 py-2 text-xs text-amber-200">
          Tipp: Erst die Liste sperren, damit sich keine Anmeldungen mehr ändern, dann Teams generieren.
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button onClick={generate} disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
          {hasTeams ? "Teams neu generieren" : "Teams generieren"}
        </Button>
        {hasTeams && (
          <Button variant="danger" onClick={remove} disabled={pending}>
            <Trash2 className="h-4 w-4" /> Teams löschen
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-700/40 bg-red-900/20 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}
    </div>
  );
}
