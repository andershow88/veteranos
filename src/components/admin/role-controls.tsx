"use client";

import { useTransition, useState } from "react";
import { ShieldCheck, ShieldOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { promoteToAdminAction, demoteToPlayerAction } from "@/server/role-actions";

type Props = {
  userId: string;
  role: "ADMIN" | "PLAYER";
  isSelf: boolean;
  isLastAdmin: boolean;
};

export function RoleControls({ userId, role, isSelf, isLastAdmin }: Props) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const promote = () => {
    setError(null);
    start(async () => {
      try {
        await promoteToAdminAction(userId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to promote");
      }
    });
  };

  const demote = () => {
    setError(null);
    if (!confirm("Demote this admin to a regular player?")) return;
    start(async () => {
      try {
        await demoteToPlayerAction(userId);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to demote");
      }
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {role === "PLAYER" ? (
          <Button onClick={promote} disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Promote to admin
          </Button>
        ) : (
          <Button
            variant="danger"
            onClick={demote}
            disabled={pending || isSelf || isLastAdmin}
            title={
              isSelf
                ? "You cannot demote yourself"
                : isLastAdmin
                ? "Cannot demote the only remaining admin"
                : undefined
            }
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldOff className="h-4 w-4" />}
            Demote to player
          </Button>
        )}
      </div>

      {(isSelf || isLastAdmin) && role === "ADMIN" && (
        <p className="text-xs text-muted">
          {isSelf
            ? "You cannot demote your own account."
            : "Cannot demote the only remaining admin. Promote someone else first."}
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
