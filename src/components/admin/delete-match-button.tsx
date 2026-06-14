"use client";

import { useState, useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { deleteMatchAction } from "@/server/admin-actions";

export function DeleteMatchButton({
  matchId,
  matchLabel,
}: {
  matchId: string;
  matchLabel: string;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { confirm, dialog } = useConfirm();

  const onDelete = async () => {
    setError(null);
    const ok = await confirm({
      title: `Delete match on ${matchLabel}?`,
      description:
        "All sign-ups, declines, waitlist entries and any generated teams for this match will be removed. This cannot be undone.",
      confirmText: "Delete match",
      variant: "danger",
    });
    if (!ok) return;
    start(async () => {
      try {
        await deleteMatchAction(matchId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to delete match");
      }
    });
  };

  return (
    <>
      <Button variant="danger" size="sm" onClick={onDelete} disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        Delete
      </Button>
      {error && <Alert tone="danger">{error}</Alert>}
      {dialog}
    </>
  );
}
